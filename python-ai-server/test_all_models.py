import os
# pyrefly: ignore [missing-import]
from google import genai
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()

models_to_test = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.5-flash"
]

print("Testing different models for quota...")
for m in models_to_test:
    try:
        response = client.models.generate_content(
            model=m,
            contents="Say Hello"
        )
        print(f"✅ Success with model {m}: {response.text.strip()}")
    except Exception as e:
        print(f"❌ Error with model {m}: {e}")
