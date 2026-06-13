# 冷门棋类规则速查

全栈 MVP：Flask 后端 + React 前端，用于浏览与管理冷门棋类规则。

## 项目结构

```
├── backend/          # Flask + SQLAlchemy API（端口 3000）
├── frontend/         # React + Vite + Ant Design（端口 3101）
└── README.md
```

## 功能

- **页面 1**：棋类列表（Ant Design List），支持新增 / 编辑 / 删除 / 收藏 / 勾选对比
- **页面 2**：规则详情（Descriptions + Typography 摘要，react-markdown 渲染）
- **页面 3**：我的收藏（列表展示已收藏棋类，支持跳转详情和取消收藏）
- **页面 4**：棋类对比（列表勾选 1~3 个棋类后跳转，表格横向并排展示棋类名、起源、难度、规则摘要、相关链接；对加载失败的条目给出明确提示，超过 3 个编号时持久说明截断情况）
- **页面 5**：数据统计概览（卡片展示棋类总数量、彩色标签展示各难度分布、列表展示起源地区前五名排行；接口加载失败时显示空状态并提供重新加载按钮；顶部导航栏右侧「数据统计」链接跳转至该页）
- **字段**：棋类名、起源、规则摘要、难度、相关链接
- **种子数据**：5 条冷门棋类（首次启动自动写入 `backend/data/chess.db`）

## 环境要求

- Python 3.10+
- Node.js 18+

## 启动方式

### 1. 后端（端口 3000）

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

后端 API 地址：`http://localhost:3000/api/games`

### 2. 前端（端口 3101）

新开一个终端：

```bash
cd frontend
npm install
npm run dev
```

浏览器访问：`http://localhost:3101`

> 前端通过 Vite 代理将 `/api` 请求转发至后端 `http://localhost:3000`。

## API 概览

| 方法   | 路径                 | 说明           |
|--------|----------------------|----------------|
| GET    | /api/games          | 获取列表       |
| GET    | /api/games/:id      | 获取详情       |
| GET    | /api/games/batch?ids=1,2,3 | 批量获取多条棋类详情（最多 3 个，返回按传入顺序排列，不存在的编号会包含 `error` 字段） |
| POST   | /api/games          | 创建条目       |
| PUT    | /api/games/:id      | 更新条目       |
| DELETE | /api/games/:id      | 删除条目       |
| GET    | /api/favorites       | 获取全部收藏（含棋类详情） |
| GET    | /api/favorites/ids   | 获取已收藏棋类 ID 列表 |
| POST   | /api/favorites       | 添加收藏（body: `{ game_id }`） |
| DELETE | /api/favorites/:game_id | 取消收藏     |

## 技术栈

- **前端**：React 18、Vite、TypeScript、Ant Design 5、React Router、axios、react-markdown
- **后端**：Flask、Flask-SQLAlchemy、Flask-CORS、SQLite（`./data/chess.db`）
