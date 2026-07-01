import { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, Popconfirm, message, Tag, Typography } from 'antd';
import { DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import dynamicsApi from '../../api/dynamics';

const { Link } = Typography;

export default function Dynamics() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');

  const fetch = () => {
    setLoading(true);
    dynamicsApi.getDynamics({ page, pageSize: 20, keyword }).then(res => {
      if (res.code === 0) { setList(res.data.list); setTotal(res.data.total); }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page]);

  const onDelete = (id) => {
    dynamicsApi.deleteDynamic(id).then(res => {
      if (res.code === 0) { message.success('已删除'); fetch(); }
      else message.error(res.message);
    });
  };

  const columns = [
    { title: '作者', width: 120, render: (_, r) => (
      <Space>
        <img src={r.userInfo?.avatarUrl || ''} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
        <span>{r.userInfo?.nickName || '-'}</span>
      </Space>
    )},
    { title: '内容', dataIndex: 'content', ellipsis: true, width: 250,
      render: (t) => t ? t.substring(0, 50) : '(无文字)' },
    { title: '标题', dataIndex: 'title', width: 120, ellipsis: true },
    { title: '类型', dataIndex: 'displayType', width: 80,
      render: (v) => ({ large: '大图', grid9: '九宫格', text: '纯文字', video: '视频' }[v] || v) },
    { title: '评论', dataIndex: 'commentsCount', width: 70 },
    { title: '点赞', dataIndex: 'likesCount', width: 70 },
    { title: '时间', dataIndex: 'createTime', width: 160,
      render: (v) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    {
      title: '操作', width: 120, render: (_, r) => (
        <Space>
          <Popconfirm title="确定删除该动态及其评论?" onConfirm={() => onDelete(r._id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card title="动态管理">
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="输入作者 OpenID 搜索" value={keyword} onChange={e => setKeyword(e.target.value)}
          onPressEnter={() => { setPage(1); fetch(); }} style={{ width: 300 }} />
        <Button type="primary" icon={<SearchOutlined />} onClick={() => { setPage(1); fetch(); }}>搜索</Button>
      </Space>
      <Table rowKey="_id" columns={columns} dataSource={list} loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => setPage(p) }} scroll={{ x: 1000 }} />
    </Card>
  );
}
