import os
import unittest
import tempfile
import concurrent.futures
from backend.models import db, Topic, Lesson, Question
from backend.config import Config
from backend.app import create_app

class ConcurrencyStressTestCase(unittest.TestCase):
    def setUp(self):
        self.db_fd, self.db_path = tempfile.mkstemp(suffix=".db")
        os.close(self.db_fd)

        class StressTestConfig(Config):
            TESTING = True
            SQLALCHEMY_DATABASE_URI = f"sqlite:///{self.db_path}"
            DEV_MODE = True

        self.app = create_app(StressTestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        db.session.remove()
        self.app_context.pop()
        try:
            os.remove(self.db_path)
            wal_path = f"{self.db_path}-wal"
            shm_path = f"{self.db_path}-shm"
            if os.path.exists(wal_path):
                os.remove(wal_path)
            if os.path.exists(shm_path):
                os.remove(shm_path)
        except Exception:
            pass

    def test_wal_mode_enabled(self):
        """Verifies SQLite is operating in WAL mode with 30s busy timeout."""
        with self.app.app_context():
            result = db.session.execute(db.text("PRAGMA journal_mode;")).scalar()
            self.assertEqual(result.lower(), "wal")

            timeout = db.session.execute(db.text("PRAGMA busy_timeout;")).scalar()
            self.assertEqual(timeout, 30000)

    def test_25_concurrent_public_requests(self):
        """
        Simulates 25 concurrent students accessing syllabus curriculum,
        lesson questions, completing lessons, and fetching practice questions
        without any authentication barriers.
        """
        num_students = 25
        first_lesson = Lesson.query.order_by(Lesson.id).first()
        self.assertIsNotNone(first_lesson, "Seed lessons must exist")
        lesson_id = first_lesson.id

        def simulate_student(idx):
            client = self.app.test_client()

            # 1. Fetch Topics (public)
            topics_res = client.get("/api/topics")
            if topics_res.status_code != 200:
                return False, f"Get topics failed: {topics_res.status_code}"
            topics_data = topics_res.get_json()
            if not topics_data.get("topics"):
                return False, "Empty topics returned"

            # 2. Fetch Lesson Questions (public)
            lesson_res = client.get(f"/api/lesson/{lesson_id}")
            if lesson_res.status_code != 200:
                return False, f"Get lesson failed: {lesson_res.status_code}"
            lesson_data = lesson_res.get_json()
            if not lesson_data.get("questions"):
                return False, "Empty questions returned"

            # 3. Complete Lesson (public)
            complete_res = client.post(
                f"/api/lesson/{lesson_id}/complete",
                json={
                    "xp_earned": 20,
                    "accuracy": 100,
                }
            )
            if complete_res.status_code != 200:
                return False, f"Complete lesson failed: {complete_res.status_code}"

            # 4. Fetch Practice Questions (public)
            practice_res = client.get("/api/practice/questions?ids=1,2")
            if practice_res.status_code != 200:
                return False, f"Get practice failed: {practice_res.status_code}"
            practice_data = practice_res.get_json()
            if not practice_data.get("questions"):
                return False, "Empty practice questions returned"

            return True, "Success"

        with concurrent.futures.ThreadPoolExecutor(max_workers=25) as executor:
            futures = [executor.submit(simulate_student, i) for i in range(1, num_students + 1)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        for success, message in results:
            self.assertTrue(success, f"Concurrent student request failed: {message}")

if __name__ == "__main__":
    unittest.main()
