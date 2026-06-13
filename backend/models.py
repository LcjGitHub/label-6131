"""SQLAlchemy 数据模型。"""

from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Category(db.Model):
    """棋类分类。"""

    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    games = db.relationship("ChessGame", backref="category", lazy=True)

    def to_dict(self) -> dict:
        """
        序列化为 API 响应字典。

        @returns {dict} 分类条目
        """
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Favorite(db.Model):
    """收藏记录。"""

    __tablename__ = "favorites"

    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey("chess_games.id", ondelete="CASCADE"), nullable=False, unique=True)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    game = db.relationship("ChessGame", backref="favorite", lazy=True)

    def to_dict(self) -> dict:
        """
        序列化为 API 响应字典。

        @returns {dict} 收藏条目
        """
        return {
            "id": self.id,
            "game_id": self.game_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "game": self.game.to_dict() if self.game else None,
        }


class ChessGame(db.Model):
    """冷门棋类规则条目。"""

    __tablename__ = "chess_games"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    origin = db.Column(db.String(200), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    difficulty = db.Column(db.String(50), nullable=False)
    links = db.Column(db.Text, nullable=True)
    board_size = db.Column(db.String(50), nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
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
            "board_size": self.board_size or "",
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
