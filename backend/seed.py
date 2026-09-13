import os
import json
import sys
from sqlalchemy.exc import IntegrityError
from .models import db, Topic, Lesson, Question

SEEDS_DIR = os.path.join(os.path.dirname(__file__), "seeds")
QUESTIONS_JSON_PATH = os.path.join(SEEDS_DIR, "questions_data.json")

ICON_MAP = {
    "fsu": "calculator",
    "quadratic-equations": "compass",
    "powers-and-roots": "zap",
    "linear-equations-and-inequalities": "sliders",
}

def seed_database(force=False):
    """
    Seeds database from backend/seeds/questions_data.json containing 105 math questions.
    Idempotent and safe against concurrent worker executions and unique constraint violations.
    """
    if force:
        print("Clearing old curriculum for fresh seed...")
        try:
            Question.query.delete()
            Lesson.query.delete()
            Topic.query.delete()
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Warning during force clear: {e}")

    if not os.path.exists(QUESTIONS_JSON_PATH):
        print(f"Seed file not found: {QUESTIONS_JSON_PATH}")
        return

    with open(QUESTIONS_JSON_PATH, "r", encoding="utf-8") as f:
        curriculum = json.load(f)

    total_questions = 0

    try:
        for t_idx, t_data in enumerate(curriculum, start=1):
            slug = t_data.get("topic_slug", f"topic-{t_idx}")
            title = t_data.get("topic_title", f"Тема {t_idx}")
            icon = ICON_MAP.get(slug, "calculator")

            # Check if topic already exists to prevent UNIQUE constraint failed: topics.slug
            topic = Topic.query.filter_by(slug=slug).first()
            if not topic:
                topic = Topic(
                    slug=slug,
                    title=title,
                    icon=icon,
                    order_index=t_idx,
                )
                db.session.add(topic)
                db.session.flush()
            else:
                topic.title = title
                topic.icon = icon
                topic.order_index = t_idx
                db.session.flush()

            for l_data in t_data.get("lessons", []):
                order = l_data.get("order", 1)
                lesson_title = l_data.get("lesson_title", f"Урок {order}")
                xp_reward = 25

                # Check if lesson already exists
                lesson = Lesson.query.filter_by(topic_id=topic.id, order_index=order).first()
                if not lesson:
                    lesson = Lesson(
                        topic_id=topic.id,
                        title=lesson_title,
                        order_index=order,
                        xp_reward=xp_reward,
                    )
                    db.session.add(lesson)
                    db.session.flush()
                else:
                    lesson.title = lesson_title
                    lesson.xp_reward = xp_reward
                    db.session.flush()

                # Add questions if not already present
                existing_q_count = Question.query.filter_by(lesson_id=lesson.id).count()
                if existing_q_count == 0:
                    for q_data in l_data.get("questions", []):
                        q = Question(
                            lesson_id=lesson.id,
                            latex_text=q_data["latex_text"],
                            question_type=q_data.get("question_type", "choice"),
                            options_json=json.dumps(q_data.get("options", []), ensure_ascii=False),
                            correct_answer=q_data["correct_answer"],
                            explanation_latex=q_data.get("explanation", ""),
                        )
                        db.session.add(q)
                        total_questions += 1
                else:
                    total_questions += existing_q_count

        db.session.commit()
        print(f"Database successfully seeded/verified with {len(curriculum)} topics and {total_questions} questions!")
    except IntegrityError as err:
        db.session.rollback()
        print(f"Concurrent database seed detected. Rolled back safely without error: {err}")
    except Exception as e:
        db.session.rollback()
        print(f"Unexpected error during seed: {e}")

if __name__ == "__main__":
    # Allow running directly: python -m backend.seed or python backend/seed.py
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from backend.app import create_app
    app = create_app(seed=False)
    with app.app_context():
        db.create_all()
        seed_database()
