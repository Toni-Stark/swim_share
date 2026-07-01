import { useState, useEffect } from 'react';
import { Card, Table, Typography, Row, Col, Statistic, Progress, Tag } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import tierApi from '../../api/tiers';

const { Title } = Typography;

const TIER_COLORS = {
  '王者泳者': '#eb2f96',
  '钻石泳者': '#722ed1',
  '铂金泳者': '#1890ff',
  '黄金泳者': '#faad14',
  '白银泳者': '#bfbfbf',
  '青铜泳者': '#d48806'
};

const STROKE_LABEL = { freestyle: '自由泳', breaststroke: '蛙泳', backstroke: '仰泳', butterfly: '蝶泳' };

export default function TierStats() {
  const [distribution, setDistribution] = useState({});
  const [total, setTotal] = useState(0);
  const [diamondList, setDiamondList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([tierApi.getTierDistribution(), tierApi.getDiamondUsers()]).then(([dRes, diaRes]) => {
      if (dRes.code === 0) {
        setDistribution(dRes.data.distribution);
        setTotal(dRes.data.total);
      }
      if (diaRes.code === 0) setDiamondList(diaRes.data.list);
    }).finally(() => setLoading(false));
  }, []);

  const entries = Object.entries(distribution).sort((a, b) => {
    const order = ['王者泳者', '钻石泳者', '铂金泳者', '黄金泳者', '白银泳者', '青铜泳者', '暂无段位'];
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });

  const diaColumns = [
    { title: '昵称', dataIndex: 'nickName', width: 120 },
    { title: 'OpenID', dataIndex: 'openid', width: 200, ellipsis: true },
    { title: '泳姿', width: 80, render: (_, r) => STROKE_LABEL[r.stroke] || r.stroke },
    { title: '最佳PB', dataIndex: 'bestPB', width: 100, render: (v) => `${v}s/100m` },
    { title: '平均配速', dataIndex: 'avgSpeed', width: 100, render: (v) => `${v}s/100m` },
    { title: '段位', dataIndex: 'tier', width: 100,
      render: (v) => <Tag color={TIER_COLORS[v]}>{v}</Tag> },
    { title: '徽章', dataIndex: 'badge', width: 60 }
  ];

  return (
    <div>
      <Card title="段位分析" loading={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Title level={5}>段位分布（总 {total} 人已打卡）</Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {entries.map(([name, count]) => (
                <div key={name} style={{
                  flex: '1 1 140px',
                  minWidth: 130,
                  padding: '12px 16px',
                  background: '#fafafa',
                  borderRadius: 8,
                  borderLeft: `4px solid ${TIER_COLORS[name] || '#999'}`
                }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: TIER_COLORS[name] }}>{count}</div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{name}</div>
                  <Progress percent={total > 0 ? Math.round(count / total * 100) : 0} showInfo={false} size="small"
                    strokeColor={TIER_COLORS[name]} style={{ marginTop: 4 }} />
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="钻石/王者泳者列表" style={{ marginTop: 16 }} loading={loading}
        extra={<Tag color="purple" icon={<TrophyOutlined />}>共 {diamondList.length} 人</Tag>}>
        <Table rowKey="openid" columns={diaColumns} dataSource={diamondList} scroll={{ x: 800 }} pagination={{ pageSize: 20 }} />
      </Card>
    </div>
  );
}
