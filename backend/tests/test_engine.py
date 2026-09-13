import unittest
from datetime import datetime, timezone, timedelta, date
from backend.models import db, User, Topic, Lesson, Question, UserMistake
from backend.config import Config
from backend.engine import sync_user_hearts, update_user_streak, practice_resolve_question, record_user_mistakes
from backend.app import create_app

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    DEV_MODE = True

class MathEngineTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_healthz_endpoint(self):
        response = self.client.get("/healthz")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "ok")

    def test_streak_first_day_and_same_day(self):
        user = User(telegram_id=1001, first_name="Alice")
        db.session.add(user)
        db.session.commit()

        d1 = date(2026, 9, 10)
        streak, incremented = update_user_streak(user, reference_date=d1)
        self.assertEqual(streak, 1)
        self.assertTrue(incremented)
        self.assertEqual(user.last_active_date, d1)

        # Same day completion should not increment
        streak_again, incremented_again = update_user_streak(user, reference_date=d1)
        self.assertEqual(streak_again, 1)
        self.assertFalse(incremented_again)

    def test_streak_consecutive_days_and_gap(self):
        user = User(telegram_id=1002, first_name="Bob")
        db.session.add(user)
        db.session.commit()

        d1 = date(2026, 9, 10)
        update_user_streak(user, reference_date=d1)
        self.assertEqual(user.streak_days, 1)

        # Consecutive day (d2 = d1 + 1)
        d2 = date(2026, 9, 11)
        streak2, inc2 = update_user_streak(user, reference_date=d2)
        self.assertEqual(streak2, 2)
        self.assertTrue(inc2)

        # Missed a day (d4 = d2 + 2 days gap)
        d4 = date(2026, 9, 13)
        streak4, inc4 = update_user_streak(user, reference_date=d4)
        self.assertEqual(streak4, 1)
        self.assertTrue(inc4)

    def test_hearts_regeneration(self):
        now = datetime.now(timezone.utc)
        user = User(telegram_id=1003, hearts=2, last_heart_updated=now - timedelta(hours=8, minutes=5))
        db.session.add(user)
        db.session.commit()

        # 8 hours elapsed = 2 hearts should be restored (2 + 2 = 4)
        info = sync_user_hearts(user)
        self.assertEqual(user.hearts, 4)
        self.assertEqual(info["restored_count"], 2)

        # Another 4+ hours elapsed -> should max out at 5
        user.last_heart_updated = now - timedelta(hours=5)
        info2 = sync_user_hearts(user)
        self.assertEqual(user.hearts, 5)

    def test_practice_mode_recovers_hearts_and_resolves_mistakes(self):
        user = User(telegram_id=1004, hearts=3)
        db.session.add(user)
        db.session.flush()

        q = Question.query.first()
        mistake = UserMistake(user_id=user.id, question_id=q.id, fail_count=2)
        db.session.add(mistake)
        db.session.commit()

        # Correct practice answer recovers 1 heart and decrements fail_count
        res = practice_resolve_question(user, q.id, is_correct=True)
        self.assertEqual(res["hearts"], 4)
        self.assertTrue(res["heart_recovered"])
        self.assertEqual(mistake.fail_count, 1)

        # Wrong practice answer does NOT deduct hearts
        res_wrong = practice_resolve_question(user, q.id, is_correct=False)
        self.assertEqual(res_wrong["hearts"], 4)
        self.assertFalse(res_wrong["heart_recovered"])

    def test_public_lesson_questions(self):
        lesson = Lesson.query.first()
        response = self.client.get(f"/api/lesson/{lesson.id}")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("questions", data)
        self.assertGreater(len(data["questions"]), 0)

if __name__ == "__main__":
    unittest.main()
