#region Description
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os
import boto3
from uuid import uuid4
from datetime import datetime
from PIL import Image
from PIL.ExifTags import TAGS
import tempfile

app = FastAPI()
themesAPIs = APIRouter(prefix="/themes")
collectionsAPIs = APIRouter(prefix="/collections")
photosAPIs = APIRouter(prefix="/photos")
utilsAPIs = APIRouter(prefix="/utils")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods including OPTIONS
    allow_headers=["*"],
)

# MinIO Configuration
MINIO_ENDPOINT = "http://localhost:9500"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin"
MINIO_BUCKET = "photo-gallery"

s3_client = boto3.client(
    "s3", 
    endpoint_url=MINIO_ENDPOINT,
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY,
    verify=False
)

DB_FILE = "images.db"

def get_db_connection() -> sqlite3.Connection:
    """
    Get SQLite database connection

    Parameters:
    None

    Returns:
    sqlite3.Connection: SQLite database connection
    """
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def generate_presigned_url(filepath:str, expiration:int=3600) -> str:
    """
    Generate presigned URL for MinIO object

    Parameters:
    filepath (str): Object filepath in MinIO
    expiration (int): Expiration time in seconds (default 1 hour)

    Returns:
    str: Presigned URL
    """
    try:
        # Remove duplicated bucket prefix if present in the filepath
        prefix = f"{MINIO_BUCKET}/"
        key = filepath[len(prefix):] if filepath.startswith(prefix) else filepath
        
        url = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": MINIO_BUCKET,
                "Key": key
            },
            ExpiresIn=expiration
        )
        return url
    except Exception as e:
        return None

def get_exif_data(image_path:str) -> dict:
    """
    Extract EXIF data from image
    
    Parameters:
    image_path (str): Image file path

    Returns:
    dict: EXIF data including camera_model, focal_length, exposure_time, iso, and aperture
    """
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
        print(f"Error extracting EXIF: {e}")
        return {}

def convert_to_webp(image_path: str) -> str:
    """
    Convert an image to WebP format
    
    Parameters:
    image_path (str): Original image path
    
    Returns:
    str: Path to the WebP version or None if conversion failed
    """
    try:
        # Create output filename - make sure we use a clean name without path issues
        base_filename = os.path.basename(image_path).rsplit('.', 1)[0]
        temp_dir = os.path.dirname(image_path)
        preview_path = os.path.join(temp_dir, f"{base_filename}.webp")
        
        print(f"Attempting to create WebP at: {preview_path}")
        
        # Open, convert, and save the image
        with Image.open(image_path) as img:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            img.save(preview_path, "WEBP", quality=80)
            # Force flush to disk
            img.close()
        
        # Verify file was created with a retry mechanism
        for _ in range(3):  # retry up to 3 times
            if os.path.isfile(preview_path):
                file_size = os.path.getsize(preview_path)
                if file_size > 0:
                    print(f"WebP created successfully at: {preview_path} (size: {file_size} bytes)")
                    return preview_path
            # Small delay before checking again
            import time
            time.sleep(0.2)
        
        print(f"Failed to create WebP at: {preview_path} after retries")
        return None
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error converting to WebP: {str(e)}\n{error_details}")
        return None

class PhotoUpdate(BaseModel):
    name: str
    theme: str
    collection: str
    favourite: bool
    camera_model: str
    focal_length: str
    exposure_time: str
    iso: str
    aperture: str

# New Pydantic models for Themes and Collections
class ThemePayload(BaseModel):
    name: str
    preview_image: str = None
    status: str = "active"

class CollectionPayload(BaseModel):
    name: str
    theme: str
    preview_image: str = None
    status: str = "active"
#endregion

#region Themes
@themesAPIs.get("/")
def get_all_themes() -> list[dict]:
    """
    Get all active themes

    Parameters:
    None

    Returns:
    list: Themes data including id, name, preview_image, and status
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM themes WHERE status='active'")
    themes = cursor.fetchall()
    conn.close()
    
    return [  # changed from set to list comprehension
        {"id": themes[i]['id'],
        "name": themes[i]['name'],
        "preview_image": generate_presigned_url(themes[i]['preview_image']),
        "status": themes[i]['status']
        } for i in range(len(themes))
    ]

@themesAPIs.post("/add")
def add_theme(theme: ThemePayload) -> dict[str, str]:
    """
    Add a theme

    Parameters:
    theme (ThemePayload): Theme details

    Returns:
    dict: Message indicating theme added successfully
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    theme_id = str(uuid4())
    cursor.execute("""
        INSERT INTO themes (id, name, preview_image, status)
        VALUES (?, ?, ?, ?)
    """, (theme_id, theme.name, theme.preview_image, theme.status))
    conn.commit()
    conn.close()
    return {"message": "Theme added successfully", "id": theme_id}

