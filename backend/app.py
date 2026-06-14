"""Flask 应用入口。"""

import os

from flask import Flask
from flask_cors import CORS
from sqlalchemy import inspect

from models import db
from routes.categories import categories_bp
from routes.favorites import favorites_bp
from routes.games import games_bp
from routes.notes import notes_bp
from routes.recent_views import recent_views_bp
from routes.stats import stats_bp
from routes.tags import tags_bp
from seed import seed_database


def _auto_migrate(app: Flask) -> None:
    """
     自动迁移：检测模型与实际表结构差异并补全新增列。

     @param {Flask} app - Flask 应用实例
     """
    inspector = inspect(app.extensions["sqlalchemy"].engine)
    with app.app_context():
        existing_tables = set(inspector.get_table_names())
        for table_name, table in db.metadata.tables.items():
            if table_name not in existing_tables:
                continue
            existing_cols = {col["name"] for col in inspector.get_columns(table_name)}
            model_cols = {c.name for c in table.columns}
            missing = model_cols - existing_cols
            for col_name in missing:
                col = table.columns[col_name]
                col_type = col.type.compile(dialect=db.engine.dialect)
                nullable = "" if col.nullable else "NOT NULL"
                default = ""
                if col.server_default is not None:
                    default = f"DEFAULT {col.server_default.arg}"
                db.session.execute(
                    db.text(
                        f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type} {nullable} {default}"
                    )
                )
            if missing:
                db.session.commit()

        if "categories" not in existing_tables:
            db.create_all()


def create_app(config: dict | None = None) -> Flask:
    """
     创建并配置 Flask 应用。

     @param {dict | None} config - 可选的配置覆盖项
     @returns {Flask} 应用实例
     """
    app = Flask(__name__)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)

    db_path = os.path.join(data_dir, "chess.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    if config:
        app.config.update(config)

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(games_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(favorites_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(recent_views_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(tags_bp)

    @app.get("/api/health")
    def health():
        """健康检查。"""
        return {"status": "ok"}

    with app.app_context():
        db.create_all()
        _auto_migrate(app)
        seed_database()

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="0.0.0.0", port=3000, debug=True)
