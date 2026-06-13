import { useEffect, useState } from 'react';
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
import { DeleteOutlined, EditOutlined, PlusOutlined, StarFilled, StarOutlined } from '@ant-design/icons';

import {
  addFavorite,
  batchDeleteGames,
  createGame,
  deleteGame,
  fetchFavoriteIds,
  removeFavorite,
  updateGame,
} from '../api/client';
import type { ChessGame, ChessGamePayload } from '../types/game';
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [form] = Form.useForm<ChessGamePayload>();
  const navigate = useNavigate();

  const loadFavoriteIds = async () => {
    try {
      const ids = await fetchFavoriteIds();
      setFavoriteIds(new Set(ids));
    } catch {
      message.error('加载收藏状态失败');
    }
  };

  // 组件挂载时加载收藏状态（分类和列表数据已在 useGameList 中加载）
  useEffect(() => {
    loadFavoriteIds();
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

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
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
      if (editing) {
        await updateGame(editing.id, payload);
        message.success('更新成功');
      } else {
        await createGame(payload);
        message.success('创建成功');
      }
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
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增棋类
        </Button>
      </Space>

      <List
        loading={loading}
        itemLayout="vertical"
        dataSource={games}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <Button
                key="favorite"
                type="link"
                icon={favoriteIds.has(item.id) ? <StarFilled /> : <StarOutlined />}
                onClick={() => toggleFavorite(item.id)}
                style={favoriteIds.has(item.id) ? { color: '#faad14' } : undefined}
              >
                {favoriteIds.has(item.id) ? '已收藏' : '收藏'}
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
