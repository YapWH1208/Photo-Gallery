# Photo Gallery
A simple photo gallery application built with Next.js, FastAPI, SQLite, and MinIO for object storage.

# Features
- **Next.js** for the frontend
- **FastAPI** as the backend
- **SQLite** as the database
- **MinIO** for object storage
- Image upload and retrieval
- Metadata storage using SQLite

# Installation
## Prerequisites
Ensure you have the following installed:
- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 16+](https://nodejs.org/en)
- [Minio server](https://min.io/docs/minio/windows/index.html) 
- SQLite (Built in with python)

## Setup
1. Clone the repository
 ```sh
git clone https://github.com/YapWH1208/Photo-Gallery.git
 ```
2. Download [Minio](https://min.io/docs/minio/windows/index.html) server executable
3. Install the python requirements in the backend
 ```sh
 cd photo-gallery-backend
 pip install -r requirements.txt
 ```
4. Install the dependencies of the frontend
 ```sh
cd photo-gallery-frontend
npm install --legacy-peer-deps
 ```

# Usage
1. Start up Minio Server
 ```sh
[Minio Filepath] server --address :9500 --console-address :9501 [Storage Folderpath]
 ```
2. Start up FastAPI service
 ```sh
 cd photo-gallery-backend
 uvicorn apis:app --reload
 ```
3. Start up frontend
```sh
npm run build
npm start
```
4. Open the webpage at `http://localhost:3000`

# License
This project is licensed under the MIT License.

# Contributors
<a href="https://github.com/YapWH1208/Photo-Gallery/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=YapWH1208/Photo-Gallery" />
</a>

# Acknowledgments
- FastAPI for backend API
- Next.js for frontend UI
- MinIO for storage
