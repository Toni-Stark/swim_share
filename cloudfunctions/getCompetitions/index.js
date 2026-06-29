const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  let adminFlag = false;
  try {
    const configResult = await db.collection('global_config')
      .doc('adminOpenIds')
      .get();
    const val = configResult.data?.value;
    if (Array.isArray(val)) adminFlag = val.includes(openid);
    else if (typeof val === 'string') adminFlag = val === openid;
  } catch (e) {}


  try {
    const result = await db.collection('swim_competitions')
      .orderBy('date', 'desc')
      .limit(50)
      .get();

    const list = result.data;

    const regResult = await db.collection('competition_registrations')
      .where({ _openid: openid })
      .get();

    const regMap = {};
    regResult.data.forEach(r => {
      regMap[r.competitionId] = r.status;
    });

    const enrichedList = list.map(item => ({
      ...item,
      myRegStatus: regMap[item._id] || ''
    }));

    return {
      code: 0,
      message: 'success',
      data: {
        list: enrichedList,
        isAdmin: adminFlag
      }
    };
  } catch (error) {
    console.error('获取公开赛列表失败:', error);
    return {
      code: 0,
      message: 'success',
      data: { list: [], isAdmin: adminFlag }
    };
  }
};
