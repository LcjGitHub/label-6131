"""最近浏览记录路由。"""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from models import ChessGame, RecentView, db

recent_views_bp = Blueprint("recent_views", __name__, url_prefix="/api/recent-views")


def _upsert_recent_view(game_id: int) -> RecentView:
    """
    创建或更新浏览记录（同一棋类只保留最新一条）。

    @param {int} game_id - 棋类编号
    @returns {RecentView} 浏览记录对象
    """
    existing = RecentView.query.filter_by(game_id=game_id).first()
    if existing:
        existing.viewed_at = datetime.now(timezone.utc)
        db.session.commit()
        return existing

    recent_view = RecentView(game_id=game_id)
    db.session.add(recent_view)
    db.session.commit()

    total = RecentView.query.count()
    if total > 50:
        old_records = (
            RecentView.query
            .order_by(RecentView.viewed_at.asc())
            .limit(total - 50)
            .all()
        )
        for r in old_records:
            db.session.delete(r)
        db.session.commit()

    return recent_view


@recent_views_bp.get("")
def list_recent_views():
    """获取最近浏览记录（最多10条，按访问时间倒序）。"""
    recent_views = (
        RecentView.query
        .order_by(RecentView.viewed_at.desc())
        .limit(10)
        .all()
    )
    return jsonify([rv.to_dict() for rv in recent_views])


@recent_views_bp.post("")
def add_recent_view():
    """添加或更新浏览记录。"""
    data = request.get_json(silent=True) or {}
    game_id = data.get("game_id")

    if game_id is None:
        return jsonify({"error": "game_id 为必填项"}), 400

    try:
        game_id = int(game_id)
    except (ValueError, TypeError):
        return jsonify({"error": "game_id 格式不正确"}), 400

    game = db.session.get(ChessGame, game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404

    recent_view = _upsert_recent_view(game_id)
    return jsonify(recent_view.to_dict()), 200
