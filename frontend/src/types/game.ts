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
  category_id: number | null;
  category_name: string | null;
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
  category_id?: number | null;
}

/** 收藏条目类型 */
export interface Favorite {
  id: number;
  game_id: number;
  created_at?: string;
  game: ChessGame | null;
}

/** 批量获取中存在错误的条目 */
export interface ChessGameError {
  id: number;
  error: string;
}

/** 批量获取响应条目（可能成功也可能失败） */
export type ChessGameBatchItem = ChessGame | ChessGameError;
