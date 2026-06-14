import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Empty, List, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { ScheduleFilled } from '@ant-design/icons';

import { fetchTodos, removeTodo } from '../api/client';
import type { Todo } from '../types/game';

const { Paragraph, Text } = Typography;

const difficultyColor: Record<string, string> = {
  入门: 'green',
  中等: 'blue',
  较难: 'orange',
  困难: 'red',
};

const sortOptions = [
  { value: 'desc', label: '最近加入' },
  { value: 'asc', label: '最早加入' },
];

function formatDateTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadTodos = async (order: 'asc' | 'desc') => {
    setLoading(true);
    try {
      const data = await fetchTodos(order);
      setTodos(data);
    } catch {
      message.error('加载待学清单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos(sortOrder);
  }, [sortOrder]);

  const handleSortChange = (value: 'asc' | 'desc') => {
    setSortOrder(value);
  };

  const handleRemove = async (gameId: number) => {
    try {
      await removeTodo(gameId);
      message.success('已移出待学');
      setTodos((prev) => prev.filter((todo) => todo.game_id !== gameId));
    } catch {
      message.error('移出待学失败');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <Empty description="暂无待学棋类">
        <Link to="/">
          <Button type="primary">去添加待学</Button>
        </Link>
      </Empty>
    );
  }

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Text type="secondary">共 {todos.length} 个待学</Text>
        <Select
          value={sortOrder}
          onChange={handleSortChange}
          options={sortOptions}
          style={{ width: 120 }}
        />
      </Space>

      <List
        itemLayout="vertical"
        dataSource={todos}
        renderItem={(item) => {
          const game = item.game;
          if (!game) return null;

          return (
            <List.Item
              key={item.id}
              actions={[
                <Button
                  key="remove-todo"
                  type="link"
                  icon={<ScheduleFilled style={{ color: '#1677ff' }} />}
                  onClick={() => handleRemove(item.game_id)}
                >
                  移出待学
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Link to={`/games/${game.id}`} style={{ fontSize: 16 }}>
                    {game.name}
                  </Link>
                }
                description={
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">加入时间：{formatDateTime(item.created_at)}</Text>
                    <Text type="secondary">起源：{game.origin}</Text>
                    {game.board_size && (
                      <Text type="secondary">棋盘规格：{game.board_size}</Text>
                    )}
                    <Space size={8} wrap>
                      <Tag color={game.category_name ? 'purple' : 'default'}>
                        {game.category_name ?? '未分类'}
                      </Tag>
                      <Tag color={difficultyColor[game.difficulty] ?? 'default'}>
                        {game.difficulty}
                      </Tag>
                      {game.tags?.map((tag) => (
                        <Tag key={tag.id} color={tag.color || 'geekblue'}>
                          {tag.name}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                }
              />
              <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                {game.summary}
              </Paragraph>
            </List.Item>
          );
        }}
      />
    </>
  );
}
