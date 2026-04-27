import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")
api_key = os.environ.get("GEMINI_API_KEY")

print(f"Testing key: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

try:
    genai.configure(api_key=api_key)
    print("Listing models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
    
    model = genai.GenerativeModel("gemini-flash-latest")
    response = model.generate_content("Say hello")
    print("Success!")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
