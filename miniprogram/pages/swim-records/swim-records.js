const request = require('../../utils/request.js');
const encouragements = require('../../data/encouragements.js');
const strokesData = require('../../data/strokes.js');

const AVG_TIERS = [
  { maxSpeed: 120, minSpeed: 0,   tier: '铂金泳者', badge: '💎', rank: 'platinum' },
  { maxSpeed: 150, minSpeed: 120, tier: '黄金泳者', badge: '🥇', rank: 'gold' },
  { maxSpeed: 180, minSpeed: 150, tier: '白银泳者', badge: '🥈', rank: 'silver' },
  { maxSpeed: 999, minSpeed: 180, tier: '青铜泳者', badge: '🥉', rank: 'bronze' },
];

const PB_TIERS = [
  { maxSpeed: 65,  minSpeed: 0,   tier: '王者泳者', badge: '⚡', rank: 'king' },
  { maxSpeed: 80,  minSpeed: 65,  tier: '钻石泳者', badge: '👑', rank: 'diamond' },
];

function getTier(avgSpeed, bestPB) {
  if (bestPB != null && bestPB > 0) {
    const pbTier = PB_TIERS.find(t => bestPB >= t.minSpeed && bestPB <= t.maxSpeed);
    if (pbTier) return pbTier;
  }
  return AVG_TIERS.find(t => avgSpeed >= t.minSpeed && avgSpeed < t.maxSpeed) || null;
}

function formatPace(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + String(s).padStart(2, '0');
}

