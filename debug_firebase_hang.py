# debug_firebase_hang.py
import os
import time
import requests
from dotenv import load_dotenv

# We'll use the REST API as a baseline to see if the hang is in the SDK or the Network
load_dotenv('.env.local')

PROJECT_ID = os.environ.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
API_KEY = os.environ.get('NEXT_PUBLIC_FIREBASE_API_KEY')
DATABASE_URL = os.environ.get('NEXT_PUBLIC_FIREBASE_DATABASE_URL')

def test_firestore():
    print(f"\n--- Testing Firestore REST API (Project: {PROJECT_ID}) ---")
    # https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection_id}
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/test_connection?key={API_KEY}"
    payload = {
        "fields": {
            "test_time": {"stringValue": str(time.time())}
        }
    }
    try:
        start = time.time()
        response = requests.post(url, json=payload, timeout=10)
        end = time.time()
        print(f"Status: {response.status_code}")
        print(f"Time Taken: {end - start:.2f}s")
        if response.status_code == 200:
            print("[OK] Firestore is reachable and writable via REST.")
        else:
            print(f"[FAIL] Firestore returned: {response.text}")
    except Exception as e:
        print(f"[ERROR] Firestore Test Exception: {e}")

def test_rtdb():
    print(f"\n--- Testing Realtime DB REST API (URL: {DATABASE_URL}) ---")
    # {DATABASE_URL}/test.json?auth={token}
    url = f"{DATABASE_URL}/test_connection.json?key={API_KEY}" 
    payload = {"test_time": time.time()}
    try:
        start = time.time()
        response = requests.put(url, json=payload, timeout=10)
        end = time.time()
        print(f"Status: {response.status_code}")
        print(f"Time Taken: {end - start:.2f}s")
        if response.status_code == 200:
            print("[OK] Realtime DB is reachable and writable via REST.")
        else:
            print(f"[FAIL] RTDB returned: {response.text}")
    except Exception as e:
        print(f"[ERROR] RTDB Test Exception: {e}")

if __name__ == "__main__":
    test_firestore()
    test_rtdb()
