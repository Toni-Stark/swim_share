import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { UserOutlined, FileTextOutlined, CommentOutlined, ScheduleOutlined, TrophyOutlined, FormOutlined } from '@ant-design/icons';
import dashboardApi from '../../api/dashboard';

const { Title } = Typography;

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardApi.getStats().then(res => {
      if (res.code === 0) setStats(res.data);
    });
  }, []);

  const cards = [
    { title: '总用户', value: stats?.totalUsers || 0, icon: <UserOutlined />, color: '#1890ff' },
    { title: '总动态', value: stats?.totalDynamics || 0, icon: <FileTextOutlined />, color: '#52c41a' },
    { title: '总评论', value: stats?.totalComments || 0, icon: <CommentOutlined />, color: '#faad14' },
    { title: '今日打卡', value: stats?.todayCheckIns || 0, icon: <ScheduleOutlined />, color: '#722ed1' },
    { title: '钻石用户', value: stats?.diamondUsers || 0, icon: <TrophyOutlined />, color: '#eb2f96' },
    { title: '报名总数', value: stats?.totalRegistrations || 0, icon: <FormOutlined />, color: '#13c2c2' },
  ];

  return (
    <div>
      <Title level={4}>数据看板</Title>
      <Row gutter={[16, 16]}>
        {cards.map((c, i) => (
          <Col key={i} xs={12} sm={8} lg={4}>
            <Card hoverable>
              <Statistic
                title={c.title}
                value={c.value}
                prefix={c.icon}
                valueStyle={{ color: c.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="系统概况">
            {stats ? (
              <Row gutter={16}>
                <Col span={8}><Statistic title="总打卡记录" value={stats.totalCheckIns} suffix="条" /></Col>
                <Col span={8}><Statistic title="今日打卡用户" value={stats.todayUsersCount} suffix="人" /></Col>
                <Col span={8}><Statistic title="赛事报名" value={stats.totalRegistrations} suffix="人次" /></Col>
              </Row>
            ) : (
              <p>加载中...</p>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
