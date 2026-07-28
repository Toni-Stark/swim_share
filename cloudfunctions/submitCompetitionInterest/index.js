const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { competitionId, phone } = event;

  if (!competitionId) {
    return { code: -1, message: '缺少赛事ID', data: null };
  }

  if (!phone || !/^1\d{10}$/.test(phone)) {
    return { code: -1, message: '请输入正确的手机号', data: null };
  }

  try {
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get();
    const dbUser = userResult.data[0] || {};

    const allRecords = await db.collection('check_ins')
      .where({ _openid: openid })
      .limit(1000)
      .get();

    let totalDistance = 0;
    let bestPace = Infinity;
    let bestPaceStroke = '';
    const STROKE_EMOJI = {
      freestyle: '🏊', breaststroke: '🐸', backstroke: '🌊', butterfly: '🦋'
    };
    const STROKE_NAME = {
      freestyle: '自由泳', breaststroke: '蛙泳', backstroke: '仰泳', butterfly: '蝶泳'
    };

    allRecords.data.forEach(item => {
      const dist = Number(item.distance) || 0;
      const dur = Number(item.duration) || 0;
      totalDistance += dist;
      if (dist > 0 && dur > 0) {
        const pace = dur / (dist / 100);
        if (pace < bestPace) {
          bestPace = pace;
          bestPaceStroke = item.stroke || '';
        }
      }
    });

    function formatPace(seconds) {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return m + ':' + String(s).padStart(2, '0');
    }

    const ALL_TIERS = [
      { maxSpeed: 50,  minSpeed: 0,   tier: '荣耀王者', badge: '👑', rank: 'king_glory' },
      { maxSpeed: 60,  minSpeed: 50,  tier: '王者',     badge: '⚡', rank: 'king' },
      { maxSpeed: 70,  minSpeed: 60,  tier: '星耀',     badge: '💫', rank: 'star' },
      { maxSpeed: 80,  minSpeed: 70,  tier: '钻石',     badge: '💎', rank: 'diamond' },
      { maxSpeed: 110, minSpeed: 80,  tier: '铂金',     badge: '🪙', rank: 'platinum' },
      { maxSpeed: 140, minSpeed: 110, tier: '黄金',     badge: '🥇', rank: 'gold' },
      { maxSpeed: 180, minSpeed: 140, tier: '白银',     badge: '🥈', rank: 'silver' },
      { maxSpeed: 999, minSpeed: 180, tier: '青铜',     badge: '🥉', rank: 'bronze' },
    ];

    let tierName = '';
    let tierBadge = '';
    if (bestPace < Infinity) {
      const pbTier = ALL_TIERS.find(t => bestPace >= t.minSpeed && bestPace <= t.maxSpeed);
      if (pbTier) {
        tierName = pbTier.tier;
        tierBadge = pbTier.badge;
      }
    }

    const compResult = await db.collection('swim_competitions').doc(competitionId).get();
    const competition = compResult.data;

    const userStats = {
      bestPB: bestPace < Infinity ? formatPace(bestPace) : '--',
      bestPBStroke: STROKE_NAME[bestPaceStroke] || '',
      bestPBEmoji: STROKE_EMOJI[bestPaceStroke] || '⏱',
      totalDistance,
      tierName,
      tierBadge
    };

    const existing = await db.collection('competition_registrations')
      .where({ _openid: openid, competitionId })
      .get();

    const now = Date.now();

    if (existing.data.length > 0) {
      await db.collection('competition_registrations').doc(existing.data[0]._id).update({
        data: {
          phone,
          nickName: dbUser.nickName || '微信用户',
          userStats,
          status: 'pending',
          updateTime: now
        }
      });
    } else {
      await db.collection('competition_registrations').add({
        data: {
          _openid: openid,
          competitionId,
          competitionName: competition ? competition.name : '',
          phone,
          nickName: dbUser.nickName || '微信用户',
          userStats,
          status: 'pending',
          resultImage: '',
          resultScore: '',
          resultRank: '',
          createTime: now,
          updateTime: now
        }
      });
    }

    return { code: 0, message: '提交成功', data: null };
  } catch (error) {
    console.error('提交赛事意向失败:', error);
    return { code: -1, message: '提交失败，请重试', data: null };
  }
};
