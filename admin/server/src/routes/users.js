const express = require('express');
const { getDb } = require('../cloudbase');

const router = express.Router();

// 用户列表（分页+搜索）
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const keyword = req.query.keyword || '';

    let filter = {};
    if (keyword) {
      const _ = db.command;
      filter._openid = _.eq(keyword);
    }

    const countRes = await db.collection('users').where(filter).count();
    const listRes = await db.collection('users').where(filter)
      .orderBy('registerTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    res.json({
      code: 0,
      data: { list: listRes.data, total: countRes.total, page, pageSize }
    });
  } catch (err) {
    console.error('查询用户失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 用户详情
router.get('/:openid', async (req, res) => {
  try {
    const db = getDb();
    const { openid } = req.params;
    const userRes = await db.collection('users').where({ _openid: openid }).get();

    if (userRes.data.length === 0) {
      return res.json({ code: -1, message: '用户不存在' });
    }

    const dynamicsCount = await db.collection('user_dynamics')
      .where({ _openid: openid }).count();

    const commentsCount = await db.collection('comments')
      .where({ _openid: openid }).count();

    const checkInsCount = await db.collection('check_ins')
      .where({ _openid: openid }).count();

    let totalDistance = 0;
    let bestPace = Infinity;
    let monthDistance = 0;
    const month = new Date().getMonth() + 1;

    const ALL_TIERS = [
      { maxSpeed: 50,  minSpeed: 0,   tier: '荣耀王者', badge: '👑' },
      { maxSpeed: 60,  minSpeed: 50,  tier: '王者',     badge: '⚡' },
      { maxSpeed: 70,  minSpeed: 60,  tier: '星耀',     badge: '💫' },
      { maxSpeed: 80,  minSpeed: 70,  tier: '钻石',     badge: '💎' },
      { maxSpeed: 110, minSpeed: 80,  tier: '铂金',     badge: '🪙' },
      { maxSpeed: 140, minSpeed: 110, tier: '黄金',     badge: '🥇' },
      { maxSpeed: 180, minSpeed: 140, tier: '白银',     badge: '🥈' },
      { maxSpeed: 999, minSpeed: 180, tier: '青铜',     badge: '🥉' },
    ];

    let tierName = '';
    let tierBadge = '';

    try {
      const allChecks = await db.collection('check_ins').where({ _openid: openid }).limit(1000).get();
      allChecks.data.forEach(item => {
        const dist = Number(item.distance) || 0;
        const dur = Number(item.duration) || 0;
        if (dist > 0) totalDistance += dist;
        if (dist > 0 && dur > 0) {
          const pace = dur / (dist / 100);
          if (pace < bestPace) bestPace = pace;
        }
        let itemMonth;
        const dateVal = item.date;
        if (typeof dateVal === 'string') {
          itemMonth = parseInt(dateVal.split('-')[1], 10);
        } else if (dateVal) {
          itemMonth = new Date(dateVal).getMonth() + 1;
        }
        if (itemMonth === month && dist > 0) monthDistance += dist;
      });
    } catch (e) { /* ignore */ }

    if (bestPace < Infinity && bestPace > 0) {
      const t = ALL_TIERS.find(t => bestPace >= t.minSpeed && bestPace <= t.maxSpeed);
      if (t) { tierName = t.tier; tierBadge = t.badge; }
    }

    res.json({
      code: 0,
      data: {
        user: userRes.data[0],
        stats: {
          dynamicsCount: dynamicsCount.total,
          commentsCount: commentsCount.total,
          checkInsCount: checkInsCount.total,
          totalDistance,
          bestPace: bestPace < Infinity ? Math.round(bestPace * 10) / 10 : null,
          monthDistance,
          tierName,
          tierBadge
        }
      }
    });
  } catch (err) {
    console.error('查询用户详情失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 更新用户信息
router.put('/:openid', async (req, res) => {
  try {
    const db = getDb();
    const { openid } = req.params;
    const { nickName, signature, is_show, isDiamond, role } = req.body;

    const updateData = {};
    if (nickName !== undefined) updateData.nickName = nickName;
    if (signature !== undefined) updateData.signature = signature;
    if (is_show !== undefined) updateData.is_show = is_show;
    if (isDiamond !== undefined) updateData.isDiamond = isDiamond;
    if (role !== undefined) updateData.role = role;

    await db.collection('users').where({ _openid: openid }).update({ data: updateData });

    // 如果改了角色，同步 adminOpenIds
    if (role !== undefined) {
      await syncAdminOpenIds();
    }

    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('更新用户失败:', err);
    res.json({ code: -1, message: '更新失败' });
  }
});

async function syncAdminOpenIds() {
  try {
    const db = getDb();
    const allAdmins = await db.collection('users').where({ role: 'admin' }).limit(500).get();
    const openids = (allAdmins.data || []).map(u => u._openid).filter(Boolean);
    // 更新 global_config 中 adminOpenIds 的值
    try {
      await db.collection('global_config').doc('adminOpenIds').update({ data: { value: openids } });
    } catch {
      // 如果 doc 不存在则新增
      await db.collection('global_config').add({ data: { _id: 'adminOpenIds', key: 'adminOpenIds', value: openids } });
    }
  } catch (e) {
    console.warn('同步 adminOpenIds 失败:', e);
  }
}

// 删除用户及其动态和打卡记录
router.delete('/:openid', async (req, res) => {
  try {
    const db = getDb();
    const { openid } = req.params;

    const userRes = await db.collection('users').where({ _openid: openid }).count();
    if (userRes.total === 0) {
      return res.json({ code: -1, message: '用户不存在' });
    }

    await db.collection('check_ins').where({ _openid: openid }).remove();
    await db.collection('user_dynamics').where({ _openid: openid }).remove();
    await db.collection('users').where({ _openid: openid }).remove();

    res.json({ code: 0, message: '已删除' });
  } catch (err) {
    console.error('删除用户失败:', err);
    res.json({ code: -1, message: '删除失败' });
  }
});

module.exports = router;
