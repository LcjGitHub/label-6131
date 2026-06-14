"""相关链接可达性检测路由。"""

from __future__ import annotations

import re

import requests
from flask import Blueprint, jsonify

from models import ChessGame

link_check_bp = Blueprint("link_check", __name__, url_prefix="/api/games")

_URL_PATTERN = re.compile(r"https?://[^\s,，]+")
_REQUEST_TIMEOUT = 10
_MAX_REDIRECTS = 5


def _extract_urls(raw: str) -> list[str]:
    return _URL_PATTERN.findall(raw)


def _check_single_url(url: str) -> dict:
    try:
        resp = requests.head(
            url,
            timeout=_REQUEST_TIMEOUT,
            allow_redirects=True,
            max_redirects=_MAX_REDIRECTS,
            headers={"User-Agent": "Mozilla/5.0 (compatible; LinkChecker/1.0)"},
        )
        if resp.status_code < 400:
            return {"url": url, "reachable": True, "status_code": resp.status_code}
        return {"url": url, "reachable": False, "status_code": resp.status_code, "reason": f"HTTP {resp.status_code}"}
    except requests.exceptions.Timeout:
        return {"url": url, "reachable": False, "reason": "请求超时"}
    except requests.exceptions.ConnectionError:
        return {"url": url, "reachable": False, "reason": "连接失败"}
    except requests.exceptions.TooManyRedirects:
        return {"url": url, "reachable": False, "reason": "重定向过多"}
    except requests.exceptions.RequestException as exc:
        return {"url": url, "reachable": False, "reason": str(exc) or "请求异常"}


@link_check_bp.get("/<int:game_id>/check-links")
def check_links(game_id: int):
    """根据棋类编号检测其相关链接字段中各网址是否可访问。"""
    game = ChessGame.query.get(game_id)
    if not game:
        return jsonify({"error": "棋类不存在"}), 404

    raw_links = game.links or ""
    urls = _extract_urls(raw_links)

    if not urls:
        return jsonify({"game_id": game_id, "results": [], "summary": {"total": 0, "reachable": 0, "unreachable": 0}})

    results = [_check_single_url(u) for u in urls]

    reachable_count = sum(1 for r in results if r["reachable"])
    unreachable_count = len(results) - reachable_count

    return jsonify({
        "game_id": game_id,
        "results": results,
        "summary": {
            "total": len(results),
            "reachable": reachable_count,
            "unreachable": unreachable_count,
        },
    })
