"""标签 CRUD 路由。"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from models import ChessGame, GameTag, Tag, db

tags_bp = Blueprint("tags", __name__, url_prefix="/api/tags")


@tags_bp.get("")
def list_tags():
    """获取标签列表，支持按关键词搜索。"""
    keyword = request.args.get("keyword")
    query = Tag.query

    if keyword and keyword.strip():
        keyword = keyword.strip()
        keyword_pattern = f"%{keyword}%"
        query = query.filter(Tag.name.ilike(keyword_pattern))

    tags = query.order_by(Tag.name.asc()).all()
    return jsonify({
        "items": [tag.to_dict() for tag in tags],
        "total": len(tags),
    })


@tags_bp.post("")
def create_tag():
    """创建标签。"""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    color = (data.get("color") or "").strip() or None

    if not name:
        return jsonify({"error": "标签名称不能为空"}), 400

    if len(name) > 50:
        return jsonify({"error": "标签名称不能超过 50 个字符"}), 400

    existing = Tag.query.filter_by(name=name).first()
    if existing:
        return jsonify(existing.to_dict()), 200

    tag = Tag(name=name, color=color)
    db.session.add(tag)
    db.session.commit()
    return jsonify(tag.to_dict()), 201


@tags_bp.get("/<int:tag_id>")
def get_tag(tag_id: int):
    """获取单个标签详情。"""
    tag = db.session.get(Tag, tag_id)
    if not tag:
        return jsonify({"error": "标签不存在"}), 404
    return jsonify(tag.to_dict())


@tags_bp.put("/<int:tag_id>")
def update_tag(tag_id: int):
    """更新标签。"""
    tag = db.session.get(Tag, tag_id)
    if not tag:
        return jsonify({"error": "标签不存在"}), 404

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    color = (data.get("color") or "").strip() or None

    if not name:
        return jsonify({"error": "标签名称不能为空"}), 400

    if len(name) > 50:
        return jsonify({"error": "标签名称不能超过 50 个字符"}), 400

    existing = Tag.query.filter(Tag.name == name, Tag.id != tag_id).first()
    if existing:
        return jsonify({"error": "标签名称已存在"}), 409

    tag.name = name
    tag.color = color
    db.session.commit()
    return jsonify(tag.to_dict())


@tags_bp.delete("/<int:tag_id>")
def delete_tag(tag_id: int):
    """删除标签。"""
    tag = db.session.get(Tag, tag_id)
    if not tag:
        return jsonify({"error": "标签不存在"}), 404

    GameTag.query.filter_by(tag_id=tag_id).delete()
    db.session.delete(tag)
    db.session.commit()
    return jsonify({"message": "删除成功"})


@tags_bp.get("/games/<int:game_id>")
def get_game_tags(game_id: int):
    """获取指定棋类的标签列表。"""
    game = db.session.get(ChessGame, game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404

    game_tags = GameTag.query.filter_by(game_id=game_id).all()
    tags = [gt.tag for gt in game_tags]
    return jsonify({
        "items": [tag.to_dict() for tag in tags],
        "total": len(tags),
    })


@tags_bp.put("/games/<int:game_id>")
def set_game_tags(game_id: int):
    """为指定棋类设置标签列表（全量替换）。"""
    game = db.session.get(ChessGame, game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404

    data = request.get_json(silent=True) or {}
    tag_ids = data.get("tag_ids", [])

    if not isinstance(tag_ids, list):
        return jsonify({"error": "tag_ids 必须是数组格式"}), 400

    parsed_tag_ids: list[int] = []
    for item in tag_ids:
        try:
            parsed_tag_ids.append(int(item))
        except (ValueError, TypeError):
            return jsonify({"error": f"无效的标签编号: {item}"}), 400

    for tid in parsed_tag_ids:
        tag = db.session.get(Tag, tid)
        if not tag:
            return jsonify({"error": f"标签编号 {tid} 不存在"}), 400

    GameTag.query.filter_by(game_id=game_id).delete()

    for tid in parsed_tag_ids:
        game_tag = GameTag(game_id=game_id, tag_id=tid)
        db.session.add(game_tag)

    db.session.commit()

    game_tags = GameTag.query.filter_by(game_id=game_id).all()
    tags = [gt.tag for gt in game_tags]
    return jsonify({
        "items": [tag.to_dict() for tag in tags],
        "total": len(tags),
    })
