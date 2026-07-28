const https = require('https');
const config = require('./config');

let accessToken = null;
let tokenExpiry = 0;

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { reject(new Error(body)); }
      });
    }).on('error', reject);
  });
}

function httpPost(url, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { reject(new Error(raw)); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('HTTP 请求超时')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wxAppId}&secret=${config.wxAppSecret}`;
  const res = await httpGet(url);
  if (res.access_token) {
    accessToken = res.access_token;
    tokenExpiry = Date.now() + (res.expires_in - 300) * 1000;
    console.log('[cloudbase] access_token 获取成功');
    return accessToken;
  }
  throw new Error('获取 access_token 失败: ' + JSON.stringify(res));
}

async function callAdminApi(params) {
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${token}&env=${config.cloudEnvId}&name=adminApi`;
  const res = await httpPost(url, { data: JSON.stringify(params) });
  if (res.errcode !== 0) {
    throw new Error(`云函数调用失败: errcode=${res.errcode} ${res.errmsg}`);
  }
  const resp = JSON.parse(res.resp_data);
  if (resp.code !== 0) {
    throw new Error(resp.message || '服务器错误');
  }
  return resp.data;
}

async function callCloudFunction(name, data) {
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${token}&env=${config.cloudEnvId}&name=${name}`;
  const res = await httpPost(url, { data: JSON.stringify(data) });
  if (res.errcode !== 0) {
    throw new Error(`云函数 ${name} 调用失败: errcode=${res.errcode} ${res.errmsg}`);
  }
  const resp = JSON.parse(res.resp_data);
  if (resp.code !== 0) {
    throw new Error(resp.message || '服务器错误');
  }
  return resp.data;
}

function getDb() {
  const makeQuery = (collectionName) => {
    let _filter = {};
    let _orderBy = null;
    let _skipVal = 0;
    let _limitVal = 100;

    const chain = {
      where(filterObj) {
        _filter = filterObj || {};
        return chain;
      },
      orderBy(field, dir) {
        _orderBy = [field, dir];
        return chain;
      },
      skip(n) {
        _skipVal = n;
        return chain;
      },
      limit(n) {
        _limitVal = n;
        return chain;
      },
      async get() {
        const list = await callAdminApi({
          op: 'query', collection: collectionName,
          filter: _filter, orderBy: _orderBy, skip: _skipVal, limit: _limitVal
        });
        return { data: list };
      },
      async count() {
        const result = await callAdminApi({
          op: 'count', collection: collectionName, filter: _filter
        });
        return { total: result.total };
      },
      async add(params) {
        const result = await callAdminApi({
          op: 'add', collection: collectionName, data: params.data
        });
        return { _id: result.id, id: result.id };
      },
      async update(params) {
        await callAdminApi({
          op: 'whereUpdate', collection: collectionName, filter: _filter, data: params.data
        });
        return { stats: { updated: 1 } };
      },
      async remove() {
        await callAdminApi({
          op: 'whereRemove', collection: collectionName, filter: _filter
        });
        return { stats: { removed: 1 } };
      },
      doc(id) {
        return {
          async get() {
            const data = await callAdminApi({
              op: 'docGet', collection: collectionName, docId: id
            });
            return { data };
          },
          async update(params) {
            await callAdminApi({
              op: 'docUpdate', collection: collectionName, docId: id, data: params.data
            });
            return { stats: { updated: 1 } };
          },
          async set(params) {
            await callAdminApi({
              op: 'docSet', collection: collectionName, docId: id, data: params.data
            });
            return { stats: { updated: 1 } };
          },
          async remove() {
            await callAdminApi({
              op: 'docRemove', collection: collectionName, docId: id
            });
            return { stats: { removed: 1 } };
          }
        };
      }
    };
    return chain;
  };

  const proxy = {
    collection(name) { return makeQuery(name); },
    command: {
      inc(val) { return { $cmd: 'inc', $val: val }; },
      in(arr) { return { $cmd: 'in', $val: arr }; },
      eq(v) { return { $cmd: 'eq', $val: v }; },
      gte(v) { return { $cmd: 'gte', $val: v }; },
      lte(v) { return { $cmd: 'lte', $val: v }; },
      gt(v) { return { $cmd: 'gt', $val: v }; },
      lt(v) { return { $cmd: 'lt', $val: v }; }
    }
  };

  return proxy;
}

async function initCloudbase() {
  try {
    await getAccessToken();
    console.log('[cloudbase] 云函数代理就绪, env:', config.cloudEnvId);
  } catch (err) {
    console.error('[cloudbase] 初始化失败:', err.message);
    process.exit(1);
  }
}

module.exports = { initCloudbase, getDb, callCloudFunction };
