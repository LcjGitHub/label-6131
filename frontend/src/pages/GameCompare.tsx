import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Space, Spin, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons';

import { fetchGamesBatch } from '../api/client';
import type { ChessGame, ChessGameBatchItem, ChessGameError } from '../types/game';

const { Title, Text } = Typography;

const difficultyColor: Record<string, string> = {
  入门: 'green',
  中等: 'blue',
  较难: 'orange',
  困难: 'red',
};

/** 解析 URL 查询参数中的 ids */
function parseIdsFromQuery(search: string): number[] {
  const params = new URLSearchParams(search);
  const raw = params.get('ids') ?? '';
  const idStrs = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const ids: number[] = [];
  for (const s of idStrs) {
    const n = Number(s);
    if (Number.isInteger(n) && n > 0) {
      ids.push(n);
    }
  }
  return ids;
}

/** 判断是否为有效棋类数据 */
function isChessGame(item: ChessGameBatchItem): item is ChessGame {
  return 'name' in item;
}

/** 判断是否为错误条目 */
function isChessGameError(item: ChessGameBatchItem): item is ChessGameError {
  return 'error' in item;
}

/** 对比页面 */
export default function GameCompare() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ChessGameBatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const allIds = useMemo(() => parseIdsFromQuery(location.search), [location.search]);
  const truncatedCount = allIds.length > 3 ? allIds.length - 3 : 0;
  const validIds = useMemo(() => allIds.slice(0, 3), [allIds]);

  useEffect(() => {
    const load = async () => {
      if (allIds.length === 0) {
        message.warning('请选择要对比的棋类');
        setLoading(false);
        navigate('/');
        return;
      }
      setLoading(true);
      try {
        const data = await fetchGamesBatch(validIds);
        setItems(data);
      } catch {
        message.error('加载对比数据失败，正在返回列表...');
        setItems([]);
        setLoading(false);
        setTimeout(() => navigate('/'), 1500);
        return;
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [allIds, validIds, navigate]);

  const validGames = useMemo(
    () => items.filter(isChessGame),
    [items],
  );
  const errorItems = useMemo(
    () => items.filter(isChessGameError),
    [items],
  );

  const columns: ColumnsType<{ field: string; label: string }> = [
    {
      title: '对比项',
      dataIndex: 'label',
      key: 'label',
      width: 120,
      fixed: 'left',
      render: (text) => <Text strong>{text}</Text>,
    },
    ...validGames.map<ColumnsType<{ field: string; label: string }>[number]>((game) => ({
      title: (
        <Link to={`/games/${game.id}`} style={{ fontSize: 14, fontWeight: 600 }}>
          {game.name}
        </Link>
      ),
      key: `game-${game.id}`,
      width: 240,
      render: (_text, _record) => renderCell(game, _record.field),
    })),
  ];

  const rowData = [
    { field: 'origin', label: '起源' },
    { field: 'board_size', label: '棋盘规格' },
    { field: 'difficulty', label: '难度' },
    { field: 'tags', label: '特色标签' },
    { field: 'summary', label: '规则摘要' },
    { field: 'links', label: '相关链接' },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0 }}>
          <Link to="/">返回列表</Link>
        </Button>
      </Space>

      <Title level={2} style={{ marginBottom: 16 }}>
        棋类对比
      </Title>

      <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }} size={12}>
        <Text type="secondary">
          共对比 {validGames.length} 个棋类，横向比较各棋类的关键信息
        </Text>
        {truncatedCount > 0 && (
          <Alert
            type="warning"
            showIcon
            message={`已截断：地址栏共传入 ${allIds.length} 个编号，最多支持同时对比 3 个，已忽略超出的 ${truncatedCount} 个`}
          />
        )}
        {errorItems.length > 0 && (
          <Alert
            type="error"
            showIcon
            message={
              <div>
                以下棋类加载失败：
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  {errorItems.map((err) => (
                    <li key={err.id}>
                      编号 {err.id}：{err.error}
                    </li>
                  ))}
                </ul>
              </div>
            }
          />
        )}
      </Space>

      {validGames.length > 0 ? (
        <Table
          columns={columns}
          dataSource={rowData}
          pagination={false}
          bordered
          rowKey="field"
          scroll={{ x: 800 }}
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          message="没有可对比的有效棋类数据"
          action={
            <Button size="small" onClick={() => navigate('/')}>
              返回列表
            </Button>
          }
        />
      )}
    </>
  );
}

/** 根据字段类型渲染对比单元格 */
function renderCell(game: ChessGame, field: string) {
  switch (field) {
    case 'origin':
      return <Text>{game.origin}</Text>;
    case 'board_size':
      return game.board_size ? (
        <Text>{game.board_size}</Text>
      ) : (
        <Text type="secondary">暂无</Text>
      );
    case 'difficulty':
      return (
        <Tag color={difficultyColor[game.difficulty] ?? 'default'}>{game.difficulty}</Tag>
      );
    case 'tags':
      return game.tags?.length ? (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {game.tags.map((tag) => (
            <Tag key={tag.id} color={tag.color || 'geekblue'}>
              {tag.name}
            </Tag>
          ))}
        </div>
      ) : (
        <Text type="secondary">暂无</Text>
      );
    case 'summary':
      return (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          {game.summary}
        </div>
      );
    case 'links':
      return game.links ? (
        <a href={game.links} target="_blank" rel="noreferrer">
          <LinkOutlined /> 查看链接
        </a>
      ) : (
        <Text type="secondary">暂无</Text>
      );
    default:
      return <Text>-</Text>;
  }
}
