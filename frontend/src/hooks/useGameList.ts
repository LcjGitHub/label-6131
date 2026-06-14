import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { message } from 'antd';

import {
  fetchCategories,
  fetchGames,
} from '../api/client';
import type { Category, ChessGame } from '../types/game';

const ALL_CATEGORY_VALUE = 0;
const ALL_DIFFICULTY_VALUE = '';

const DIFFICULTY_OPTIONS = [
  { label: '入门', value: '入门' },
  { label: '中等', value: '中等' },
  { label: '较难', value: '较难' },
  { label: '困难', value: '困难' },
];

const SORT_OPTIONS = [
  { label: '按编号升序', value: 'id-asc' },
  { label: '按编号降序', value: 'id-desc' },
  { label: '按名称升序', value: 'name-asc' },
  { label: '按名称降序', value: 'name-desc' },
  { label: '按难度升序', value: 'difficulty-asc' },
  { label: '按难度降序', value: 'difficulty-desc' },
  { label: '按创建时间升序', value: 'created_at-asc' },
  { label: '按创建时间降序', value: 'created_at-desc' },
];

const difficultyColor: Record<string, string> = {
  入门: 'green',
  中等: 'blue',
  较难: 'orange',
  困难: 'red',
};

const difficultyOptions = [
  { label: '全部难度', value: ALL_DIFFICULTY_VALUE },
  ...DIFFICULTY_OPTIONS,
];

const VALID_DIFFICULTIES = DIFFICULTY_OPTIONS.map((opt) => opt.value);

/**
 * 棋类列表状态管理 Hook
 * 负责：筛选条件、排序、分页、列表数据请求、分类数据加载
 * 不负责：CRUD 模态框、收藏、对比勾选（由页面组件自身管理）
 */
export function useGameList() {
  const [searchParams] = useSearchParams();
  const [games, setGames] = useState<ChessGame[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [filterCategoryId, setFilterCategoryId] = useState<number>(ALL_CATEGORY_VALUE);
  const [keywordInput, setKeywordInput] = useState('');
  const initialDifficulty = (() => {
    const difficultyFromUrl = searchParams.get('difficulty');
    return difficultyFromUrl && VALID_DIFFICULTIES.includes(difficultyFromUrl)
      ? difficultyFromUrl
      : ALL_DIFFICULTY_VALUE;
  })();
  const [filterDifficulty, setFilterDifficulty] = useState<string>(initialDifficulty);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTrigger, setSearchTrigger] = useState(0);

  const loadGames = useCallback(async (
    p = page,
    ps = pageSize,
    sb = sortBy,
    so = sortOrder,
  ) => {
    setLoading(true);
    try {
      const categoryId = filterCategoryId === ALL_CATEGORY_VALUE ? undefined : filterCategoryId;
      const difficulty = filterDifficulty === ALL_DIFFICULTY_VALUE ? undefined : filterDifficulty;
      const data = await fetchGames(p, ps, categoryId, keywordInput, difficulty, sb, so);
      setGames(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.page_size);
    } catch {
      message.error('加载棋类列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, filterCategoryId, keywordInput, filterDifficulty]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories(1, 100);
      setCategories(data.items);
    } catch {
      message.error('加载分类列表失败');
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadGames();
  }, [searchTrigger]);

  const handleSearch = useCallback(() => {
    setPage(1);
    setSearchTrigger((prev) => prev + 1);
  }, []);

  const handleClear = useCallback(() => {
    setKeywordInput('');
    setFilterDifficulty(ALL_DIFFICULTY_VALUE);
    setFilterCategoryId(ALL_CATEGORY_VALUE);
    setSortBy('id');
    setSortOrder('asc');
    setPage(1);
    setSearchTrigger((prev) => prev + 1);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    const [sb, so] = value.split('-');
    setSortBy(sb);
    setSortOrder(so);
    setPage(1);
    loadGames(1, pageSize, sb, so);
  }, [loadGames, pageSize]);

  const handlePaginationChange = useCallback((p: number, ps: number) => {
    loadGames(p, ps);
  }, [loadGames]);

  const reloadGames = useCallback(async (p = page, ps = pageSize) => {
    await loadGames(p, ps);
  }, [loadGames, page, pageSize]);

  const categoryOptions = [
    { label: '全部分类', value: ALL_CATEGORY_VALUE },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const gameCategoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));

  const currentSortValue = `${sortBy}-${sortOrder}`;

  return {
    games,
    setGames,
    categories,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    filterCategoryId,
    setFilterCategoryId,
    keywordInput,
    setKeywordInput,
    filterDifficulty,
    setFilterDifficulty,
    sortBy,
    sortOrder,
    currentSortValue,
    handleSearch,
    handleClear,
    handleSortChange,
    handlePaginationChange,
    reloadGames,
    categoryOptions,
    gameCategoryOptions,
    DIFFICULTY_OPTIONS,
    SORT_OPTIONS,
    difficultyOptions,
    difficultyColor,
    ALL_CATEGORY_VALUE,
    ALL_DIFFICULTY_VALUE,
  };
}

export {
  DIFFICULTY_OPTIONS,
  SORT_OPTIONS,
  difficultyColor,
  difficultyOptions,
  ALL_CATEGORY_VALUE,
  ALL_DIFFICULTY_VALUE,
};
