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
          monthDistance
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
    const { nickName, signature, is_show, isDiamond } = req.body;

    const updateData = {};
    if (nickName !== undefined) updateData.nickName = nickName;
    if (signature !== undefined) updateData.signature = signature;
    if (is_show !== undefined) updateData.is_show = is_show;
    if (isDiamond !== undefined) updateData.isDiamond = isDiamond;

    await db.collection('users').where({ _openid: openid }).update({ data: updateData });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('更新用户失败:', err);
    res.json({ code: -1, message: '更新失败' });
  }
});

module.exports = router;
