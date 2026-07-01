import { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Tag, Space, Modal, Descriptions, message, Switch } from 'antd';
import { SearchOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import usersApi from '../../api/users';

export default function Users() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    usersApi.getUsers({ page, pageSize: 20, keyword }).then(res => {
      if (res.code === 0) { setList(res.data.list); setTotal(res.data.total); }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const onSearch = () => { setPage(1); fetchUsers(); };

  const viewDetail = (record) => {
    usersApi.getUserDetail(record._openid).then(res => {
      if (res.code === 0) { setDetail(res.data); setDetailOpen(true); }
    });
  };

  const openEdit = (record) => {
    setEditUser({ ...record });
    setEditOpen(true);
  };

  const saveEdit = () => {
    usersApi.updateUser(editUser._openid, {
      nickName: editUser.nickName,
      signature: editUser.signature,
      is_show: editUser.is_show,
      isDiamond: editUser.isDiamond
    }).then(res => {
      if (res.code === 0) { message.success('已更新'); setEditOpen(false); fetchUsers(); }
      else message.error(res.message);
    });
  };

  const toggleShow = (record, checked) => {
    usersApi.updateUser(record._openid, { is_show: checked }).then(res => {
      if (res.code === 0) { message.success('已切换'); fetchUsers(); }
    });
  };

  const columns = [
    { title: '头像', width: 70, render: (_, r) => (
      <img src={r.avatarUrl || 'https://lovebeyonddays.com/common/default-avatar.png'}
        style={{ width: 40, height: 40, borderRadius: '50%' }} alt="" />
    )},
    { title: '昵称', dataIndex: 'nickName', width: 120 },
    { title: 'OpenID', dataIndex: '_openid', width: 200, ellipsis: true },
    { title: '签名', dataIndex: 'signature', width: 150, ellipsis: true },
    { title: '钻石段位', width: 100, render: (_, r) => r.isDiamond ? <Tag color="gold">钻石</Tag> : <Tag>普通</Tag> },
    { title: '权限', width: 80, render: (_, r) => <Switch checked={r.is_show !== false} onChange={(v) => toggleShow(r, v)} size="small" /> },
    {
      title: '操作', width: 160, render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r)}>详情</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card title="用户管理">
        <Space style={{ marginBottom: 16 }}>
          <Input placeholder="输入 OpenID 搜索" value={keyword} onChange={e => setKeyword(e.target.value)}
            onPressEnter={onSearch} style={{ width: 300 }} />
          <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>搜索</Button>
        </Space>
        <Table rowKey="_openid" columns={columns} dataSource={list} loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: (p) => setPage(p) }} scroll={{ x: 900 }} />
      </Card>

      <Modal title="用户详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={700}>
        {detail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="头像">
              <img src={detail.user.avatarUrl || 'https://lovebeyonddays.com/common/default-avatar.png'}
                style={{ width: 48, height: 48, borderRadius: '50%' }} alt="" />
            </Descriptions.Item>
            <Descriptions.Item label="昵称">{detail.user.nickName}</Descriptions.Item>
            <Descriptions.Item label="OpenID">{detail.user._openid}</Descriptions.Item>
            <Descriptions.Item label="签名">{detail.user.signature || '-'}</Descriptions.Item>
            <Descriptions.Item label="钻石段位">{detail.user.isDiamond ? '是' : '否'}</Descriptions.Item>
            <Descriptions.Item label="权限">{detail.user.is_show !== false ? '正常' : '受限'}</Descriptions.Item>
            <Descriptions.Item label="动态数">{detail.stats.dynamicsCount}</Descriptions.Item>
            <Descriptions.Item label="评论数">{detail.stats.commentsCount}</Descriptions.Item>
            <Descriptions.Item label="打卡次数">{detail.stats.checkInsCount}</Descriptions.Item>
            <Descriptions.Item label="总距离">{detail.stats.totalDistance}m</Descriptions.Item>
            <Descriptions.Item label="最佳配速">{detail.stats.bestPace ? detail.stats.bestPace + 's/100m' : '-'}</Descriptions.Item>
            <Descriptions.Item label="本月距离">{detail.stats.monthDistance}m</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal title="编辑用户" open={editOpen} onOk={saveEdit} onCancel={() => setEditOpen(false)}>
        {editUser && (
          <div>
            <div style={{ marginBottom: 12 }}><b>昵称</b>: <Input value={editUser.nickName} onChange={e => setEditUser({ ...editUser, nickName: e.target.value })} /></div>
            <div style={{ marginBottom: 12 }}><b>签名</b>: <Input.TextArea value={editUser.signature} onChange={e => setEditUser({ ...editUser, signature: e.target.value })} rows={2} /></div>
            <div style={{ marginBottom: 12 }}><b>权限(is_show)</b>: <Switch checked={editUser.is_show !== false} onChange={v => setEditUser({ ...editUser, is_show: v })} /></div>
            <div style={{ marginBottom: 12 }}><b>钻石段位(isDiamond)</b>: <Switch checked={editUser.isDiamond} onChange={v => setEditUser({ ...editUser, isDiamond: v })} /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
