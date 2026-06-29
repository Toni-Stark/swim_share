const request = require('../../utils/request.js');

Page({
  data: {
    competitions: [],
    isAdmin: false,
    youLongShow: 1
  },

  onLoad() {
    this.syncYouLongShow();
    this.loadCompetitions();
  },

  onShow() {
    this.loadCompetitions();
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

  async loadCompetitions() {
    try {
      const result = await request.callFunction('getCompetitions', {}, { showLoad: false, showError: false });
      this.setData({
        competitions: result?.list || [],
        isAdmin: result?.isAdmin || false
      });
    } catch (e) {
      console.warn('加载公开赛失败:', e);
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    wx.navigateTo({
      url: `/pages/competition-detail/competition-detail?id=${id}&index=${index}`
    });
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/competition-edit/competition-edit' });
  },

  goToEdit(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    wx.navigateTo({
      url: `/pages/competition-edit/competition-edit?id=${id}&index=${index}`
    });
  }
});
