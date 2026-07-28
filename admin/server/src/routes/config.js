const express = require('express');
const { getDb } = require('../cloudbase');

const router = express.Router();

// 获取所有配置
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('global_config').limit(100).get();
    res.json({ code: 0, data: result.data || [] });
  } catch (err) {
    if (err.message && err.message.includes('not exist')) return res.json({ code: 0, data: [] });
    console.error('查询配置失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 更新/新建配置值（用 doc(key).set() 直接 upsert）
router.put('/:key', async (req, res) => {
  try {
    const db = getDb();
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) return res.json({ code: -1, message: 'value 不能为空' });
    await db.collection('global_config').doc(key).set({ data: { key, value } });
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('更新配置失败:', err);
    res.json({ code: -1, message: '更新失败: ' + (err.message || String(err)) });
  }
});

module.exports = router;
