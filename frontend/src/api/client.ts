import axios from 'axios';

import type { Category, CategoryPayload, ChessGame, ChessGameBatchItem, ChessGamePayload, Favorite, PaginatedResponse, StatsOverview } from '../types/game';

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

/**
 * 获取分类列表（支持分页）
 * @param page - 页码，默认 1
 * @param pageSize - 每页条数，默认 10
 * @returns 分页响应数据
 */
export async function fetchCategories(page = 1, pageSize = 10): Promise<PaginatedResponse<Category>> {
  const { data } = await client.get<PaginatedResponse<Category>>('/categories', {
    params: { page, page_size: pageSize },
  });
  return data;
}

/**
 * 创建分类
 * @param payload - 创建数据
 * @returns 新建分类
 */
export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const { data } = await client.post<Category>('/categories', payload);
  return data;
}

/**
 * 删除分类
 * @param id - 分类 ID
 */
export async function deleteCategory(id: number): Promise<void> {
  await client.delete(`/categories/${id}`);
}

/**
 * 获取棋类列表（支持分页和筛选）
 * @param page - 页码，默认 1
 * @param pageSize - 每页条数，默认 10
 * @param categoryId - 可选的分类 ID，用于按分类筛选
 * @param keyword - 可选的关键词，用于模糊匹配名称、起源、规则摘要
 * @param difficulty - 可选的难度，用于精确匹配难度
 * @returns 分页响应数据
 */
export async function fetchGames(
  page = 1,
  pageSize = 10,
  categoryId?: number | null,
  keyword?: string | null,
  difficulty?: string | null,
): Promise<PaginatedResponse<ChessGame>> {
  const params: Record<string, string | number> = { page, page_size: pageSize };
  if (categoryId) params.category_id = categoryId;
  if (keyword?.trim()) params.keyword = keyword.trim();
  if (difficulty?.trim()) params.difficulty = difficulty.trim();
  const { data } = await client.get<PaginatedResponse<ChessGame>>('/games', { params });
  return data;
}

/**
 * 获取单条棋类详情
 * @param id - 棋类 ID
 * @returns 棋类详情
 */
export async function fetchGame(id: number): Promise<ChessGame> {
  const { data } = await client.get<ChessGame>(`/games/${id}`);
  return data;
}

/**
 * 批量获取多条棋类详情（最多3条）
 * @param ids - 棋类 ID 数组
 * @returns 棋类详情数组（可能包含带 error 字段的错误条目
 */
export async function fetchGamesBatch(ids: number[]): Promise<ChessGameBatchItem[]> {
  const { data } = await client.get<ChessGameBatchItem[]>('/games/batch', {
    params: { ids: ids.join(',') },
  });
  return data;
}

/**
 * 创建棋类条目
 * @param payload - 创建数据
 * @returns 新建条目
 */
export async function createGame(payload: ChessGamePayload): Promise<ChessGame> {
  const { data } = await client.post<ChessGame>('/games', payload);
  return data;
}

/**
 * 更新棋类条目
 * @param id - 棋类 ID
 * @param payload - 更新数据
 * @returns 更新后条目
 */
export async function updateGame(id: number, payload: ChessGamePayload): Promise<ChessGame> {
  const { data } = await client.put<ChessGame>(`/games/${id}`, payload);
  return data;
}

/**
 * 删除棋类条目
 * @param id - 棋类 ID
 */
export async function deleteGame(id: number): Promise<void> {
  await client.delete(`/games/${id}`);
}

/**
 * 获取全部收藏列表（含棋类详情）
 * @returns 收藏条目数组
 */
export async function fetchFavorites(): Promise<Favorite[]> {
  const { data } = await client.get<Favorite[]>('/favorites');
  return data;
}

/**
 * 获取全部已收藏的棋类 ID 列表
 * @returns 已收藏的棋类 ID 数组
 */
export async function fetchFavoriteIds(): Promise<number[]> {
  const { data } = await client.get<number[]>('/favorites/ids');
  return data;
}

/**
 * 添加收藏
 * @param gameId - 棋类 ID
 * @returns 新建的收藏条目
 */
export async function addFavorite(gameId: number): Promise<Favorite> {
  const { data } = await client.post<Favorite>('/favorites', { game_id: gameId });
  return data;
}

/**
 * 取消收藏
 * @param gameId - 棋类 ID
 */
export async function removeFavorite(gameId: number): Promise<void> {
  await client.delete(`/favorites/${gameId}`);
}

/**
 * 获取数据统计概览
 * @returns 统计概览数据
 */
export async function fetchStatsOverview(): Promise<StatsOverview> {
  const { data } = await client.get<StatsOverview>('/stats/overview');
  return data;
}
