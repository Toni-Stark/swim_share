const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 自动建集合
async function ensureCollection(name) {
  try {
    await db.createCollection(name);
  } catch (e) {
    console.warn('[ensureCollection] 建集合失败:', name, e.message);
  }
}

function deserializeCommands(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(deserializeCommands);
  if (typeof obj === 'object') {
    if (obj.$cmd) {
      const v = deserializeCommands(obj.$val);
      switch (obj.$cmd) {
        case 'inc': return _.inc(v);
        case 'in': return _.in(v);
        case 'eq': return _.eq(v);
        case 'gte': return _.gte(v);
        case 'lte': return _.lte(v);
        case 'gt': return _.gt(v);
        case 'lt': return _.lt(v);
        default: return obj;
      }
    }
    const result = {};
    for (const key of Object.keys(obj)) {
      result[key] = deserializeCommands(obj[key]);
    }
    return result;
  }
  return obj;
}

exports.main = async (rawEvent, context) => {
  let event = rawEvent;
  // WeChat TCB invoke API 会把参数放在 data 字段（JSON 字符串）
  if (rawEvent && typeof rawEvent.data === 'string') {
    try { event = JSON.parse(rawEvent.data); } catch (e) { /* keep original */ }
  }
  const { op, collection, filter, data, orderBy, skip, limit, docId } = event;

  try {
    switch (op) {
      case 'query': {
        let q = db.collection(collection).where(deserializeCommands(filter || {}));
        if (orderBy) q = q.orderBy(orderBy[0], orderBy[1]);
        if (skip !== undefined) q = q.skip(skip);
        if (limit !== undefined) q = q.limit(limit);
        try { const r = await q.get(); return { code: 0, data: r.data }; }
        catch (e) { if (e.message && e.message.includes('not exist')) return { code: 0, data: [] }; throw e; }
      }
      case 'count': {
        let q = db.collection(collection);
        if (filter && Object.keys(filter).length > 0) q = q.where(deserializeCommands(filter));
        try { const r = await q.count(); return { code: 0, data: { total: r.total } }; }
        catch (e) { if (e.message && e.message.includes('not exist')) return { code: 0, data: { total: 0 } }; throw e; }
      }
      case 'add': {
        try {
          const r = await db.collection(collection).add({ data: deserializeCommands(data) });
          return { code: 0, data: { id: r._id } };
        } catch (e) {
          if (e.message && e.message.includes('not exist')) {
            await ensureCollection(collection);
            const r = await db.collection(collection).add({ data: deserializeCommands(data) });
            return { code: 0, data: { id: r._id } };
          }
          throw e;
        }
      }
      case 'docGet': {
        try { const r = await db.collection(collection).doc(docId).get(); return { code: 0, data: r.data }; }
        catch (e) { if (e.message && e.message.includes('not exist')) return { code: 0, data: null }; throw e; }
      }
      case 'docUpdate': {
        await db.collection(collection).doc(docId).update({ data: deserializeCommands(data) });
        return { code: 0, message: 'ok' };
      }
      case 'docSet': {
        await db.collection(collection).doc(docId).set({ data: deserializeCommands(data) });
        return { code: 0, message: 'ok' };
      }
      case 'docRemove': {
        try { await db.collection(collection).doc(docId).remove(); return { code: 0, message: 'ok' }; }
        catch (e) { if (e.message && e.message.includes('not exist')) return { code: 0, message: 'ok' }; throw e; }
      }
      case 'whereUpdate': {
        await db.collection(collection).where(deserializeCommands(filter || {})).update({ data: deserializeCommands(data) });
        return { code: 0, message: 'ok' };
      }
      case 'whereRemove': {
        try { await db.collection(collection).where(deserializeCommands(filter || {})).remove(); return { code: 0, message: 'ok' }; }
        catch (e) { if (e.message && e.message.includes('not exist')) return { code: 0, message: 'ok' }; throw e; }
      }
      default:
        return { code: -1, message: '未知操作: ' + op };
    }
  } catch (err) {
    console.error('[adminApi] error:', err);
    return { code: -1, message: err.message || '服务器错误' };
  }
};
