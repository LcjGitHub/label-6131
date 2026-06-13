import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Form,
  Input,
  List,
  Modal,
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
  createGame,
  deleteGame,
  fetchCategories,
  fetchFavoriteIds,
  fetchGames,
  removeFavorite,
  updateGame,
} from '../api/client';
import type { Category, ChessGame, ChessGamePayload } from '../types/game';

const { Paragraph, Text } = Typography;

const DIFFICULTY_OPTIONS = [
  { label: '入门', value: '入门' },
  { label: '中等', value: '中等' },
  { label: '较难', value: '较难' },
  { label: '困难', value: '困难' },
];

const difficultyColor: Record<string, string> = {
  入门: 'green',
  中等: 'blue',
  较难: 'orange',
  困难: 'red',
};

const ALL_CATEGORY_VALUE = 0;
const ALL_DIFFICULTY_VALUE = '';

const difficultyOptions = [
  { label: '全部难度', value: ALL_DIFFICULTY_VALUE },
  ...DIFFICULTY_OPTIONS,
];

/** 棋类列表页 */
export default function GameList() {
  const [games, setGames] = useState<ChessGame[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChessGame | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<number>(ALL_CATEGORY_VALUE);
  const [keywordInput, setKeywordInput] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>(ALL_DIFFICULTY_VALUE);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [form] = Form.useForm<ChessGamePayload>();
  const navigate = useNavigate();

  const loadGames = async () => {
    setLoading(true);
    try {
      const categoryId = filterCategoryId === ALL_CATEGORY_VALUE ? undefined : filterCategoryId;
      const difficulty = filterDifficulty === ALL_DIFFICULTY_VALUE ? undefined : filterDifficulty;
      const data = await fetchGames(categoryId, keywordInput, difficulty);
      setGames(data);
    } catch {
      message.error('加载棋类列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories(1, 100);
      setCategories(data.items);
    } catch {
      message.error('加载分类列表失败');
    }
  };

  const loadFavoriteIds = async () => {
    try {
      const ids = await fetchFavoriteIds();
      setFavoriteIds(new Set(ids));
    } catch {
      message.error('加载收藏状态失败');
    }
  };

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

  useEffect(() => {
    loadCategories();
    loadFavoriteIds();
  }, []);

  useEffect(() => {
    loadGames();
  }, [searchTrigger]);

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
      await loadGames();
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
      await loadGames();
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
        if (next.size >= 3) {
          message.warning('最多只能选择3个棋类进行对比');
          return prev;
        }
        next.add(gameId);
      }
      return next;
    });
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

  const handleSearch = () => {
    setSearchTrigger((prev) => prev + 1);
  };

  const handleClear = () => {
    setKeywordInput('');
    setFilterDifficulty(ALL_DIFFICULTY_VALUE);
    setFilterCategoryId(ALL_CATEGORY_VALUE);
    setSearchTrigger((prev) => prev + 1);
  };

  const categoryOptions = [
    { label: '全部分类', value: ALL_CATEGORY_VALUE },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const gameCategoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));

  return (
    <>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Space wrap>
          <Text type="secondary">共 {games.length} 种冷门棋类</Text>
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
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleClear}>
            清空
          </Button>
          <Button
            type="primary"
            onClick={startCompare}
            disabled={selectedIds.size < 1}
          >
            开始对比（已选 {selectedIds.size}/3）
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
