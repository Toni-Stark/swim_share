import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, DatePicker, Select, Popconfirm, message, Tag, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UnorderedListOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import compApi from '../../api/competitions';
import uploadApi from '../../api/upload';

export default function Competitions() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [regModal, setRegModal] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    compApi.getCompetitions({ pageSize: 100 }).then(res => {
      if (res.code === 0) setList(res.data.list);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditItem(null); form.resetFields(); setPreviewUrl(''); setModalOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    form.setFieldsValue({ ...item, date: dayjs(item.date) });
    setPreviewUrl(item.coverImage || '');
    setModalOpen(true);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await uploadApi.uploadFile(file);
      if (res.code === 0) {
        const url = res.data.url;
        form.setFieldsValue({ coverImage: url });
        setPreviewUrl(url);
        message.success('封面上传成功');
      } else {
        message.error(res.message || '上传失败');
      }
    } catch {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const onSave = async () => {
    const values = await form.validateFields();
    const data = { ...values, date: values.date.format('YYYY-MM-DD') };
    if (editItem) {
      compApi.updateCompetition(editItem._id, data).then(res => {
        if (res.code === 0) { message.success('已更新'); setModalOpen(false); fetch(); }
      });
    } else {
      compApi.createCompetition(data).then(res => {
        if (res.code === 0) { message.success('已创建'); setModalOpen(false); fetch(); }
      });
    }
  };

  const onDelete = (id) => {
    compApi.deleteCompetition(id).then(res => {
      if (res.code === 0) { message.success('已删除'); fetch(); }
    });
  };

  const viewRegs = (id) => {
    compApi.getRegistrations(id).then(res => {
      if (res.code === 0) { setRegistrations(res.data); setRegModal(true); }
    });
  };

  const review = (compId, regId, status) => {
    compApi.reviewRegistration(compId, regId, status).then(res => {
      if (res.code === 0) { message.success('审核完成'); viewRegs(compId); fetch(); }
    });
  };

  const columns = [
    { title: '名称', dataIndex: 'name', width: 200 },
    { title: '封面', width: 80, render: (_, r) => r.coverImage ? (
      <img src={r.coverImage} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} alt="" />
    ) : <span style={{ color: '#ccc' }}>无</span> },
    { title: '日期', dataIndex: 'date', width: 120 },
    { title: '地点', dataIndex: 'location', width: 150, ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (v) => <Tag color={v === 'upcoming' ? 'blue' : 'default'}>{v === 'upcoming' ? '进行中' : '已结束'}</Tag> },
    { title: '报名人数', dataIndex: 'registrantCount', width: 90 },
    {
      title: '操作', width: 240, render: (_, r) => (
        <Space>
          <Button size="small" icon={<UnorderedListOutlined />} onClick={() => viewRegs(r._id)}>报名</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => onDelete(r._id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const regColumns = [
    { title: '昵称', dataIndex: 'nickName', width: 100 },
    { title: '电话', dataIndex: 'phone', width: 130 },
    { title: '段位', width: 100, render: (_, r) => <span>{r.userStats?.tierBadge} {r.userStats?.tierName}</span> },
    { title: '最佳配速', width: 90, render: (_, r) => r.userStats?.bestPB || '-' },
    { title: '状态', dataIndex: 'status', width: 90,
      render: (v) => <Tag color={v === 'approved' ? 'green' : v === 'rejected' ? 'red' : 'orange'}>
        {v === 'approved' ? '已通过' : v === 'rejected' ? '已拒绝' : '待审核'}
      </Tag> },
    { title: '成绩', width: 100, render: (_, r) => r.resultScore ? `${r.resultScore} (${r.resultRank || '-'})` : '-' },
    {
      title: '操作', width: 160, render: (_, r) => r.status === 'pending' ? (
        <Space>
          <Button size="small" type="primary" onClick={() => review(r.competitionId, r._id, 'approved')}>通过</Button>
          <Button size="small" danger onClick={() => review(r.competitionId, r._id, 'rejected')}>拒绝</Button>
        </Space>
      ) : <span>-</span>
    }
  ];

  return (
    <div>
      <Card title="赛事管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增</Button>}>
        <Table rowKey="_id" columns={columns} dataSource={list} loading={loading} scroll={{ x: 900 }} pagination={false} />
      </Card>

      <Modal title={editItem ? '编辑赛事' : '新增赛事'} open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="location" label="地点" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="coverImage" label="封面图">
            <Input placeholder="上传后自动填入" readOnly style={{ marginBottom: 8 }} />
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleUpload}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>选择图片上传</Button>
            </Upload>
            {previewUrl && (
              <img src={previewUrl} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', marginTop: 8, borderRadius: 6 }} alt="preview" />
            )}
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="upcoming">
            <Select options={[{ label: '进行中', value: 'upcoming' }, { label: '已结束', value: 'ended' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="报名列表" open={regModal} onCancel={() => setRegModal(false)} footer={null} width={900}>
        <Table rowKey="_id" columns={regColumns} dataSource={registrations} scroll={{ x: 800 }} pagination={false} />
      </Modal>
    </div>
  );
}
