import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Descriptions, Spin, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

import { fetchGame } from '../api/client';
import type { ChessGame } from '../types/game';

const { Title, Paragraph, Text } = Typography;

const difficultyColor: Record<string, string> = {
  入门: 'green',
  中等: 'blue',
  较难: 'orange',
  困难: 'red',
};

/** 规则详情页 */
export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<ChessGame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await fetchGame(Number(id));
        setGame(data);
      } catch {
        message.error('加载详情失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!game) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Text type="secondary">未找到该棋类</Text>
        <br />
        <Link to="/">
          <Button type="link">返回列表</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0, marginBottom: 16 }}>
        <Link to="/">返回列表</Link>
      </Button>

      <Title level={2}>{game.name}</Title>

      <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="起源">{game.origin}</Descriptions.Item>
        <Descriptions.Item label="难度">
          <Tag color={difficultyColor[game.difficulty] ?? 'default'}>{game.difficulty}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="相关链接">
          {game.links ? (
            <a href={game.links} target="_blank" rel="noreferrer">
              <LinkOutlined /> {game.links}
            </a>
          ) : (
            <Text type="secondary">暂无</Text>
          )}
        </Descriptions.Item>
      </Descriptions>

      <Title level={4}>规则摘要</Title>
      <Paragraph>
        <ReactMarkdown>{game.summary}</ReactMarkdown>
      </Paragraph>
    </>
  );
}
