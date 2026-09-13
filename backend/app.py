import os
from datetime import datetime, timezone
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from .config import Config
from .models import db, Topic, Lesson, Question
from .seed import seed_database

def create_app(config_class=Config):
    static_folder = os.path.join(os.path.dirname(__file__), "static")
    app = Flask(__name__, static_folder=static_folder)
    app.config.from_object(config_class)

    # Enable CORS for local Vite dev server
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)

    with app.app_context():
        db.create_all()
        seed_database()

    # -------------------------------------------------------------
    # 1. Health check endpoint (for UptimeRobot & Render keep-alive)
    # -------------------------------------------------------------
    @app.route("/healthz", methods=["GET"])
    def health_check():
        """Lightweight endpoint returning 200 OK without DB overhead."""
        return jsonify({"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}), 200

    # -------------------------------------------------------------
    # 2. Auth stubs (Fully unauthenticated: always returns status ok)
    # -------------------------------------------------------------
    @app.route("/api/auth/telegram", methods=["GET", "POST"])
    @app.route("/api/auth/<path:subpath>", methods=["GET", "POST"])
    def auth_stub(subpath=None):
        return jsonify({"status": "ok", "authenticated": True}), 200

    @app.route("/api/user/profile", methods=["GET"])
    def get_profile_stub():
        return jsonify({"status": "ok"}), 200

    # -------------------------------------------------------------
    # 3. Public Topics & Lessons Curriculum
    # -------------------------------------------------------------
    @app.route("/api/topics", methods=["GET"])
    def get_topics():
        """Returns all topics with lessons. Progress is managed client-side in CloudStorage."""
        topics = Topic.query.order_by(Topic.order_index).all()
        return jsonify({
            "topics": [topic.to_dict() for topic in topics],
            "total_topics": len(topics),
        }), 200

    # -------------------------------------------------------------
    # 4. Public Lesson Questions
    # -------------------------------------------------------------
    @app.route("/api/lesson/<int:lesson_id>", methods=["GET"])
    @app.route("/api/lesson/<int:lesson_id>/start", methods=["GET"])
    def get_lesson_questions(lesson_id):
        """Returns lesson details and questions without auth barriers."""
        lesson = db.session.get(Lesson, lesson_id)
        if not lesson:
            return jsonify({"error": "not_found", "message": "Урок не найден"}), 404

        questions = Question.query.filter_by(lesson_id=lesson.id).all()
        return jsonify({
            "lesson": lesson.to_dict(),
            "questions": [q.to_dict(include_answer=True) for q in questions],
        }), 200

    @app.route("/api/lesson/<int:lesson_id>/complete", methods=["POST"])
    def complete_lesson(lesson_id):
        """
        Public completion endpoint. Progress is stored in Telegram CloudStorage & localStorage.
        """
        return jsonify({"status": "ok", "success": True}), 200

    # -------------------------------------------------------------
    # 5. Public Practice Mode Questions
    # -------------------------------------------------------------
    @app.route("/api/practice/questions", methods=["GET"])
    @app.route("/api/practice/mistakes", methods=["GET"])
    def get_practice_questions():
        """
        Public practice questions endpoint:
        Takes optional ?ids=1,2,3 from client's math_mistakes pool.
        Supplements with syllabus questions if needed to provide at least 5 questions.
        """
        ids_param = request.args.get("ids", "")
        requested_ids = []
        if ids_param:
            for item in ids_param.split(","):
                try:
                    requested_ids.append(int(item.strip()))
                except ValueError:
                    pass

        practice_questions = []
        seen_ids = set()
        if requested_ids:
            questions = Question.query.filter(Question.id.in_(requested_ids)).all()
            for q in questions:
                practice_questions.append(q.to_dict(include_answer=True))
                seen_ids.add(q.id)

        # Supplement if fewer than 5 questions
        if len(practice_questions) < 5:
            fallback = Question.query.filter(~Question.id.in_(seen_ids) if seen_ids else True).limit(5 - len(practice_questions)).all()
            for q in fallback:
                practice_questions.append(q.to_dict(include_answer=True))

        return jsonify({
            "questions": practice_questions,
        }), 200

    @app.route("/api/practice/answer", methods=["POST"])
    def practice_answer():
        """Public endpoint for practice submission."""
        return jsonify({"status": "ok", "success": True}), 200

    # -------------------------------------------------------------
    # 6. SPA Static Serving (Single Port for Render)
    # -------------------------------------------------------------
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve(path):
        """Serves built React static files or index.html for SPA routing."""
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        if os.path.exists(os.path.join(app.static_folder, "index.html")):
            return send_from_directory(app.static_folder, "index.html")
        return jsonify({
            "status": "backend_ready",
            "message": "Frontend dist is not yet compiled into backend/static. Run build.sh or start Vite in dev mode.",
        })

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
