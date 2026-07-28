import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  CommentOutlined,
  TrophyOutlined,
  ScheduleOutlined,
  ControlOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = AntLayout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/dynamics', icon: <FileTextOutlined />, label: '动态管理' },
  { key: '/comments', icon: <CommentOutlined />, label: '评论管理' },
  { key: '/competitions', icon: <TrophyOutlined />, label: '赛事管理' },
  { key: '/checkins', icon: <ScheduleOutlined />, label: '打卡记录' },
  { key: '/content', icon: <ControlOutlined />, label: '内容管理' },
  { key: '/tiers', icon: <TrophyOutlined />, label: '段位分析' },
  { key: '/honors', icon: <TrophyOutlined />, label: '荣誉管理' },
  { key: '/config', icon: <SettingOutlined />, label: '全局配置' }
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const selectedKey = '/' + location.pathname.split('/')[1];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login', { replace: true });
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? '游' : '游龙管理后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{
          padding: '0 24px',
          background: token.colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
