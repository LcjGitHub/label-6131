"""棋类 CRUD 路由。"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from io import BytesIO

from flask import Blueprint, jsonify, request, send_file
from sqlalchemy import case

from models import Category, ChessGame, Favorite, RecentView, db

games_bp = Blueprint("games", __name__, url_prefix="/api/games")


def _parse_links(raw: str | None) -> str:
    """
     规范化相关链接字段。

     @param {str | None} raw - 原始链接文本
     @returns {str} 规范化后的链接
     """
    return (raw or "").strip()


def _resolve_category_id(raw) -> tuple[int | None, str | None]:
    """
     解析并校验分类编号，若提供了不存在的分类则返回错误信息。

     @param raw - 原始分类编号
     @returns {tuple[int | None, str | None]} (分类编号或 None, 错误信息或 None)
     """
    if raw is None or raw == "":
        return None, None
    try:
        cat_id = int(raw)
    except (ValueError, TypeError):
        return None, "分类编号格式不正确"
    if cat_id <= 0:
        return None, None
    category = db.session.get(Category, cat_id)
    if not category:
        return None, f"分类编号 {cat_id} 不存在"
    return cat_id, None


@games_bp.get("")
def list_games():
    """获取棋类列表，支持按分类、关键词、难度筛选、排序及分页。"""
    category_id = request.args.get("category_id")
    keyword = request.args.get("keyword")
    difficulty = request.args.get("difficulty")
    sort_by = request.args.get("sort_by", "id")
    sort_order = request.args.get("sort_order", "asc")
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 10, type=int)
    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)

    sort_column_map = {
        "id": ChessGame.id,
        "name": ChessGame.name,
        "difficulty": ChessGame.difficulty,
        "created_at": ChessGame.created_at,
    }
    if sort_by not in sort_column_map:
        sort_by = "id"
    if sort_order.lower() == "desc":
        if sort_by == "difficulty":
            difficulty_order = case(
                (ChessGame.difficulty == "困难", 1),
                (ChessGame.difficulty == "较难", 2),
                (ChessGame.difficulty == "中等", 3),
                (ChessGame.difficulty == "入门", 4),
                else_=5,
            )
            order_expr = difficulty_order.asc()
        else:
            order_expr = sort_column_map[sort_by].desc()
    else:
        if sort_by == "difficulty":
            difficulty_order = case(
                (ChessGame.difficulty == "入门", 1),
                (ChessGame.difficulty == "中等", 2),
                (ChessGame.difficulty == "较难", 3),
                (ChessGame.difficulty == "困难", 4),
                else_=5,
            )
            order_expr = difficulty_order.asc()
        else:
            order_expr = sort_column_map[sort_by].asc()

    query = ChessGame.query

    if category_id and category_id != "":
        try:
            cat_id = int(category_id)
            query = query.filter_by(category_id=cat_id)
        except ValueError:
            pass

    if keyword and keyword.strip():
        keyword = keyword.strip()
        keyword_pattern = f"%{keyword}%"
        query = query.filter(
            db.or_(
                ChessGame.name.ilike(keyword_pattern),
                ChessGame.origin.ilike(keyword_pattern),
                ChessGame.summary.ilike(keyword_pattern),
            )
        )

    if difficulty and difficulty.strip():
        query = query.filter(ChessGame.difficulty == difficulty.strip())

    total = query.count()
    games = query.order_by(order_expr).offset((page - 1) * page_size).limit(page_size).all()
    return jsonify({
        "items": [game.to_dict() for game in games],
        "total": total,
        "page": page,
        "page_size": page_size,
    })


@games_bp.get("/<int:game_id>")
def get_game(game_id: int):
    """获取单条棋类详情，并自动写入或更新浏览记录。"""
    game = db.session.get(ChessGame, game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404

    existing = RecentView.query.filter_by(game_id=game_id).first()
    if existing:
        existing.viewed_at = datetime.now(timezone.utc)
    else:
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

    return jsonify(game.to_dict())


@games_bp.get("/<int:game_id>/neighbors")
def get_game_neighbors(game_id: int):
    """获取当前棋类的上一条和下一条棋类编号及名称。"""
    game = db.session.get(ChessGame, game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404

    prev_game = (
        ChessGame.query
        .filter(ChessGame.id < game_id)
        .order_by(ChessGame.id.desc())
        .first()
    )
    next_game = (
        ChessGame.query
        .filter(ChessGame.id > game_id)
        .order_by(ChessGame.id.asc())
        .first()
    )

    return jsonify({
        "prev": {
            "id": prev_game.id,
            "name": prev_game.name,
        } if prev_game else None,
        "next": {
            "id": next_game.id,
            "name": next_game.name,
        } if next_game else None,
    })


@games_bp.get("/<int:game_id>/similar")
def get_similar_games(game_id: int):
    """获取与当前棋类相同难度的其他棋类推荐（排除当前条目，最多3条）。"""
    game = db.session.get(ChessGame, game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404

    similar_games = (
        ChessGame.query
        .filter(
            ChessGame.difficulty == game.difficulty,
            ChessGame.id != game_id,
        )
        .order_by(ChessGame.id.asc())
        .limit(3)
        .all()
    )

    return jsonify({
        "items": [
            {
                "id": g.id,
                "name": g.name,
            }
            for g in similar_games
        ],
    })


@games_bp.get("/batch")
def get_games_batch():
    """批量获取多条棋类详情（最多3条）。"""
    raw_ids = request.args.get("ids")
    if not raw_ids:
        return jsonify({"error": "请提供棋类编号 ids 参数"}), 400

    id_strs = [s.strip() for s in raw_ids.split(",") if s.strip()]
    if len(id_strs) == 0:
        return jsonify({"error": "ids 参数不能为空"}), 400
    if len(id_strs) > 3:
        return jsonify({"error": "最多同时对比3个棋类"}), 400

    parsed_ids: list[int] = []
    for s in id_strs:
        try:
            parsed_ids.append(int(s))
        except ValueError:
            return jsonify({"error": f"无效的编号: {s}"}), 400

    games = ChessGame.query.filter(ChessGame.id.in_(parsed_ids)).all()
    game_map = {g.id: g for g in games}

    result: list[dict] = []
    for gid in parsed_ids:
        if gid in game_map:
            result.append(game_map[gid].to_dict())
        else:
            result.append({"id": gid, "error": "棋类不存在"})

    return jsonify(result)


@games_bp.post("")
def create_game():
    """创建棋类条目。"""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    origin = (data.get("origin") or "").strip()
    summary = (data.get("summary") or "").strip()
    difficulty = (data.get("difficulty") or "").strip()
    links = _parse_links(data.get("links"))
    board_size = (data.get("board_size") or "").strip() or None
    category_id, cat_err = _resolve_category_id(data.get("category_id"))

    if cat_err:
        return jsonify({"error": cat_err}), 400

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
        board_size=board_size,
        category_id=category_id,
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
    board_size = (data.get("board_size") or "").strip() or None
    category_id, cat_err = _resolve_category_id(data.get("category_id"))

    if cat_err:
        return jsonify({"error": cat_err}), 400

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
    game.board_size = board_size
    game.category_id = category_id
    db.session.commit()
    return jsonify(game.to_dict())


@games_bp.delete("/<int:game_id>")
def delete_game(game_id: int):
    """删除棋类条目。"""
    game = db.session.get(ChessGame, game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404

    Favorite.query.filter_by(game_id=game_id).delete()
    RecentView.query.filter_by(game_id=game_id).delete()
    db.session.delete(game)
    db.session.commit()
    return jsonify({"message": "删除成功"})


@games_bp.delete("/batch")
def delete_games_batch():
    """批量删除棋类条目（同步清理对应收藏记录）。"""
    data = request.get_json(silent=True) or {}
    ids = data.get("ids", [])

    if not ids:
        return jsonify({"error": "请提供要删除的棋类编号列表 ids"}), 400

    if not isinstance(ids, list):
        return jsonify({"error": "ids 必须是数组格式"}), 400

    parsed_ids: list[int] = []
    for item in ids:
        try:
            parsed_ids.append(int(item))
        except (ValueError, TypeError):
            return jsonify({"error": f"无效的编号: {item}"}), 400

    success_count = 0
    failed: list[dict] = []

    for game_id in parsed_ids:
        game = db.session.get(ChessGame, game_id)
        if not game:
            failed.append({"id": game_id, "error": "棋类不存在"})
            continue

        try:
            Favorite.query.filter_by(game_id=game_id).delete()
            RecentView.query.filter_by(game_id=game_id).delete()
            db.session.delete(game)
            db.session.commit()
            success_count += 1
        except Exception as e:
            db.session.rollback()
            failed.append({"id": game_id, "error": str(e)})

    return jsonify({
        "message": f"成功删除 {success_count} 个棋类",
        "success_count": success_count,
        "failed": failed,
    })


@games_bp.get("/export")
def export_games():
    """导出全部棋类条目为 JSON 文件。"""
    games = ChessGame.query.order_by(ChessGame.id.asc()).all()
    export_data = {
        "version": "1.0",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "count": len(games),
        "items": [
            {
                "name": game.name,
                "origin": game.origin,
                "summary": game.summary,
                "difficulty": game.difficulty,
                "links": game.links or "",
                "board_size": game.board_size or "",
                "category_id": game.category_id,
            }
            for game in games
        ],
    }

    json_str = json.dumps(export_data, ensure_ascii=False, indent=2)
    buffer = BytesIO(json_str.encode("utf-8"))
    buffer.seek(0)

    filename = f"chess-games-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
    return send_file(
        buffer,
        mimetype="application/json",
        as_attachment=True,
        download_name=filename,
    )


REQUIRED_FIELDS = ["name", "origin", "summary", "difficulty"]


@games_bp.post("/import")
def import_games():
    """从上传的 JSON 文件批量导入棋类条目。"""
    if "file" not in request.files:
        return jsonify({"error": "请选择要上传的数据文件"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "文件名不能为空"}), 400

    try:
        file_content = file.read().decode("utf-8")
        data = json.loads(file_content)
    except (UnicodeDecodeError, json.JSONDecodeError):
        return jsonify({"error": "文件格式不正确，必须是有效的 JSON 文件"}), 400

    items = data.get("items", []) if isinstance(data, dict) else data
    if not isinstance(items, list):
        return jsonify({"error": "数据格式错误：items 必须是数组"}), 400

    if len(items) == 0:
        return jsonify({"error": "导入数据为空"}), 400

    existing_names = {g.name for g in ChessGame.query.all()}

    success_count = 0
    skip_count = 0
    failed: list[dict] = []
    seen_names: set[str] = set()

    for index, item in enumerate(items):
        if not isinstance(item, dict):
            failed.append({"index": index, "error": "条目格式错误，必须是对象"})
            continue

        missing = [f for f in REQUIRED_FIELDS if not (item.get(f) or "").strip()]
        if missing:
            failed.append({
                "index": index,
                "name": item.get("name", ""),
                "error": f"缺少必填字段：{', '.join(missing)}",
            })
            continue

        name = item["name"].strip()
        origin = item["origin"].strip()
        summary = item["summary"].strip()
        difficulty = item["difficulty"].strip()
        links = _parse_links(item.get("links"))
        board_size = (item.get("board_size") or "").strip() or None

        if name in existing_names or name in seen_names:
            skip_count += 1
            continue

        category_id = None
        raw_cat = item.get("category_id")
        if raw_cat is not None and raw_cat != "":
            cat_id_res, cat_err = _resolve_category_id(raw_cat)
            if cat_err:
                failed.append({
                    "index": index,
                    "name": name,
                    "error": cat_err,
                })
                continue
            category_id = cat_id_res

        try:
            game = ChessGame(
                name=name,
                origin=origin,
                summary=summary,
                difficulty=difficulty,
                links=links,
                board_size=board_size,
                category_id=category_id,
            )
            db.session.add(game)
            db.session.commit()
            success_count += 1
            seen_names.add(name)
        except Exception as e:
            db.session.rollback()
            failed.append({
                "index": index,
                "name": name,
                "error": str(e),
            })

    return jsonify({
        "message": f"导入完成：成功 {success_count} 条，跳过 {skip_count} 条，失败 {len(failed)} 条",
        "success_count": success_count,
        "skip_count": skip_count,
        "failed_count": len(failed),
        "failed": failed,
    })
