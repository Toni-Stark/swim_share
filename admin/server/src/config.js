const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: process.env.PORT || 3001,
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  cloudEnvId: process.env.CLOUD_ENV_ID,
  wxAppId: process.env.WX_APPID,
  wxAppSecret: process.env.WX_APPSECRET
};
