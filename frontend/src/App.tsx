import { Layout, Menu, Typography } from 'antd';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppstoreOutlined, BarChartOutlined, HistoryOutlined, StarOutlined, UnorderedListOutlined, ThunderboltOutlined } from '@ant-design/icons';

import CategoryList from './pages/CategoryList';
import FavoriteList from './pages/FavoriteList';
import GameCompare from './pages/GameCompare';
import GameDetail from './pages/GameDetail';
import GameList from './pages/GameList';
import RandomDiscover from './pages/RandomDiscover';
import RecentViewList from './pages/RecentViewList';
import StatsOverview from './pages/StatsOverview';

const { Header, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', label: '棋类列表', icon: <UnorderedListOutlined /> },
  { key: '/random', label: '随机发现', icon: <ThunderboltOutlined /> },
  { key: '/recent-views', label: '最近浏览', icon: <HistoryOutlined /> },
  { key: '/favorites', label: '我的收藏', icon: <StarOutlined /> },
  { key: '/categories', label: '分类管理', icon: <AppstoreOutlined /> },
];

/** 应用根组件 */
export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/stats')) return '';
    if (location.pathname.startsWith('/categories')) return '/categories';
    if (location.pathname.startsWith('/favorites')) return '/favorites';
    if (location.pathname.startsWith('/recent-views')) return '/recent-views';
    if (location.pathname.startsWith('/random')) return '/random';
    return '/';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Title level={3} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
          冷门棋类规则速查
        </Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, minWidth: 0, borderBottom: 'none' }}
        />
        <a
          href="/stats"
          onClick={(e) => {
            e.preventDefault();
            navigate('/stats');
          }}
          style={{ color: '#fff', whiteSpace: 'nowrap' }}
        >
          <BarChartOutlined style={{ marginRight: 4 }} />
          数据统计
        </a>
      </Header>
      <Content style={{ padding: '24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<GameList />} />
          <Route path="/random" element={<RandomDiscover />} />
          <Route path="/recent-views" element={<RecentViewList />} />
          <Route path="/favorites" element={<FavoriteList />} />
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/games/:id" element={<GameDetail />} />
          <Route path="/compare" element={<GameCompare />} />
          <Route path="/stats" element={<StatsOverview />} />
        </Routes>
      </Content>
    </Layout>
  );
}
