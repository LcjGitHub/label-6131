"""SQLAlchemy 数据模型。"""

from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class ChessGame(db.Model):
    """冷门棋类规则条目。"""

    __tablename__ = "chess_games"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    origin = db.Column(db.String(200), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    difficulty = db.Column(db.String(50), nullable=False)
    links = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> dict:
        """
        序列化为 API 响应字典。

        @returns {dict} 棋类条目
        """
        return {
            "id": self.id,
            "name": self.name,
            "origin": self.origin,
            "summary": self.summary,
            "difficulty": self.difficulty,
            "links": self.links or "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
