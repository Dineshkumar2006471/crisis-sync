
import firebase_admin
from firebase_admin import credentials, firestore, db as rtdb
import json
import os

# Initialize Firebase Admin
cred_path = "fir-project-f09ad-firebase-adminsdk-fbsvc-9b47310a7d.json"
if not os.path.exists(cred_path):
    print(f"Error: {cred_path} not found.")
    exit(1)

cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://fir-project-f09ad-default-rtdb.firebaseio.com/'
})

fs = firestore.client()

def clear_incidents():
    print("Clearing Firestore incidents...")
    incidents_ref = fs.collection('incidents')
    docs = incidents_ref.list_documents()
    count = 0
    for doc in docs:
        doc.delete()
        count += 1
    print(f"Deleted {count} incidents from Firestore.")

    print("Clearing RTDB live_incidents...")
    rtdb.reference('live_incidents').delete()
    print("RTDB live_incidents cleared.")

    print("Clearing Logs...")
    logs_ref = fs.collection('logs')
    docs = logs_ref.list_documents()
    count = 0
    for doc in docs:
        doc.delete()
        count += 1
    print(f"Deleted {count} logs from Firestore.")

if __name__ == "__main__":
    clear_incidents()
