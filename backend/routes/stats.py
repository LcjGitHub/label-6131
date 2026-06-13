"""数据统计路由。"""

from __future__ import annotations

from flask import Blueprint, jsonify
from sqlalchemy import func

from models import ChessGame, db

stats_bp = Blueprint("stats", __name__, url_prefix="/api/stats")


@stats_bp.get("/overview")
def get_overview():
    """获取数据统计概览。

    @returns {dict} 统计概览数据，包含：
        - total_games: 棋类总数量
        - difficulty_distribution: 各难度等级的条目数量
        - origin_rank: 按起源地区汇总的前五名排行
    """
    total_games = ChessGame.query.count()

    difficulty_rows = db.session.query(
        ChessGame.difficulty,
        func.count(ChessGame.id).label("count"),
    ).group_by(ChessGame.difficulty).all()

    difficulty_distribution = {row.difficulty: row.count for row in difficulty_rows}

    origin_rows = db.session.query(
        ChessGame.origin,
        func.count(ChessGame.id).label("count"),
    ).group_by(ChessGame.origin).order_by(func.count(ChessGame.id).desc()).limit(5).all()

    origin_rank = [
        {"origin": row.origin, "count": row.count}
        for row in origin_rows
    ]

    return jsonify({
        "total_games": total_games,
        "difficulty_distribution": difficulty_distribution,
        "origin_rank": origin_rank,
    })
