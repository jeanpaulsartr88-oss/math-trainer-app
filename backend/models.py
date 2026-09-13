from datetime import datetime, timezone
import json
from sqlalchemy import event
from sqlalchemy.engine import Engine
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    Optimizes SQLite for high concurrency (20-25 concurrent users):
    - journal_mode=WAL: non-blocking concurrent readers & writers
    - busy_timeout=30000: waits up to 30 seconds for lock release to prevent 'database is locked'
    - synchronous=NORMAL: optimal disk flush balance
    - temp_store=MEMORY: in-memory temp tables
    """
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA busy_timeout=30000;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA temp_store=MEMORY;")
        cursor.close()
    except Exception:
        # Ignore for non-SQLite engines like PostgreSQL
        pass

def utcnow():
    return datetime.now(timezone.utc)

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    telegram_id = db.Column(db.BigInteger, unique=True, nullable=False, index=True)
    username = db.Column(db.String(64), nullable=True)
    first_name = db.Column(db.String(64), nullable=False, default="Ученик")
    xp = db.Column(db.Integer, nullable=False, default=0)
    streak_days = db.Column(db.Integer, nullable=False, default=0)
    last_active_date = db.Column(db.Date, nullable=True)
    hearts = db.Column(db.Integer, nullable=False, default=5)
    last_heart_updated = db.Column(db.DateTime, nullable=False, default=utcnow)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    # Relationships
    mistakes = db.relationship("UserMistake", backref="user", cascade="all, delete-orphan", lazy="dynamic")
    progress = db.relationship("UserLessonProgress", backref="user", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "telegram_id": self.telegram_id,
            "username": self.username,
            "first_name": self.first_name,
            "xp": self.xp,
            "streak_days": self.streak_days,
            "last_active_date": self.last_active_date.isoformat() if self.last_active_date else None,
            "hearts": self.hearts,
            "last_heart_updated": self.last_heart_updated.isoformat() if self.last_heart_updated else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Topic(db.Model):
    __tablename__ = "topics"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(64), unique=True, nullable=False)
    title = db.Column(db.String(128), nullable=False)
    icon = db.Column(db.String(32), nullable=False, default="calculator")
    order_index = db.Column(db.Integer, nullable=False, default=0)

    lessons = db.relationship("Lesson", backref="topic", cascade="all, delete-orphan", order_by="Lesson.order_index", lazy="joined")

    def to_dict(self, completed_lesson_ids=None):
        completed_set = set(completed_lesson_ids or [])
        return {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "icon": self.icon,
            "order_index": self.order_index,
            "lessons": [lesson.to_dict(is_completed=lesson.id in completed_set) for lesson in self.lessons],
        }

class Lesson(db.Model):
    __tablename__ = "lessons"

    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=False)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    title = db.Column(db.String(128), nullable=False)
    xp_reward = db.Column(db.Integer, nullable=False, default=20)

    questions = db.relationship("Question", backref="lesson", cascade="all, delete-orphan", order_by="Question.id", lazy=True)

    def to_dict(self, is_completed=False):
        return {
            "id": self.id,
            "topic_id": self.topic_id,
            "order_index": self.order_index,
            "title": self.title,
            "xp_reward": self.xp_reward,
            "question_count": len(self.questions),
            "is_completed": is_completed,
        }

class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.id"), nullable=False)
    latex_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False, default="choice")  # 'choice', 'input', 'boolean'
    options_json = db.Column(db.Text, nullable=True)  # JSON array of strings
    correct_answer = db.Column(db.String(128), nullable=False)
    explanation_latex = db.Column(db.Text, nullable=True)

    def get_options(self):
        if not self.options_json:
            return []
        try:
            return json.loads(self.options_json)
        except Exception:
            return []

    def to_dict(self, include_answer=False):
        data = {
            "id": self.id,
            "lesson_id": self.lesson_id,
            "latex_text": self.latex_text,
            "question_type": self.question_type,
            "options": self.get_options(),
            "explanation_latex": self.explanation_latex,
        }
        if include_answer:
            data["correct_answer"] = self.correct_answer
        return data

class UserMistake(db.Model):
    __tablename__ = "user_mistakes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False, index=True)
    fail_count = db.Column(db.Integer, nullable=False, default=1)
    last_failed_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    question = db.relationship("Question", lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "fail_count": self.fail_count,
            "last_failed_at": self.last_failed_at.isoformat() if self.last_failed_at else None,
            "question": self.question.to_dict() if self.question else None,
        }

class UserLessonProgress(db.Model):
    __tablename__ = "user_lesson_progress"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.id"), nullable=False, index=True)
    completed = db.Column(db.Boolean, nullable=False, default=True)
    completed_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    first_try_accuracy = db.Column(db.Integer, nullable=False, default=100)
