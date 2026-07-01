import { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import contentApi from '../../api/content';

export default function Content() {
  return (
    <Card title="内容管理">
      <Tabs items={[
        { key: 'ads', label: '广告管理', children: <AdsTab /> },
        { key: 'official', label: '官方内容', children: <OfficialTab /> }
      ]} />
    </Card>
  );
}

function AdsTab() {
  const [list, setList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    contentApi.getAds().then(res => { if (res.code === 0) setList(res.data); });
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditItem(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); form.setFieldsValue(item); setModalOpen(true); };

  const onSave = async () => {
    const values = await form.validateFields();
    if (editItem) {
      contentApi.updateAd(editItem._id, values).then(res => {
        if (res.code === 0) { message.success('已更新'); setModalOpen(false); fetch(); }
      });
    } else {
      contentApi.createAd(values).then(res => {
        if (res.code === 0) { message.success('已创建'); setModalOpen(false); fetch(); }
      });
    }
  };

  const onDelete = (id) => {
    contentApi.deleteAd(id).then(res => { if (res.code === 0) { message.success('已删除'); fetch(); } });
  };

  const columns = [
    { title: '标题', dataIndex: 'title', width: 200 },
    { title: '类型', dataIndex: 'cardType', width: 100, render: (v) => <Tag>{v}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80,
      render: (v) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag> },
    { title: '优先级', dataIndex: 'priority', width: 80 },
    { title: '联系方式', width: 150, render: (_, r) => `${r.contactType}: ${r.contactInfo}` },
    {
      title: '操作', width: 180, render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => onDelete(r._id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>新增广告</Button>
      <Table rowKey="_id" columns={columns} dataSource={list} scroll={{ x: 800 }} pagination={false} />
      <Modal title={editItem ? '编辑广告' : '新增广告'} open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="coverUrl" label="封面图 URL"><Input /></Form.Item>
          <Form.Item name="cardType" label="类型" initialValue="ad">
            <Select options={[{ label: '广告', value: 'ad' }, { label: '赛事', value: 'competition' }]} />
          </Form.Item>
          <Form.Item name="contactType" label="联系方式类型" initialValue="wechat">
            <Select options={[{ label: '微信', value: 'wechat' }, { label: '电话', value: 'phone' }]} />
          </Form.Item>
          <Form.Item name="contactInfo" label="联系方式"><Input /></Form.Item>
          <Form.Item name="priority" label="优先级" initialValue={1}><Input type="number" /></Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select options={[{ label: '启用', value: 'active' }, { label: '禁用', value: 'inactive' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function OfficialTab() {
  const [list, setList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    contentApi.getOfficial().then(res => { if (res.code === 0) setList(res.data); });
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditItem(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); form.setFieldsValue(item); setModalOpen(true); };

  const onSave = async () => {
    const values = await form.validateFields();
    if (editItem) {
      contentApi.updateOfficial(editItem._id, values).then(res => {
        if (res.code === 0) { message.success('已更新'); setModalOpen(false); fetch(); }
      });
    } else {
      contentApi.createOfficial(values).then(res => {
        if (res.code === 0) { message.success('已创建'); setModalOpen(false); fetch(); }
      });
    }
  };

  const onDelete = (id) => {
    contentApi.deleteOfficial(id).then(res => { if (res.code === 0) { message.success('已删除'); fetch(); } });
  };

  const columns = [
    { title: '标题', dataIndex: 'title', width: 200 },
    { title: '类型', dataIndex: 'type', width: 100, render: (v) => <Tag>{v}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80,
      render: (v) => <Tag color={v === 'published' ? 'green' : 'default'}>{v}</Tag> },
    { title: '优先级', dataIndex: 'priority', width: 80 },
    { title: '发布时间', dataIndex: 'publishTime', width: 160,
      render: (v) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    {
      title: '操作', width: 180, render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => onDelete(r._id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>新增官方内容</Button>
      <Table rowKey="_id" columns={columns} dataSource={list} scroll={{ x: 800 }} pagination={false} />
      <Modal title={editItem ? '编辑官方内容' : '新增官方内容'} open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="content" label="内容"><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="coverUrl" label="封面图 URL"><Input /></Form.Item>
          <Form.Item name="type" label="类型" initialValue="announcement"><Input /></Form.Item>
          <Form.Item name="priority" label="优先级" initialValue={1}><Input type="number" /></Form.Item>
          <Form.Item name="status" label="状态" initialValue="published">
            <Select options={[{ label: '已发布', value: 'published' }, { label: '草稿', value: 'draft' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
