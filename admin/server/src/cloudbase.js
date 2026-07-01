const config = require('./config');

let db = null;

function initCloudbase() {
  if (db) return db;

  const cloudbase = require('@cloudbase/node-sdk');

  const app = cloudbase.init({
    env: config.cloudEnvId,
    secretId: config.tencentSecretId,
    secretKey: config.tencentSecretKey,
    region: 'ap-shanghai'
  });

  db = app.database();
  console.log('[cloudbase] 云数据库连接成功, env:', config.cloudEnvId, 'region: ap-shanghai');
  return db;
}

function getDb() {
  if (!db) return initCloudbase();
  return db;
}

module.exports = { initCloudbase, getDb };

