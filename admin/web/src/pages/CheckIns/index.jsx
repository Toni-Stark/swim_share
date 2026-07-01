import { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Space, DatePicker, Typography, Row, Col, Statistic } from 'antd';
import { SearchOutlined, ScheduleOutlined, TrophyOutlined, EnvironmentOutlined } from '@ant-design/icons';
import checkinsApi from '../../api/checkins';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const STROKE_LABEL = { freestyle: '自由泳', breaststroke: '蛙泳', backstroke: '仰泳', butterfly: '蝶泳' };

export default function CheckIns() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [openid, setOpenid] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [stats, setStats] = useState([]);

  const fetch = ({ p = 1 } = {}) => {
    setLoading(true);
    const params = { page: p, pageSize: 20 };
    if (openid) params.openid = openid;
    if (dateRange && dateRange[0]) params.dateFrom = dateRange[0].format('YYYY-MM-DD');
    if (dateRange && dateRange[1]) params.dateTo = dateRange[1].format('YYYY-MM-DD');
    checkinsApi.getCheckIns(params).then(res => {
      if (res.code === 0) { setList(res.data.list); setTotal(res.data.total); }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page]);

  const onSearch = () => { setPage(1); fetch({ p: 1 }); };

  useEffect(() => {
    checkinsApi.getCheckInStats().then(res => {
      if (res.code === 0) setStats(res.data.slice(-6));
    });
  }, []);

  const columns = [
    { title: '用户', dataIndex: '_openid', width: 200, ellipsis: true },
    { title: '日期', dataIndex: 'date', width: 120 },
    { title: '泳姿', width: 80, render: (_, r) => STROKE_LABEL[r.stroke] || r.stroke || '-' },
    { title: '距离(m)', dataIndex: 'distance', width: 100 },
    { title: '时长(s)', dataIndex: 'duration', width: 100 },
    {
      title: '配速', width: 100, render: (_, r) => {
        if (r.distance > 0 && r.duration > 0) {
          const pace = Math.round((r.duration / (r.distance / 100)) * 10) / 10;
          return `${pace}s/100m`;
        }
        return '-';
      }
    }
  ];

  return (
    <div>
      <Card title="打卡统计" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {stats.map((s, i) => (
            <Col key={i} xs={12} sm={8} lg={4}>
              <Statistic
                title={s.month}
                value={s.distance}
                suffix="m"
                valueStyle={{ fontSize: 16 }}
              />
              <small style={{ color: '#999' }}>活跃 {s.activeDays} 天</small>
            </Col>
          ))}
        </Row>
      </Card>
      <Card title="打卡记录">
        <Space style={{ marginBottom: 16 }} wrap>
          <Input placeholder="OpenID" value={openid} onChange={e => setOpenid(e.target.value)}
            onPressEnter={onSearch} style={{ width: 200 }} />
          <RangePicker
            onChange={(dates) => {
              setDateRange(dates);
            }}
            style={{ width: 240 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>搜索</Button>
        </Space>
        <Table rowKey="_id" columns={columns} dataSource={list} loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: (p) => setPage(p) }} scroll={{ x: 700 }} />
      </Card>
    </div>
  );
}
