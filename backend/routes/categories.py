"""棋类分类 CRUD 路由。"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from models import Category, ChessGame, db

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@categories_bp.get("")
def list_categories():
    """获取分类列表（支持分页）。"""
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 10, type=int)
    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)

    query = Category.query.order_by(Category.id.asc())
    total = query.count()
    categories = query.offset((page - 1) * page_size).limit(page_size).all()
    return jsonify({
        "items": [cat.to_dict() for cat in categories],
        "total": total,
        "page": page,
        "page_size": page_size,
    })


@categories_bp.post("")
def create_category():
    """创建分类。"""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()

    if not name:
        return jsonify({"error": "分类名称为必填项"}), 400

    if Category.query.filter_by(name=name).first():
        return jsonify({"error": "分类名称已存在"}), 409

    category = Category(name=name)
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


@categories_bp.put("/<int:category_id>")
def update_category(category_id: int):
    """更新分类名称。"""
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({"error": "分类不存在"}), 404

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()

    if not name:
        return jsonify({"error": "分类名称为必填项"}), 400

    existing = Category.query.filter(Category.name == name, Category.id != category_id).first()
    if existing:
        return jsonify({"error": "分类名称已存在"}), 409

    category.name = name
    db.session.commit()
    return jsonify(category.to_dict())


@categories_bp.delete("/<int:category_id>")
def delete_category(category_id: int):
    """删除分类。"""
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({"error": "分类不存在"}), 404

    game_count = ChessGame.query.filter_by(category_id=category_id).count()
    if game_count > 0:
        return jsonify({"error": f"该分类下还有 {game_count} 个棋类，无法删除"}), 400

    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "删除成功"})
