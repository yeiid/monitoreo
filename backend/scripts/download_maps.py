import os
import requests
import sys

def download_file(url, dest_path):
    print(f"Checking for map file at {dest_path}...")
    if os.path.exists(dest_path):
        size = os.path.getsize(dest_path)
        if size > 1024 * 1024:  # At least 1MB
            print("✅ Map file already exists and looks valid. Skipping download.")
            return

    print(f"📥 Map file not found or invalid. Downloading from {url}...")
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    
    try:
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(dest_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        print("✅ Download complete!")
    except Exception as e:
        print(f"❌ Error downloading map: {e}")
        sys.exit(1)

if __name__ == "__main__":
    MAP_URL = os.getenv("MAP_DOWNLOAD_URL")
    if not MAP_URL:
        print("⚠️ MAP_DOWNLOAD_URL environment variable not set. Skipping auto-download.")
        sys.exit(0)
    
    DEST = os.path.join(os.path.dirname(__file__), "..", "maps", "colombia.mbtiles")
    download_file(MAP_URL, DEST)
