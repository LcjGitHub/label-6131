"""待学清单 CRUD 路由。"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from models import ChessGame, Todo, db

todos_bp = Blueprint("todos", __name__, url_prefix="/api/todos")


@todos_bp.get("")
def list_todos():
    """获取全部待学列表，支持按加入时间排序。"""
    sort_order = request.args.get("sort_order", "desc").lower()
    order_col = Todo.created_at.desc() if sort_order == "desc" else Todo.created_at.asc()
    todos = Todo.query.order_by(order_col).all()
    return jsonify([todo.to_dict() for todo in todos])


@todos_bp.get("/ids")
def list_todo_ids():
    """获取全部已加入待学的棋类 ID 集合。"""
    todos = Todo.query.with_entities(Todo.game_id).all()
    return jsonify([todo.game_id for todo in todos])


@todos_bp.post("")
def add_todo():
    """加入待学。"""
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

    existing = Todo.query.filter_by(game_id=game_id).first()
    if existing:
        return jsonify({"error": "该棋类已在待学清单中"}), 409

    todo = Todo(game_id=game_id)
    db.session.add(todo)
    db.session.commit()
    return jsonify(todo.to_dict()), 201


@todos_bp.delete("/<int:game_id>")
def remove_todo(game_id: int):
    """移出待学。"""
    todo = Todo.query.filter_by(game_id=game_id).first()
    if not todo:
        return jsonify({"error": "该棋类不在待学清单中"}), 404

    db.session.delete(todo)
    db.session.commit()
    return jsonify({"message": "已移出待学清单"})
