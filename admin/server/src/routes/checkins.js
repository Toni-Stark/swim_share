const express = require('express');
const { getDb } = require('../cloudbase');

const router = express.Router();

// 打卡列表（支持按 openid 和日期范围搜索）
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const { openid, dateFrom, dateTo } = req.query;

    let filter = {};
    if (openid) filter._openid = openid;

    let allRes;
    if (dateFrom || dateTo) {
      const list = await db.collection('check_ins')
        .where(filter)
        .orderBy('date', 'desc')
        .limit(1000)
        .get();
      allRes = (list.data || []).filter(item => {
        const d = typeof item.date === 'string' ? item.date : '';
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
      });
      const total = allRes.length;
      const paged = allRes.slice(skip, skip + pageSize);
      return res.json({ code: 0, data: { list: paged, total, page, pageSize } });
    }

    const countRes = await db.collection('check_ins').where(filter).count();
    const listRes = await db.collection('check_ins').where(filter)
      .orderBy('date', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    res.json({
      code: 0,
      data: { list: listRes.data, total: countRes.total, page, pageSize }
    });
  } catch (err) {
    console.error('查询打卡记录失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 打卡统计（月度汇总）
router.get('/stats', async (req, res) => {
  try {
    const db = getDb();
    const allRes = await db.collection('check_ins').limit(2000).get();
    const records = allRes.data || [];

    const monthMap = {};
    records.forEach(item => {
      let dateKey;
      if (typeof item.date === 'string') dateKey = item.date;
      else if (item.date) {
        const d = new Date(item.date);
        dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      if (!dateKey) return;
      const month = dateKey.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { month, distance: 0, days: new Set() };
      const dist = Number(item.distance) || 0;
      monthMap[month].distance += dist;
      if (dist > 0) monthMap[month].days.add(dateKey);
    });

    res.json({
      code: 0,
      data: Object.values(monthMap).map(m => ({
        month: m.month,
        distance: m.distance,
        activeDays: m.days.size
      })).sort((a, b) => a.month.localeCompare(b.month))
    });
  } catch (err) {
    console.error('查询打卡统计失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 打卡看板（今日/本周/本月 + 用户头像昵称）
router.get('/dashboard', async (req, res) => {
  try {
    const db = getDb();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const today = now.getDate();

    const formatDate = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // 本周起止（周一起始）
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const todayStr = formatDate(year, month, today);
    const weekStartStr = formatDate(weekStart.getFullYear(), weekStart.getMonth() + 1, weekStart.getDate());
    const monthStartStr = formatDate(year, month, 1);

    // 单次查询：取最近 500 条，排序在前端
    const allChecks = await db.collection('check_ins')
      .orderBy('date', 'desc')
      .limit(500)
      .get();

    const allRecords = allChecks.data || [];

    // 今日
    const todayChecks = allRecords.filter(item => {
      const d = typeof item.date === 'string' ? item.date : '';
      return d === todayStr;
    });
    const todayDistance = todayChecks.reduce((sum, c) => sum + (Number(c.distance) || 0), 0);
    const todayUsers = [...new Set(todayChecks.map(c => c._openid))];

    // 本周
    const weekChecks = allRecords.filter(item => {
      const d = typeof item.date === 'string' ? item.date : '';
      return d >= weekStartStr && d <= todayStr;
    });
    const weekDistance = weekChecks.reduce((sum, c) => sum + (Number(c.distance) || 0), 0);
    const weekDays = [...new Set(weekChecks.map(c => c.date))];
    const weekUsers = [...new Set(weekChecks.map(c => c._openid))];

    // 本月
    const monthChecks = allRecords.filter(item => {
      const d = typeof item.date === 'string' ? item.date : '';
      return d >= monthStartStr && d <= todayStr;
    });
    const monthDistance = monthChecks.reduce((sum, c) => sum + (Number(c.distance) || 0), 0);
    const monthDays = [...new Set(monthChecks.map(c => c.date))];

    // 批量查用户信息
    const allOpenids = [...new Set([
      ...todayUsers, ...weekUsers
    ])].filter(Boolean);

    let usersMap = {};
    if (allOpenids.length > 0) {
      const _ = db.command;
      try {
        const usersRes = await db.collection('users')
          .where({ _openid: _.in(allOpenids) })
          .limit(200)
          .get();
        (usersRes.data || []).forEach(u => { usersMap[u._openid] = { nickName: u.nickName || '', avatarUrl: u.avatarUrl || '' }; });
      } catch (e) { /* ignore */ }
    }

    // 组装今日
    const todayDetail = todayChecks.map(c => {
      const u = usersMap[c._openid] || {};
      const dist = Number(c.distance) || 0;
      const dur = Number(c.duration) || 0;
      const pace = dist > 0 && dur > 0 ? Math.round((dur / (dist / 100)) * 10) / 10 : null;
      return {
        _openid: c._openid,
        nickName: u.nickName || '',
        avatarUrl: u.avatarUrl || '',
        distance: dist,
        duration: dur,
        stroke: c.stroke || '',
        pace,
        createTime: c.createTime || c.updateTime
      };
    });

    // 组装本周（按用户聚合）
    const weekUserMap = {};
    weekChecks.forEach(c => {
      const oid = c._openid;
      if (!weekUserMap[oid]) {
        weekUserMap[oid] = {
          _openid: oid,
          nickName: (usersMap[oid] || {}).nickName || '',
          avatarUrl: (usersMap[oid] || {}).avatarUrl || '',
          totalDistance: 0,
          checkCount: 0,
          days: [],
          strokes: []
        };
      }
      const dist = Number(c.distance) || 0;
      weekUserMap[oid].totalDistance += dist;
      weekUserMap[oid].checkCount++;
      if (!weekUserMap[oid].days.includes(c.date)) weekUserMap[oid].days.push(c.date);
      if (c.stroke && !weekUserMap[oid].strokes.includes(c.stroke)) weekUserMap[oid].strokes.push(c.stroke);
    });

    const weekUsersList = Object.values(weekUserMap).sort((a, b) => b.totalDistance - a.totalDistance);

    res.json({
      code: 0,
      data: {
        today: {
          date: todayStr,
          distance: todayDistance,
          userCount: todayUsers.length,
          checkIns: todayDetail
        },
        week: {
          startDate: weekStartStr,
          endDate: todayStr,
          distance: weekDistance,
          activeDays: weekDays.length,
          userCount: weekUsers.length,
          users: weekUsersList
        },
        month: {
          distance: monthDistance,
          activeDays: monthDays.length
        }
      }
    });
  } catch (err) {
    console.error('查询打卡看板失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

module.exports = router;
