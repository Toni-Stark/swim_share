const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { honorId, placed, x, y } = event;

  if (!honorId) return { code: -1, message: '缺少 honorId' };

  try {
    const updateData = { placed: !!placed };
    if (x !== undefined) updateData.x = x;
    if (y !== undefined) updateData.y = y;

    await db.collection('user_honors')
      .where({ _openid: openid, _id: honorId })
      .update({ data: updateData });

    return { code: 0, message: 'ok' };
  } catch (err) {
    console.error('[updateHonorPosition] error:', err);
    return { code: -1, message: err.message };
  }
};
