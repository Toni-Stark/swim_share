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
  const { action, data } = event;
  const now = Date.now();
  const isAdmin = await checkAdmin(openid);

  try {
    if (action === 'create') {
      if (!isAdmin) return { code: -1, message: '无权限', data: null };
      if (!data.name || !data.date || !data.location) {
        return { code: -1, message: '请填写完整赛事信息', data: null };
      }

      const result = await db.collection('swim_competitions').add({
        data: {
          name: data.name,
          date: data.date,
          location: data.location,
          description: data.description || '',
          coverImage: data.coverImage || '',
          status: data.status || 'upcoming',
          registrantCount: 0,
          createdBy: openid,
          createTime: now,
          updateTime: now
        }
      });

      return { code: 0, message: '创建成功', data: { _id: result._id } };
    }

    if (action === 'update' || action === 'delete') {
      if (!data._id) {
        return { code: -1, message: '缺少赛事ID', data: null };
      }

      // 查询赛事创建者
      let createdBy = null;
      try {
        const compRes = await db.collection('swim_competitions').doc(data._id).get();
        createdBy = compRes.data && compRes.data.createdBy;
      } catch (e) { /* 查不到视为无权限 */ }

      const isCreator = createdBy && createdBy === openid;
      if (!isAdmin && !isCreator) {
        return { code: -1, message: '无权限', data: null };
      }

      if (action === 'update') {
        const updateData = { updateTime: now };
        if (data.name !== undefined) updateData.name = data.name;
        if (data.date !== undefined) updateData.date = data.date;
        if (data.location !== undefined) updateData.location = data.location;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
        if (data.status !== undefined) updateData.status = data.status;

        await db.collection('swim_competitions').doc(data._id).update({ data: updateData });
        return { code: 0, message: '更新成功', data: null };
      }

      if (action === 'delete') {
        await db.collection('swim_competitions').doc(data._id).remove();
        await db.collection('competition_registrations').where({
          competitionId: data._id
        }).remove();
        return { code: 0, message: '删除成功', data: null };
      }
    }

    return { code: -1, message: '未知操作', data: null };
  } catch (error) {
    console.error('赛事管理失败:', error);
    return { code: -1, message: '操作失败，请重试', data: null };
  }
};
