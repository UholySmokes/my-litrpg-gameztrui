import os
from pathlib import Path

from dotenv import load_dotenv

ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(ENV_PATH)

print("VERTEX?", os.getenv("GOOGLE_GENAI_USE_VERTEXAI"))
print("KEY SET?", bool(os.getenv("GOOGLE_API_KEY")))
