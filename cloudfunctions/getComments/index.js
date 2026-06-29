// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 用 users 表里的最新昵称/头像覆盖评论的 userInfo（解决改头像后评论不更新）
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
  const { dynamicId, page = 1, pageSize = 20 } = event;

  if (!dynamicId) {
    return {
      code: -1,
      message: '参数错误',
      data: null
    };
  }

  try {
    const skip = (page - 1) * pageSize;

    // 查询总数
    const countResult = await db.collection('comments')
      .where({
        dynamicId: dynamicId
      })
      .count();

    const total = countResult.total;

    // 查询评论列表（按时间倒序）
    const listResult = await db.collection('comments')
      .where({
        dynamicId: dynamicId
      })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 查询当前用户对这些评论的点赞状态
    const commentIds = listResult.data.map(item => item._id);
    let userLikes = [];

    if (commentIds.length > 0) {
      const likesResult = await db.collection('likes')
        .where({
          _openid: wxContext.OPENID,
          targetType: 'comment',
          targetId: db.command.in(commentIds)
        })
        .get();

      userLikes = likesResult.data.map(item => item.targetId);
    }

    // 标记用户已点赞的评论
    const commentsWithLikeStatus = listResult.data.map(comment => ({
      ...comment,
      isLiked: userLikes.includes(comment._id)
    }));

    const finalList = await attachLatestUserInfo(commentsWithLikeStatus);

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
    console.error('获取评论失败:', error);
    return {
      code: -1,
      message: '获取评论失败，请重试',
      data: null
    };
  }
};
