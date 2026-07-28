const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const https = require('https');
const { callCloudFunction } = require('../cloudbase');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.json({ code: -1, message: '未选择文件' });

    const ext = file.originalname.split('.').pop() || 'jpg';
    const key = `admin/${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;

    // 1. 获取七牛上传凭证
    const tokenRes = await callCloudFunction('getQiniuToken', { key });

    // 2. 上传到七牛
    const form = new FormData();
    form.append('token', tokenRes.token);
    form.append('key', key);
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });

    const qiniuUrl = await new Promise((resolve, reject) => {
      const req2 = https.request('https://upload-z2.qiniup.com', {
        method: 'POST',
        headers: form.getHeaders()
      }, (qRes) => {
        let body = '';
        qRes.on('data', chunk => body += chunk);
        qRes.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.key) {
              resolve(`https://lovebeyonddays.com/${data.key}`);
            } else {
              reject(new Error(data.error || '上传失败'));
            }
          } catch { reject(new Error('解析七牛响应失败')); }
        });
      });
      req2.on('error', reject);
      form.pipe(req2);
    });

    res.json({ code: 0, data: { url: qiniuUrl } });
  } catch (err) {
    console.error('上传失败:', err);
    res.json({ code: -1, message: err.message || '上传失败' });
  }
});

module.exports = router;
