import { Layout, Menu, Typography } from 'antd';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';

import CategoryList from './pages/CategoryList';
import GameDetail from './pages/GameDetail';
import GameList from './pages/GameList';

const { Header, Content } = Layout;
const { Title } = Typography;

/** 应用根组件 */
export default function App() {
  const location = useLocation();

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/categories')) return '/categories';
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
          style={{ flex: 1, minWidth: 0, borderBottom: 'none' }}
        >
          <Menu.Item key="/" icon={<UnorderedListOutlined />}>
            <Link to="/">棋类列表</Link>
          </Menu.Item>
          <Menu.Item key="/categories" icon={<AppstoreOutlined />}>
            <Link to="/categories">分类管理</Link>
          </Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<GameList />} />
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/games/:id" element={<GameDetail />} />
        </Routes>
      </Content>
    </Layout>
  );
}
