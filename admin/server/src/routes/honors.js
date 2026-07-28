const express = require('express');
const { getDb } = require('../cloudbase');

const router = express.Router();

// 荣誉定义列表
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('honors').orderBy('sortOrder', 'asc').limit(100).get();
    res.json({ code: 0, data: result.data || [] });
  } catch (err) {
    if (err.message && err.message.includes('not exist')) return res.json({ code: 0, data: [] });
    console.error('查询荣誉失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 新增荣誉
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const data = { ...req.body, createTime: Date.now() };
    const result = await db.collection('honors').add({ data });
    res.json({ code: 0, message: '创建成功', data: { id: result.id } });
  } catch (err) {
    console.error('创建荣誉失败:', err);
    res.json({ code: -1, message: '创建失败: ' + (err.message || String(err)) });
  }
});

// 更新荣誉
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const data = { ...req.body };
    delete data._id;
    await db.collection('honors').doc(req.params.id).update({ data });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('更新荣誉失败:', err);
    res.json({ code: -1, message: '更新失败: ' + (err.message || String(err)) });
  }
});

// 删除荣誉
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('honors').doc(req.params.id).remove();
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error('删除荣誉失败:', err);
    res.json({ code: -1, message: '删除失败' });
  }
});

// 初始化默认段位和荣誉数据
router.post('/seed', async (req, res) => {
  try {
    const db = getDb();

    const defaultHonors = [
      { name: '荣耀王者', icon: '👑', badge: '👑', type: 'tier', level: 'top', criteria: { bestPB: { min: 0, max: 50 } }, description: '100米最佳配速 ≤ 50秒', sortOrder: 1 },
      { name: '王者', icon: '⚡', badge: '⚡', type: 'tier', level: 'top', criteria: { bestPB: { min: 50, max: 60 } }, description: '100米最佳配速 50~60秒', sortOrder: 2 },
      { name: '星耀', icon: '💫', badge: '💫', type: 'tier', level: 'top', criteria: { bestPB: { min: 60, max: 70 } }, description: '100米最佳配速 60~70秒', sortOrder: 3 },
      { name: '钻石', icon: '💎', badge: '💎', type: 'tier', level: 'intermediate', criteria: { bestPB: { min: 70, max: 80 } }, description: '100米最佳配速 70~80秒', sortOrder: 4 },
      { name: '铂金', icon: '🪙', badge: '🪙', type: 'tier', level: 'intermediate', criteria: { bestPB: { min: 80, max: 110 } }, description: '100米最佳配速 80~110秒', sortOrder: 5 },
      { name: '黄金', icon: '🥇', badge: '🥇', type: 'tier', level: 'intermediate', criteria: { bestPB: { min: 110, max: 140 } }, description: '100米最佳配速 110~140秒', sortOrder: 6 },
      { name: '白银', icon: '🥈', badge: '🥈', type: 'tier', level: 'primary', criteria: { bestPB: { min: 140, max: 180 } }, description: '100米最佳配速 140~180秒', sortOrder: 7 },
      { name: '青铜', icon: '🥉', badge: '🥉', type: 'tier', level: 'primary', criteria: { bestPB: { min: 180, max: 999 } }, description: '100米最佳配速 ≥ 180秒', sortOrder: 8 },
      { name: '泳池猛龙', icon: '🐲', badge: '🐲', type: 'distance', level: 'top', criteria: { maxDailyDistance: 5000 }, description: '单日游泳距离 ≥ 5000m', sortOrder: 9 },
      { name: '月泳百公里', icon: '🌊', badge: '🌊', type: 'distance', level: 'top', criteria: { monthDistance: 100000 }, description: '月度累计距离 ≥ 100km', sortOrder: 10 },
      { name: '铁人意志', icon: '💪', badge: '💪', type: 'distance', level: 'intermediate', criteria: { monthDistance: 45000 }, description: '月度累计距离 ≥ 45km', sortOrder: 11 },
      { name: '速度之星', icon: '🚀', badge: '🚀', type: 'speed', level: 'top', criteria: { bestPB: { min: 0, max: 45 } }, description: '100米最佳配速 ≤ 45秒', sortOrder: 12 },
      { name: '全能泳者', icon: '🏅', badge: '🏅', type: 'combo', level: 'intermediate', criteria: { allStrokes: true }, description: '使用全部四种泳姿打卡', sortOrder: 13 },
      { name: '百日坚持', icon: '🔥', badge: '🔥', type: 'endurance', level: 'top', criteria: { totalDays: 100 }, description: '累计打卡 ≥ 100天', sortOrder: 14 },
    ];

    // 先清空再插入
    try { await db.collection('honors').where({}).remove(); } catch (e) {}

    for (const h of defaultHonors) {
      await db.collection('honors').add({ data: h });
    }

    res.json({ code: 0, message: `已初始化 ${defaultHonors.length} 条荣誉`, data: { count: defaultHonors.length } });
  } catch (err) {
    console.error('初始化失败:', err);
    res.json({ code: -1, message: '初始化失败' });
  }
});

// 用户荣誉列表
router.get('/user/:openid', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('user_honors')
      .where({ _openid: req.params.openid })
      .orderBy('approvedAt', 'desc')
      .limit(100)
      .get();
    res.json({ code: 0, data: result.data || [] });
  } catch (err) {
    if (err.message && err.message.includes('not exist')) return res.json({ code: 0, data: [] });
    res.json({ code: -1, message: '查询失败' });
  }
});

// 颁发荣誉
router.post('/user/:openid', async (req, res) => {
  try {
    const db = getDb();
    const { honorId, name, icon, badge, level, process, achievedAt } = req.body;
    if (!honorId || !name) return res.json({ code: -1, message: '请选择荣誉' });
    const result = await db.collection('user_honors').add({
      data: {
        _openid: req.params.openid,
        honorId, name, icon: icon || '🏅', badge: badge || '🏅',
        imageUrl: req.body.imageUrl || '',
        level: level || 'primary',
        process: process || '', achievedAt: achievedAt || '',
        approvedAt: new Date()
      }
    });
    res.json({ code: 0, message: '已颁发', data: { id: result.id } });
  } catch (err) {
    console.error('颁发荣誉失败:', err);
    res.json({ code: -1, message: '颁发失败' });
  }
});

// 撤销荣誉
router.delete('/user/:openid/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('user_honors').doc(req.params.id).remove();
    res.json({ code: 0, message: '已撤销' });
  } catch (err) {
    console.error('撤销荣誉失败:', err);
    res.json({ code: -1, message: '撤销失败' });
  }
});

module.exports = router;
