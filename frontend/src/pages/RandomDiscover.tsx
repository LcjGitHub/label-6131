import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Space, Spin, Tag, Typography, message } from 'antd';
import { ReloadOutlined, RightOutlined } from '@ant-design/icons';

import { fetchRandomGame } from '../api/client';
import type { ChessGame } from '../types/game';

const { Title, Paragraph, Text } = Typography;

const difficultyColor: Record<string, string> = {
  入门: 'green',
  中等: 'blue',
  较难: 'orange',
  困难: 'red',
};

export default function RandomDiscover() {
  const navigate = useNavigate();
  const [game, setGame] = useState<ChessGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRandomGame = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await fetchRandomGame();
      setGame(data);
    } catch {
      message.error('获取随机棋类失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRandomGame();
  }, []);

  const truncateSummary = (summary: string, maxLen = 200): string => {
    if (!summary) return '';
    if (summary.length <= maxLen) return summary;
    return summary.slice(0, maxLen) + '...';
  };

  const handleViewDetail = () => {
    if (game) {
      navigate(`/games/${game.id}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!game) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Text type="secondary">暂无棋类数据</Text>
        <br />
        <Button type="primary" onClick={() => loadRandomGame()} style={{ marginTop: 16 }}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        随机发现
      </Title>

      <Card
        loading={refreshing}
        style={{
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        }}
        bodyStyle={{ padding: 32 }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 12 }}>
              {game.name}
            </Title>
            <Space size={8} wrap>
              {game.category_name && (
                <Tag color="purple">{game.category_name}</Tag>
              )}
              <Tag color={difficultyColor[game.difficulty] ?? 'default'}>
                难度：{game.difficulty}
              </Tag>
            </Space>
          </div>

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              起源：{game.origin}
            </Text>
            {game.board_size && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                棋盘规格：{game.board_size}
              </Text>
            )}
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              规则摘要
            </Text>
            <Paragraph style={{ marginBottom: 0, lineHeight: 1.8 }}>
              {truncateSummary(game.summary)}
            </Paragraph>
          </div>

          <Space size="middle" style={{ justifyContent: 'flex-end', width: '100%', paddingTop: 8 }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadRandomGame(true)}
              loading={refreshing}
              size="large"
            >
              换一个
            </Button>
            <Button
              type="primary"
              icon={<RightOutlined />}
              iconPosition="end"
              onClick={handleViewDetail}
              size="large"
            >
              查看详情
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
}
