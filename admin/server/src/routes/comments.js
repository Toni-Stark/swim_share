const express = require('express');
const { getDb } = require('../cloudbase');

const router = express.Router();

// 评论列表（分页）
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const dynamicId = req.query.dynamicId || '';

    let filter = {};
    if (dynamicId) filter.dynamicId = dynamicId;

    const countRes = await db.collection('comments').where(filter).count();
    const listRes = await db.collection('comments').where(filter)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    res.json({
      code: 0,
      data: { list: listRes.data, total: countRes.total, page, pageSize }
    });
  } catch (err) {
    console.error('查询评论失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 删除评论
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const result = await db.collection('comments').doc(id).get();
    if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
      return res.json({ code: -1, message: '评论不存在' });
    }

    const comment = Array.isArray(result.data) ? result.data[0] : result.data;
    const { dynamicId } = comment;

    // 删除关联点赞
    await db.collection('likes').where({ targetType: 'comment', targetId: id }).remove();

    // 删除评论
    await db.collection('comments').doc(id).remove();

    // 扣减动态评论数
    if (dynamicId) {
      try {
        await db.collection('user_dynamics').doc(dynamicId).update({
          data: { commentsCount: db.command.inc(-1) }
        });
      } catch (e) { /* ignore */ }
    }

    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error('删除评论失败:', err);
    res.json({ code: -1, message: '删除失败' });
  }
});

module.exports = router;
