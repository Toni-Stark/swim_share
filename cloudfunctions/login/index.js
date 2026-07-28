// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { userInfo } = event;

  // ===== 调试日志：打印关键信息 =====
  console.log('===== 登录调试信息 =====');
  console.log('wxContext:', JSON.stringify(wxContext));
  console.log('OPENID:', openid);
  console.log('APPID:', wxContext.APPID);
  console.log('UNIONID:', wxContext.UNIONID);
  console.log('前端传入的userInfo:', JSON.stringify(userInfo));
  console.log('========================');

  // 检查 openid 是否有效
  if (!openid) {
    console.error('错误：无法获取用户 openid');
    return {
      code: -1,
      message: '获取用户身份失败，请重试',
      data: null
    };
  }

  try {
    // 查询用户是否已存在
    console.log('查询用户，openid:', openid);
    const userResult = await db.collection('users')
      .where({
        _openid: openid
      })
      .get();

    console.log('查询结果，找到', userResult.data.length, '条记录');

    const now = db.serverDate();

    if (userResult.data.length === 0) {
      // 新用户，创建用户记录
      await db.collection('users').add({
        data: {
          _openid: openid,
          nickName: userInfo.nickName || '微信用户',
          avatarUrl: userInfo.avatarUrl || '',
          gender: userInfo.gender || 0,
          province: userInfo.province || '',
          city: userInfo.city || '',
          signature: '',
          phone: '',
          email: '',
          is_show: true, // 权限字段：控制是否显示评论/点赞/添加动态等功能
          isDiamond: false, // 钻石段位标记：由打卡数据变化时维护
          role: 'user', // 用户角色：admin 管理员 / user 普通用户
          stats: {
            dynamicsCount: 0,
            followersCount: 0,
            followingCount: 0,
            likesCount: 0
          },
          lastLoginTime: now,
          registerTime: now,
          updateTime: now
        }
      });

      console.log('新用户注册成功:', openid);
    } else {
      // 已存在用户，只更新最后登录时间
      // 不覆盖用户已自定义的昵称、头像等信息
      await db.collection('users')
        .where({
          _openid: openid
        })
        .update({
          data: {
            lastLoginTime: now,
            updateTime: now
          }
        });

      console.log('用户登录成功:', openid);
    }

    // 重新查询用户信息返回
    const finalUserResult = await db.collection('users')
      .where({
        _openid: openid
      })
      .get();

    return {
      code: 0,
      message: '登录成功',
      data: {
        openid: openid,
        userInfo: finalUserResult.data[0]
      }
    };

  } catch (error) {
    console.error('登录失败:', error);
    return {
      code: -1,
      message: '登录失败，请重试',
      data: null
    };
  }
};
