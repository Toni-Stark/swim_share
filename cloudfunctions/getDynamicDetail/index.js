// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { dynamicId } = event;

  if (!dynamicId) {
    return {
      code: -1,
      message: '参数错误',
      data: null
    };
  }

  try {
    // 查询动态详情
    const result = await db.collection('user_dynamics')
      .doc(dynamicId)
      .get();

    if (!result.data) {
      return {
        code: -1,
        message: '动态不存在',
        data: null
      };
    }

    // 查询当前用户是否点赞了该动态
    let isLiked = false;
    if (wxContext.OPENID) {
      const likeResult = await db.collection('likes')
        .where({
          _openid: wxContext.OPENID,
          targetType: 'dynamic',
          targetId: dynamicId
        })
        .get();

      isLiked = likeResult.data.length > 0;
    }

    // 统计该动态的总点赞数
    const likesCountResult = await db.collection('likes')
      .where({
        targetType: 'dynamic',
        targetId: dynamicId
      })
      .count();

    // 统计该动态的总评论数
    const commentsCountResult = await db.collection('comments')
      .where({
        dynamicId: dynamicId
      })
      .count();

    // 返回数据
    const dynamic = {
      ...result.data,
      isLiked: isLiked,
      likesCount: likesCountResult.total,
      commentsCount: commentsCountResult.total
    };

    // 用 users 表里的最新昵称/头像覆盖作者信息（解决改头像后详情不更新）
    if (dynamic._openid) {
      const uRes = await db.collection('users')
        .where({ _openid: dynamic._openid })
        .get();
      const u = uRes.data && uRes.data[0];
      if (u) {
        dynamic.userInfo = {
          ...(dynamic.userInfo || {}),
          nickName: u.nickName || (dynamic.userInfo && dynamic.userInfo.nickName) || '微信用户',
          avatarUrl: u.avatarUrl || (dynamic.userInfo && dynamic.userInfo.avatarUrl) || ''
        };
      }
    }

    return {
      code: 0,
      message: 'success',
      data: dynamic
    };

  } catch (error) {
    console.error('获取动态详情失败:', error);
    return {
      code: -1,
      message: '获取失败，请重试',
      data: null
    };
  }
};
