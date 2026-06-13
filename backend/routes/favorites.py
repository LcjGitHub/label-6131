"""收藏 CRUD 路由。"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from models import ChessGame, Favorite, db

favorites_bp = Blueprint("favorites", __name__, url_prefix="/api/favorites")


@favorites_bp.get("")
def list_favorites():
    """获取全部收藏列表。"""
    favorites = Favorite.query.order_by(Favorite.created_at.desc()).all()
    return jsonify([fav.to_dict() for fav in favorites])


@favorites_bp.get("/ids")
def list_favorite_ids():
    """获取全部已收藏的棋类 ID 集合。"""
    favorites = Favorite.query.with_entities(Favorite.game_id).all()
    return jsonify([fav.game_id for fav in favorites])


@favorites_bp.post("")
def add_favorite():
    """添加收藏。"""
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

    existing = Favorite.query.filter_by(game_id=game_id).first()
    if existing:
        return jsonify({"error": "已收藏该棋类"}), 409

    favorite = Favorite(game_id=game_id)
    db.session.add(favorite)
    db.session.commit()
    return jsonify(favorite.to_dict()), 201


@favorites_bp.delete("/<int:game_id>")
def remove_favorite(game_id: int):
    """取消收藏。"""
    favorite = Favorite.query.filter_by(game_id=game_id).first()
    if not favorite:
        return jsonify({"error": "未收藏该棋类"}), 404

    db.session.delete(favorite)
    db.session.commit()
    return jsonify({"message": "取消收藏成功"})
