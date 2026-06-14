import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Descriptions, Input, Spin, Tag, Tooltip, Typography, message } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, LeftOutlined, LinkOutlined, RightOutlined, ScheduleFilled, ScheduleOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

import { fetchGame, fetchGameNeighbors, fetchSimilarGames, addRecentView, fetchNote, saveNote, clearNote, checkLinks, addTodo, removeTodo, fetchTodoIds } from '../api/client';
import type { ChessGame, GameNeighbors, LinkCheckResult, SimilarGamesResponse } from '../types/game';

const { Title, Paragraph, Text } = Typography;

const difficultyColor: Record<string, string> = {
  入门: 'green',
  中等: 'blue',
  较难: 'orange',
  困难: 'red',
};

const { TextArea } = Input;

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<ChessGame | null>(null);
  const [neighbors, setNeighbors] = useState<GameNeighbors | null>(null);
  const [neighborsError, setNeighborsError] = useState(false);
  const [similarGames, setSimilarGames] = useState<SimilarGamesResponse | null>(null);
  const [similarError, setSimilarError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteClearing, setNoteClearing] = useState(false);
  const [linkResults, setLinkResults] = useState<LinkCheckResult[]>([]);
  const [linkChecking, setLinkChecking] = useState(false);
  const [linkCheckError, setLinkCheckError] = useState(false);
  const [isTodo, setIsTodo] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setNeighborsError(false);
      setSimilarError(false);
      setNoteContent('');
      setLinkResults([]);
      setLinkChecking(false);
      setLinkCheckError(false);
      setIsTodo(false);
      try {
        const gameId = Number(id);
        const gameData = await fetchGame(gameId);
        setGame(gameData);
        addRecentView(gameId).catch(() => {});
        try {
          const todoIds = await fetchTodoIds();
          setIsTodo(todoIds.includes(gameId));
        } catch {
          setIsTodo(false);
        }
        try {
          const noteData = await fetchNote(gameId);
          setNoteContent(noteData.content || '');
        } catch {
          setNoteContent('');
        }
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
        if (gameData.links && gameData.links.trim()) {
          setLinkChecking(true);
          try {
            const checkData = await checkLinks(gameId);
            setLinkResults(checkData.results);
          } catch {
            setLinkCheckError(true);
          } finally {
            setLinkChecking(false);
          }
        }
      } catch {
        message.error('加载详情失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const toggleTodo = async () => {
    if (!id) return;
    const gameId = Number(id);
    try {
      if (isTodo) {
        await removeTodo(gameId);
        setIsTodo(false);
        message.success('已移出待学');
      } else {
        await addTodo(gameId);
        setIsTodo(true);
        message.success('已加入待学');
      }
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        message.error(axiosErr.response?.data?.error ?? '操作失败');
      } else {
        message.error('操作失败');
      }
    }
  };

  const handleSaveNote = async () => {
    if (!id) return;
    const gameId = Number(id);
    setNoteSaving(true);
    try {
      await saveNote(gameId, noteContent);
      message.success('备注已保存');
    } catch {
      message.error('保存失败，请稍后重试');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleClearNote = async () => {
    if (!id) return;
    const gameId = Number(id);
    setNoteClearing(true);
    try {
      await clearNote(gameId);
      setNoteContent('');
      message.success('备注已清空');
    } catch {
      message.error('清空失败，请稍后重试');
    } finally {
      setNoteClearing(false);
    }
  };

  const getLinkStatus = (url: string): LinkCheckResult | undefined => {
    return linkResults.find((r) => r.url === url);
  };

  const renderLinkStatusIcon = (url: string) => {
    if (linkChecking) {
      return <Spin size="small" style={{ marginLeft: 6 }} />;
    }
    const result = getLinkStatus(url);
    if (!result) return null;
    if (result.reachable) {
      return (
        <Tooltip title={`可达 (HTTP ${result.status_code})`}>
          <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 6 }} />
        </Tooltip>
      );
    }
    return (
      <Tooltip title={`不可达${result.reason ? `：${result.reason}` : ''}`}>
        <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: 6 }} />
      </Tooltip>
    );
  };

  const renderLinksSection = () => {
    if (!game?.links || !game.links.trim()) {
      return <Text type="secondary">暂无</Text>;
    }

    const urls = game.links.match(/https?:\/\/[^\s,，]+/g) || [game.links.trim()];

    if (linkChecking) {
      return (
        <div>
          {urls.map((url) => (
            <div key={url} style={{ marginBottom: 4, display: 'flex', alignItems: 'center' }}>
              <a href={url} target="_blank" rel="noreferrer">
                <LinkOutlined /> {url}
              </a>
              <Spin size="small" style={{ marginLeft: 6 }} />
            </div>
          ))}
          <Text type="secondary" style={{ fontSize: 12 }}>
            正在检测链接可达性...
          </Text>
        </div>
      );
    }

    if (linkCheckError) {
      return (
        <div>
          {urls.map((url) => (
            <div key={url} style={{ marginBottom: 4 }}>
              <a href={url} target="_blank" rel="noreferrer">
                <LinkOutlined /> {url}
              </a>
              <Tooltip title="检测出错，无法判断链接状态">
                <ExclamationCircleOutlined style={{ color: '#faad14', marginLeft: 6 }} />
              </Tooltip>
            </div>
          ))}
          <Text type="warning" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            链接检测出错，无法判断可达性，但不影响正常访问
          </Text>
        </div>
      );
    }

    const allUnreachable = linkResults.length > 0 && linkResults.every((r) => !r.reachable);

    return (
      <div>
        {urls.map((url) => (
          <div key={url} style={{ marginBottom: 4 }}>
            <a href={url} target="_blank" rel="noreferrer">
              <LinkOutlined /> {url}
            </a>
            {renderLinkStatusIcon(url)}
          </div>
        ))}
        {allUnreachable && (
          <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            所有链接均不可达，可能是目标网站暂时不可用或链接已失效
          </Text>
        )}
      </div>
    );
  };

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

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Title level={2} style={{ margin: 0 }}>{game.name}</Title>
        <Button
          icon={isTodo ? <ScheduleFilled /> : <ScheduleOutlined />}
          onClick={toggleTodo}
          type={isTodo ? 'primary' : 'default'}
        >
          {isTodo ? '已待学' : '加入待学'}
        </Button>
      </div>

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
        <Descriptions.Item label="特色标签">
          {game.tags?.length ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {game.tags.map((tag) => (
                <Tag key={tag.id} color={tag.color || 'geekblue'}>
                  {tag.name}
                </Tag>
              ))}
            </div>
          ) : (
            <Text type="secondary">暂无标签</Text>
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
          {renderLinksSection()}
        </Descriptions.Item>
      </Descriptions>

      <Title level={4}>规则摘要</Title>
      <Paragraph>
        <ReactMarkdown>{game.summary}</ReactMarkdown>
      </Paragraph>

      <Title level={4}>我的备注</Title>
      <Paragraph>
        <TextArea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="在这里添加你的个人笔记..."
          autoSize={{ minRows: 4, maxRows: 12 }}
          style={{ marginBottom: 12 }}
        />
        {!noteContent && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontStyle: 'italic' }}>
            暂无备注，点击上方输入框添加你的个人笔记
          </Text>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            type="primary"
            onClick={handleSaveNote}
            loading={noteSaving}
            disabled={!noteContent.trim()}
          >
            保存
          </Button>
          <Button
            danger
            onClick={handleClearNote}
            loading={noteClearing}
            disabled={!noteContent}
          >
            清空
          </Button>
        </div>
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
