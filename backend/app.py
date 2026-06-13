"""Flask 应用入口。"""

import os

from flask import Flask
from flask_cors import CORS

from models import db
from routes.categories import categories_bp
from routes.games import games_bp
from seed import seed_database


def create_app() -> Flask:
    """
     创建并配置 Flask 应用。

     @returns {Flask} 应用实例
     """
    app = Flask(__name__)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)

    db_path = os.path.join(data_dir, "chess.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(games_bp)
    app.register_blueprint(categories_bp)

    @app.get("/api/health")
    def health():
        """健康检查。"""
        return {"status": "ok"}

    with app.app_context():
        db.create_all()
        seed_database()

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="0.0.0.0", port=3000, debug=True)