Page({
  data: {
    year: 2026,
    month: 6,
    today: 0,
    checkedToday: false,
    todayDistance: 0,
    records: {},
    calendar: [],
    showModal: false,
    modalDay: 0,
    modalDistance: '',
    modalDuration: '',
    modalStroke: '',
    modalIsToday: false,
    checkInLoading: false,
    monthlyTotal: 0,
    weeklyTotal: 0,
    rankPercent: 0,
    activeDays: 0,
    totalDuration: 0,
    weekDays: [],
    isCurrentMonth: true,
    calTouchStartX: 0,
    strokeStats: [],
    progression: null,
    encouragement: '',
    showCompetitionTip: false,
    userTierInfo: null,
    competitions: [],
    bestPaceFormatted: '',
    bestPaceEmoji: '⏱',
    specialTitle: '',
    youLongShow: 1
  },

  onLoad() {
    const now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      today: now.getDate()
    });
    this.syncYouLongShow();
    this.loadData();
    this.loadUserStats();
    this.loadEncouragement();
  },

  onShow() {
    this.loadData();
    this.loadUserStats();
    this.loadEncouragement();
  },

  async loadData() {
    try {
      const now = new Date();
      const today = now.getDate();
      const isCurrentMonth = now.getFullYear() === this.data.year && (now.getMonth() + 1) === this.data.month;

      const result = await request.callFunction('getCheckIns', {
        year: this.data.year,
        month: this.data.month
      }, { showLoad: false, showError: false });

      const records = result?.records || {};

      this.setData({
        today,
        records,
        isCurrentMonth,
        checkedToday: isCurrentMonth && !!records[today],
        todayDistance: records[today]?.distance || 0
      });
      this.buildCalendar();
      this.computeStats();
    } catch (e) {
      console.warn('加载打卡数据失败:', e);
      this.buildCalendar();
    }
  },

  getIntensity(distance) {
    if (!distance || distance <= 0) return 0;
    if (distance < 500) return 1;
    if (distance < 1000) return 2;
    return 3;
  },

  buildCalendar() {
    const { year, month, today, records } = this.data;
    const totalDays = new Date(year, month, 0).getDate();
    const startWeek = new Date(year, month - 1, 1).getDay();
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;

    const calendar = [];

    for (let i = 0; i < startWeek; i++) {
      calendar.push({ day: 0, type: 'empty' });
    }

    for (let d = 1; d <= totalDays; d++) {
      const hasRecord = !!records[d];
      const distance = records[d]?.distance || 0;
      const isToday = isCurrentMonth && d === today;
      const isFuture = isCurrentMonth && d > today;
      const intensity = this.getIntensity(distance);
      let type = 'normal';
      if (isToday) type = 'today';
      else if (isFuture) type = 'future';
      else if (hasRecord && distance > 0) type = 'record';
      else if (hasRecord) type = 'checked';

      calendar.push({ day: d, type, hasRecord, distance, isToday, intensity });
    }

    this.setData({ calendar });
  },

  computeStats() {
    const { records, year, month } = this.data;
    const now = new Date();

    let monthlyTotal = 0;
    let activeDays = 0;
    const dayKeys = Object.keys(records).map(Number).sort((a, b) => a - b);

    dayKeys.forEach(d => {
      const dist = records[d]?.distance || 0;
      if (dist > 0) {
        monthlyTotal += dist;
        activeDays++;
      }
    });

    let weeklyTotal = 0;
    const today = now.getDate();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = d.getDate();
      const dist = d.getMonth() + 1 === month && d.getFullYear() === year && records[key]?.distance || 0;
      if (dist > 0) weeklyTotal += dist;
      const labels = ['日', '一', '二', '三', '四', '五', '六'];
      weekDays.push({
        label: labels[i],
        distance: dist,
        isToday: d.getDate() === today && d.getMonth() === now.getMonth()
      });
    }

    const dailyAvg = activeDays > 0 ? monthlyTotal / activeDays : 0;
    let rankPercent = 0;
    if (dailyAvg >= 2000) rankPercent = '95%';
    else if (dailyAvg >= 1500) rankPercent = '85%';
    else if (dailyAvg >= 1000) rankPercent = '70%';
    else if (dailyAvg >= 500) rankPercent = '50%';
    else if (dailyAvg >= 200) rankPercent = '30%';
    else if (dailyAvg > 0) rankPercent = '15%';
    else rankPercent = '0%';

    const strokeStats = this.computeStrokeStats(records);

    let bestPace = Infinity;
    let bestPaceStroke = '';
    let monthMaxDistance = 0;
    dayKeys.forEach(d => {
      const dist = records[d]?.distance || 0;
      const dur = records[d]?.duration || 0;
      if (dist > monthMaxDistance) monthMaxDistance = dist;
      if (dist > 0 && dur > 0) {
        const pace = dur / (dist / 100);
        if (pace < bestPace) {
          bestPace = pace;
          bestPaceStroke = records[d]?.stroke || '';
        }
      }
    });

    const STROKE_EMOJI_LOCAL = { freestyle: '🏊', breaststroke: '🐸', backstroke: '🌊', butterfly: '🦋' };
    const bestPaceFormatted = bestPace < Infinity ? formatPace(bestPace) : '';
    const bestPaceEmoji = STROKE_EMOJI_LOCAL[bestPaceStroke] || '⏱';
    const specialTitle = (monthlyTotal > 45000 || monthMaxDistance > 12000) ? '毅力之星' : '';

    this.setData({ monthlyTotal, weeklyTotal, rankPercent, activeDays, weekDays, strokeStats, bestPaceFormatted, bestPaceEmoji, specialTitle });
    this.loadProgression(strokeStats);
  },

  computeStrokeStats(records) {
    const stats = {};
    strokesData.forEach(s => {
      stats[s.id] = {
        id: s.id,
        name: s.name,
        emoji: s.emoji,
        color: s.color,
        totalDistance: 0,
        totalDuration: 0,
        sessions: 0,
        bestPace: Infinity
      };
    });

    Object.keys(records).forEach(d => {
      const r = records[d];
      const dist = r?.distance || 0;
      const dur = r?.duration || 0;
      const stroke = r?.stroke || '';
      if (dist > 0 && dur > 0 && stats[stroke]) {
        stats[stroke].totalDistance += dist;
        stats[stroke].totalDuration += dur;
        stats[stroke].sessions++;
        const pace = dur / (dist / 100);
        if (pace < stats[stroke].bestPace) {
          stats[stroke].bestPace = pace;
        }
      }
    });

    return Object.values(stats)
      .filter(s => s.sessions > 0)
      .map(s => {
        const avg = s.totalDistance > 0
          ? Math.round((s.totalDuration / (s.totalDistance / 100)) * 10) / 10
          : 0;
        const bestPB = s.bestPace < Infinity ? Math.round(s.bestPace * 10) / 10 : null;
        const tier = getTier(avg, bestPB);
        return {
          ...s,
          avgSpeed100m: avg,
          bestPB,
          tier: tier ? tier.tier : '-',
          badge: tier ? tier.badge : '',
          rank: tier ? tier.rank : ''
        };
      })
      .sort((a, b) => a.avgSpeed100m - b.avgSpeed100m);
  },

  async loadProgression(strokeStats) {
    if (!strokeStats || strokeStats.length === 0) {
      this.setData({ progression: null, showCompetitionTip: false, userTierInfo: null, competitions: [] });
      return;
    }

    const bestStroke = strokeStats[0];
    const tier = getTier(bestStroke.avgSpeed100m, bestStroke.bestPB);
    const isDiamond = (tier && (tier.rank === 'diamond' || tier.rank === 'king')) || this.data.specialTitle;
    const userTierInfo = tier ? { stroke: bestStroke, tier: tier.tier, badge: tier.badge } : null;

    if (!isDiamond) {
      this.setData({
        progression: null,
        showCompetitionTip: true,
        userTierInfo,
        competitions: []
      });
      return;
    }

    try {
      const result = await request.callFunction('getProgressions', {
        stroke: bestStroke.id,
        speedPer100m: bestStroke.avgSpeed100m
      }, { showLoad: false, showError: false });

      const data = result?.data || result;
      const compResult = await request.callFunction('getCompetitions', {}, { showLoad: false, showError: false });
      const competitions = compResult?.list || [];

      this.setData({
        progression: data?.current
          ? { stroke: bestStroke, current: data.current, next: data.next }
          : null,
        showCompetitionTip: false,
        userTierInfo,
        competitions
      });
    } catch (e) {
      console.warn('加载进阶数据失败:', e);
      this.setData({
        showCompetitionTip: false,
        userTierInfo,
        competitions: []
      });
    }
  },

  loadEncouragement() {
    const idx = (new Date().getDate() - 1) % encouragements.length;
    this.setData({ encouragement: encouragements[idx] });
  },

  async syncYouLongShow() {
    try {
      const result = await request.callFunction('getGlobalConfig', {
        key: 'youLongShow'
      }, { showLoad: false, showError: false });
      const val = result && result.value !== undefined ? Number(result.value) : 1;
      this.setData({ youLongShow: val });
    } catch (e) {
      this.setData({ youLongShow: 1 });
    }
  },

  goToCompetitions() {
    wx.navigateTo({ url: '/pages/competitions/competitions' });
  },

  // 滑动切月
  onCalTouchStart(e) {
    this.setData({ calTouchStartX: e.touches[0].clientX });
  },

  onCalTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - this.data.calTouchStartX;
    if (Math.abs(dx) < 50) return;
    if (dx > 0) {
      this.prevMonth();
    } else {
      const now = new Date();
      const isCurrentMonth = now.getFullYear() === this.data.year && (now.getMonth() + 1) === this.data.month;
      if (!isCurrentMonth) this.nextMonth();
    }
  },

  prevMonth() {
    let { year, month } = this.data;
    if (month === 1) { year--; month = 12; }
    else { month--; }
    this.setData({ year, month, checkedToday: false, todayDistance: 0 });
    this.loadData();
  },

  nextMonth() {
    let { year, month } = this.data;
    if (month === 12) { year++; month = 1; }
    else { month++; }
    this.setData({ year, month, checkedToday: false, todayDistance: 0 });
    this.loadData();
  },

  goToToday() {
    const now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      today: now.getDate()
    });
    this.loadData();
  },

  onDayTap(e) {
    const day = e.currentTarget.dataset.day;
    if (!day) return;

    const now = new Date();
    const isCurrentMonth = now.getFullYear() === this.data.year && (now.getMonth() + 1) === this.data.month;
    if (isCurrentMonth && day > now.getDate()) return;

    const record = this.data.records[day];
    this.setData({
      showModal: true,
      modalDay: day,
      modalIsToday: isCurrentMonth && day === now.getDate(),
      modalDistance: record ? String(record.distance || '') : '',
      modalDuration: record?.duration ? String(Math.round(record.duration / 60)) : '',
      modalStroke: record?.stroke || ''
    });
  },

  onModalInput(e) {
    this.setData({ modalDistance: e.detail.value });
  },

  onDurationInput(e) {
    this.setData({ modalDuration: e.detail.value });
  },

  onStrokeSelect(e) {
    this.setData({ modalStroke: e.currentTarget.dataset.stroke });
  },

  async saveDistance() {
    const { year, month, modalDay, modalDistance, modalDuration, modalStroke, modalIsToday } = this.data;
    const distance = parseInt(modalDistance) || 0;
    const durationMin = parseInt(modalDuration) || 0;
    const duration = durationMin * 60;
    const stroke = modalStroke || '';
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(modalDay).padStart(2, '0')}`;

    try {
      await request.callFunction('checkIn', {
        distance: distance,
        duration: duration,
        stroke: stroke,
        date: dateStr
      }, { showLoad: true });

      const records = { ...this.data.records };
      records[modalDay] = { distance, duration, stroke };

      const now = new Date();
      const today = now.getDate();
      const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
      const isToday = modalIsToday || (isCurrentMonth && modalDay === today);

      this.setData({
        showModal: false,
        records,
        checkedToday: isCurrentMonth && (isToday || !!records[today]),
        todayDistance: isToday ? distance : (records[today]?.distance || 0)
      });
      this.buildCalendar();
      this.computeStats();
      this.loadUserStats();
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },
  noclose(){

  },
  closeModal() {
    this.setData({ showModal: false });
  },

  async doCheckIn() {
    if (this.data.checkInLoading) return;
    this.setData({ checkInLoading: true });

    try {
      const realToday = new Date().getDate();
      const record = this.data.records[realToday];

      this.setData({
        showModal: true,
        modalDay: realToday,
        modalIsToday: true,
        modalDistance: record ? String(record.distance || '') : '',
        modalDuration: record?.duration ? String(Math.round(record.duration / 60)) : '',
        modalStroke: record?.stroke || '',
        checkInLoading: false
      });
    } catch (e) {
      this.setData({ checkInLoading: false });
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  async loadUserStats() {
    try {
      const now = new Date();
      const result = await request.callFunction('getUserStats', {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        today: now.getDate()
      }, { showLoad: false, showError: false });
      const data = result?.data || result || {};
      const totalSec = data.totalDuration || 0;
      let totalDurationText = '';
      if (totalSec >= 3600) {
        totalDurationText = (totalSec / 3600).toFixed(1) + 'h';
      } else {
        totalDurationText = Math.round(totalSec / 60) + 'min';
      }
      this.setData({
        totalDuration: data.totalDuration || 0,
        totalDurationText
      });
    } catch (e) {
      console.warn('加载用户统计失败:', e);
    }
  }
});
