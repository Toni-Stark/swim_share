import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Popconfirm, message, Input } from 'antd';
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import commentsApi from '../../api/comments';

export default function Comments() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [dynamicId, setDynamicId] = useState('');

  const fetch = () => {
    setLoading(true);
    commentsApi.getComments({ page, pageSize: 20, dynamicId }).then(res => {
      if (res.code === 0) { setList(res.data.list); setTotal(res.data.total); }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page]);

  const onDelete = (id) => {
    commentsApi.deleteComment(id).then(res => {
      if (res.code === 0) { message.success('已删除'); fetch(); }
      else message.error(res.message);
    });
  };

  const columns = [
    { title: '评论人', width: 120, render: (_, r) => (
      <Space>
        <img src={r.userInfo?.avatarUrl || ''} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
        <span>{r.userInfo?.nickName || '-'}</span>
      </Space>
    )},
    { title: '内容', dataIndex: 'content', width: 300, ellipsis: true },
    { title: '所属动态', dataIndex: 'dynamicId', width: 200, ellipsis: true },
    { title: '点赞', dataIndex: 'likesCount', width: 70 },
    { title: '时间', dataIndex: 'createTime', width: 160,
      render: (v) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    {
      title: '操作', width: 100, render: (_, r) => (
        <Popconfirm title="确定删除?" onConfirm={() => onDelete(r._id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <Card title="评论管理">
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="按动态ID筛选" value={dynamicId} onChange={e => setDynamicId(e.target.value)}
          onPressEnter={() => { setPage(1); fetch(); }} style={{ width: 300 }} />
        <Button type="primary" icon={<SearchOutlined />} onClick={() => { setPage(1); fetch(); }}>筛选</Button>
      </Space>
      <Table rowKey="_id" columns={columns} dataSource={list} loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => setPage(p) }} scroll={{ x: 1000 }} />
    </Card>
  );
}
