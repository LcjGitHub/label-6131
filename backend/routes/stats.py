"""数据统计路由。"""

from __future__ import annotations

import re
from collections import Counter

from flask import Blueprint, jsonify
from sqlalchemy import func

from models import Category, ChessGame, db

stats_bp = Blueprint("stats", __name__, url_prefix="/api/stats")


def _extract_main_origin(origin: str) -> str:
    """从起源文本中提取主要地区名。

    处理规则：
    1. 去除括号及其内容（支持中英文括号）
    2. 若存在斜杠或逗号分隔的多个地区，仅取第一个
    3. 去除首尾空白

    @param {str} origin - 原始起源文本
    @returns {str} 提取后的主要地区名
    """
    if not origin:
        return ""
    text = origin.strip()
    text = re.sub(r"[（(][^）)]*[）)]", "", text)
    text = re.split(r"[/／,，、]", text)[0]
    text = text.strip()
    return text or origin.strip()


@stats_bp.get("/overview")
def get_overview():
    """获取数据统计概览。

    @returns {dict} 统计概览数据，包含：
        - total_games: 棋类总数量
        - difficulty_distribution: 各难度等级的条目数量
        - origin_rank: 按起源地区汇总的前五名排行（提取主要地区名后汇总）
        - category_distribution: 按分类汇总各类别下条目数量（含未分类）
    """
    total_games = ChessGame.query.count()

    difficulty_rows = db.session.query(
        ChessGame.difficulty,
        func.count(ChessGame.id).label("count"),
    ).group_by(ChessGame.difficulty).all()

    difficulty_distribution = {row.difficulty: row.count for row in difficulty_rows}

    all_origins = db.session.query(ChessGame.origin).all()
    origin_counter: Counter[str] = Counter()
    for (origin,) in all_origins:
        main_origin = _extract_main_origin(origin or "")
        if main_origin:
            origin_counter[main_origin] += 1

    origin_rank = [
        {"origin": name, "count": count}
        for name, count in origin_counter.most_common(5)
    ]

    category_rows = (
        db.session.query(
            Category.name,
            func.count(ChessGame.id).label("count"),
        )
        .join(ChessGame, ChessGame.category_id == Category.id)
        .group_by(Category.name)
        .all()
    )

    uncategorized_count = ChessGame.query.filter(
        ChessGame.category_id.is_(None)
    ).count()

    category_distribution = [
        {"category": row.name, "count": row.count} for row in category_rows
    ]
    if uncategorized_count > 0:
        category_distribution.append(
            {"category": "未分类", "count": uncategorized_count}
        )

    return jsonify({
        "total_games": total_games,
        "difficulty_distribution": difficulty_distribution,
        "origin_rank": origin_rank,
        "category_distribution": category_distribution,
    })
