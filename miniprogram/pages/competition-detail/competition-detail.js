const request = require('../../utils/request.js');

Page({
  data: {
    competition: null,
    competitionId: '',
    isAdmin: false,
    isCreator: false,
    myRegStatus: '',
    registrations: [],
    showPhoneModal: false,
    phone: '',
    submitting: false,
    loadingRegs: false,
    youLongShow: 1
  },

  onLoad(options) {
    this.syncYouLongShow();
    const id = options.id;
    this.setData({ competitionId: id });

    const pages = getCurrentPages();
    if (pages.length > 1) {
      const listPage = pages[pages.length - 2];
      const competitions = listPage.data.competitions || [];
      const index = parseInt(options.index);
      const item = competitions.find(c => c._id === id) || competitions[index];
      if (item) {
        this.setData({
          competition: item,
          isAdmin: listPage.data.isAdmin || false,
          isCreator: item.isCreator || false,
          myRegStatus: item.myRegStatus || ''
        });
      }
    }

    if (!this.data.competition) {
      this.loadCompetition(id);
    }

    if (this.data.isAdmin || this.data.isCreator) {
      this.loadRegistrations(id);
    }
  },

  onShow() {
    if ((this.data.isAdmin || this.data.isCreator) && this.data.competitionId) {
      this.loadRegistrations(this.data.competitionId);
    }
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

  async loadCompetition(id) {
    try {
      const result = await request.callFunction('getCompetitions', {}, { showLoad: true, showError: false });
      const list = result?.list || [];
      const item = list.find(c => c._id === id);
      if (item) {
        this.setData({
          competition: item,
          isAdmin: result?.isAdmin || false,
          isCreator: item.isCreator || false,
          myRegStatus: item.myRegStatus || ''
        });
        if (result?.isAdmin || item.isCreator) this.loadRegistrations(id);
      }
    } catch (e) {
      console.warn('加载赛事失败:', e);
    }
  },

  async loadRegistrations(competitionId) {
    this.setData({ loadingRegs: true });
    try {
      const result = await request.callFunction('getCompetitionRegistrations', {
        competitionId
      }, { showLoad: false, showError: false });
      this.setData({
        registrations: result?.list || [],
        loadingRegs: false
      });
    } catch (e) {
      console.warn('加载报名列表失败:', e);
      this.setData({ loadingRegs: false });
    }
  },

  openPhoneModal() {
    this.setData({ showPhoneModal: true, phone: '' });
  },

  closePhoneModal() {
    this.setData({ showPhoneModal: false });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  async submitInterest() {
    const { phone, competitionId, submitting } = this.data;
    if (submitting) return;

    if (!phone || !/^1\d{10}$/.test(phone)) {
      request.showToast('请输入正确的手机号');
      return;
    }

    this.setData({ submitting: true });

    try {
      await request.callFunction('submitCompetitionInterest', {
        competitionId,
        phone
      }, { loadText: '提交中...' });

      request.showToast('提交成功', 'success');
      this.setData({
        showPhoneModal: false,
        submitting: false,
        myRegStatus: 'pending'
      });
    } catch (e) {
      request.showToast('提交失败');
      this.setData({ submitting: false });
    }
  },

  async reviewReg(e) {
    const { id, status } = e.currentTarget.dataset;
    const actionText = status === 'approved' ? '通过' : '驳回';

    wx.showModal({
      title: `确认${actionText}`,
      content: `确定要${actionText}该报名吗？`,
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request.callFunction('reviewCompetitionRegistration', {
            registrationId: id,
            status
          }, { loadText: '处理中...' });

          request.showToast(`已${actionText}`, 'success');
          this.loadRegistrations(this.data.competitionId);
        } catch (e) {
          request.showToast('操作失败');
        }
      }
    });
  },

  callPhone(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone });
    }
  }
});
