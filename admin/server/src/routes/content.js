const express = require('express');
const { getDb } = require('../cloudbase');

const router = express.Router();

// 广告列表
router.get('/ads', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('ads').orderBy('createTime', 'desc').limit(100).get();
    res.json({ code: 0, data: result.data || [] });
  } catch (err) {
    console.error('查询广告失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 新增广告
router.post('/ads', async (req, res) => {
  try {
    const db = getDb();
    const data = { ...req.body, createTime: new Date() };
    const result = await db.collection('ads').add({ data });
    res.json({ code: 0, message: '创建成功', data: { _id: result.id } });
  } catch (err) {
    console.error('创建广告失败:', err);
    res.json({ code: -1, message: '创建失败' });
  }
});

// 更新广告
router.put('/ads/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const data = { ...req.body };
    delete data._id;
    await db.collection('ads').doc(id).update({ data });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('更新广告失败:', err);
    res.json({ code: -1, message: '更新失败' });
  }
});

// 删除广告
router.delete('/ads/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('ads').doc(req.params.id).remove();
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error('删除广告失败:', err);
    res.json({ code: -1, message: '删除失败' });
  }
});

// 官方内容列表
router.get('/official', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('official_content')
      .orderBy('publishTime', 'desc').limit(100).get();
    res.json({ code: 0, data: result.data || [] });
  } catch (err) {
    console.error('查询官方内容失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 新增官方内容
router.post('/official', async (req, res) => {
  try {
    const db = getDb();
    const data = { ...req.body, publishTime: new Date(), createTime: new Date() };
    const result = await db.collection('official_content').add({ data });
    res.json({ code: 0, message: '创建成功', data: { _id: result.id } });
  } catch (err) {
    console.error('创建官方内容失败:', err);
    res.json({ code: -1, message: '创建失败' });
  }
});

// 更新官方内容
router.put('/official/:id', async (req, res) => {
  try {
    const db = getDb();
    const data = { ...req.body };
    delete data._id;
    await db.collection('official_content').doc(req.params.id).update({ data });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('更新官方内容失败:', err);
    res.json({ code: -1, message: '更新失败' });
  }
});

// 删除官方内容
router.delete('/official/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('official_content').doc(req.params.id).remove();
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error('删除官方内容失败:', err);
    res.json({ code: -1, message: '删除失败' });
  }
});

module.exports = router;
