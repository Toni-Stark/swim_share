const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

async function checkAdmin(openid) {
  try {
    const configResult = await db.collection('global_config')
      .doc('adminOpenIds')
      .get();
    const val = configResult.data?.value;
    if (Array.isArray(val)) return val.includes(openid);
    if (typeof val === 'string') return val === openid;
    return false;
  } catch (e) {
    return false;
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!(await checkAdmin(openid))) {
    return { code: -1, message: '无权限', data: null };
  }

  const { competitionId } = event;

  if (!competitionId) {
    return { code: -1, message: '缺少赛事ID', data: null };
  }

  try {
    const result = await db.collection('competition_registrations')
      .where({ competitionId })
      .orderBy('createTime', 'desc')
      .limit(100)
      .get();

    return {
      code: 0,
      message: 'success',
      data: { list: result.data }
    };
  } catch (error) {
    console.error('获取报名列表失败:', error);
    return { code: -1, message: '获取失败', data: null };
  }
};
