const request = require('../../utils/request.js');

Page({
  data: {
    registrations: [],
    loading: true,
    showUpload: false,
    currentReg: null,
    resultScore: '',
    resultRank: '',
    uploading: false,
    youLongShow: 1
  },

  onLoad() {
    this.syncYouLongShow();
    this.loadData();
  },

  onShow() {
    this.loadData();
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

  async loadData() {
    try {
      const result = await request.callFunction('getMyCompetitions', {}, {
        showLoad: false, showError: false
      });
      this.setData({
        registrations: result?.list || [],
        loading: false
      });
    } catch (e) {
      console.warn('加载我的赛事失败:', e);
      this.setData({ loading: false });
    }
  },

  openUpload(e) {
    const index = e.currentTarget.dataset.index;
    const reg = this.data.registrations[index];
    this.setData({
      showUpload: true,
      currentReg: reg,
      resultScore: reg.resultScore || '',
      resultRank: reg.resultRank || ''
    });
  },

  closeUpload() {
    this.setData({ showUpload: false, currentReg: null });
  },

  onScoreInput(e) {
    this.setData({ resultScore: e.detail.value });
  },

  onRankInput(e) {
    this.setData({ resultRank: e.detail.value });
  },

  chooseResultImage() {
    const reg = this.data.currentReg;
    if (!reg) return;

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...', mask: true });
        request.uploadToQiniu(tempFilePath, 'results').then(url => {
          wx.hideLoading();
          const index = this.data.registrations.findIndex(r => r._id === reg._id);
          if (index >= 0) {
            this.setData({
              [`registrations[${index}].resultImage`]: url,
              'currentReg.resultImage': url
            });
          }
        }).catch(() => {
          wx.hideLoading();
          request.showToast('上传失败');
        });
      }
    });
  },

  async saveResult() {
    const { currentReg, resultScore, resultRank, uploading } = this.data;
    if (!currentReg || uploading) return;

    this.setData({ uploading: true });

    try {
      await request.callFunction('uploadCompetitionResult', {
        registrationId: currentReg._id,
        resultImage: currentReg.resultImage || '',
        resultScore: resultScore.trim(),
        resultRank: resultRank.trim()
      }, { loadText: '保存中...' });

      request.showToast('保存成功', 'success');
      this.setData({ showUpload: false, uploading: false });
      this.loadData();
    } catch (e) {
      request.showToast('保存失败');
      this.setData({ uploading: false });
    }
  },

  goToDetail(e) {
    const reg = this.data.registrations[e.currentTarget.dataset.index];
    if (reg && reg.competition) {
      wx.navigateTo({
        url: `/pages/competition-detail/competition-detail?id=${reg.competitionId}`
      });
    }
  }
});
