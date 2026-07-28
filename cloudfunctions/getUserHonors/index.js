const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const [res, shellRes] = await Promise.all([
      db.collection('user_honors')
        .where({ _openid: openid })
        .orderBy('approvedAt', 'asc')
        .limit(100)
        .get(),
      db.collection('global_config')
        .where({ key: db.command.in(['badgeShell_primary', 'badgeShell_intermediate', 'badgeShell_top']) })
        .get()
    ]);

    const shells = {};
    (shellRes.data || []).forEach(s => { shells[s.key] = s.value; });

    return { code: 0, data: { list: res.data || [], shells } };
  } catch (err) {
    console.error('[getUserHonors] error:', err);
    return { code: -1, message: err.message };
  }
};
