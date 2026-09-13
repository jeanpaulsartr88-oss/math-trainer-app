import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "math-lms-duolingo-secret-key-change-me")
    BOT_TOKEN = os.getenv("BOT_TOKEN", "")
    DEV_MODE = os.getenv("DEV_MODE", "true").lower() in ("true", "1", "yes")

    # Render uses DATABASE_URL; handle postgres:// to postgresql:// dialect change
    db_url = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'math_app.db')}")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Duolingo mechanics constants
    MAX_HEARTS = 5
    HEART_RECHARGE_HOURS = 4
    BASE_XP_PER_LESSON = 20
