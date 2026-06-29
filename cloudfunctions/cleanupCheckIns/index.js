const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 计算用户是否达到钻石段位（全历史最佳配速 ≤ 80s/100m，或当月毅力之星）
async function computeIsDiamond(openid) {
  const now = new Date();
  const month = now.getMonth() + 1;

  const allResult = await db.collection('check_ins')
    .where({ _openid: openid })
    .limit(1000)
    .get();

  const dateMap = {};
  allResult.data.forEach(item => {
    let dateKey;
    if (typeof item.date === 'string') {
      dateKey = item.date;
    } else if (item.date) {
      const d = new Date(item.date);
      dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (!dateKey) return;
    const existing = dateMap[dateKey];
    if (!existing || (item.updateTime && existing.updateTime && item.updateTime > existing.updateTime)) {
      dateMap[dateKey] = item;
    } else if (!existing.distance && item.distance) {
      dateMap[dateKey] = item;
    }
  });

  let bestPace = Infinity;
  let monthDistance = 0;
  let monthMaxDistance = 0;

  Object.values(dateMap).forEach(item => {
    const dist = Number(item.distance) || 0;
    const dur = Number(item.duration) || 0;

    let itemMonth;
    if (typeof item.date === 'string') {
      itemMonth = parseInt(item.date.split('-')[1], 10);
    } else if (item.date) {
      itemMonth = new Date(item.date).getMonth() + 1;
    }

    if (itemMonth === month) {
      if (dist > 0) monthDistance += dist;
      if (dist > monthMaxDistance) monthMaxDistance = dist;
    }

    if (dist > 0 && dur > 0) {
      const pace = dur / (dist / 100);
      if (pace < bestPace) bestPace = pace;
    }
  });

  const isIronWill = monthDistance > 45000 || monthMaxDistance > 12000;
  return (bestPace < Infinity && bestPace > 0 && bestPace <= 80) || isIronWill;
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = event.openid || wxContext.OPENID;

  try {
    const allResult = await db.collection('check_ins')
      .where({
        _openid: openid
      })
      .limit(1000)
      .get();

    const allRecords = allResult.data;
    const dateMap = {};
    let migrated = 0;
    let deleted = 0;

    allRecords.forEach(item => {
      let dateKey;
      if (typeof item.date === 'string') {
        dateKey = item.date;
      } else if (item.date) {
        const d = new Date(item.date);
        dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      if (!dateKey) return;

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(item);
    });

    const dateKeys = Object.keys(dateMap);
    let deletedCount = 0;
    let migratedCount = 0;

    for (const dateKey of dateKeys) {
      const entries = dateMap[dateKey];

      entries.sort((a, b) => {
        const aTime = a.updateTime || a.createTime || 0;
        const bTime = b.updateTime || b.createTime || 0;
        return bTime - aTime;
      });

      const keep = entries[0];

      if (typeof keep.date !== 'string') {
        await db.collection('check_ins').doc(keep._id).update({
          data: {
            date: dateKey,
            updateTime: db.serverDate()
          }
        });
        migratedCount++;
        keep.date = dateKey;
      }

      for (let i = 1; i < entries.length; i++) {
        const dup = entries[i];

        if (keep.distance == null && dup.distance != null && keep.distance !== dup.distance) {
          keep.distance = dup.distance;
        }
        if (keep.duration == null && dup.duration != null) {
          keep.duration = dup.duration;
        }
        if (!keep.stroke && dup.stroke) {
          keep.stroke = dup.stroke;
        }

        await db.collection('check_ins').doc(dup._id).remove();
        deletedCount++;
      }

      if (keep._mergeUpdated) {
        await db.collection('check_ins').doc(keep._id).update({
          data: {
            distance: keep.distance,
            duration: keep.duration,
            stroke: keep.stroke,
            updateTime: db.serverDate()
          }
        });
      }
    }

    try {
      const isDiamond = await computeIsDiamond(openid);
      await db.collection('users')
        .where({ _openid: openid })
        .update({ data: { isDiamond } });
    } catch (e) {
      console.warn('[cleanupCheckIns] 更新 isDiamond 失败:', e);
    }

    return {
      code: 0,
      message: `清理完成：去重删除 ${deletedCount} 条，日期格式迁移 ${migratedCount} 条`,
      data: {
        totalRecords: allRecords.length,
        uniqueDates: dateKeys.length,
        deleted: deletedCount,
        migrated: migratedCount
      }
    };
  } catch (error) {
    console.error('清理数据失败:', error);
    return {
      code: -1,
      message: '清理失败: ' + error.message,
      data: null
    };
  }
};
