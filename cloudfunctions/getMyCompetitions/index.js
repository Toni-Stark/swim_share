const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const result = await db.collection('competition_registrations')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get();

    const registrations = result.data;
    const competitionIds = [...new Set(registrations.map(r => r.competitionId))];

    let competitionsMap = {};
    if (competitionIds.length > 0) {
      const compResult = await db.collection('swim_competitions')
        .where({ _id: db.command.in(competitionIds) })
        .get();
      compResult.data.forEach(c => { competitionsMap[c._id] = c; });
    }

    const list = registrations.map(r => ({
      ...r,
      competition: competitionsMap[r.competitionId] || null
    }));

    return {
      code: 0,
      message: 'success',
      data: { list }
    };
  } catch (error) {
    console.error('获取我的赛事失败:', error);
    return { code: -1, message: '获取失败', data: null };
  }
};
