const auth = require('../../utils/auth.js');
const request = require('../../utils/request.js');

Page({
  data: {
    userInfo: {},
    isLogin: false,
    todayChecked: false,
    todayDistance: 0,
    monthActiveDays: 0,
    monthDistance: 0,
    totalDistance: 0,
    totalActiveDays: 0,
    bestPaceFormatted: '',
    bestPaceEmoji: '⏱',
    youLongShow: 1
  },

  onLoad() {},

  onShow() {
    this.loadUserInfo();
    this.loadSwimStats();
    this.syncYouLongShow();
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

  async loadSwimStats() {
    const stored = auth.getStoredUserInfo();
    if (!stored.openid) return;

    try {
      if (!wx.cloud || !wx.cloud.callFunction) return;
      const now = new Date();
      const result = await request.callFunction('getUserStats', {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        today: now.getDate()
      }, { showLoad: false, showError: false });

      const data = result?.data || result || {};
      this.setData({
        todayChecked: data.todayChecked || false,
        todayDistance: data.todayDistance || 0,
        monthActiveDays: data.monthActiveDays || 0,
        monthDistance: data.monthDistance || 0,
        totalDistance: data.totalDistance || 0,
        totalActiveDays: data.totalActiveDays || 0,
        bestPaceFormatted: data.bestPaceFormatted || '',
        bestPaceEmoji: data.bestPaceEmoji || '⏱'
      });
    } catch (e) {
      console.warn('加载游泳数据失败:', e);
    }
  },

  async loadUserInfo(forceRefresh = false) {
    const stored = auth.getStoredUserInfo();

    if (!stored.userInfo || !stored.openid) {
      this.setData({
        userInfo: {
          nickName: '未登录',
          avatarUrl: 'https://lovebeyonddays.com/common/default-avatar.png',
          signature: '点击登录，开启游泳之旅',
          stats: { dynamicsCount: 0, followersCount: 0, subscriptionsCount: 0 }
        },
        isLogin: false
      });
      return;
    }

    // 先用缓存即时展示，再拉取最新数据
    this.setData({ userInfo: stored.userInfo, isLogin: true });

    if (!wx.cloud || !wx.cloud.callFunction) return;

    try {
      const result = await request.callFunction('getUserInfo', {}, { showLoad: false, showError: false });
      if (result) {
        auth.saveUserInfo(result, stored.openid);
        this.setData({ userInfo: result, isLogin: true });
      }
    } catch (error) {
      // 接口失败时不覆盖缓存数据
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  editProfile() {
    if (!this.data.isLogin) { request.showToast('请先登录'); return; }
    wx.navigateTo({ url: '/pages/edit-profile/edit-profile' });
  },

  goToHonorWall() {
    if (!this.data.isLogin) { request.showToast('请先登录'); return; }
    wx.navigateTo({ url: '/pages/honors-wall/honors-wall' });
  },

  goToSwimRecords() {
    wx.navigateTo({ url: '/pages/swim-records/swim-records' });
  },

  goToMyDynamics() {
    if (!this.data.isLogin) { request.showToast('请先登录'); return; }
    wx.navigateTo({ url: '/pages/my-dynamics/my-dynamics' });
  },

  goToMySubscriptions() {
    if (!this.data.isLogin) { request.showToast('请先登录'); return; }
    wx.navigateTo({ url: '/pages/my-likes/my-likes' });
  },

  goToMyCompetitions() {
    if (!this.data.isLogin) { request.showToast('请先登录'); return; }
    wx.navigateTo({ url: '/pages/my-competitions/my-competitions' });
  },

  goToCompetitions() {
    if (!this.data.isLogin) { request.showToast('请先登录'); return; }
    wx.navigateTo({ url: '/pages/competitions/competitions' });
  },

  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  onShareAppMessage() {
    return { title: '我的主页', path: '/pages/mine/mine' };
  }
});
