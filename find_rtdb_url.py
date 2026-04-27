# find_rtdb_url.py
import requests
import os
from dotenv import load_dotenv

load_dotenv('.env.local')
PROJECT_ID = os.environ.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
API_KEY = os.environ.get('NEXT_PUBLIC_FIREBASE_API_KEY')

patterns = [
    f"https://{PROJECT_ID}.firebaseio.com",
    f"https://{PROJECT_ID}-default-rtdb.firebaseio.com",
    f"https://{PROJECT_ID}.asia-southeast1.firebasedatabase.app",
    f"https://{PROJECT_ID}-default-rtdb.asia-southeast1.firebasedatabase.app",
    f"https://{PROJECT_ID}.europe-west1.firebasedatabase.app",
    f"https://{PROJECT_ID}-default-rtdb.europe-west1.firebasedatabase.app",
]

def test_urls():
    for url in patterns:
        try:
            full_url = f"{url}/.json?key={API_KEY}"
            resp = requests.get(full_url, timeout=5)
            print(f"Testing: {url} -> Status: {resp.status_code}")
            if resp.status_code in [200, 401, 403]:
                print(f"[FOUND] Valid RTDB endpoint: {url}")
                return url
        except:
            pass
    return None

if __name__ == "__main__":
    result = test_urls()
    if result:
        print(f"\nFinal URL: {result}")
    else:
        print("\n[FAIL] No valid RTDB endpoint found.")
