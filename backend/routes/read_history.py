"""已读记录路由。"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from models import ChessGame, ReadHistory, db

read_history_bp = Blueprint("read_history", __name__, url_prefix="/api/read-history")


@read_history_bp.get("")
def list_read_history():
    """获取全部已读记录列表，支持按已读时间排序。"""
    sort_order = request.args.get("sort_order", "desc").lower()
    order_col = ReadHistory.read_at.desc() if sort_order == "desc" else ReadHistory.read_at.asc()
    read_history = ReadHistory.query.order_by(order_col).all()
    return jsonify([rh.to_dict() for rh in read_history])


@read_history_bp.get("/ids")
def list_read_ids():
    """获取全部已读的棋类 ID 集合。"""
    read_history = ReadHistory.query.with_entities(ReadHistory.game_id).all()
    return jsonify([rh.game_id for rh in read_history])


@read_history_bp.post("")
def mark_as_read():
    """标记已读。"""
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

    existing = ReadHistory.query.filter_by(game_id=game_id).first()
    if existing:
        from datetime import datetime, timezone
        existing.read_at = datetime.now(timezone.utc)
        db.session.commit()
        return jsonify(existing.to_dict()), 200

    read_history = ReadHistory(game_id=game_id)
    db.session.add(read_history)
    db.session.commit()
    return jsonify(read_history.to_dict()), 201


@read_history_bp.delete("/<int:game_id>")
def unmark_read(game_id: int):
    """取消已读。"""
    read_history = ReadHistory.query.filter_by(game_id=game_id).first()
    if not read_history:
        return jsonify({"error": "未标记该棋类为已读"}), 404

    db.session.delete(read_history)
    db.session.commit()
    return jsonify({"message": "取消已读成功"})
