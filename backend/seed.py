import os
import json
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
    If force=True, clears existing topics, lessons, and questions first.
    """
    if not force and Topic.query.first():
        print("Database already contains topics. Skipping seed.")
        return

    if force:
        print("Clearing old curriculum for fresh seed...")
        Question.query.delete()
        Lesson.query.delete()
        Topic.query.delete()
        db.session.commit()

    if not os.path.exists(QUESTIONS_JSON_PATH):
        print(f"Seed file not found: {QUESTIONS_JSON_PATH}")
        return

    with open(QUESTIONS_JSON_PATH, "r", encoding="utf-8") as f:
        curriculum = json.load(f)

    total_questions = 0

    for t_idx, t_data in enumerate(curriculum, start=1):
        slug = t_data.get("topic_slug", f"topic-{t_idx}")
        title = t_data.get("topic_title", f"Тема {t_idx}")
        icon = ICON_MAP.get(slug, "calculator")

        topic = Topic(
            slug=slug,
            title=title,
            icon=icon,
            order_index=t_idx,
        )
        db.session.add(topic)
        db.session.flush()

        for l_data in t_data.get("lessons", []):
            order = l_data.get("order", 1)
            lesson_title = l_data.get("lesson_title", f"Урок {order}")
            xp_reward = 25

            lesson = Lesson(
                topic_id=topic.id,
                title=lesson_title,
                order_index=order,
                xp_reward=xp_reward,
            )
            db.session.add(lesson)
            db.session.flush()

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

    db.session.commit()
    print(f"Database successfully seeded with {len(curriculum)} topics and {total_questions} questions!")
