import axios from 'axios';

import type { ChessGame, ChessGamePayload } from '../types/game';

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

/**
 * 获取全部棋类列表
 * @returns 棋类数组
 */
export async function fetchGames(): Promise<ChessGame[]> {
  const { data } = await client.get<ChessGame[]>('/games');
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
