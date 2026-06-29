const request = require('../../utils/request.js');
const strokesData = require('../../data/strokes.js');

Page({
  data: {
    featuredDynamic: {
      title: '欢迎来到游泳教学平台',
      desc: '专业游泳教学，安全高效',
      image: ''
    },
    contactInfo: {
      wechat: 'lllh2033',
      qq: '3209233073'
    },
    strokes: strokesData,
  },

  onLoad() {
    this.loadFeaturedDynamic();
  },

  async loadFeaturedDynamic() {
    this.setData({
      featuredDynamic: {
        title: '2026游泳暑期训练开始报名',
        desc: '专业教练团队，小班教学，一对一指导',
        image: 'https://lovebeyonddays.com/common/zi_2.png'
      }
    });
  },

  onFeaturedCardTap() {
    wx.navigateTo({
      url: '/pages/featured-detail/featured-detail'
    });
  },

  onStrokeTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/stroke-detail/stroke-detail?id=${id}`
    });
  },

  onCoachTap() {
    wx.navigateTo({ url: '/pages/coach-detail/coach-detail' });
  },

  onLifeguardTap() {
    wx.navigateTo({ url: '/pages/lifeguard-detail/lifeguard-detail' });
  },

  onCopyWechat(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.text,
      success: () => wx.showToast({ title: '微信号已复制', icon: 'success' })
    });
  },

  onCopyQQ(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.text,
      success: () => wx.showToast({ title: 'QQ号已复制', icon: 'success' })
    });
  },

  onShareAppMessage() {
    return {
      title: '游泳打卡记录平台-赠送公开赛名额',
      path: '/pages/index/index',
      imageUrl: this.data.featuredDynamic.image
    };
  }
});
