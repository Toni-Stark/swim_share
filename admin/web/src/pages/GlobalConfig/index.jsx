import { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Space, message, Tag } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import configApi from '../../api/config';

export default function GlobalConfig() {
  const [configs, setConfigs] = useState([]);
  const [editingValues, setEditingValues] = useState({});

  const fetch = () => {
    configApi.getConfigs().then(res => {
      if (res.code === 0) {
        setConfigs(res.data);
        const map = {};
        res.data.forEach(c => { map[c._id || c.key] = c.value; });
        setEditingValues(map);
      }
    });
  };

  useEffect(() => { fetch(); }, []);

  const save = (key) => {
    const value = editingValues[key];
    configApi.updateConfig(key, value).then(res => {
      if (res.code === 0) { message.success('已保存'); fetch(); }
      else message.error(res.message);
    });
  };

  const renderValue = (key, val) => {
    if (key === 'youLongShow') {
      return (
        <Tag color={val ? 'green' : 'red'} style={{ cursor: 'pointer' }}
          onClick={() => {
            const nv = val === 1 ? 0 : 1;
            configApi.updateConfig(key, nv).then(res => {
              if (res.code === 0) { message.success('已切换'); fetch(); }
            });
          }}>
          {val === 1 ? '已开启' : '已关闭'}
        </Tag>
      );
    }
    if (typeof val === 'string' && (key === 'adminOpenIds')) {
      return <Input.TextArea value={editingValues[key]} onChange={e => setEditingValues({ ...editingValues, [key]: e.target.value })} rows={3} />;
    }
    return <Input value={editingValues[key] || ''} onChange={e => setEditingValues({ ...editingValues, [key]: e.target.value })} />;
  };

  return (
    <Card title="全局配置" extra={<Button icon={<ReloadOutlined />} onClick={fetch}>刷新</Button>}>
      <Table rowKey="_id" dataSource={configs} pagination={false} columns={[
        { title: '配置键', dataIndex: '_id', width: 200, render: (v, r) => r._id || r.key },
        { title: '当前值', width: 300, render: (_, r) => {
          const key = r._id || r.key;
          const val = r.value;
          if (typeof val === 'boolean' || (key === 'youLongShow' && (val === 1 || val === 0))) {
            const v = val === 1 || val === true;
            return <Tag color={v ? 'green' : 'red'}>{v ? '开启' : '关闭'}</Tag>;
          }
          return <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>;
        }},
        { title: '新值', render: (_, r) => renderValue(r._id || r.key, r.value) },
        {
          title: '操作', width: 100, render: (_, r) => {
            const key = r._id || r.key;
            if (key === 'youLongShow') return null;
            return <Button type="primary" size="small" icon={<SaveOutlined />} onClick={() => save(key)}>保存</Button>;
          }
        }
      ]} />
    </Card>
  );
}
