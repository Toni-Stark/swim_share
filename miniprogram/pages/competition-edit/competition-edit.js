const request = require('../../utils/request.js');

Page({
  data: {
    isEdit: false,
    competitionId: '',
    youLongShow: 1,
    form: {
      name: '',
      date: '',
      location: '',
      description: '',
      coverImage: '',
      status: 'upcoming'
    },
    saving: false
  },

  onLoad(options) {
    this.syncYouLongShow();
    if (options.id) {
      this.setData({ isEdit: true, competitionId: options.id });
      this.loadCompetition(options.id, options.index);
    }
  },

  async syncYouLongShow() {
    try {
      const result = await request.callFunction('getGlobalConfig', {
        key: 'youLongShow'
      }, { showLoad: false, showError: false });
      const val = result && result.value !== undefined ? Number(result.value) : 1;
      this.setData({ youLongShow: val });
      if (!val) {
        request.showToast('功能暂未开放');
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (e) {
      this.setData({ youLongShow: 1 });
    }
  },

  loadCompetition(id, index) {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      const prevPage = pages[pages.length - 2];
      const list = prevPage.data.competitions || [];
      const item = list.find(c => c._id === id) || list[parseInt(index)];
      if (item) {
        this.setData({
          form: {
            name: item.name || '',
            date: item.date || '',
            location: item.location || '',
            description: item.description || '',
            coverImage: item.coverImage || '',
            status: item.status || 'upcoming'
          }
        });
      }
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ 'form.date': e.detail.value });
  },

  onStatusChange(e) {
    const status = e.detail.value === '0' ? 'upcoming' : 'ended';
    this.setData({ 'form.status': status });
  },

  chooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...', mask: true });
        request.uploadToQiniu(tempFilePath, 'competitions').then(url => {
          wx.hideLoading();
          this.setData({ 'form.coverImage': url });
        }).catch(() => {
          wx.hideLoading();
          request.showToast('上传失败');
        });
      }
    });
  },

  async save() {
    const { form, isEdit, competitionId, saving } = this.data;
    if (saving) return;

    if (!form.name.trim()) { request.showToast('请输入赛事名称'); return; }
    if (!form.date) { request.showToast('请选择日期'); return; }
    if (!form.location.trim()) { request.showToast('请输入地点'); return; }

    this.setData({ saving: true });

    try {
      const action = isEdit ? 'update' : 'create';
      const data = { ...form };
      if (isEdit) data._id = competitionId;

      await request.callFunction('manageCompetition', { action, data }, {
        loadText: '保存中...'
      });

      request.showToast('保存成功', 'success');
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (e) {
      console.error('保存失败:', e);
      request.showToast('保存失败');
      this.setData({ saving: false });
    }
  },

  async deleteCompetition() {
    const { competitionId } = this.data;
    if (!competitionId) return;

    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，同时清除该赛事的所有报名记录',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request.callFunction('manageCompetition', {
            action: 'delete',
            data: { _id: competitionId }
          }, { loadText: '删除中...' });
          request.showToast('已删除', 'success');
          setTimeout(() => wx.navigateBack(), 1500);
        } catch (e) {
          request.showToast('删除失败');
        }
      }
    });
  }
});
