const jwt = require('jsonwebtoken');
const config = require('../config');

function authMiddleware(req, res, next) {
  const publicPaths = ['/auth/login'];

  if (publicPaths.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录或 Token 已过期' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.adminInfo = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'Token 无效或已过期' });
  }
}

module.exports = authMiddleware;
