"""数据统计路由。"""

from __future__ import annotations

import re
from collections import Counter

from flask import Blueprint, jsonify
from sqlalchemy import func

from models import ChessGame, db

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

    return jsonify({
        "total_games": total_games,
        "difficulty_distribution": difficulty_distribution,
        "origin_rank": origin_rank,
    })