@themesAPIs.put("/edit/{theme_id}")
def edit_theme(theme_id: str, theme: ThemePayload) -> dict[str, str]:
    """
    Edit theme details

    Parameters:
    theme_id (str): Theme ID
    theme (ThemePayload): Theme details to update

    Returns:
    dict: Message indicating theme updated successfully
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE themes SET name=?, preview_image=?, status=?
        WHERE id=?
    """, (theme.name, theme.preview_image, theme.status, theme_id))
    conn.commit()
    conn.close()
    return {"message": "Theme updated successfully"}

@themesAPIs.delete("/delete/{theme_id}")
def delete_theme(theme_id: str) -> dict[str, str]:
    """
    Delete a theme

    Parameters:
    theme_id (str): Theme ID

    Returns:
    dict: Message indicating theme deleted successfully
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE themes SET status='inactive' WHERE id=?", (theme_id,))
    conn.commit()
    conn.close()
    return {"message": "Theme deleted successfully"}
#endregion

#region Collections
@collectionsAPIs.get("/")
def get_all_collections() -> list[dict]:
    """
    Get all active collections

    Parameters:
    None

    Returns:
    list: Collections data including id, name, theme, preview_image, and status
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM collections WHERE status='active'")
    collections = cursor.fetchall()
    conn.close()
    
    return [  # changed from set to list comprehension
        {"id": collections[i]['id'],
        "name": collections[i]['name'],
        "theme": collections[i]['theme'],
        "preview_image": generate_presigned_url(collections[i]['preview_image']),
        "status": collections[i]['status']
        } for i in range(len(collections))
    ]

@collectionsAPIs.get("/{theme}")
def get_collections_by_theme(theme: str) -> list[dict]:
    """
    Get collections by theme

    Parameters:
    theme (str): Theme name

    Returns:
    list: Collections data including id, name, theme, preview_image, and status
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM collections WHERE theme=? AND status='active'", (theme,))
    collections = cursor.fetchall()
    conn.close()
    
    return [  # changed from set to list comprehension
        {"id": collections[i]['id'],
        "name": collections[i]['name'],
        "theme": collections[i]['theme'],
        "preview_image": generate_presigned_url(collections[i]['preview_image']),
        "status": collections[i]['status']
        } for i in range(len(collections))
    ]

@collectionsAPIs.post("/add")
def add_collection(collection: CollectionPayload) -> dict[str, str]:
    """
    Add a collection

    Parameters:
    collection (CollectionPayload): Collection details

    Returns:
    dict: Message indicating collection added successfully
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    collection_id = str(uuid4())
    cursor.execute("""
        INSERT INTO collections (id, name, theme, preview_image, status)
        VALUES (?, ?, ?, ?, ?)
    """, (collection_id, collection.name, collection.theme, collection.preview_image, collection.status))
    conn.commit()
    conn.close()
    return {"message": "Collection added successfully", "id": collection_id}

@collectionsAPIs.put("/edit/{collection_id}")
def edit_collection(collection_id: str, collection: CollectionPayload) -> dict[str, str]:
    """
    Edit collection details

    Parameters:
    collection_id (str): Collection ID

    Returns:
    dict: Message indicating collection updated successfully
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE collections SET name=?, theme=?, preview_image=?, status=?
        WHERE id=?
    """, (collection.name, collection.theme, collection.preview_image, collection.status, collection_id))
    conn.commit()
    conn.close()
    return {"message": "Collection updated successfully"}

@collectionsAPIs.delete("/delete/{collection_id}")
def delete_collection(collection_id: str) -> dict[str, str]:
    """
    Delete a collection

    Parameters:
    collection_id (str): Collection ID

    Returns:
    dict: Message indicating collection deleted successfully
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE collections SET status='inactive' WHERE id=?", (collection_id,))
    conn.commit()
    conn.close()
    return {"message": "Collection deleted successfully"}
#endregion

#region Photos
@photosAPIs.get("/", deprecated=True)
def get_all_photos() -> list[dict[str, str]]:
    """
    Get all active photos

    Parameters:
    None

    Returns:
    list: Photos data including id, name, date_added, theme, collection, favourite, camera_model, 
        focal_length, exposure_time, iso, aperture, preview_image, and status
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM images WHERE status='active'")
    photos = cursor.fetchall()
    conn.close()
    
    return [  # changed from set to list comprehension
        {"id": photos[i]['id'],
        "name": photos[i]['name'],
        "date_added": photos[i]['date_added'],
        "theme": photos[i]['theme'],
        "collection": photos[i]['collection'],
        "favourite": str(photos[i]['favourite']) if photos[i]['favourite'] is not None else "",
        "camera_model": str(photos[i]['camera_model']) if photos[i]['camera_model'] is not None else "",
        "focal_length": str(photos[i]['focal_length']) if photos[i]['focal_length'] is not None else "",
        "exposure_time": str(photos[i]['exposure_time']) if photos[i]['exposure_time'] is not None else "",
        "iso": str(photos[i]['iso']) if photos[i]['iso'] is not None else "",
        "aperture": str(photos[i]['aperture']) if photos[i]['aperture'] is not None else "",
        "preview_image": generate_presigned_url(photos[i]['preview_image']),
        "status": photos[i]['status']
        } for i in range(len(photos))
    ]

