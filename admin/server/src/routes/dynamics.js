const express = require('express');
const { getDb } = require('../cloudbase');

const router = express.Router();

// 动态列表（分页+搜索）
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const keyword = req.query.keyword || '';

    let filter = { status: 'published' };
    if (keyword) {
      const _ = db.command;
      filter = { status: 'published', _openid: _.eq(keyword) };
    }

    const countRes = await db.collection('user_dynamics').where(filter).count();
    const listRes = await db.collection('user_dynamics').where(filter)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    res.json({
      code: 0,
      data: { list: listRes.data, total: countRes.total, page, pageSize }
    });
  } catch (err) {
    console.error('查询动态失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 动态详情
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const result = await db.collection('user_dynamics').doc(id).get();

    if (!result.data || result.data.length === 0) {
      return res.json({ code: -1, message: '动态不存在' });
    }

    const dynamic = Array.isArray(result.data) ? result.data[0] : result.data;

    const commentsCount = await db.collection('comments')
      .where({ dynamicId: id }).count();

    res.json({
      code: 0,
      data: { ...dynamic, commentsCount: commentsCount.total }
    });
  } catch (err) {
    console.error('查询动态详情失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 删除动态
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const result = await db.collection('user_dynamics').doc(id).get();
    if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
      return res.json({ code: -1, message: '动态不存在' });
    }

    const dynamic = Array.isArray(result.data) ? result.data[0] : result.data;
    const _openid = dynamic._openid;

    // 删除关联评论
    await db.collection('comments').where({ dynamicId: id }).remove();

    // 删除关联点赞
    await db.collection('likes').where({ targetType: 'dynamic', targetId: id }).remove();

    // 删除动态
    await db.collection('user_dynamics').doc(id).remove();

    // 扣减用户动态数
    if (_openid) {
      try {
        await db.collection('users').where({ _openid }).update({
          data: { 'stats.dynamicsCount': db.command.inc(-1) }
        });
      } catch (e) { /* ignore */ }
    }

    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error('删除动态失败:', err);
    res.json({ code: -1, message: '删除失败' });
  }
});

module.exports = router;
