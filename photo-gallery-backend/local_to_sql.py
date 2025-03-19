import os
import sqlite3
import datetime
import boto3
import random
import multiprocessing    # added import
from PIL import Image
from PIL.ExifTags import TAGS
from uuid import uuid4

def get_exif_data(image_path):
    try:
        img = Image.open(image_path)
        exif_data = img._getexif()
        if not exif_data:
            return {}
        
        exif = {}
        for tag, value in exif_data.items():
            decoded = TAGS.get(tag, tag)
            exif[decoded] = value
        
        return {
            "camera_model": exif.get("Model", "Unknown"),
            "focal_length": exif.get("FocalLength", "Unknown"),
            "exposure_time": exif.get("ExposureTime", "Unknown"),
            "iso": exif.get("ISOSpeedRatings", "Unknown"),
            "aperture": exif.get("FNumber", "Unknown")
        }
    except Exception as e:
        print(f"Error extracting EXIF from {image_path}: {e}")
        return {}

def convert_to_webp(image_path):
    webp_path = image_path.rsplit('.', 1)[0] + ".webp"
    try:
        img = Image.open(image_path)
        img.save(webp_path, "WEBP", quality=80)
        return webp_path
    except Exception as e:
        print(f"Error converting {image_path} to WebP: {e}")
        return None

def upload_to_minio(file_path, minio_path):
    try:
        s3_client.upload_file(file_path, MINIO_BUCKET, minio_path)
        return f"{MINIO_BUCKET}/{minio_path}"
    except Exception as e:
        print(f"Error uploading {file_path} to MinIO: {e}")
        return None

def generate_uuid():
    return str(uuid4())

def process_images(base_dir):
    pool = multiprocessing.Pool(processes=8)
    theme_previews = {}
    
    for theme in os.listdir(base_dir):
        theme_path = os.path.join(base_dir, theme)
        if not os.path.isdir(theme_path):
            continue
        
        collection_previews = []     # collect each collection preview URL
        
        for collection in os.listdir(theme_path):
            collection_path = os.path.join(theme_path, collection)
            if not os.path.isdir(collection_path):
                continue
            
            images_list = []         # store tuples (file_path, file_name) for uploaded images
            # Remove inline preview setting: collection_preview_image = None
            
            for file_name in os.listdir(collection_path):
                file_path = os.path.join(collection_path, file_name)
                if not os.path.isfile(file_path):
                    continue
                
                minio_path = f"{theme}/{collection}/{file_name}"   # upload original image
                minio_url = upload_to_minio(file_path, minio_path)
                
                if minio_url:
                    # Save original image info to DB with uuid as id
                    exif = get_exif_data(file_path)
                    date_added = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    
                    # Convert image to WebP for preview in a separate process 
                    preview_path = pool.apply_async(convert_to_webp, (file_path,)).get()
                    preview_url = None
                    if preview_path:
                        preview_minio_path = f"{theme}/{collection}/previews/{os.path.basename(preview_path)}"
                        preview_url = upload_to_minio(preview_path, preview_minio_path)
                        os.remove(preview_path)
                    
                    cursor.execute('''
                        INSERT INTO images (id, name, filepath, date_added, theme, collection, 
                                            camera_model, focal_length, exposure_time, iso, aperture, preview_image)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (generate_uuid(), file_name, minio_url, date_added, theme, collection, 
                          exif.get("camera_model"), exif.get("focal_length"), 
                          exif.get("exposure_time"), exif.get("iso"), exif.get("aperture"), preview_url))
                    conn.commit()
                    print(f"Stored: {file_name}")
                    
                    images_list.append((file_path, file_name))
            
            if images_list:
                # Randomly select one image to serve as collection preview
                chosen_file_path, chosen_file_name = random.choice(images_list)
                preview_webp_path = pool.apply_async(convert_to_webp, (chosen_file_path,)).get()
                if preview_webp_path:
                    preview_minio_path = f"{theme}/{collection}/{os.path.basename(preview_webp_path)}"
                    preview_minio_url = upload_to_minio(preview_webp_path, preview_minio_path)
                    # Insert collection preview record with uuid as id
                    cursor.execute('''INSERT INTO collections (id, name, theme, preview_image) VALUES (?, ?, ?, ?)''',
                               (generate_uuid(), collection, theme, preview_minio_url))
                    conn.commit()
                    collection_previews.append(preview_minio_url)
                    os.remove(preview_webp_path)   # Remove the local webp file after upload
            
        if collection_previews:
            # Randomly select a preview among the collection previews for the theme
            theme_preview = random.choice(collection_previews)
            cursor.execute('''INSERT INTO themes (id, name, preview_image) VALUES (?, ?, ?)''', (generate_uuid(), theme, theme_preview))
            conn.commit()

    for theme, preview_image in theme_previews.items():
        cursor.execute('''INSERT INTO themes (id, name, preview_image) VALUES (?, ?, ?)''', (generate_uuid(), theme, preview_image))
        conn.commit()
    
    pool.close()
    pool.join()

if __name__ == "__main__":
    # MinIO Configuration
    MINIO_ENDPOINT = "http://localhost:9500"
    MINIO_ACCESS_KEY = "minioadmin"
    MINIO_SECRET_KEY = "minioadmin"
    MINIO_BUCKET = "photo-gallery"

    s3_client = boto3.client(
        "s3", 
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY
    )

    # Ensure MinIO bucket exists
    def create_bucket():
        try:
            s3_client.create_bucket(Bucket=MINIO_BUCKET)
        except s3_client.exceptions.BucketAlreadyOwnedByYou:
            pass  # Ignore if bucket exists

    create_bucket()

    # Database setup
    DB_FILE = "images.db"
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS images (
            id TEXT PRIMARY KEY,
            name TEXT,
            filepath TEXT,
            date_added TEXT,
            theme TEXT,
            collection TEXT,
            favourite BOOLEAN DEFAULT 0,
            camera_model TEXT,
            focal_length TEXT,
            exposure_time TEXT,
            iso TEXT,
            aperture TEXT,
            preview_image TEXT,
            status TEXT DEFAULT 'active'
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS collections (
            id TEXT PRIMARY KEY,
            name TEXT,
            theme TEXT,
            preview_image TEXT,
            status TEXT DEFAULT 'active'
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS themes (
            id TEXT PRIMARY KEY,
            name TEXT,
            preview_image TEXT,
            status TEXT DEFAULT 'active'
        )
    ''')
    
    conn.commit()

    # Run script
    BASE_DIR = r"C:\Users\YapWH\Desktop\photos"
    process_images(BASE_DIR)
    conn.close()
