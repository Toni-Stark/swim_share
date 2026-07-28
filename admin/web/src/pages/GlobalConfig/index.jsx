import { useState, useEffect } from 'react';
import { Card, Switch, Typography, Row, Col, List, Avatar, Tag, Popconfirm, Button, Space, Empty } from 'antd';
import { SettingOutlined, TeamOutlined, UserDeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import configApi from '../../api/config';
import usersApi from '../../api/users';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function GlobalConfig() {
  const [youLongShow, setYouLongShow] = useState(1);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetch = () => {
    setLoading(true);
    Promise.all([
      configApi.getConfigs(),
      usersApi.getUsers({ pageSize: 500 })
    ]).then(([confRes, userRes]) => {
      if (confRes.code === 0) {
        confRes.data.forEach(c => {
          if (c._id === 'youLongShow' || c.key === 'youLongShow') {
            setYouLongShow(Number(c.value) || 0);
          }
        });
      }
      if (userRes.code === 0) {
        const adminList = (userRes.data.list || []).filter(u => u.role === 'admin');
        setAdmins(adminList);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const toggleYouLong = (checked) => {
    const val = checked ? 1 : 0;
    setYouLongShow(val);
    configApi.updateConfig('youLongShow', val).then(res => {
      if (res.code !== 0) setYouLongShow(checked ? 0 : 1);
    });
  };

  const removeAdmin = (openid) => {
    usersApi.updateUser(openid, { role: 'user' }).then(res => {
      if (res.code === 0) fetch();
    });
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>全局配置</Title>

      <Row gutter={[16, 16]}>
        {/* youLongShow 开关 */}
        <Col xs={24} md={8}>
          <Card
            loading={loading}
            style={{
              borderRadius: 12,
              borderTop: '3px solid #1677ff'
            }}
          >
            <Space align="start" size={16}>
              <SettingOutlined style={{ fontSize: 32, color: '#1677ff' }} />
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 16 }}>游龙功能开关</Text>
                <div style={{ marginTop: 8 }}>
                  <Switch
                    checked={youLongShow === 1}
                    onChange={toggleYouLong}
                    style={{ marginBottom: 8 }}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  控制小程序端游龙功能（信息流、发布动态等）的全局显隐。
                  关闭后用户将看到「功能暂未开放」。
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            loading={loading}
            style={{
              borderRadius: 12,
              borderTop: '3px solid #52c41a'
            }}
          >
            <Space align="start" size={16}>
              <TeamOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 16 }}>管理员列表</Text>
                <div style={{ marginTop: 12 }}>
                  <Tag color="green" style={{ fontSize: 13, marginBottom: 8 }}>{admins.length} 位管理员</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  管理员可以发布赛事、审核报名。
                  前往「用户管理」页变更用户角色。
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            loading={loading}
            style={{
              borderRadius: 12,
              borderTop: '3px solid #722ed1',
              background: 'linear-gradient(180deg, #f9f0ff 0%, #fff 100%)'
            }}
          >
            <Space align="start" size={16}>
              <div style={{ fontSize: 32 }}>🏊</div>
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 16 }}>钻石段位</Text>
                <div style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 13, color: '#666' }}>
                    全历史最佳配速 ≤ 80s/100m 或当月毅力之星自动判定。
                    可在「段位分析」页查看分布。
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 管理员列表 */}
      <Card
        title={<Space><TeamOutlined />管理员用户</Space>}
        extra={<Button icon={<ReloadOutlined />} onClick={fetch} size="small">刷新</Button>}
        style={{ marginTop: 16, borderRadius: 12 }}
        loading={loading}
      >
        {admins.length > 0 ? (
          <List
            dataSource={admins}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="edit"
                    size="small"
                    onClick={() => navigate('/users')}
                  >
                    前往编辑
                  </Button>,
                  <Popconfirm
                    key="remove"
                    title="确定移除此用户的管理员角色？"
                    onConfirm={() => removeAdmin(item._openid)}
                  >
                    <Button size="small" danger icon={<UserDeleteOutlined />}>移除</Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar src={item.avatarUrl || 'https://lovebeyonddays.com/common/default-avatar.png'} size={40} />
                  }
                  title={item.nickName || '未知用户'}
                  description={item._openid}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无管理员，请在用户管理页设置" />
        )}
      </Card>
    </div>
  );
}
