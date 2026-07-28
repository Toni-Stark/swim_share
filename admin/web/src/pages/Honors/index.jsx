import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, InputNumber, Space, Popconfirm, message, Tag, Upload, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, SettingOutlined, EyeOutlined } from '@ant-design/icons';
import honorsApi from '../../api/honors';
import uploadApi from '../../api/upload';
import configApi from '../../api/config';

const TYPE_OPTIONS = [
  { label: '段位', value: 'tier' },
  { label: '泳速', value: 'speed' },
  { label: '距离', value: 'distance' },
  { label: '毅力', value: 'endurance' },
  { label: '全能', value: 'combo' }
];

const LEVEL_OPTIONS = [
  { label: '顶级', value: 'top' },
  { label: '中级', value: 'intermediate' },
  { label: '初级', value: 'primary' }
];

const LEVEL_COLORS = { top: 'red', intermediate: 'blue', primary: 'gold' };

export default function Honors() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [form] = Form.useForm();

  // 徽章外壳设置（三级独立）
  const [shellSettingOpen, setShellSettingOpen] = useState(false);
  const [shellPrimary, setShellPrimary] = useState('');
  const [shellIntermediate, setShellIntermediate] = useState('');
  const [shellTop, setShellTop] = useState('');
  const [shellUploading, setShellUploading] = useState('');
  const [wallPreviewOpen, setWallPreviewOpen] = useState(false);

  useEffect(() => {
    configApi.getConfigs().then(res => {
      if (res.code === 0) {
        res.data.forEach(c => {
          if (c.key === 'badgeShell_primary') setShellPrimary(c.value || '');
          else if (c.key === 'badgeShell_intermediate') setShellIntermediate(c.value || '');
          else if (c.key === 'badgeShell_top') setShellTop(c.value || '');
        });
      }
    });
  }, []);

  const fetch = () => {
    setLoading(true);
    honorsApi.getHonors().then(res => {
      if (res.code === 0) setList(res.data);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditItem(null); form.resetFields(); setPreviewImage(''); setModalOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    form.setFieldsValue(item);
    setPreviewImage(item.imageUrl || '');
    setModalOpen(true);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await uploadApi.uploadFile(file);
      if (res.code === 0) {
        form.setFieldsValue({ imageUrl: res.data.url });
        setPreviewImage(res.data.url);
        message.success('上传成功');
      } else message.error(res.message);
    } catch { message.error('上传失败'); }
    finally { setUploading(false); }
    return false;
  };

  const handleShellUpload = (level) => async (file) => {
    setShellUploading(level);
    try {
      const res = await uploadApi.uploadFile(file);
      if (res.code === 0) {
        const key = `badgeShell_${level}`;
        const setters = { primary: setShellPrimary, intermediate: setShellIntermediate, top: setShellTop };
        setters[level](res.data.url);
        configApi.updateConfig(key, res.data.url).then(r => {
          if (r.code === 0) message.success(`${LEVEL_OPTIONS.find(l => l.value === level)?.label}外壳已更新`);
          else message.error(r.message || '保存失败');
        });
      } else message.error(res.message);
    } catch { message.error('上传失败'); }
    finally { setShellUploading(''); }
    return false;
  };

  const onSave = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      imageUrl: values.imageUrl || editItem?.imageUrl || '',
      criteria: {
        bestPB: values.bestPB_max != null ? { min: values.bestPB_min || 0, max: values.bestPB_max } : undefined,
        maxDailyDistance: values.maxDailyDistance || undefined,
        monthDistance: values.monthDistance || undefined,
        totalDays: values.totalDays || undefined,
        allStrokes: values.allStrokes || undefined
      },
      sortOrder: values.sortOrder || 99
    };
    delete data.bestPB_min; delete data.bestPB_max;
    delete data.maxDailyDistance; delete data.monthDistance; delete data.totalDays; delete data.allStrokes;

    if (editItem) {
      honorsApi.updateHonor(editItem._id, data).then(res => {
        if (res.code === 0) { message.success('已更新'); setModalOpen(false); fetch(); }
      });
    } else {
      honorsApi.createHonor(data).then(res => {
        if (res.code === 0) { message.success('已创建'); setModalOpen(false); fetch(); }
      });
    }
  };

  const onDelete = (id) => {
    honorsApi.deleteHonor(id).then(res => {
      if (res.code === 0) { message.success('已删除'); fetch(); }
    });
  };

  const onSeed = () => {
    honorsApi.seedHonors().then(res => {
      if (res.code === 0) { message.success(res.message); fetch(); }
    });
  };

  const columns = [
    { title: '排序', dataIndex: 'sortOrder', width: 60 },
    {
      title: '勋章', width: 80,
      render: (_, r) => r.imageUrl
        ? <img src={r.imageUrl} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f0f0f0' }} alt="" />
        : <span style={{ fontSize: 24 }}>🏅</span>
    },
    { title: '名称', dataIndex: 'name', width: 110 },
    { title: '类型', dataIndex: 'type', width: 70, render: (v) => <Tag>{v}</Tag> },
    { title: '等级', dataIndex: 'level', width: 70, render: (v) => <Tag color={LEVEL_COLORS[v] || 'default'}>{v === 'top' ? '顶级' : v === 'intermediate' ? '中级' : '初级'}</Tag> },
    { title: '达成条件', dataIndex: 'description', width: 200, ellipsis: true },
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
      <Card
        title="荣誉管理"
        extra={
          <Space>
            <Button icon={<SettingOutlined />} onClick={() => setShellSettingOpen(true)}>徽章外壳设置</Button>
            <Button icon={<EyeOutlined />} onClick={() => setWallPreviewOpen(true)}>荣誉墙预览</Button>
            <Popconfirm title="这将删除所有现有荣誉并恢复默认，确定？" onConfirm={onSeed} okText="确定清空" okType="danger" cancelText="取消">
              <Button danger>初始化默认荣誉</Button>
            </Popconfirm>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增</Button>
          </Space>
        }
      >
        <Table rowKey="_id" columns={columns} dataSource={list} loading={loading} scroll={{ x: 800 }} pagination={false} />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal title={editItem ? '编辑荣誉' : '新增荣誉'} open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)} width={560}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="imageUrl" label="勋章图片">
            <Input placeholder="上传后自动填入" readOnly />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Upload accept="image/*" showUploadList={false} beforeUpload={handleUpload}>
              <Button icon={<UploadOutlined />} loading={uploading}>上传图片到七牛</Button>
            </Upload>
            {previewImage && (
              <img src={previewImage} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', marginTop: 8, border: '3px solid #faad14' }} alt="" />
            )}
          </Form.Item>
          <Space size={12}>
            <Form.Item name="type" label="类型" rules={[{ required: true }]}>
              <Select options={TYPE_OPTIONS} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="level" label="等级" rules={[{ required: true }]} initialValue="primary">
              <Select options={LEVEL_OPTIONS} style={{ width: 160 }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="达成条件" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序序号"><InputNumber min={1} max={999} /></Form.Item>
        </Form>
      </Modal>

      {/* 徽章外壳设置弹窗 */}
      <Modal title="徽章外壳设置" open={shellSettingOpen} onCancel={() => setShellSettingOpen(false)} footer={null} width={720}>
        <p style={{ color: '#666', marginBottom: 16, textAlign: 'center' }}>
          为不同等级荣誉设置独立的徽章外壳。小程序中点击奖牌可翻面查看详情。
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          {[
            { level: 'primary', label: '初级', color: '#52c41a', shell: shellPrimary, setter: setShellPrimary },
            { level: 'intermediate', label: '中级', color: '#1890ff', shell: shellIntermediate, setter: setShellIntermediate },
            { level: 'top', label: '顶级', color: '#faad14', shell: shellTop, setter: setShellTop },
          ].map(card => (
            <div key={card.level} style={{
              flex: 1, textAlign: 'center', padding: 16, borderRadius: 12,
              border: `2px solid ${card.color}20`, background: `${card.color}08`
            }}>
              <div style={{ fontWeight: 'bold', fontSize: 14, color: card.color, marginBottom: 12 }}>
                {card.label}外壳
              </div>
              {card.shell ? (
                <img src={card.shell} style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 12 }} alt="" />
              ) : (
                <div style={{
                  width: 120, height: 120, margin: '0 auto 12px', borderRadius: 8,
                  border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 12
                }}>未设置</div>
              )}
              <Upload accept="image/*" showUploadList={false} beforeUpload={handleShellUpload(card.level)}>
                <Button size="small" icon={<UploadOutlined />} loading={shellUploading === card.level}>
                  {card.shell ? '更换' : '上传'}
                </Button>
              </Upload>
            </div>
          ))}
        </div>
      </Modal>

      {/* 荣誉墙预览 */}
      <Modal title="荣誉墙预览" open={wallPreviewOpen} onCancel={() => setWallPreviewOpen(false)} footer={null} width={800}>
        <p style={{ color: '#666', marginBottom: 16, textAlign: 'center', fontSize: 13 }}>
          预览外壳+勋章在荣誉墙上的实际效果 · 一行三个
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxHeight: 500, overflowY: 'auto', padding: 8 }}>
          {list.map(honor => {
            const shellKey = `badgeShell_${honor.level || 'primary'}`;
            const shell = honor.level === 'top' ? shellTop : honor.level === 'intermediate' ? shellIntermediate : shellPrimary;
            return (
              <div key={honor._id} style={{
                width: 220, height: 260, position: 'relative', borderRadius: 16,
                boxShadow: 'inset 0 0 60px rgba(0,0,0,.3), 0 6px 20px rgba(0,0,0,.2)',
                background: honor.level === 'top'
                  ? 'linear-gradient(145deg, #36070d 0%, #4c0b14 30%, #2c050a 60%, #4c0b14 100%)'
                  : honor.level === 'intermediate'
                  ? 'linear-gradient(145deg, #0d3358 0%, #144c82 30%, #0b2845 60%, #144c82 100%)'
                  : 'linear-gradient(145deg, #c4a15e 0%, #e4c17e 30%, #b8934e 60%, #e4c17e 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {shell && (
                  <img src={shell} style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    objectFit: 'cover', opacity: 0.88, borderRadius: 14, zIndex: 0
                  }} alt="" />
                )}
                {honor.imageUrl ? (
                  <img src={honor.imageUrl} style={{
                    width: 150, height: 150, borderRadius: '50%', objectFit: 'cover', zIndex: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,.4), inset 0 0 0 4px rgba(255,255,255,.15), 0 0 0 2px rgba(255,215,0,.4)'
                  }} alt="" />
                ) : (
                  <span style={{ fontSize: 56, zIndex: 2 }}>🏅</span>
                )}
              </div>
            );
          })}
          {list.length === 0 && <div style={{ color: '#999', padding: 40 }}>暂无荣誉，请先新增</div>}
        </div>
      </Modal>
    </div>
  );
}
