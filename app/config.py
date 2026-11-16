import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
ROOT = Path(__file__).resolve().parents[1]

class Config:
    DATABASE_URL = os.getenv('DATABASE_URL', '')
    ARTIFACT_DIR = os.getenv('ARTIFACT_DIR', str(ROOT / 'ml/artifacts'))
    RISK_LOW_THRESHOLD = float(os.getenv('RISK_LOW_THRESHOLD', '0.30'))
    RISK_HIGH_THRESHOLD = float(os.getenv('RISK_HIGH_THRESHOLD', '0.70'))
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
    MAX_CONTENT_LENGTH = 64 * 1024
