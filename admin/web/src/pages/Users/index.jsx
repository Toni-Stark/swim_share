import { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Tag, Space, Modal, Descriptions, message, Popconfirm, Select, Form } from 'antd';
import { SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, TrophyOutlined, PlusOutlined } from '@ant-design/icons';
import usersApi from '../../api/users';
import honorsApi from '../../api/honors';

const TIER_COLORS = {
  '荣耀王者': 'magenta', '王者': 'red', '星耀': 'purple', '钻石': 'blue',
  '铂金': 'cyan', '黄金': 'gold', '白银': 'default', '青铜': 'orange'
};

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
  const [userHonors, setUserHonors] = useState([]);
  const [allHonors, setAllHonors] = useState([]);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantHonor, setGrantHonor] = useState(null);
  const [grantProcess, setGrantProcess] = useState('');
  const [grantDate, setGrantDate] = useState('');
  const [editForm] = Form.useForm();

  const fetchUsers = () => {
    setLoading(true);
    usersApi.getUsers({ page, pageSize: 20, keyword }).then(res => {
      if (res.code === 0) { setList(res.data.list); setTotal(res.data.total); }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const onSearch = () => { setPage(1); fetchUsers(); };

  const viewDetail = (record) => {
    Promise.all([
      usersApi.getUserDetail(record._openid),
      honorsApi.getUserHonors(record._openid),
      honorsApi.getHonors()
    ]).then(([userRes, honorRes, allHonorRes]) => {
      if (userRes.code === 0) setDetail(userRes.data);
      if (honorRes.code === 0) setUserHonors(honorRes.data);
      if (allHonorRes.code === 0) setAllHonors(allHonorRes.data.filter(h => !honorRes.data?.find(uh => uh.honorId === h._id)));
      setDetailOpen(true);
    });
  };

  const openEdit = (record) => {
    setEditUser(record);
    editForm.setFieldsValue({
      nickName: record.nickName,
      signature: record.signature,
      role: record.role || 'user'
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const values = await editForm.validateFields();
    usersApi.updateUser(editUser._openid, {
      nickName: values.nickName,
      signature: values.signature,
      role: values.role
    }).then(res => {
      if (res.code === 0) { message.success('已更新'); setEditOpen(false); fetchUsers(); }
      else message.error(res.message);
    });
  };

  const onDelete = (record) => {
    usersApi.deleteUser(record._openid).then(res => {
      if (res.code === 0) { message.success('已删除账号、全部动态和游泳记录'); fetchUsers(); }
      else message.error(res.message);
    });
  };

  const doGrantHonor = () => {
    if (!grantHonor || !detail) return;
    honorsApi.grantHonor(detail.user._openid, {
      honorId: grantHonor._id,
      name: grantHonor.name,
      icon: grantHonor.icon,
      badge: grantHonor.badge,
      imageUrl: grantHonor.imageUrl,
      level: grantHonor.level,
      process: grantProcess,
      achievedAt: grantDate
    }).then(res => {
      if (res.code === 0) { message.success('已颁发'); setGrantOpen(false); setGrantHonor(null); setGrantProcess(''); setGrantDate('');
        honorsApi.getUserHonors(detail.user._openid).then(r => { if (r.code === 0) setUserHonors(r.data); }); }
      else message.error(res.message);
    });
  };

  const doRevokeHonor = (honorId) => {
    if (!detail) return;
    honorsApi.revokeHonor(detail.user._openid, honorId).then(res => {
      if (res.code === 0) { message.success('已撤销');
        setUserHonors(userHonors.filter(h => h._id !== honorId)); }
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
    { title: '游泳段位', width: 120, render: (_, r) => {
      if (r.isDiamond !== undefined) {
        return r.isDiamond ? <Tag color="blue">钻石及以上</Tag> : <Tag>暂无</Tag>;
      }
      return <Tag>暂无</Tag>;
    } },
    { title: '角色', width: 90, render: (_, r) => r.role === 'admin' ? <Tag color="green">管理员</Tag> : <Tag>用户</Tag> },
    {
      title: '操作', width: 200, render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r)}>详情</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除该账号？" description="将删除该用户、其全部动态和游泳记录（评论保留）"
            onConfirm={() => onDelete(r)} okText="确定删除" okType="danger" cancelText="取消">
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
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
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="头像">
                <img src={detail.user.avatarUrl || 'https://lovebeyonddays.com/common/default-avatar.png'}
                  style={{ width: 48, height: 48, borderRadius: '50%' }} alt="" />
              </Descriptions.Item>
              <Descriptions.Item label="昵称">{detail.user.nickName}</Descriptions.Item>
              <Descriptions.Item label="OpenID">{detail.user._openid}</Descriptions.Item>
              <Descriptions.Item label="签名">{detail.user.signature || '-'}</Descriptions.Item>
              <Descriptions.Item label="游泳段位">
                {detail.stats.tierName ? (
                  <Tag color={TIER_COLORS[detail.stats.tierName] || 'blue'}>
                    {detail.stats.tierBadge} {detail.stats.tierName}
                  </Tag>
                ) : <Tag>暂无</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="角色">{detail.user.role === 'admin' ? '管理员' : '用户'}</Descriptions.Item>
              <Descriptions.Item label="动态数">{detail.stats.dynamicsCount}</Descriptions.Item>
              <Descriptions.Item label="评论数">{detail.stats.commentsCount}</Descriptions.Item>
              <Descriptions.Item label="打卡次数">{detail.stats.checkInsCount}</Descriptions.Item>
              <Descriptions.Item label="总距离">{detail.stats.totalDistance}m</Descriptions.Item>
              <Descriptions.Item label="最佳配速">{detail.stats.bestPace ? detail.stats.bestPace + 's/100m' : '-'}</Descriptions.Item>
              <Descriptions.Item label="本月距离">{detail.stats.monthDistance}m</Descriptions.Item>
            </Descriptions>

            <Card title={<Space><TrophyOutlined />已获荣誉</Space>} size="small" style={{ marginTop: 16 }}
              extra={<Button type="primary" size="small" icon={<PlusOutlined />}
                onClick={() => setGrantOpen(true)}>颁发</Button>}>
              {userHonors.length > 0 ? (
                <Table rowKey="_id" dataSource={userHonors} pagination={false} size="small" columns={[
                  { title: '勋章', width: 60, render: (_, r) => r.imageUrl
                    ? <img src={r.imageUrl} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} alt="" />
                    : <span style={{ fontSize: 22 }}>{r.icon || r.badge || '🏅'}</span> },
                  { title: '名称', dataIndex: 'name', width: 100 },
                  { title: '等级', width: 70, render: (_, r) => <Tag color={r.level === 'top' ? 'red' : r.level === 'intermediate' ? 'blue' : 'gold'}>{r.level === 'top' ? '顶级' : r.level === 'intermediate' ? '中级' : '初级'}</Tag> },
                  { title: '过程', dataIndex: 'process', ellipsis: true, width: 150 },
                  { title: '时间', dataIndex: 'achievedAt', width: 100 },
                  { title: '操作', width: 80, render: (_, r) => (
                    <Popconfirm title="撤销该勋章?" onConfirm={() => doRevokeHonor(r._id)}>
                      <Button size="small" danger>撤销</Button>
                    </Popconfirm>
                  )}
                ]} />
              ) : <div style={{ color: '#999', padding: 12, textAlign: 'center' }}>暂无荣誉</div>}
            </Card>
          </div>
        )}
      </Modal>

      <Modal title="编辑用户" open={editOpen} onOk={saveEdit} onCancel={() => setEditOpen(false)}>
        <Form form={editForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="nickName" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="signature" label="签名">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="user">用户</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="颁发荣誉勋章" open={grantOpen} onOk={doGrantHonor} onCancel={() => setGrantOpen(false)} width={500}>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div>
            <b>选择荣誉：</b>
            <Select style={{ width: '100%', marginTop: 8 }} placeholder="选择荣誉"
              options={allHonors.map(h => ({ label: `${h.icon || '🏅'} ${h.name} (${h.level === 'top' ? '顶级' : h.level === 'intermediate' ? '中级' : '初级'})`, value: h._id }))}
              onChange={(v) => { const found = allHonors.find(h => h._id === v); setGrantHonor(found || null); }}
            />
          </div>
          <div>
            <b>获取过程：</b>
            <Input.TextArea value={grantProcess} onChange={e => setGrantProcess(e.target.value)} rows={3}
              placeholder="如：2026年7月全月累计150km" style={{ marginTop: 8 }} />
          </div>
          <div>
            <b>获得时间：</b>
            <Input value={grantDate} onChange={e => setGrantDate(e.target.value)}
              placeholder="如：2026年7月 或 2026-07-01" style={{ marginTop: 8 }} />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
