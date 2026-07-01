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
    console.error('查询配置失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 更新配置值
router.put('/:key', async (req, res) => {
  try {
    const db = getDb();
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.json({ code: -1, message: 'value 不能为空' });
    }

    // 尝试用 doc(id) 更新（key 即 _id）
    try {
      await db.collection('global_config').doc(key).update({ data: { value } });
    } catch {
      // doc 不存在则使用 where 更新
      await db.collection('global_config').where({ key }).update({ data: { value } });
    }

    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('更新配置失败:', err);
    res.json({ code: -1, message: '更新失败' });
  }
});

module.exports = router;
