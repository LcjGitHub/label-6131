import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Collapse, Empty, List, Space, Statistic, Tag, Typography, message } from 'antd';
import { AlertOutlined, CheckCircleOutlined, ReloadOutlined, SafetyOutlined, UnorderedListOutlined } from '@ant-design/icons';

import { fetchLinkHealthSummary } from '../api/client';
import type { LinkHealthSummaryResponse } from '../types/game';

const { Text, Paragraph } = Typography;

/** 链接健康页 */
export default function LinkHealthPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<LinkHealthSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLinkHealthSummary();
      setData(result);
    } catch (err) {
      const e = err instanceof Error ? err : new Error('加载链接健康数据失败');
      setError(e);
      message.error('加载链接健康数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGameClick = (gameId: number) => {
    navigate(`/games/${gameId}`);
  };

  if (error && !loading) {
    return (
      <Card bordered={false}>
        <Empty
          description={
            <Space direction="vertical" size={8} align="center">
              <Text type="danger" strong>
                加载链接健康数据失败
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {error.message || '请检查后端服务是否正常运行后重试'}
              </Text>
            </Space>
          }
        >
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadData}>
            重新加载
          </Button>
        </Empty>
      </Card>
    );
  }

  const hasIssues = data && data.games.length > 0;

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card bordered={false} loading={loading}>
        <Space size={[24, 24]} wrap style={{ width: '100%', justifyContent: 'space-around' }}>
          <Statistic
            title="已扫描棋类总数"
            value={data?.summary.total_games_scanned ?? 0}
            prefix={<UnorderedListOutlined />}
          />
          <Statistic
            title="含链接棋类"
            value={data?.summary.total_games_with_links ?? 0}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
          <Statistic
            title="存在失效链接"
            value={data?.summary.total_games_with_issues ?? 0}
            prefix={<AlertOutlined />}
            valueStyle={{ color: data?.summary.total_games_with_issues ? '#ff4d4f' : '#52c41a' }}
          />
          <Statistic
            title="失效链接总数"
            value={data?.summary.total_unreachable ?? 0}
            prefix={<AlertOutlined />}
            valueStyle={{ color: data?.summary.total_unreachable ? '#ff4d4f' : '#52c41a' }}
          />
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <SafetyOutlined />
            <span>失效链接详情</span>
          </Space>
        }
        loading={loading}
        bordered={false}
        extra={
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadData}
            disabled={loading}
          >
            重新扫描
          </Button>
        }
      >
        {!loading && !hasIssues ? (
          <Empty
            image={<SafetyOutlined style={{ fontSize: 64, color: '#52c41a' }} />}
            description={
              <Space direction="vertical" size={8} align="center">
                <Text strong style={{ fontSize: 16 }}>
                  所有链接均正常可用
                </Text>
                <Text type="secondary">
                  已扫描 {data?.summary.total_games_with_links ?? 0} 个棋类的 {data?.summary.total_links ?? 0} 条链接
                </Text>
              </Space>
            }
          />
        ) : (
          <>
            {hasIssues && (
              <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 16 }}>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  共检测到 <Text type="danger" strong>{data?.summary.total_unreachable}</Text> 条失效链接，
                  涉及 <Text type="danger" strong>{data?.summary.total_games_with_issues}</Text> 个棋类。
                  点击棋类名称可进入详情页进行修改。
                </Paragraph>
              </Space>
            )}
            <Collapse
              accordion
              bordered={false}
              style={{ background: 'transparent' }}
              items={data?.games.map((game) => ({
                key: String(game.game_id),
                label: (
                  <Space style={{ width: '100%' }}>
                    <AlertOutlined style={{ color: '#ff4d4f' }} />
                    <Button
                      type="link"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGameClick(game.game_id);
                      }}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      <Text strong>{game.game_name}</Text>
                    </Button>
                    <Space style={{ flex: 1, justifyContent: 'flex-end' }}>
                      <Tag color="red">
                        {game.summary.unreachable} 条失效
                      </Tag>
                      <Text type="secondary">
                        共 {game.summary.total} 条链接
                      </Text>
                    </Space>
                  </Space>
                ),
                children: (
                  <List
                    dataSource={game.unreachable_links}
                    renderItem={(item) => (
                      <List.Item style={{ paddingLeft: 32 }}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Text code copyable style={{ width: '100%', wordBreak: 'break-all' }}>
                            {item.url}
                          </Text>
                          <Space size={8}>
                            <Tag color="red">
                              {item.status_code ? `HTTP ${item.status_code}` : '错误'}
                            </Tag>
                            <Text type="secondary">
                              失效原因：{item.reason || '未知错误'}
                            </Text>
                          </Space>
                        </Space>
                      </List.Item>
                    )}
                  />
                ),
              }))}
            />
          </>
        )}
      </Card>
    </Space>
  );
}
