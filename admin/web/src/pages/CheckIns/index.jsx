import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Avatar, Tag, Space, Empty, Typography, Collapse, Badge } from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined,
  TrophyOutlined, TeamOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import checkinsApi from '../../api/checkins';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const STROKE_EMOJI = { freestyle: '🏊', breaststroke: '🐸', backstroke: '🌊', butterfly: '🦋' };
const STROKE_LABEL = { freestyle: '自由泳', breaststroke: '蛙泳', backstroke: '仰泳', butterfly: '蝶泳' };

function formatPace(dist, dur) {
  if (!dist || !dur) return '-';
  const s = Math.round((dur / (dist / 100)) * 10) / 10;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}'${String(sec).padStart(2, '0')}"`;
}

function formatDuration(sec) {
  if (!sec) return '-';
  const m = Math.floor(sec / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h${m % 60}min`;
  }
  return `${m}min`;
}

export default function CheckIns() {
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    checkinsApi.getDashboard().then(res => {
      if (res.code === 0) setDash(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Card loading />;
  }

  if (!dash) return <Empty description="暂无数据" />;

  const { today, week, month } = dash;

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
              border: 'none',
              borderRadius: 12
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>今日</span>}
              value={today.distance}
              suffix={<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)' }}>m</span>}
              valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 700 }}
            />
            <Space split={<span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                <TeamOutlined /> {(today.userCount || 0)} 人打卡
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                <CalendarOutlined /> {today.date?.slice(5)}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              border: 'none',
              borderRadius: 12
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>本周</span>}
              value={week.distance}
              suffix={<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)' }}>m</span>}
              valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 700 }}
            />
            <Space split={<span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                <TeamOutlined /> {(week.userCount || 0)} 人
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                <ClockCircleOutlined /> {(week.activeDays || 0)} 天活跃
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
              border: 'none',
              borderRadius: 12
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>本月</span>}
              value={month.distance}
              suffix={<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)' }}>m</span>}
              valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 700 }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
              <CalendarOutlined /> 累计活跃 {(month.activeDays || 0)} 天
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 今日打卡详情 */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#1677ff' }} />
            <span>今日打卡</span>
            <Tag color="blue">{today.userCount || 0} 人</Tag>
          </Space>
        }
        style={{ marginBottom: 24, borderRadius: 12 }}
      >
        {today.checkIns && today.checkIns.length > 0 ? (
          <Row gutter={[16, 16]}>
            {today.checkIns.map((item, idx) => (
              <Col key={idx} xs={24} sm={12} lg={8}>
                <div
                  style={{
                    background: '#fafafa',
                    borderRadius: 10,
                    padding: 16,
                    border: '1px solid #f0f0f0',
                    transition: 'box-shadow 0.2s',
                    cursor: 'default'
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <Badge dot={item.stroke ? true : false} color={item.stroke === 'freestyle' ? '#1677ff' : item.stroke === 'breaststroke' ? '#52c41a' : item.stroke === 'butterfly' ? '#faad14' : '#eb2f96'} offset={[-4, 4]}>
                      <Avatar
                        size={44}
                        src={item.avatarUrl || 'https://lovebeyonddays.com/common/default-avatar.png'}
                        style={{ border: '2px solid #e8e8e8' }}
                      />
                    </Badge>
                    <div style={{ marginLeft: 12, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>
                        {item.nickName || item._openid?.slice(-8) || '未知用户'}
                      </div>
                      <Space size={8}>
                        {item.stroke && (
                          <Tag color="blue" style={{ marginRight: 0, fontSize: 12 }}>
                            {STROKE_EMOJI[item.stroke]} {STROKE_LABEL[item.stroke] || item.stroke}
                          </Tag>
                        )}
                        {item.createTime && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(item.createTime).format('HH:mm')}
                          </Text>
                        )}
                      </Space>
                    </div>
                  </div>
                  <Row gutter={8}>
                    <Col span={8}>
                      <Statistic title="距离" value={item.distance} suffix="m" valueStyle={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="时长" value={formatDuration(item.duration)} valueStyle={{ fontSize: 18, fontWeight: 600 }} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="配速" value={item.pace ? item.pace + 's/100m' : '-'}
                        valueStyle={{ fontSize: 16, fontWeight: 600, color: item.pace && item.pace < 120 ? '#52c41a' : '#666' }} />
                    </Col>
                  </Row>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            image={<span style={{ fontSize: 48 }}>🏊</span>}
            description="今天还没有人打卡，去小程序游一游吧"
          />
        )}
      </Card>

      {/* 本周活跃用户 */}
      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: '#52c41a' }} />
            <span>本周活跃泳者</span>
            <Tag color="green">{week.userCount || 0} 人</Tag>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        {week.users && week.users.length > 0 ? (
          <Row gutter={[12, 12]}>
            {week.users.map((u, idx) => (
              <Col key={idx} xs={12} sm={8} md={6} lg={4}>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '16px 8px',
                    borderRadius: 10,
                    background: idx < 3 ? 'linear-gradient(180deg, #f6ffed 0%, #fff 100%)' : '#fff',
                    border: idx < 3 ? '1px solid #b7eb8f' : '1px solid #f0f0f0'
                  }}
                >
                  {idx < 3 && (
                    <div style={{ marginBottom: 4 }}>
                      <Tag color={['gold', 'blue', 'purple'][idx]}>
                        {['🥇', '🥈', '🥉'][idx]} 第{(idx + 1)}名
                      </Tag>
                    </div>
                  )}
                  <Avatar
                    size={56}
                    src={u.avatarUrl || 'https://lovebeyonddays.com/common/default-avatar.png'}
                    style={{ border: '3px solid #e8e8e8', marginBottom: 8 }}
                  />
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {u.nickName || u._openid?.slice(-8) || '未知'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}>
                    {u.totalDistance}<span style={{ fontSize: 12, color: '#999' }}>m</span>
                  </div>
                  <Space size={4} style={{ marginTop: 4 }}>
                    <Tag color="green" style={{ fontSize: 11 }}>
                      打卡 <b>{u.checkCount}</b> 次
                    </Tag>
                    {u.days && u.days.length > 0 && (
                      <Tag style={{ fontSize: 11 }}>{u.days.length} 天</Tag>
                    )}
                  </Space>
                  {u.strokes && u.strokes.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 13, color: '#666' }}>
                      {u.strokes.map(s => STROKE_EMOJI[s]).join(' ')}
                    </div>
                  )}
                  {u.days && u.days.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: 11, color: '#aaa' }}>
                      {u.days.map(d => d.slice(5)).join(' · ')}
                    </div>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="本周暂无打卡记录" />
        )}
      </Card>
    </div>
  );
}
