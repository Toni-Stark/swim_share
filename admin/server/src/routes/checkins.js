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

module.exports = router;
