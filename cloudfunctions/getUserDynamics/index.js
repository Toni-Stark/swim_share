// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 用 users 表里的最新昵称/头像覆盖列表项的 userInfo（解决改头像后列表不更新）
async function attachLatestUserInfo(list) {
  const openids = [...new Set(list.map(i => i._openid).filter(Boolean))];
  if (openids.length === 0) return list;
  const _ = db.command;
  const usersRes = await db.collection('users')
    .where({ _openid: _.in(openids) })
    .limit(100)
    .get();
  const map = {};
  usersRes.data.forEach(u => { map[u._openid] = u; });
  return list.map(item => {
    const u = map[item._openid];
    if (u) {
      item.userInfo = {
        ...(item.userInfo || {}),
        nickName: u.nickName || (item.userInfo && item.userInfo.nickName) || '微信用户',
        avatarUrl: u.avatarUrl || (item.userInfo && item.userInfo.avatarUrl) || ''
      };
    }
    return item;
  });
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { page = 1, pageSize = 10, userId, myOwn = false, subscribedOnly = false } = event;

  try {
    const _ = db.command;
    const skip = (page - 1) * pageSize;

    let where = {
      status: 'published'
    };

    if (myOwn && wxContext.OPENID) {
      where._openid = wxContext.OPENID;
      console.log('[getUserDynamics] myOwn mode, OPENID:', wxContext.OPENID);
    } else {
      where.isPrivate = false;
      if (userId) {
        where._openid = userId;
      } else if (subscribedOnly && wxContext.OPENID) {
        const subResult = await db.collection('subscriptions')
          .where({ subscriberOpenid: wxContext.OPENID })
          .get();

        const subscribedOpenids = subResult.data.map(item => item.targetOpenid);
        if (subscribedOpenids.length > 0) {
          subscribedOpenids.push(wxContext.OPENID);
          where._openid = _.in(subscribedOpenids);
        } else {
          where._openid = wxContext.OPENID;
        }
      }
    }

    // 查询总数
    const countResult = await db.collection('user_dynamics')
      .where(where)
      .count();

    const total = countResult.total;

    // 查询列表
    const listResult = await db.collection('user_dynamics')
      .where(where)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    const dynamicIds = listResult.data.map(item => item._id);
    let subscribedOpenids = [];

    if (dynamicIds.length > 0 && wxContext.OPENID) {
      const subResult = await db.collection('subscriptions')
        .where({
          subscriberOpenid: wxContext.OPENID
        })
        .get();

      subscribedOpenids = subResult.data.map(item => item.targetOpenid);
    }

    const dynamicsWithLikeStatus = listResult.data.map(dynamic => ({
      ...dynamic,
      isSubscribed: subscribedOpenids.includes(dynamic._openid),
      likesCount: dynamic.likesCount || 0,
      commentsCount: dynamic.commentsCount || 0
    }));

    const finalList = await attachLatestUserInfo(dynamicsWithLikeStatus);

    return {
      code: 0,
      message: 'success',
      data: {
        list: finalList,
        total: total,
        page: page,
        pageSize: pageSize,
        hasMore: skip + pageSize < total
      }
    };

  } catch (error) {
    console.error('获取用户动态失败:', error);
    return {
      code: -1,
      message: '获取动态失败，请重试',
      data: null
    };
  }
};
