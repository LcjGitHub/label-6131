import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Descriptions, Spin, Tag, Tooltip, Typography, message } from 'antd';
import { ArrowLeftOutlined, LeftOutlined, LinkOutlined, RightOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

import { fetchGame, fetchGameNeighbors, fetchSimilarGames, addRecentView } from '../api/client';
import type { ChessGame, GameNeighbors, SimilarGamesResponse } from '../types/game';

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
  const navigate = useNavigate();
  const [game, setGame] = useState<ChessGame | null>(null);
  const [neighbors, setNeighbors] = useState<GameNeighbors | null>(null);
  const [neighborsError, setNeighborsError] = useState(false);
  const [similarGames, setSimilarGames] = useState<SimilarGamesResponse | null>(null);
  const [similarError, setSimilarError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setNeighborsError(false);
      setSimilarError(false);
      try {
        const gameId = Number(id);
        const gameData = await fetchGame(gameId);
        setGame(gameData);
        addRecentView(gameId).catch(() => {});
        try {
          const neighborsData = await fetchGameNeighbors(gameId);
          setNeighbors(neighborsData);
        } catch {
          setNeighborsError(true);
          setNeighbors(null);
        }
        try {
          const similarData = await fetchSimilarGames(gameId);
          setSimilarGames(similarData);
        } catch {
          setSimilarError(true);
          setSimilarGames(null);
        }
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

  const hasPrev = neighbors?.prev != null && !neighborsError;
  const hasNext = neighbors?.next != null && !neighborsError;

  const getPrevTooltip = () => {
    if (neighborsError) return '相邻棋类加载失败';
    if (!neighbors?.prev) return '已经是第一条';
    return neighbors.prev.name;
  };

  const getNextTooltip = () => {
    if (neighborsError) return '相邻棋类加载失败';
    if (!neighbors?.next) return '已经是最后一条';
    return neighbors.next.name;
  };

  return (
    <>
      <Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0, marginBottom: 16 }}>
        <Link to="/">返回列表</Link>
      </Button>

      <Title level={2}>{game.name}</Title>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Tooltip title={getPrevTooltip()}>
          <Button
            icon={<LeftOutlined />}
            disabled={!hasPrev}
            onClick={() => hasPrev && navigate(`/games/${neighbors!.prev!.id}`)}
          >
            上一条
          </Button>
        </Tooltip>
        <Tooltip title={getNextTooltip()}>
          <Button
            icon={<RightOutlined />}
            iconPosition="end"
            disabled={!hasNext}
            onClick={() => hasNext && navigate(`/games/${neighbors!.next!.id}`)}
          >
            下一条
          </Button>
        </Tooltip>
      </div>

      <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="分类">
          {game.category_name ? (
            <Tag color="purple">{game.category_name}</Tag>
          ) : (
            <Tag>未分类</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="起源">{game.origin}</Descriptions.Item>
        <Descriptions.Item label="棋盘规格">
          {game.board_size ? (
            game.board_size
          ) : (
            <Text type="secondary">暂无</Text>
          )}
        </Descriptions.Item>
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

      <Title level={4}>同类推荐</Title>
      <Paragraph>
        {similarError ? (
          <Text type="secondary">暂无同类推荐</Text>
        ) : similarGames?.items?.length ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {similarGames.items.map((item) => (
              <li key={item.id} style={{ marginBottom: 8 }}>
                <Link to={`/games/${item.id}`}>{item.name}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <Text type="secondary">暂无同类推荐</Text>
        )}
      </Paragraph>
    </>
  );
}
