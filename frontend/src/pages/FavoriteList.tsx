import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Empty, List, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { StarFilled } from '@ant-design/icons';

import { fetchFavorites, removeFavorite } from '../api/client';
import type { Favorite } from '../types/game';

const { Paragraph, Text } = Typography;

const difficultyColor: Record<string, string> = {
  入门: 'green',
  中等: 'blue',
  较难: 'orange',
  困难: 'red',
};

const sortOptions = [
  { value: 'desc', label: '最近收藏' },
  { value: 'asc', label: '最早收藏' },
];

export default function FavoriteList() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadFavorites = async (order: 'asc' | 'desc') => {
    setLoading(true);
    try {
      const data = await fetchFavorites(order);
      setFavorites(data);
    } catch {
      message.error('加载收藏列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites(sortOrder);
  }, [sortOrder]);

  const handleSortChange = (value: 'asc' | 'desc') => {
    setSortOrder(value);
  };

  const handleRemove = async (gameId: number) => {
    try {
      await removeFavorite(gameId);
      message.success('已取消收藏');
      setFavorites((prev) => prev.filter((fav) => fav.game_id !== gameId));
    } catch {
      message.error('取消收藏失败');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <Empty description="暂无收藏">
        <Link to="/">
          <Button type="primary">去收藏棋类</Button>
        </Link>
      </Empty>
    );
  }

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Text type="secondary">共 {favorites.length} 个收藏</Text>
        <Select
          value={sortOrder}
          onChange={handleSortChange}
          options={sortOptions}
          style={{ width: 120 }}
        />
      </Space>

      <List
        itemLayout="vertical"
        dataSource={favorites}
        renderItem={(item) => {
          const game = item.game;
          if (!game) return null;

          return (
            <List.Item
              key={item.id}
              actions={[
                <Button
                  key="unfavorite"
                  type="link"
                  icon={<StarFilled style={{ color: '#faad14' }} />}
                  onClick={() => handleRemove(item.game_id)}
                >
                  取消收藏
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
