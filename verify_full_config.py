import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore, db

def verify_gemini():
    print("\n--- Testing Gemini API ---")
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        print("[FAIL] GEMINI_API_KEY not found in environment.")
        return False
    
    print(f"Using Key: {key[:5]}...{key[-5:]}")
    try:
        genai.configure(api_key=key)
        # Try a basic model check
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content("Hi")
        print(f"[OK] Gemini Response: {response.text.strip()}")
        return True
    except Exception as e:
        print(f"[ERROR] Gemini API check failed.")
        print(f"Details: {e}")
        if "Generative Language API has not been used" in str(e):
            print("\n!!! ACTION REQUIRED !!!")
            print("Please enable the 'Generative Language API' at:")
            print("https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com")
        return False

def verify_firebase():
    print("\n--- Testing Firebase ---")
    project_id = os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID")
    if not project_id:
        print("[FAIL] NEXT_PUBLIC_FIREBASE_PROJECT_ID not found.")
        return False
    
    print(f"Project ID: {project_id}")
    print("[OK] Firebase configuration found.")
    return True

if __name__ == "__main__":
    load_dotenv(dotenv_path=".env.local")
    gemini_ok = verify_gemini()
    firebase_ok = verify_firebase()
    
    if gemini_ok and firebase_ok:
        print("\nALL SYSTEMS OPERATIONAL")
    else:
        print("\nSOME SYSTEMS FAILED")
