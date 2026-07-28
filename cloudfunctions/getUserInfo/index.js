// 云函数入口文件
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

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { userId } = event;

  // 如果没有指定userId，则查询当前用户
  const targetOpenid = userId || wxContext.OPENID;

  try {
    // 查询用户基本信息
    const userResult = await db.collection('users')
      .where({
        _openid: targetOpenid
      })
      .get();

    if (userResult.data.length === 0) {
      return {
        code: -1,
        message: '用户不存在',
        data: null
      };
    }

    const userInfo = userResult.data[0];

    // 钻石段位字段：存量用户缺失时自愈计算并回填（仅本人）
    let isDiamond = userInfo.isDiamond;
    if (isDiamond === undefined && !userId) {
      try {
        isDiamond = await computeIsDiamond(targetOpenid);
        await db.collection('users')
          .where({ _openid: targetOpenid })
          .update({ data: { isDiamond } });
      } catch (e) {
        console.warn('回填 isDiamond 失败:', e);
        isDiamond = false;
      }
    }

    // 角色字段：存量用户缺失时从 adminOpenIds 回填
    let role = userInfo.role;
    if ((role === undefined || role === null) && !userId) {
      try {
        const configRes = await db.collection('global_config').doc('adminOpenIds').get();
        const val = configRes.data && configRes.data.value;
        const isAdmin = Array.isArray(val) ? val.includes(targetOpenid)
          : (typeof val === 'string' && val === targetOpenid);
        role = isAdmin ? 'admin' : 'user';
        await db.collection('users').where({ _openid: targetOpenid }).update({ data: { role } });
      } catch (e) {
        role = 'user';
      }
    }

    // 统计用户的动态数
    const dynamicsWhere = {
      _openid: targetOpenid,
      status: 'published'
    };
    if (userId) {
      // 查看他人时，只统计公开游龙
      dynamicsWhere.isPrivate = false;
    }
    const dynamicsCount = await db.collection('user_dynamics')
      .where(dynamicsWhere)
      .count();

    // 统计用户的粉丝数（有多少人订阅了我）
    const followersCount = await db.collection('subscriptions')
      .where({
        targetOpenid: targetOpenid
      })
      .count();

    // 统计用户的订阅数（我订阅了多少人）
    const subscriptionsCount = await db.collection('subscriptions')
      .where({
        subscriberOpenid: targetOpenid
      })
      .count();

    const fullUserInfo = {
      ...userInfo,
      isDiamond: isDiamond === undefined ? false : isDiamond,
      role: role === undefined ? 'user' : role,
      stats: {
        dynamicsCount: dynamicsCount.total,
        followersCount: followersCount.total,
        subscriptionsCount: subscriptionsCount.total
      }
    };

    return {
      code: 0,
      message: 'success',
      data: fullUserInfo
    };

  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      code: -1,
      message: '获取用户信息失败，请重试',
      data: null
    };
  }
};
