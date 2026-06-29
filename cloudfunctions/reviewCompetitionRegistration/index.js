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

  const { registrationId, status } = event;

  if (!registrationId) {
    return { code: -1, message: '缺少报名记录ID', data: null };
  }

  if (!['approved', 'rejected'].includes(status)) {
    return { code: -1, message: '无效的审核状态', data: null };
  }

  try {
    const regResult = await db.collection('competition_registrations').doc(registrationId).get();
    const reg = regResult.data;

    await db.collection('competition_registrations').doc(registrationId).update({
      data: {
        status,
        reviewTime: Date.now(),
        updateTime: Date.now()
      }
    });

    if (status === 'approved' && reg.competitionId) {
      await db.collection('swim_competitions').doc(reg.competitionId).update({
        data: { registrantCount: db.command.inc(1) }
      });
    }

    return { code: 0, message: status === 'approved' ? '已通过' : '已驳回', data: null };
  } catch (error) {
    console.error('审核失败:', error);
    return { code: -1, message: '审核失败，请重试', data: null };
  }
};
