import { useEffect, useState } from 'react';
import { Card, List, Space, Tag, Typography, message } from 'antd';
import { BarChartOutlined, TrophyOutlined } from '@ant-design/icons';

import { fetchStatsOverview } from '../api/client';
import type { StatsOverview } from '../types/game';

const { Title, Text } = Typography;

const difficultyColor: Record<string, string> = {
  入门: 'green',
  中等: 'blue',
  较难: 'orange',
  困难: 'red',
};

/** 统计概览页 */
export default function StatsOverviewPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchStatsOverview();
      setStats(data);
    } catch {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const difficultyEntries = stats
    ? Object.entries(stats.difficulty_distribution).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card
        loading={loading}
        bordered={false}
        style={{ textAlign: 'center' }}
        bodyStyle={{ padding: 32 }}
      >
        <BarChartOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={2} style={{ marginBottom: 8 }}>
          {stats?.total_games ?? 0}
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          棋类总数量
        </Text>
      </Card>

      <Card
        title={
          <Space>
            <TrophyOutlined />
            <span>难度分布</span>
          </Space>
        }
        loading={loading}
        bordered={false}
      >
        <Space size={[12, 12]} wrap>
          {difficultyEntries.map(([difficulty, count]) => (
            <Tag
              key={difficulty}
              color={difficultyColor[difficulty] ?? 'default'}
              style={{ fontSize: 14, padding: '4px 12px', borderRadius: 6 }}
            >
              {difficulty}：{count} 种
            </Tag>
          ))}
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <TrophyOutlined />
            <span>起源地区排行（前五名）</span>
          </Space>
        }
        loading={loading}
        bordered={false}
      >
        <List
          dataSource={stats?.origin_rank ?? []}
          renderItem={(item, index) => (
            <List.Item>
              <Space style={{ width: '100%' }}>
                <Tag
                  color={index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}
                  style={{ minWidth: 28, textAlign: 'center' }}
                >
                  {index + 1}
                </Tag>
                <Text style={{ flex: 1 }}>{item.origin}</Text>
                <Text type="secondary">{item.count} 种</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
