import { Layout, Menu, Typography } from 'antd';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppstoreOutlined, StarOutlined, UnorderedListOutlined } from '@ant-design/icons';

import CategoryList from './pages/CategoryList';
import FavoriteList from './pages/FavoriteList';
import GameDetail from './pages/GameDetail';
import GameList from './pages/GameList';

const { Header, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', label: '棋类列表', icon: <UnorderedListOutlined /> },
  { key: '/favorites', label: '我的收藏', icon: <StarOutlined /> },
  { key: '/categories', label: '分类管理', icon: <AppstoreOutlined /> },
];

/** 应用根组件 */
export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/categories')) return '/categories';
    if (location.pathname.startsWith('/favorites')) return '/favorites';
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
      </Header>
      <Content style={{ padding: '24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<GameList />} />
          <Route path="/favorites" element={<FavoriteList />} />
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/games/:id" element={<GameDetail />} />
        </Routes>
      </Content>
    </Layout>
  );
}