@photosAPIs.get("/theme/{theme}/collection/{collection}")
def get_photos_by_theme_and_collection(theme: str, collection: str) -> list[dict]:
    """
    Get photos by theme and collection

    Parameters:
    theme (str): Theme name
    collection (str): Collection name

    Returns:
    list: Photos data including id, name, date_added, theme, collection, favourite, camera_model, 
        focal_length, exposure_time, iso, aperture, preview_image, and
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM images WHERE theme=? AND collection=? AND status='active'", (theme, collection))
    photos = cursor.fetchall()
    conn.close()
    
    return [  # changed from set to list comprehension
        {"id": photos[i]['id'],
        "name": photos[i]['name'],
        "date_added": photos[i]['date_added'],
        "theme": photos[i]['theme'],
        "collection": photos[i]['collection'],
        "favourite": photos[i]['favourite'],
        "camera_model": photos[i]['camera_model'],
        "focal_length": photos[i]['focal_length'],
        "exposure_time": photos[i]['exposure_time'],
        "iso": photos[i]['iso'],
        "aperture": photos[i]['aperture'],
        "preview_image": generate_presigned_url(photos[i]['preview_image']),
        "status": photos[i]['status']
        } for i in range(len(photos))
    ]

@photosAPIs.get("/detail/{photo_id}")
def get_photo_details(photo_id: str) -> dict:
    """
    Get photo details by id

    Parameters:
    photo_id (str): Photo ID

    Returns:
    dict: Photo data including id, name, date_added, theme, collection, favourite, camera_model, 
        focal_length, exposure_time, iso, aperture, preview_image, and status
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM images WHERE id=?", (photo_id,))
    photo = cursor.fetchone()
    conn.close()
    if photo:
        return {
            "id": photo['id'],
            "name": photo['name'],
            "date_added": photo['date_added'],
            "theme": photo['theme'],
            "collection": photo['collection'],
            "favourite": photo['favourite'],
            "camera_model": photo['camera_model'],
            "focal_length": photo['focal_length'],
            "exposure_time": photo['exposure_time'],
            "iso": photo['iso'],
            "aperture": photo['aperture'],
            "preview_image": generate_presigned_url(photo['preview_image']),
            "status": photo['status']
        }
    else:
        raise HTTPException(status_code=404, detail="Photo not found")

@photosAPIs.get("/download/{photo_id}")
def download_photo(photo_id: str) -> dict[str, str]:
    """
    Get photo download URL by id

    Parameters:
    photo_id (str): Photo ID

    Returns:
    dict: Photo download URL
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT filepath FROM images WHERE id=?", (photo_id,))
    photo = cursor.fetchone()
    conn.close()
    if photo:
        return {"url": generate_presigned_url(photo['filepath'])}
    else:
        raise HTTPException(status_code=404, detail="Photo not found")
#endregion

#region Utils
@utilsAPIs.get("/favorites")
def get_favorites() -> list[dict]:
    """
    Get all favorite photos

    Parameters:
    None

    Returns:
    list: Favorite photos data including id, name, date_added, theme, collection, favourite, camera_model, 
        focal_length, exposure_time, iso, aperture, preview_image, and status
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM images WHERE favourite=1")
    favorites = cursor.fetchall()
    conn.close()
    
    return [  # changed from set to list comprehension
        {"id": favorites[i]['id'],
        "name": favorites[i]['name'],
        "date_added": favorites[i]['date_added'],
        "theme": favorites[i]['theme'],
        "collection": favorites[i]['collection'],
        "favourite": favorites[i]['favourite'],
        "camera_model": favorites[i]['camera_model'],
        "focal_length": favorites[i]['focal_length'],
        "exposure_time": favorites[i]['exposure_time'],
        "iso": favorites[i]['iso'],
        "aperture": favorites[i]['aperture'],
        "preview_image": generate_presigned_url(favorites[i]['preview_image']),
        "status": favorites[i]['status']
        } for i in range(len(favorites))
    ]

