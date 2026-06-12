"""种子数据：5 条冷门棋类规则。"""

from models import ChessGame, db

SEED_GAMES = [
    {
        "name": "连珠（Renju）",
        "origin": "日本（明治时代，源自五子棋）",
        "summary": (
            "在 15×15 棋盘上，黑先白后轮流落子，先连成五子者胜。"
            "黑方受禁手规则限制：三三、四四、长连均为禁手；"
            "白方无禁手。开局采用指定或交换规则以平衡先后手。"
        ),
        "difficulty": "中等",
        "links": "https://zh.wikipedia.org/wiki/%E9%80%A3%E7%8F%A0",
    },
    {
        "name": "九子棋（Nine Men's Morris）",
        "origin": "古罗马 / 中世纪欧洲",
        "summary": (
            "双方各 9 枚棋子，分三阶段：先轮流放子到空点；"
            "棋子放完后进入走子阶段，沿连线移动到相邻空点；"
            "若一方只剩 3 枚则进入飞子阶段可任意移动。"
            "任意时刻形成三子一线（Mill）可吃对方一子，"
            "对方棋子少于 3 枚或无法移动则判负。"
        ),
        "difficulty": "入门",
        "links": "https://zh.wikipedia.org/wiki/%E4%B9%9D%E5%AD%90%E6%A3%8B",
    },
    {
        "name": "将棋（Shogi）",
        "origin": "日本",
        "summary": (
            "在 9×9 棋盘对弈，每方 20 枚棋子。棋子可升级（成），"
            "被吃掉的棋子加入持驹，可在己方回合重新打入棋盘。"
            "将死对方王将（玉将）即胜。棋子移动规则与象棋类似但各有差异，"
            "如桂马、银将、金将等走法独特。"
        ),
        "difficulty": "较难",
        "links": "https://zh.wikipedia.org/wiki/%E5%B0%86%E6%A3%8B",
    },
    {
        "name": "韩国janggi（韩国象棋）",
        "origin": "朝鲜半岛",
        "summary": (
            "在 9×10 交叉点棋盘对弈，与象棋相似但棋子走法不同。"
            "楚、汉双方将帅位于九宫对角位置；"
            "象走「用」字（可斜走两格），马走「日」但可能被蹩马腿；"
            "炮需跳一子才能吃子。将死对方将（楚/汉）即胜。"
        ),
        "difficulty": "中等",
        "links": "https://zh.wikipedia.org/wiki/%E9%9F%A9%E5%9B%BD%E8%B1%A1%E6%A3%8B",
    },
    {
        "name": "菲舍尔随机象棋（Chess960）",
        "origin": "美国（鲍比·菲舍尔，1996）",
        "summary": (
            "国际象棋变体：每局开始前，第一排 8 个棋子（除王、后外）"
            "在 960 种合法排列中随机摆放，王必须位于两象之间。"
            "其余规则与国际象棋相同。旨在消除开局死记硬背，"
            "更考验中局与残局理解。"
        ),
        "difficulty": "较难",
        "links": "https://zh.wikipedia.org/wiki/%E8%8F%B2%E8%88%8D%E7%88%B7%E9%9A%8F%E6%9C%BA%E8%B1%A1%E6%A3%8B",
    },
]


def seed_database() -> None:
    """
     若数据库为空则写入种子数据。

     @returns {None}
     """
    if ChessGame.query.count() > 0:
        return

    for item in SEED_GAMES:
        db.session.add(ChessGame(**item))

    db.session.commit()
