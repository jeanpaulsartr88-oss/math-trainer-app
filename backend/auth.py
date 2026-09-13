import hmac
import hashlib
import json
import urllib.parse
from datetime import datetime, timezone
from flask import request, jsonify
from functools import wraps
from .models import db, User
from .config import Config
from .engine import sync_user_hearts

def parse_init_data(init_data_raw: str):
    """Parses URL-encoded Telegram initData query string into dict."""
    parsed = urllib.parse.parse_qsl(init_data_raw, keep_blank_values=True)
    return dict(parsed)

def validate_telegram_hash(init_data_raw: str, bot_token: str) -> bool:
    """
    Validates the authenticity of initData using Telegram's HMAC-SHA256 algorithm.
    See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    """
    if not bot_token:
        return False

    try:
        data_dict = parse_init_data(init_data_raw)
        received_hash = data_dict.pop("hash", None)
        if not received_hash:
            return False

        # Sort key=value pairs alphabetically
        data_check_list = [f"{k}={v}" for k, v in sorted(data_dict.items())]
        data_check_string = "\n".join(data_check_list)

        # secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)
        secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()

        # calculated_hash = HMAC_SHA256(key=secret_key, msg=data_check_string).hexdigest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

        return hmac.compare_digest(calculated_hash, received_hash)
    except Exception:
        return False

def get_student_numeric_id(student_id_str: str) -> int:
    """
    Generates a stable 64-bit integer ID for web classroom students (distinct from Telegram range).
    """
    digest = hashlib.sha256(student_id_str.encode("utf-8")).hexdigest()
    # Map to range 10_000_000_000 ... 99_999_999_999 to never collide with Telegram IDs
    return int(digest[:12], 16) % 90_000_000_000 + 10_000_000_000

def get_or_create_user(tg_id: int, first_name: str, username: str = None) -> User:
    """Retrieves or creates a User instance with proper stats initialization."""
    clean_name = (first_name or "Ученик").strip()[:64]
    user = User.query.filter_by(telegram_id=tg_id).first()

    if not user:
        user = User(
            telegram_id=tg_id,
            username=username,
            first_name=clean_name,
            xp=0,
            streak_days=0,
            hearts=Config.MAX_HEARTS,
        )
        db.session.add(user)
        db.session.commit()
    else:
        # Update name if changed
        updated = False
        if clean_name and user.first_name != clean_name:
            user.first_name = clean_name
            updated = True
        if username and user.username != username:
            user.username = username
            updated = True
        if updated:
            db.session.commit()

    # Recalculate passive hearts
    sync_user_hearts(user)
    db.session.commit()
    return user

get_or_create_user_from_tg_data = get_or_create_user

def authenticate_user():
    """
    Extracts and authenticates user dynamically:
    1. Telegram WebApp initData (from X-Telegram-Init-Data, Authorization: Bearer, or JSON body)
    2. Web Classroom / Guest student (from X-Student-Id & X-Student-Name or JSON body)
    Zero hardcoded test mocks: each student gets their own independent record!
    """
    body_data = request.get_json(silent=True) or {}

    # Check for Telegram initData
    init_data_raw = (
        request.headers.get("X-Telegram-Init-Data") or
        request.headers.get("Authorization", "").replace("Bearer ", "") or
        body_data.get("initData")
    )

    if init_data_raw and init_data_raw.strip():
        # Validate Telegram hash if BOT_TOKEN is configured
        is_valid = validate_telegram_hash(init_data_raw, Config.BOT_TOKEN)

        # In dev mode, allow unverified Telegram initData
        if not is_valid and Config.DEV_MODE:
            is_valid = True

        if is_valid:
            try:
                data_dict = parse_init_data(init_data_raw)
                user_raw = data_dict.get("user")
                if user_raw:
                    user_dict = json.loads(user_raw)
                    return get_or_create_user(
                        tg_id=int(user_dict["id"]),
                        first_name=user_dict.get("first_name", "Ученик"),
                        username=user_dict.get("username"),
                    )
            except Exception:
                pass

    # Check for Browser Classroom student credentials
    student_id = (
        request.headers.get("X-Student-Id") or
        request.headers.get("X-Guest-Id") or
        body_data.get("student_id") or
        body_data.get("guest_id")
    )

    student_name_raw = (
        request.headers.get("X-Student-Name") or
        request.headers.get("X-Guest-Name") or
        body_data.get("student_name") or
        body_data.get("guest_name")
    )

    if student_id and student_id.strip():
        # Decode URI encoded name if passed via HTTP header
        try:
            student_name = urllib.parse.unquote(student_name_raw or "").strip() or "Ученик"
        except Exception:
            student_name = (student_name_raw or "Ученик").strip()

        numeric_id = get_student_numeric_id(student_id.strip())
        return get_or_create_user(
            tg_id=numeric_id,
            first_name=student_name,
            username=f"student_{student_id[:8]}",
        )

    return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = authenticate_user()
        return f(user, *args, **kwargs)
    return decorated_function
