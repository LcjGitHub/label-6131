import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Empty, List, Spin, Tag, Typography, message } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

import { fetchRecentViews } from '../api/client';
import type { RecentView } from '../types/game';

const { Text } = Typography;

const difficultyColor: Record<string, string> = {
  入门: 'green',
  中等: 'blue',
  较难: 'orange',
  困难: 'red',
};

function formatViewedAt(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function RecentViewList() {
  const [views, setViews] = useState<RecentView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchRecentViews();
        setViews(data);
      } catch {
        message.error('加载浏览记录失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (views.length === 0) {
    return (
      <Empty description="暂无浏览记录">
        <Link to="/">
          <Button type="primary">去浏览棋类</Button>
        </Link>
      </Empty>
    );
  }

  return (
    <>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        最近浏览（共 {views.length} 条）
      </Text>

      <List
        itemLayout="vertical"
        dataSource={views}
        renderItem={(item) => {
          const game = item.game;
          if (!game) return null;

          return (
            <List.Item key={item.id}>
              <List.Item.Meta
                title={
                  <Link to={`/games/${game.id}`} style={{ fontSize: 16 }}>
                    {game.name}
                  </Link>
                }
                description={
                  <span>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    <Text type="secondary">{formatViewedAt(item.viewed_at)}</Text>
                  </span>
                }
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color={game.category_name ? 'purple' : 'default'}>
                  {game.category_name ?? '未分类'}
                </Tag>
                <Tag color={difficultyColor[game.difficulty] ?? 'default'}>
                  {game.difficulty}
                </Tag>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  起源：{game.origin}
                </Text>
              </div>
            </List.Item>
          );
        }}
      />
    </>
  );
}
