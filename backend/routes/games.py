"""棋类 CRUD 路由。"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from models import ChessGame, db

games_bp = Blueprint("games", __name__, url_prefix="/api/games")


def _parse_links(raw: str | None) -> str:
    """
     规范化相关链接字段。

     @param {str | None} raw - 原始链接文本
     @returns {str} 规范化后的链接
     """
    return (raw or "").strip()


@games_bp.get("")
def list_games():
    """获取全部棋类列表。"""
    games = ChessGame.query.order_by(ChessGame.id.asc()).all()
    return jsonify([game.to_dict() for game in games])


@games_bp.get("/<int:game_id>")
def get_game(game_id: int):
    """获取单条棋类详情。"""
    game = db.session.get(ChessGame, game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404
    return jsonify(game.to_dict())


@games_bp.post("")
def create_game():
    """创建棋类条目。"""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    origin = (data.get("origin") or "").strip()
    summary = (data.get("summary") or "").strip()
    difficulty = (data.get("difficulty") or "").strip()
    links = _parse_links(data.get("links"))

    if not all([name, origin, summary, difficulty]):
        return jsonify({"error": "name、origin、summary、difficulty 为必填项"}), 400

    if ChessGame.query.filter_by(name=name).first():
        return jsonify({"error": "棋类名称已存在"}), 409

    game = ChessGame(
        name=name,
        origin=origin,
        summary=summary,
        difficulty=difficulty,
        links=links,
    )
    db.session.add(game)
    db.session.commit()
    return jsonify(game.to_dict()), 201


@games_bp.put("/<int:game_id>")
def update_game(game_id: int):
    """更新棋类条目。"""
    game = db.session.get(ChessGame, game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    origin = (data.get("origin") or "").strip()
    summary = (data.get("summary") or "").strip()
    difficulty = (data.get("difficulty") or "").strip()

    if not all([name, origin, summary, difficulty]):
        return jsonify({"error": "name、origin、summary、difficulty 为必填项"}), 400

    existing = ChessGame.query.filter(ChessGame.name == name, ChessGame.id != game_id).first()
    if existing:
        return jsonify({"error": "棋类名称已存在"}), 409

    game.name = name
    game.origin = origin
    game.summary = summary
    game.difficulty = difficulty
    game.links = _parse_links(data.get("links"))
    db.session.commit()
    return jsonify(game.to_dict())


@games_bp.delete("/<int:game_id>")
def delete_game(game_id: int):
    """删除棋类条目。"""
    game = db.session.get(ChessGame, game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404

    db.session.delete(game)
    db.session.commit()
    return jsonify({"message": "删除成功"})
