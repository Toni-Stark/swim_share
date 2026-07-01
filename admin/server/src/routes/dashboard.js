const express = require('express');
const { getDb } = require('../cloudbase');

const router = express.Router();

// 数据看板概览
router.get('/stats', async (req, res) => {
  try {
    const db = getDb();

    const [usersCount, dynamicsCount, commentsCount, checkInsCount,
      diamondCount, compRegCount] = await Promise.all([
      db.collection('users').count(),
      db.collection('user_dynamics').where({ status: 'published' }).count(),
      db.collection('comments').count(),
      db.collection('check_ins').count(),
      db.collection('users').where({ isDiamond: true }).count(),
      db.collection('competition_registrations').count()
    ]);

    // 今日打卡
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayCheckRes = await db.collection('check_ins').where({
      date: dateStr
    }).count();

    // 今日打卡去重用户数
    const todayUsers = new Set();
    const todayRes = await db.collection('check_ins').where({ date: dateStr }).limit(500).get();
    (todayRes.data || []).forEach(item => todayUsers.add(item._openid));

    res.json({
      code: 0,
      data: {
        totalUsers: usersCount.total,
        totalDynamics: dynamicsCount.total,
        totalComments: commentsCount.total,
        totalCheckIns: checkInsCount.total,
        diamondUsers: diamondCount.total,
        totalRegistrations: compRegCount.total,
        todayCheckIns: todayCheckRes.total,
        todayUsersCount: todayUsers.size
      }
    });
  } catch (err) {
    console.error('查询看板数据失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

module.exports = router;
