import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import request from '../../api/request';

const { Title } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const res = await request.post('/auth/login', { password: values.password });

      if (res.code === 0) {
        localStorage.setItem('admin_token', res.data.token);
        message.success('登录成功');
        setTimeout(() => navigate('/', { replace: true }), 300);
      } else {
        message.error(res.message || '密码错误');
      }
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response ? '密码错误或服务异常' : '请求失败 — 请确认后端已启动');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3}>游龙管理后台</Title>
        </div>
        <Form form={form} size="large">
          <Form.Item name="password" rules={[{ required: true, message: '请输入管理员密码' }]}>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="管理员密码"
              onKeyDown={handleKeyDown}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" loading={loading} block onClick={handleLogin}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
