const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { registrationId, resultImage, resultScore, resultRank } = event;

  if (!registrationId) {
    return { code: -1, message: '缺少报名记录ID', data: null };
  }

  try {
    const regResult = await db.collection('competition_registrations')
      .doc(registrationId)
      .get();

    const reg = regResult.data;
    if (reg._openid !== openid) {
      return { code: -1, message: '无权限', data: null };
    }

    if (reg.status !== 'approved') {
      return { code: -1, message: '只有已通过的报名才能上传成绩', data: null };
    }

    const updateData = { updateTime: Date.now() };
    if (resultImage !== undefined) updateData.resultImage = resultImage;
    if (resultScore !== undefined) updateData.resultScore = resultScore;
    if (resultRank !== undefined) updateData.resultRank = resultRank;

    await db.collection('competition_registrations').doc(registrationId).update({
      data: updateData
    });

    return { code: 0, message: '上传成功', data: null };
  } catch (error) {
    console.error('上传赛事成绩失败:', error);
    return { code: -1, message: '上传失败，请重试', data: null };
  }
};
