import os
from pathlib import Path

from dotenv import load_dotenv

ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(ENV_PATH)

print("VERTEX?", os.getenv("GOOGLE_GENAI_USE_VERTEXAI"))
print("KEY SET?", bool(os.getenv("GOOGLE_API_KEY")))
print(
    "MODEL?",
    os.getenv("NARRATOR_ADK_MODEL")
    or os.getenv("GEMINI_MODEL")
    or "gemini-2.5-flash",
)
print("FALLBACK?", os.getenv("GEMINI_FALLBACK_MODEL") or "(none)")
