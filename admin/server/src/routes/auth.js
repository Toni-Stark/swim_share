const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.json({ code: -1, message: '请输入管理员密码' });
  }

  if (password !== config.adminPassword) {
    return res.json({ code: -1, message: '管理员密码错误' });
  }

  const token = jwt.sign(
    { role: 'admin', iat: Math.floor(Date.now() / 1000) },
    config.jwtSecret,
    { expiresIn: '24h' }
  );

  return res.json({
    code: 0,
    message: '登录成功',
    data: { token, role: 'admin' }
  });
});

module.exports = router;
