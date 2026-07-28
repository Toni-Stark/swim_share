const request = require('../../utils/request.js');
const auth = require('../../utils/auth.js');
const util = require('../../utils/util.js');

Page({
  data: {
    dynamicsList: [],
    adsList: [],
    officialList: [],
    compList: [],
    feedCards: [],
    dynamicsPage: 1,
    pageSize: 10,
    dynamicsHasMore: true,
    hasMore: true,
    openid: null,
    loading: false,
    shareInfo: null,
    userInfo: null,
    isShow: false,
    filterSubscribed: false,
    youLongShow: 1
  },

  onLoad(options){
    const { from } = options;
    this.syncYouLongShow();
    if (from === 'share') {
      this.trySilentLogin();
    }
    this.loadUserInfo();
    this.loadAll();
  },

  async loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({
          userInfo: userInfo,
          isShow: userInfo.is_show !== false
        });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  async trySilentLogin() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const openid = wx.getStorageSync('openid');
      if (userInfo && openid) {
        this.setData({ openid });
        this.refreshAll();
      }
    } catch (error) {
      console.warn('静默登录跳过:', error);
    }
  },

  onShow() {
    this.loadUserInfo();
    this.syncYouLongShow();
    if (wx.getStorageSync('_needRefresh')) {
      wx.removeStorageSync('_needRefresh');
      this.refreshAll();
    }
  },

  onPullDownRefresh() {
    this.refreshAll();
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

  onReachBottom() {
    if (this.data.dynamicsHasMore && !this.data.loading) {
      this.setData({ dynamicsPage: this.data.dynamicsPage + 1 });
      this.loadDynamics();
    }
  },

  refreshAll() {
    this.setData({
      dynamicsPage: 1,
      dynamicsList: [],
      dynamicsHasMore: true
    });
    this.loadAll();
  },

  async loadAll() {
    await Promise.all([
      this.loadDynamics(true),
      this.loadAds(),
      this.loadOfficial(),
      this.loadCompetitions()
    ]);
    this.mergeFeed();
  },

  mergeFeed() {
    const { dynamicsList, adsList, officialList, compList } = this.data;
    const cards = [];

    dynamicsList.forEach(d => cards.push({ ...d, cardType: 'dynamic', sortTime: d.createTime }));
    adsList.forEach(a => cards.push({ ...a, cardType: a.cardType || 'ad', sortTime: a.createTime }));
    officialList.forEach(o => cards.push({ ...o, cardType: 'official', sortTime: o.publishTime || o.createTime }));
    compList.forEach(c => cards.push({ ...c, cardType: 'competition', sortTime: c.createTime }));

    cards.sort((a, b) => new Date(b.sortTime) - new Date(a.sortTime));

    this.setData({ feedCards: cards, hasMore: this.data.dynamicsHasMore });
  },

  async loadDynamics(isPullRefresh = false) {
    if (this.data.loading) return;
    const openid = wx.getStorageSync('openid');
    this.setData({ loading: true, openid });

    try {
      if (!wx.cloud || !wx.cloud.callFunction) {
        this.loadMockData(isPullRefresh);
        return;
      }

      const params = {
        page: this.data.dynamicsPage,
        pageSize: this.data.pageSize,
        subscribedOnly: this.data.filterSubscribed
      };

      const result = await request.callFunction('getUserDynamics', params, {
        showLoad: !isPullRefresh
      });

      const processedList = await request.processDynamicsImages(result.list);
      const formattedList = processedList.map(item => ({
        ...item,
        displayTime: util.formatRelativeTime(item.createTime)
      }));

      const newList = this.data.dynamicsPage === 1 ? formattedList : [...this.data.dynamicsList, ...formattedList];

      this.setData({
        dynamicsList: newList,
        dynamicsHasMore: result.hasMore,
        loading: false
      });

      if (isPullRefresh) wx.stopPullDownRefresh();
    } catch (error) {
      console.error('加载动态失败:', error);
      this.loadMockData(isPullRefresh);
    }
  },

  loadMockData(isPullRefresh = false) {
    this.setData({
      dynamicsList: [],
      dynamicsHasMore: false,
      loading: false
    });
    if (isPullRefresh) wx.stopPullDownRefresh();
  },

  async loadAds() {
    try {
      const result = await request.callFunction('getAds', {}, { showLoad: false, showError: false });
      const list = result?.list || [];
      this.setData({ adsList: list });
    } catch (e) {
      console.warn('加载广告失败:', e);
    }
  },

  async loadOfficial() {
    try {
      const result = await request.callFunction('getOfficialContent', {
        page: 1,
        pageSize: 50
      }, { showLoad: false, showError: false });
      this.setData({ officialList: result?.list || [] });
    } catch (e) {
      console.warn('加载官方内容失败:', e);
    }
  },

  async loadCompetitions() {
    if (!this.data.youLongShow) return;
    try {
      const result = await request.callFunction('getCompetitions', {}, { showLoad: false, showError: false });
      const list = (result?.list || []).filter(c => c.status === 'upcoming');
      const mapped = list.map(c => ({
        _id: c._id,
        cardType: 'competition',
        title: c.name,
        description: c.description || '',
        coverUrl: c.coverImage || '',
        date: c.date,
        location: c.location,
        registrantCount: c.registrantCount || 0,
        isCreator: c.isCreator || false,
        createTime: c.createTime || Date.now()
      }));
      this.setData({ compList: mapped });
    } catch (e) {
      console.warn('加载赛事失败:', e);
    }
  },

  goToPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  onUserTap(e) {
    const userId = e.detail.userId;
    wx.navigateTo({ url: `/pages/user-profile/user-profile?id=${userId}` });
  },

  onSubscribe(e) {
    console.log('订阅状态已更新:', e.detail);
  },

  onCardTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/pages/dynamic-detail/dynamic-detail?id=${id}` });
  },

  onCompTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/pages/competition-detail/competition-detail?id=${id}` });
  },

  onAdTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/pages/ad-detail/ad-detail?id=${id}` });
  },

  onOfficialTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/pages/official-detail/official-detail?id=${id}` });
  },

  toggleFilter() {
    this.setData({ filterSubscribed: !this.data.filterSubscribed });
    this.refreshAll();
  },

  onComment(e) {
    const id = e.detail.id;
    wx.navigateTo({ url: `/pages/dynamic-detail/dynamic-detail?id=${id}` });
  },

  onShare(e) {
    const { id, item } = e.detail;
    const dynamic = item || this.data.dynamicsList.find(d => d._id === id);
    if (!dynamic) return;
    this.setData({ shareInfo: dynamic });
  },

  onAdShare(e) {
    this.setData({ shareInfo: e.detail.item });
  },

  onOfficialShare(e) {
    this.setData({ shareInfo: e.detail.item });
  },

  onDelete(e) {
    const id = e.detail.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除这条动态吗？',
      success: (res) => {
        if (res.confirm) this.deleteDynamic(id);
      }
    });
  },

  async deleteDynamic(id) {
    try {
      wx.showLoading({ title: '删除中...' });
      await request.callFunction('deleteDynamic', { dynamicId: id });
      const newList = this.data.dynamicsList.filter(item => item._id !== id);
      this.setData({ dynamicsList: newList });
      this.mergeFeed();
      wx.hideLoading();
      wx.showToast({ title: '删除成功', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  onShareAppMessage() {
    const item = this.data.shareInfo;
    if (!item) {
      return {
        title: '发现精彩游龙',
        path: '/pages/dynamics/dynamics?from=share'
      };
    }

    let shareTitle = '', sharePath = '';
    if (item.cardType === 'dynamic' || item.userInfo) {
      shareTitle = item.title || (item.content || '').substring(0, 30) || `${item.userInfo?.nickName || '用户'}的游龙`;
      sharePath = `/pages/dynamic-detail/dynamic-detail?id=${item._id}&from=share`;
    } else if (item.cardType === 'ad' || item.cardType === 'competition') {
      shareTitle = item.title || '推荐消息';
      sharePath = `/pages/ad-detail/ad-detail?id=${item._id}&from=share`;
    } else {
      shareTitle = item.title || '官方公告';
      sharePath = `/pages/official-detail/official-detail?id=${item._id}&from=share`;
    }

    let shareImageUrl = '';
    if (item.images?.length) shareImageUrl = item.images[0];
    else if (item.coverUrl) shareImageUrl = item.coverUrl;

    setTimeout(() => this.setData({ shareInfo: null }), 100);

    const shareData = { title: shareTitle, path: sharePath };
    if (shareImageUrl) shareData.imageUrl = shareImageUrl;
    return shareData;
  },

  onShareTimeline() {
    const item = this.data.shareInfo;
    if (!item) return { title: '发现精彩游龙' };

    let shareTitle = '';
    if (item.title) shareTitle = item.title;
    else if (item.content) shareTitle = item.content.substring(0, 30);
    else shareTitle = item.userInfo?.nickName || '游龙';

    setTimeout(() => this.setData({ shareInfo: null }), 100);
    return { title: shareTitle, query: `id=${item._id}&from=share` };
  }
});
