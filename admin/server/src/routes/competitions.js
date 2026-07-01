const express = require('express');
const { getDb } = require('../cloudbase');

const router = express.Router();

// 赛事列表
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;

    const countRes = await db.collection('swim_competitions').count();
    const listRes = await db.collection('swim_competitions')
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    res.json({
      code: 0,
      data: { list: listRes.data, total: countRes.total, page, pageSize }
    });
  } catch (err) {
    console.error('查询赛事失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 新增赛事
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const data = {
      ...req.body,
      registrantCount: 0,
      createTime: Date.now(),
      updateTime: Date.now()
    };
    const result = await db.collection('swim_competitions').add({ data });
    res.json({ code: 0, message: '创建成功', data: { _id: result.id } });
  } catch (err) {
    console.error('创建赛事失败:', err);
    res.json({ code: -1, message: '创建失败' });
  }
});

// 更新赛事
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const data = { ...req.body, updateTime: Date.now() };
    delete data._id;
    await db.collection('swim_competitions').doc(id).update({ data });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('更新赛事失败:', err);
    res.json({ code: -1, message: '更新失败' });
  }
});

// 删除赛事
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    await db.collection('swim_competitions').doc(id).remove();
    await db.collection('competition_registrations').where({ competitionId: id }).remove();
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error('删除赛事失败:', err);
    res.json({ code: -1, message: '删除失败' });
  }
});

// 赛事报名列表
router.get('/:id/registrations', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const result = await db.collection('competition_registrations')
      .where({ competitionId: id })
      .orderBy('createTime', 'desc')
      .limit(200)
      .get();
    res.json({ code: 0, data: result.data || [] });
  } catch (err) {
    console.error('查询报名失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 审核报名
router.put('/:competitionId/registrations/:regId', async (req, res) => {
  try {
    const db = getDb();
    const { competitionId, regId } = req.params;
    const { status } = req.body;

    if (status === 'approved') {
      await db.collection('competition_registrations').where({ _id: regId }).update({
        data: { status, reviewTime: Date.now(), updateTime: Date.now() }
      });
      await db.collection('swim_competitions').doc(competitionId).update({
        data: { registrantCount: db.command.inc(1) }
      });
    } else if (status === 'rejected') {
      await db.collection('competition_registrations').where({ _id: regId }).update({
        data: { status, reviewTime: Date.now(), updateTime: Date.now() }
      });
    } else {
      return res.json({ code: -1, message: '无效的审核状态' });
    }

    res.json({ code: 0, message: '审核完成' });
  } catch (err) {
    console.error('审核报名失败:', err);
    res.json({ code: -1, message: '审核失败' });
  }
});

module.exports = router;
