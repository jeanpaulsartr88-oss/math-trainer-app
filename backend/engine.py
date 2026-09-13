from datetime import datetime, timezone, timedelta
from .models import db, User, UserMistake
from .config import Config

def get_utc_now():
    return datetime.now(timezone.utc)

def sync_user_hearts(user):
    """
    Recalculates passive heart regeneration.
    Restores 1 heart every Config.HEART_RECHARGE_HOURS hours (default 4h), up to Config.MAX_HEARTS (default 5).
    Returns dict with current hearts, time to next heart, and whether hearts were restored.
    """
    now = get_utc_now()
    if user.hearts >= Config.MAX_HEARTS:
        # Reset recharge anchor when full
        user.last_heart_updated = now
        return {
            "hearts": user.hearts,
            "seconds_until_next_heart": 0,
            "restored_count": 0,
        }

    # Ensure timezone aware
    last_updated = user.last_heart_updated
    if last_updated.tzinfo is None:
        last_updated = last_updated.replace(tzinfo=timezone.utc)

    elapsed_seconds = (now - last_updated).total_seconds()
    recharge_interval_seconds = Config.HEART_RECHARGE_HOURS * 3600

    hearts_to_restore = int(elapsed_seconds // recharge_interval_seconds)
    restored_count = 0

    if hearts_to_restore > 0:
        new_hearts = min(Config.MAX_HEARTS, user.hearts + hearts_to_restore)
        restored_count = new_hearts - user.hearts
        user.hearts = new_hearts

        if user.hearts >= Config.MAX_HEARTS:
            user.last_heart_updated = now
        else:
            # Advance timestamp by whole intervals used
            user.last_heart_updated = last_updated + timedelta(seconds=hearts_to_restore * recharge_interval_seconds)

    if user.hearts < Config.MAX_HEARTS:
        current_last = user.last_heart_updated
        if current_last.tzinfo is None:
            current_last = current_last.replace(tzinfo=timezone.utc)
        current_elapsed = (now - current_last).total_seconds()
        seconds_until_next = max(0, int(recharge_interval_seconds - current_elapsed))
    else:
        seconds_until_next = 0

    return {
        "hearts": user.hearts,
        "seconds_until_next_heart": seconds_until_next,
        "restored_count": restored_count,
    }

def update_user_streak(user, reference_date=None):
    """
    Updates user streak logic.
    - If user already completed a lesson today: streak does not increment.
    - If last active date was yesterday: streak += 1.
    - If gap > 1 day: streak reset to 1.
    - If first lesson ever: streak = 1.
    Returns tuple: (updated_streak_days, streak_incremented_bool)
    """
    today = reference_date or get_utc_now().date()

    if user.last_active_date is None:
        user.streak_days = 1
        user.last_active_date = today
        return user.streak_days, True

    if user.last_active_date == today:
        # Already credited today
        return user.streak_days, False

    days_diff = (today - user.last_active_date).days

    if days_diff == 1:
        # Consecutive day
        user.streak_days += 1
        user.last_active_date = today
        return user.streak_days, True
    elif days_diff > 1:
        # Broken streak
        user.streak_days = 1
        user.last_active_date = today
        return user.streak_days, True
    else:
        # Edge case: reference_date before last_active_date (clock skew)
        return user.streak_days, False

def record_user_mistakes(user_id, failed_question_ids):
    """
    Increments or creates mistakes in UserMistake table for Spaced Repetition Practice.
    """
    if not failed_question_ids:
        return

    now = get_utc_now()
    for q_id in set(failed_question_ids):
        mistake = UserMistake.query.filter_by(user_id=user_id, question_id=q_id).first()
        if mistake:
            mistake.fail_count += 1
            mistake.last_failed_at = now
        else:
            mistake = UserMistake(
                user_id=user_id,
                question_id=q_id,
                fail_count=1,
                last_failed_at=now,
            )
            db.session.add(mistake)

def practice_resolve_question(user, question_id, is_correct):
    """
    Handles question answered in Practice Mode:
    - If correct: user gains +1 heart (up to MAX_HEARTS), mistake count decreases.
    - If incorrect: hearts are NOT lost in practice mode.
    """
    now = get_utc_now()
    heart_recovered = False

    if is_correct:
        if user.hearts < Config.MAX_HEARTS:
            user.hearts += 1
            heart_recovered = True
            if user.hearts >= Config.MAX_HEARTS:
                user.last_heart_updated = now

        mistake = UserMistake.query.filter_by(user_id=user.id, question_id=question_id).first()
        if mistake:
            if mistake.fail_count <= 1:
                db.session.delete(mistake)
            else:
                mistake.fail_count -= 1

    return {
        "hearts": user.hearts,
        "heart_recovered": heart_recovered,
        "is_correct": is_correct,
    }
