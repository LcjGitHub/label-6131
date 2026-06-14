import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Form,
  Input,
  List,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { CheckCircleFilled, CheckCircleOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, EyeFilled, EyeOutlined, PlusOutlined, ScheduleFilled, ScheduleOutlined, StarFilled, StarOutlined, UploadOutlined } from '@ant-design/icons';

import {
  addFavorite,
  addTodo,
  batchDeleteGames,
  createGame,
  createTag,
  deleteGame,
  exportGames,
  fetchFavoriteIds,
  fetchReadIds,
  fetchTags,
  fetchTodoIds,
  importGames,
  markAsRead,
  removeFavorite,
  removeTodo,
  setGameTags,
  unmarkRead,
  updateGame,
} from '../api/client';
import type { ChessGame, ChessGamePayload, Tag as ChessTag } from '../types/game';
import { useGameList } from '../hooks/useGameList';

const { Paragraph, Text } = Typography;

/** 棋类列表页 */
export default function GameList() {
  const {
    games,
    total,
    page,
    pageSize,
    loading,
    filterCategoryId,
    setFilterCategoryId,
    keywordInput,
    setKeywordInput,
    filterDifficulty,
    setFilterDifficulty,
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
  } = useGameList();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChessGame | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [todoIds, setTodoIds] = useState<Set<number>>(new Set());
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [form] = Form.useForm<ChessGamePayload>();
  const [importing, setImporting] = useState(false);
  const [allTags, setAllTags] = useState<ChessTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [tagLoading, setTagLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const loadFavoriteIds = async () => {
    try {
      const ids = await fetchFavoriteIds();
      setFavoriteIds(new Set(ids));
    } catch {
      message.error('加载收藏状态失败');
    }
  };

  const loadTodoIds = async () => {
    try {
      const ids = await fetchTodoIds();
      setTodoIds(new Set(ids));
    } catch {
      message.error('加载待学状态失败');
    }
  };

  const loadReadIds = async () => {
    try {
      const ids = await fetchReadIds();
      setReadIds(new Set(ids));
    } catch {
      message.error('加载已读状态失败');
    }
  };

  const loadTags = async () => {
    try {
      setTagLoading(true);
      const data = await fetchTags();
      setAllTags(data.items);
    } catch {
      message.error('加载标签列表失败');
    } finally {
      setTagLoading(false);
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) {
      message.warning('请输入标签名称');
      return;
    }
    if (name.length > 50) {
      message.warning('标签名称不能超过 50 个字符');
      return;
    }
    if (allTags.some((t) => t.name === name)) {
      message.warning('标签已存在');
      return;
    }
    try {
      const newTag = await createTag({ name });
      setAllTags((prev) => [...prev, newTag]);
      setSelectedTagIds((prev) => [...prev, newTag.id]);
      setNewTagName('');
      message.success('标签创建成功');
    } catch (err) {
      if (axiosIsError(err)) {
        message.error(err.response?.data?.error ?? '创建标签失败');
      }
    }
  };

  // 组件挂载时加载收藏、待学、已读状态（分类和列表数据已在 useGameList 中加载）
  useEffect(() => {
    loadFavoriteIds();
    loadTodoIds();
    loadReadIds();
  }, []);

  const toggleFavorite = async (gameId: number) => {
    try {
      if (favoriteIds.has(gameId)) {
        await removeFavorite(gameId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(gameId);
          return next;
        });
        message.success('已取消收藏');
      } else {
        await addFavorite(gameId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.add(gameId);
          return next;
        });
        message.success('已收藏');
      }
    } catch (err) {
      if (axiosIsError(err)) {
        message.error(err.response?.data?.error ?? '操作失败');
      }
    }
  };

  const toggleTodo = async (gameId: number) => {
    try {
      if (todoIds.has(gameId)) {
        await removeTodo(gameId);
        setTodoIds((prev) => {
          const next = new Set(prev);
          next.delete(gameId);
          return next;
        });
        message.success('已移出待学');
      } else {
        await addTodo(gameId);
        setTodoIds((prev) => {
          const next = new Set(prev);
          next.add(gameId);
          return next;
        });
        message.success('已加入待学');
      }
    } catch (err) {
      if (axiosIsError(err)) {
        message.error(err.response?.data?.error ?? '操作失败');
      }
    }
  };

  const toggleRead = async (gameId: number) => {
    try {
      if (readIds.has(gameId)) {
        await unmarkRead(gameId);
        setReadIds((prev) => {
          const next = new Set(prev);
          next.delete(gameId);
          return next;
        });
        message.success('已取消已读');
      } else {
        await markAsRead(gameId);
        setReadIds((prev) => {
          const next = new Set(prev);
          next.add(gameId);
          return next;
        });
        message.success('已标记为已读');
      }
    } catch (err) {
      if (axiosIsError(err)) {
        message.error(err.response?.data?.error ?? '操作失败');
      }
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setSelectedTagIds([]);
    loadTags();
    setModalOpen(true);
  };

  const openEdit = (game: ChessGame) => {
    setEditing(game);
    form.setFieldsValue({
      name: game.name,
      origin: game.origin,
      summary: game.summary,
      difficulty: game.difficulty,
      links: game.links,
      board_size: game.board_size,
      category_id: game.category_id ?? undefined,
    });
    setSelectedTagIds(game.tags?.map((t) => t.id) ?? []);
    loadTags();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload: ChessGamePayload = {
        ...values,
        category_id: values.category_id ?? null,
      };
      let gameId: number;
      if (editing) {
        await updateGame(editing.id, payload);
        gameId = editing.id;
      } else {
        const newGame = await createGame(payload);
        gameId = newGame.id;
      }
      await setGameTags(gameId, selectedTagIds);
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false);
      await reloadGames(editing ? page : 1, pageSize);
    } catch (err) {
      if (axiosIsError(err)) {
        message.error(err.response?.data?.error ?? '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteGame(id);
      message.success('删除成功');
      const newTotal = total - 1;
      const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = Math.min(page, maxPage);
      await reloadGames(targetPage, pageSize);
    } catch {
      message.error('删除失败');
    }
  };

  const toggleSelect = (gameId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size < 1) {
      message.warning('请至少选择1条记录');
      return;
    }
    setBatchDeleteModalOpen(true);
  };

  const confirmBatchDelete = async () => {
    try {
      setBatchDeleting(true);
      const ids = Array.from(selectedIds);
      const result = await batchDeleteGames(ids);
      if (result.failed.length > 0) {
        const failedNames = result.failed.map((f) => `编号 ${f.id}`).join('、');
        message.warning(`${result.message}，失败：${failedNames}`);
      } else {
        message.success(result.message);
      }
      setSelectedIds(new Set());
      setBatchDeleteModalOpen(false);
      const newTotal = total - result.success_count;
      const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = Math.min(page, maxPage);
      await reloadGames(targetPage, pageSize);
      await loadFavoriteIds();
    } catch (err) {
      if (axiosIsError(err)) {
        message.error(err.response?.data?.error ?? '批量删除失败');
      }
    } finally {
      setBatchDeleting(false);
    }
  };

  const startCompare = () => {
    if (selectedIds.size < 1) {
      message.warning('请至少选择1个棋类');
      return;
    }
    if (selectedIds.size > 3) {
      message.warning('最多只能选择3个棋类进行对比');
      return;
    }
    const ids = Array.from(selectedIds).join(',');
    navigate(`/compare?ids=${ids}`);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleExport = async () => {
    try {
      await exportGames();
      message.success('导出成功');
    } catch (err) {
      if (axiosIsError(err)) {
        message.error(err.response?.data?.error ?? '导出失败');
      } else {
        message.error('导出失败');
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const result = await importGames(file);
      if (result.success_count > 0) {
        message.success(`导入成功：新增 ${result.success_count} 条`);
      }
      if (result.skip_count > 0) {
        message.warning(`跳过重复名称 ${result.skip_count} 条`);
      }
      if (result.failed_count > 0) {
        const errorMsgs = result.failed.slice(0, 3).map((f) => f.error).join('；');
        message.error(`导入失败 ${result.failed_count} 条：${errorMsgs}`);
      }
      if (result.success_count > 0 || result.skip_count > 0) {
        await reloadGames(page, pageSize);
      }
    } catch (err) {
      if (axiosIsError(err)) {
        message.error(err.response?.data?.error ?? '导入失败');
      } else {
        message.error('导入失败');
      }
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Space wrap>
          <Text type="secondary">共 {total} 种冷门棋类</Text>
          <Input
            style={{ minWidth: 200 }}
            placeholder="搜索名称、起源、规则摘要"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Select
            style={{ minWidth: 120 }}
            value={filterDifficulty}
            onChange={setFilterDifficulty}
            options={difficultyOptions}
            placeholder="按难度筛选"
          />
          <Select
            style={{ minWidth: 160 }}
            value={filterCategoryId}
            onChange={setFilterCategoryId}
            options={categoryOptions}
            placeholder="按分类筛选"
          />
          <Select
            style={{ minWidth: 160 }}
            value={currentSortValue}
            onChange={handleSortChange}
            options={SORT_OPTIONS}
            placeholder="排序方式"
          />
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleClear}>
            清空
          </Button>
          <Button
            type="primary"
            onClick={startCompare}
            disabled={selectedIds.size < 1 || selectedIds.size > 3}
          >
            开始对比（已选 {selectedIds.size}）
          </Button>
          <Button
            danger
            onClick={handleBatchDelete}
            disabled={selectedIds.size < 1}
            icon={<DeleteOutlined />}
          >
            批量删除（已选 {selectedIds.size}）
          </Button>
          <Button onClick={clearSelection} disabled={selectedIds.size < 1}>
            取消选择
          </Button>
        </Space>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出全部数据
          </Button>
          <Button icon={<UploadOutlined />} onClick={handleImportClick} loading={importing}>
            选择文件导入
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增棋类
          </Button>
        </Space>
      </Space>

      <List
        loading={loading}
        itemLayout="vertical"
        dataSource={games}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            style={{
              backgroundColor: readIds.has(item.id) ? '#f6ffed' : undefined,
              position: 'relative',
            }}
            actions={[
              <Button
                key="read"
                type="link"
                icon={readIds.has(item.id) ? <EyeFilled /> : <EyeOutlined />}
                onClick={() => toggleRead(item.id)}
                style={readIds.has(item.id) ? { color: '#52c41a' } : undefined}
              >
                {readIds.has(item.id) ? '已读' : '标记已读'}
              </Button>,
              <Button
                key="favorite"
                type="link"
                icon={favoriteIds.has(item.id) ? <StarFilled /> : <StarOutlined />}
                onClick={() => toggleFavorite(item.id)}
                style={favoriteIds.has(item.id) ? { color: '#faad14' } : undefined}
              >
                {favoriteIds.has(item.id) ? '已收藏' : '收藏'}
              </Button>,
              <Button
                key="todo"
                type="link"
                icon={todoIds.has(item.id) ? <ScheduleFilled /> : <ScheduleOutlined />}
                onClick={() => toggleTodo(item.id)}
                style={todoIds.has(item.id) ? { color: '#1677ff' } : undefined}
              >
                {todoIds.has(item.id) ? '已待学' : '待学'}
              </Button>,
              <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => openEdit(item)}>
                编辑
              </Button>,
              <Popconfirm
                key="delete"
                title="确定删除该棋类？"
                onConfirm={() => handleDelete(item.id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>,
            ]}
          >
            {readIds.has(item.id) && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 0,
                  height: 0,
                  borderTop: '32px solid #52c41a',
                  borderLeft: '32px solid transparent',
                  zIndex: 1,
                }}
              >
                <CheckCircleFilled
                  style={{
                    position: 'absolute',
                    top: '-28px',
                    right: '2px',
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>
            )}
            <Space align="start" style={{ width: '100%' }}>
              <Checkbox
                checked={selectedIds.has(item.id)}
                onChange={() => toggleSelect(item.id)}
                style={{ marginTop: 4 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <List.Item.Meta
                  title={
                    <Link to={`/games/${item.id}`} style={{ fontSize: 16 }}>
                      {item.name}
                    </Link>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Text type="secondary">起源：{item.origin}</Text>
                      {item.board_size && (
                        <Text type="secondary">棋盘规格：{item.board_size}</Text>
                      )}
                      <Space size={8} wrap>
                        <Tag color={item.category_name ? 'purple' : 'default'}>
                          {item.category_name ?? '未分类'}
                        </Tag>
                        <Tag color={difficultyColor[item.difficulty] ?? 'default'}>
                          {item.difficulty}
                        </Tag>
                        {item.tags?.map((tag) => (
                          <Tag key={tag.id} color={tag.color || 'geekblue'}>
                            {tag.name}
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  }
                />
                <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                  {item.summary}
                </Paragraph>
              </div>
            </Space>
          </List.Item>
        )}
      />

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          showQuickJumper
          showTotal={(t) => `共 ${t} 条`}
          onChange={handlePaginationChange}
        />
      </div>

      <Modal
        title={editing ? '编辑棋类' : '新增棋类'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="棋类名" rules={[{ required: true, message: '请输入棋类名' }]}>
            <Input placeholder="例如：连珠（Renju）" />
          </Form.Item>
          <Form.Item name="origin" label="起源" rules={[{ required: true, message: '请输入起源' }]}>
            <Input placeholder="例如：日本" />
          </Form.Item>
          <Form.Item
            name="summary"
            label="规则摘要"
            rules={[{ required: true, message: '请输入规则摘要' }]}
          >
            <Input.TextArea rows={4} placeholder="简要描述核心规则" />
          </Form.Item>
          <Form.Item
            name="difficulty"
            label="难度"
            rules={[{ required: true, message: '请选择难度' }]}
          >
            <Select options={DIFFICULTY_OPTIONS} placeholder="选择难度" />
          </Form.Item>
          <Form.Item name="board_size" label="棋盘规格">
            <Input placeholder="例如：15×15（选填）" />
          </Form.Item>
          <Form.Item name="category_id" label="分类">
            <Select
              options={gameCategoryOptions}
              placeholder="选择分类（可选）"
              allowClear
            />
          </Form.Item>
          <Form.Item label="特色标签">
            <Select
              mode="multiple"
              placeholder="选择已有标签"
              value={selectedTagIds}
              onChange={setSelectedTagIds}
              options={allTags.map((t) => ({ label: t.name, value: t.id }))}
              loading={tagLoading}
              allowClear
              style={{ width: '100%', marginBottom: 8 }}
            />
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入新标签名称，点击右侧按钮创建"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onPressEnter={handleCreateTag}
              />
              <Button type="primary" onClick={handleCreateTag}>
                新建
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="links" label="相关链接">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认批量删除"
        open={batchDeleteModalOpen}
        onCancel={() => setBatchDeleteModalOpen(false)}
        onOk={confirmBatchDelete}
        confirmLoading={batchDeleting}
        okText="确认删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <p>确定要删除选中的 <strong>{selectedIds.size}</strong> 条棋类记录吗？</p>
        <p style={{ color: '#faad14' }}>
          删除后将同时清理对应的收藏记录，此操作不可恢复。
        </p>
      </Modal>
    </>
  );
}

/**
 * 判断是否为 axios 错误
 * @param err - 未知错误
 */
function axiosIsError(err: unknown): err is { response?: { data?: { error?: string } } } {
  return typeof err === 'object' && err !== null && 'response' in err;
}
