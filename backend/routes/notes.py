"""个人备注 CRUD 路由。"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from models import ChessGame, Note, db

notes_bp = Blueprint("notes", __name__, url_prefix="/api/notes")


@notes_bp.get("/<int:game_id>")
def get_note(game_id: int):
    """按棋类编号查询备注。"""
    note = Note.query.filter_by(game_id=game_id).first()
    if not note:
        return jsonify({
            "game_id": game_id,
            "content": "",
        })
    return jsonify(note.to_dict())


@notes_bp.post("")
def save_note():
    """保存备注（不存在则创建，存在则更新）。"""
    data = request.get_json(silent=True) or {}
    game_id = data.get("game_id")
    content = data.get("content", "")

    if game_id is None:
        return jsonify({"error": "game_id 为必填项"}), 400

    try:
        game_id = int(game_id)
    except (ValueError, TypeError):
        return jsonify({"error": "game_id 格式不正确"}), 400

    game = db.session.get(ChessGame, game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404

    if not isinstance(content, str):
        return jsonify({"error": "content 格式不正确"}), 400

    note = Note.query.filter_by(game_id=game_id).first()
    if note:
        note.content = content
        db.session.commit()
        return jsonify(note.to_dict())
    else:
        note = Note(game_id=game_id, content=content)
        db.session.add(note)
        db.session.commit()
        return jsonify(note.to_dict()), 201


@notes_bp.delete("/<int:game_id>")
def clear_note(game_id: int):
    """清空备注。"""
    note = Note.query.filter_by(game_id=game_id).first()
    if not note:
        return jsonify({"message": "备注已清空"})

    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "备注已清空"})
