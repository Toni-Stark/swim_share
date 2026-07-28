const express = require('express');
const { getDb } = require('../cloudbase');

const router = express.Router();

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

function getTier(bestPB) {
  if (bestPB != null && bestPB > 0) {
    return ALL_TIERS.find(t => bestPB >= t.minSpeed && bestPB <= t.maxSpeed) || null;
  }
  return null;
}

// 计算所有用户段位（遍历打卡全量，按泳姿统计）
function computeAllUserTiers(checkIns) {
  const userStrokeMap = {};
  const strokes = ['freestyle', 'breaststroke', 'backstroke', 'butterfly'];

  // 按 (openid, stroke) 聚合
  checkIns.forEach(item => {
    const dist = Number(item.distance) || 0;
    const dur = Number(item.duration) || 0;
    const stroke = item.stroke || '';
    if (dist <= 0 || dur <= 0 || !strokes.includes(stroke)) return;
    const key = `${item._openid}_${stroke}`;
    if (!userStrokeMap[key]) {
      userStrokeMap[key] = { openid: item._openid, stroke, totalDist: 0, totalDur: 0, bestPace: Infinity };
    }
    const entry = userStrokeMap[key];
    entry.totalDist += dist;
    entry.totalDur += dur;
    const pace = dur / (dist / 100);
    if (pace < entry.bestPace) entry.bestPace = pace;
  });

  // 每个用户取最优泳姿
  const userBestMap = {};
  Object.values(userStrokeMap).forEach(entry => {
    const avg = entry.totalDist > 0 ? Math.round((entry.totalDur / (entry.totalDist / 100)) * 10) / 10 : 0;
    const bestPB = entry.bestPace < Infinity ? Math.round(entry.bestPace * 10) / 10 : null;
    const tier = getTier(bestPB);
    if (!userBestMap[entry.openid]) {
      userBestMap[entry.openid] = { openid: entry.openid, bestStroke: entry.stroke, avgSpeed: avg, bestPB, tier };
    } else {
      const cur = userBestMap[entry.openid];
      if (tier && (!cur.tier || tier.maxSpeed < cur.tier.maxSpeed)) {
        userBestMap[entry.openid] = { openid: entry.openid, bestStroke: entry.stroke, avgSpeed: avg, bestPB, tier };
      }
    }
  });

  return Object.values(userBestMap);
}

// 段位分布
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const allChecks = await db.collection('check_ins').limit(5000).get();
    const userTiers = computeAllUserTiers(allChecks.data || []);

    const distribution = {};
    const tierNames = ['荣耀王者', '王者', '星耀', '钻石', '铂金', '黄金', '白银', '青铜'];
    tierNames.forEach(t => { distribution[t] = 0; });
    distribution['暂无段位'] = 0;

    const detailList = [];
    userTiers.forEach(item => {
      if (item.tier) {
        distribution[item.tier.tier] = (distribution[item.tier.tier] || 0) + 1;
        detailList.push({
          openid: item.openid,
          stroke: item.bestStroke,
          avgSpeed: item.avgSpeed,
          bestPB: item.bestPB,
          tier: item.tier.tier,
          badge: item.tier.badge,
          rank: item.tier.rank
        });
      } else {
        distribution['暂无段位']++;
      }
    });

    res.json({ code: 0, data: { distribution, detailList, total: userTiers.length } });
  } catch (err) {
    console.error('查询段位失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 钻石/王者用户列表
router.get('/diamond', async (req, res) => {
  try {
    const db = getDb();
    const allChecks = await db.collection('check_ins').limit(5000).get();
    const userTiers = computeAllUserTiers(allChecks.data || []);
    const diamondList = userTiers.filter(item =>
      item.tier && (item.tier.rank === 'diamond' || item.tier.rank === 'star' || item.tier.rank === 'king' || item.tier.rank === 'king_glory')
    );

    // 批量取昵称
    const openids = [...new Set(diamondList.map(d => d.openid))];
    const usersMap = {};
    if (openids.length > 0) {
      const usersRes = await db.collection('users').where({
        _openid: db.command.in(openids)
      }).limit(200).get();
      (usersRes.data || []).forEach(u => { usersMap[u._openid] = u; });
    }

    const result = diamondList.map(item => ({
      ...item,
      nickName: (usersMap[item.openid] && usersMap[item.openid].nickName) || ''
    }));

    res.json({ code: 0, data: { list: result, total: result.length } });
  } catch (err) {
    console.error('查询钻石用户失败:', err);
    res.json({ code: -1, message: '查询失败' });
  }
});

module.exports = router;
