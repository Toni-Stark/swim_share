const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: process.env.PORT || 3001,
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  cloudEnvId: process.env.CLOUD_ENV_ID,
  tencentSecretId: process.env.TENCENT_SECRET_ID,
  tencentSecretKey: process.env.TENCENT_SECRET_KEY
};
