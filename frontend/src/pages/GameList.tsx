import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
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
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

import {
  createGame,
  deleteGame,
  fetchCategories,
  fetchGames,
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

/** 棋类列表页 */
export default function GameList() {
  const [games, setGames] = useState<ChessGame[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChessGame | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<number>(ALL_CATEGORY_VALUE);
  const [form] = Form.useForm<ChessGamePayload>();

  const loadGames = async () => {
    setLoading(true);
    try {
      const categoryId = filterCategoryId === ALL_CATEGORY_VALUE ? undefined : filterCategoryId;
      const data = await fetchGames(categoryId);
      setGames(data);
    } catch {
      message.error('加载棋类列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch {
      message.error('加载分类列表失败');
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadGames();
  }, [filterCategoryId]);

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

  const categoryOptions = [
    { label: '全部分类', value: ALL_CATEGORY_VALUE },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const gameCategoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));

  return (
    <>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Space>
          <Text type="secondary">共 {games.length} 种冷门棋类</Text>
          <Select
            style={{ minWidth: 160 }}
            value={filterCategoryId}
            onChange={setFilterCategoryId}
            options={categoryOptions}
            placeholder="按分类筛选"
          />
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
