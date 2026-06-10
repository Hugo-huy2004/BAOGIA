import os
# pyrefly: ignore [missing-import]
from google import genai
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()

try:
    print("Listing available models...")
    for m in client.models.list():
        print(f"Model: {m.name}, Display Name: {m.display_name or m.displayName}")
except Exception as e:
    print(f"Error listing models: {e}")
