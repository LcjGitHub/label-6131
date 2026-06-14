/** 标签条目类型 */
export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at?: string;
}

/** 创建标签请求体 */
export interface TagPayload {
  name: string;
  color?: string;
}

/** 分类条目类型 */
export interface Category {
  id: number;
  name: string;
  created_at?: string;
}

/** 创建分类请求体 */
export interface CategoryPayload {
  name: string;
}

/** 棋类条目类型 */
export interface ChessGame {
  id: number;
  name: string;
  origin: string;
  summary: string;
  difficulty: string;
  links: string;
  board_size: string;
  category_id: number | null;
  category_name: string | null;
  tags: Tag[];
  created_at?: string;
  updated_at?: string;
}

/** 创建/更新棋类请求体 */
export interface ChessGamePayload {
  name: string;
  origin: string;
  summary: string;
  difficulty: string;
  links?: string;
  board_size?: string;
  category_id?: number | null;
}

/** 收藏条目类型 */
export interface Favorite {
  id: number;
  game_id: number;
  created_at?: string;
  game: ChessGame | null;
}

export interface RecentView {
  id: number;
  game_id: number;
  viewed_at?: string;
  game: ChessGame | null;
}

/** 待学清单条目类型 */
export interface Todo {
  id: number;
  game_id: number;
  created_at?: string;
  game: ChessGame | null;
}

/** 已读记录条目类型 */
export interface ReadHistory {
  id: number;
  game_id: number;
  read_at?: string;
  game: ChessGame | null;
}

/** 批量获取中存在错误的条目 */
export interface ChessGameError {
  id: number;
  error: string;
}

/** 批量获取响应条目（可能成功也可能失败） */
export type ChessGameBatchItem = ChessGame | ChessGameError;

/** 起源地区排行条目 */
export interface OriginRankItem {
  origin: string;
  count: number;
}

/** 分页响应数据 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

/** 数据统计概览 */
export interface CategoryDistributionItem {
  category: string;
  count: number;
}

export interface StatsOverview {
  total_games: number;
  difficulty_distribution: Record<string, number>;
  origin_rank: OriginRankItem[];
  category_distribution: CategoryDistributionItem[];
}

/** 相邻棋类简要信息 */
export interface NeighborGame {
  id: number;
  name: string;
}

/** 上下相邻棋类响应 */
export interface GameNeighbors {
  prev: NeighborGame | null;
  next: NeighborGame | null;
}

/** 同类推荐棋类简要信息 */
export interface SimilarGame {
  id: number;
  name: string;
}

/** 同类推荐响应 */
export interface SimilarGamesResponse {
  items: SimilarGame[];
}

/** 个人备注类型 */
export interface Note {
  id?: number;
  game_id: number;
  content: string;
  created_at?: string;
  updated_at?: string;
}

/** 导入结果 */
export interface ImportResult {
  message: string;
  success_count: number;
  skip_count: number;
  failed_count: number;
  failed: Array<{ index: number; name?: string; error: string }>;
}

/** 单条链接检测结果 */
export interface LinkCheckResult {
  url: string;
  reachable: boolean;
  status_code?: number;
  reason?: string;
}

/** 链接可达性检测响应 */
export interface LinkCheckResponse {
  game_id: number;
  results: LinkCheckResult[];
  summary: {
    total: number;
    reachable: number;
    unreachable: number;
  };
}