@utilsAPIs.put("/favorite/{photo_id}")
def set_favorite(photo_id: str, favorite: bool) -> dict[str, str]:
    """
    Set favorite status for a photo

    Parameters:
    photo_id (str): Photo ID
    favorite (bool): Favorite status

    Returns:
    dict: Message indicating favorite status updated
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE images SET favourite=? WHERE id=?", (favorite, photo_id))
    conn.commit()
    conn.close()
    return {"message": "Favorite status updated"}

@utilsAPIs.post("/upload")
def upload_photo(file: UploadFile = File(...), 
                 theme: str = Form(...), 
                 collection: str = Form(...)) -> dict[str, str]:
    """
    Upload a photo

    Parameters:
    file (UploadFile): Photo file
    theme (str): Theme name
    collection (str): Collection name

    Returns:
    dict: Message indicating photo uploaded successfully
    """
    try:
        # Create a unique filename
        file_ext = file.filename.split(".")[-1].lower()
        unique_id = str(uuid4())
        filename = f"{unique_id}.{file_ext}"
        
        # Get system temp dir and create full path
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        
        print(f"Saving uploaded file to temp location: {temp_path}")
        
        # Save uploaded file to temp location
        with open(temp_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
        
        # Verify the temp file exists
        if not os.path.isfile(temp_path):
            raise HTTPException(status_code=500, detail=f"Failed to save temporary file at {temp_path}")
        
        # Define S3 path
        filepath = f"{theme}/{collection}/{filename}"
        
        # Upload original image
        print(f"Uploading original image to S3 path: {filepath}")
        s3_client.upload_file(temp_path, MINIO_BUCKET, filepath)
        
        # Extract EXIF data
        exif = get_exif_data(temp_path)
        
        # Create preview image
        preview_url = None
        print("Attempting to create WebP preview")
        preview_local = convert_to_webp(temp_path)
        
        if preview_local and os.path.isfile(preview_local):
            try:
                preview_filename = os.path.basename(preview_local)
                preview_path = f"{theme}/{collection}/previews/{preview_filename}"
                
                print(f"Uploading WebP preview to S3 path: {preview_path}")
                s3_client.upload_file(preview_local, MINIO_BUCKET, preview_path)
                preview_url = f"{MINIO_BUCKET}/{preview_path}"
                
                print(f"Removing local WebP preview: {preview_local}")
                os.remove(preview_local)
                print(f"WebP preview removed successfully")
            except Exception as e:
                import traceback
                error_details = traceback.format_exc()
                print(f"Error handling WebP preview: {str(e)}\n{error_details}")
        else:
            print(f"Preview creation failed or file doesn't exist")
        
        # Clean up original temp file
        try:
            os.remove(temp_path)
            print(f"Removed original temp file: {temp_path}")
        except Exception as e:
            print(f"Warning: Failed to remove temp file {temp_path}: {str(e)}")
        
        # Add record to database
        date_added = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        conn = get_db_connection()
        cursor = conn.cursor()
        new_id = str(uuid4())
        cursor.execute('''
            INSERT INTO images (id, name, filepath, date_added, theme, collection, 
                                camera_model, focal_length, exposure_time, iso, aperture, preview_image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (new_id, file.filename, filepath, date_added, theme, collection, 
              exif.get("camera_model"), exif.get("focal_length"), exif.get("exposure_time"), 
              exif.get("iso"), exif.get("aperture"), preview_url))
        conn.commit()
        conn.close()
        
        return {"message": "Photo uploaded successfully", "id": new_id}
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Upload error: {str(e)}\n{error_details}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@utilsAPIs.put("/edit/{photo_id}")
def edit_photo(photo_id: str, photo: PhotoUpdate) -> dict[str, str]:
    """
    Edit photo details

    Parameters:
    photo_id (str): Photo ID
    photo (PhotoUpdate): Photo details to update

    Returns:
    dict: Message indicating photo updated successfully
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE images SET name=?, theme=?, collection=?, favourite=?,
                          camera_model=?, focal_length=?, exposure_time=?, iso=?, aperture=?
        WHERE id=?
    ''', (photo.name, photo.theme, photo.collection, photo.favourite,
          photo.camera_model, photo.focal_length, photo.exposure_time, photo.iso, photo.aperture, photo_id))
    conn.commit()
    conn.close()
    return {"message": "Photo updated successfully"}

@utilsAPIs.delete("/delete/{photo_id}")
def delete_photo(photo_id: str) -> dict[str, str]:
    """
    Delete a photo

    Parameters:
    photo_id (str): Photo ID

    Returns:
    dict: Message indicating photo deleted successfully
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE images SET status='inactive' WHERE id=?", (photo_id,))
    conn.commit()
    conn.close()
    return {"message": "Photo deleted successfully"}
#endregion

#region APIsRouter
app.include_router(themesAPIs, tags=["Themes"])
app.include_router(collectionsAPIs, tags=["Collections"])
app.include_router(photosAPIs, tags=["Photos"])
app.include_router(utilsAPIs, tags=["Utils"])
#endregion