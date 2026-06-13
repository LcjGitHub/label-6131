import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Space, Spin, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons';

import { fetchGamesBatch } from '../api/client';
import type { ChessGame } from '../types/game';

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

/** 对比页面 */
export default function GameCompare() {
  const location = useLocation();
  const navigate = useNavigate();
  const [games, setGames] = useState<ChessGame[]>([]);
  const [loading, setLoading] = useState(true);

  const ids = useMemo(() => parseIdsFromQuery(location.search), [location.search]);

  useEffect(() => {
    const load = async () => {
      if (ids.length === 0) {
        message.warning('请选择要对比的棋类');
        navigate('/');
        return;
      }
      if (ids.length > 3) {
        message.warning('最多只能对比3个棋类');
      }
      setLoading(true);
      try {
        const validIds = ids.slice(0, 3);
        const data = await fetchGamesBatch(validIds);
        const validGames = data.filter(
          (g): g is ChessGame => g && typeof (g as ChessGame).name === 'string',
        );
        if (validGames.length === 0) {
          message.error('未找到有效的棋类数据');
          navigate('/');
          return;
        }
        setGames(validGames);
      } catch {
        message.error('加载对比数据失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ids, navigate]);

  const columns: ColumnsType<{ field: string; label: string }> = [
    {
      title: '对比项',
      dataIndex: 'label',
      key: 'label',
      width: 120,
      fixed: 'left',
      render: (text) => <Text strong>{text}</Text>,
    },
    ...games.map<ColumnsType<{ field: string; label: string }>[number]>((game) => ({
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
    { field: 'name', label: '棋类名' },
    { field: 'origin', label: '起源' },
    { field: 'difficulty', label: '难度' },
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
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        共对比 {games.length} 个棋类，横向比较各棋类的关键信息
      </Text>

      <Table
        columns={columns}
        dataSource={rowData}
        pagination={false}
        bordered
        rowKey="field"
        scroll={{ x: 800 }}
      />
    </>
  );
}

/** 根据字段类型渲染对比单元格 */
function renderCell(game: ChessGame, field: string) {
  switch (field) {
    case 'name':
      return <Text strong>{game.name}</Text>;
    case 'origin':
      return <Text>{game.origin}</Text>;
    case 'difficulty':
      return (
        <Tag color={difficultyColor[game.difficulty] ?? 'default'}>{game.difficulty}</Tag>
      );
    case 'summary':
      return (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflow: 'auto' }}>
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
