import { Layout, Typography } from 'antd';
import { Route, Routes } from 'react-router-dom';

import GameDetail from './pages/GameDetail';
import GameList from './pages/GameList';

const { Header, Content } = Layout;
const { Title } = Typography;

/** 应用根组件 */
export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          冷门棋类规则速查
        </Title>
      </Header>
      <Content style={{ padding: '24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<GameList />} />
          <Route path="/games/:id" element={<GameDetail />} />
        </Routes>
      </Content>
    </Layout>
  );
}
