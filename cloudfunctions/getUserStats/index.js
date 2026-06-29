const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = event.openid || wxContext.OPENID;
  const { year: clientYear, month: clientMonth, today: clientToday } = event;

  try {
    const now = new Date();
    const year = clientYear || now.getFullYear();
    const month = clientMonth || (now.getMonth() + 1);
    const today = clientToday || now.getDate();

    const allResult = await db.collection('check_ins')
      .where({
        _openid: openid
      })
      .limit(1000)
      .get();

    const dateMap = {};
    const allRecords = allResult.data;

    allRecords.forEach(item => {
      let dateKey;
      if (typeof item.date === 'string') {
        dateKey = item.date;
      } else if (item.date) {
        const d = new Date(item.date);
        dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      if (!dateKey) return;

      const existing = dateMap[dateKey];
      if (!existing || (item.updateTime && existing.updateTime && item.updateTime > existing.updateTime)) {
        dateMap[dateKey] = item;
      } else if (!existing.distance && item.distance) {
        dateMap[dateKey] = item;
      }
    });

    let totalDistance = 0;
    let totalActiveDays = 0;
    let totalDuration = 0;
    let monthDistance = 0;
    let monthActiveDays = 0;
    let todayDistance = 0;
    let todayChecked = false;
    let bestPace = Infinity;
    let bestPaceStroke = '';
    let monthMaxDistance = 0;
    let monthActiveDaysCount = 0;

    const STROKE_EMOJI = {
      freestyle: '🏊',
      breaststroke: '🐸',
      backstroke: '🌊',
      butterfly: '🦋'
    };

    function formatPace(seconds) {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return m + ':' + String(s).padStart(2, '0');
    }

    const uniqueRecords = Object.values(dateMap);

    uniqueRecords.forEach(item => {
      const dist = Number(item.distance) || 0;
      const dur = Number(item.duration) || 0;

      if (dist > 0) {
        totalDistance += dist;
        totalActiveDays++;
        totalDuration += dur;
      }

      let itemMonth, itemDay;
      if (typeof item.date === 'string') {
        const parts = item.date.split('-');
        itemMonth = parseInt(parts[1], 10);
        itemDay = parseInt(parts[2], 10);
      } else if (item.date) {
        const d = new Date(item.date);
        itemMonth = d.getMonth() + 1;
        itemDay = d.getDate();
      }

      if (itemMonth === month) {
        if (dist > 0) {
          monthDistance += dist;
          monthActiveDaysCount++;
        }
        if (dist > monthMaxDistance) monthMaxDistance = dist;
        if (itemDay === today) {
          todayChecked = true;
          todayDistance = dist;
        }
      }

      if (dist > 0 && dur > 0) {
        const pace = dur / (dist / 100);
        if (pace < bestPace) {
          bestPace = pace;
          bestPaceStroke = item.stroke || '';
        }
      }
    });

    const bestPaceFormatted = bestPace < Infinity ? formatPace(bestPace) : '';
    const bestPaceEmoji = STROKE_EMOJI[bestPaceStroke] || '⏱';
    const isIronWill = monthDistance > 45000 || monthMaxDistance > 12000;
    const isDiamond = (bestPace < Infinity && bestPace > 0 && bestPace <= 80) || isIronWill;

    return {
      code: 0,
      message: 'success',
      data: {
        totalDistance,
        totalActiveDays,
        totalDuration,
        monthDistance,
        monthActiveDays: monthActiveDaysCount,
        todayDistance,
        todayChecked,
        bestPaceFormatted,
        bestPaceEmoji,
        bestPaceStroke,
        isIronWill,
        isDiamond,
        monthMaxDistance
      }
    };
  } catch (error) {
    console.error('获取用户统计数据失败:', error);
    return {
      code: -1,
      message: '获取失败',
      data: {
        totalDistance: 0,
        totalActiveDays: 0,
        totalDuration: 0,
        monthDistance: 0,
        monthActiveDays: 0,
        todayDistance: 0,
        todayChecked: false,
        isDiamond: false
      }
    };
  }
};
