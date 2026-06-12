/** 棋类条目类型 */
export interface ChessGame {
  id: number;
  name: string;
  origin: string;
  summary: string;
  difficulty: string;
  links: string;
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
}
