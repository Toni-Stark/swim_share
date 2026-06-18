const auth = require('../../utils/auth.js');

Page({
  data: {
    loading: false,
    redirectUrl: '',
    agreed: false
  },

  onLoad(options) {
    if (auth.checkLogin()) {
      wx.switchTab({
        url: '/pages/index/index'
      });
      return;
    }

    if (options.redirect) {
      this.setData({ redirectUrl: decodeURIComponent(options.redirect) });
    }
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  openAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement'
    });
  },

  backHome(){
    wx.navigateBack()
  },  
  openPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    });
  },

  async handleLogin() {
    if (this.data.loading) {
      return;
    }

    this.setData({ loading: true });

    try {
      if (!wx.cloud) {
        wx.showModal({
          title: '提示',
          content: '云开发未初始化，请检查配置',
          showCancel: false
        });
        this.setData({ loading: false });
        return;
      }

      const userInfo = await auth.getUserProfile();
      console.log('获取到用户信息:', userInfo);

      const result = await auth.doLogin(userInfo);
      console.log('登录成功:', result);

      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        const redirectUrl = this.data.redirectUrl;
        if (redirectUrl) {
          wx.redirectTo({ url: redirectUrl });
        } else {
          wx.navigateBack({
            fail: () => {
              wx.switchTab({ url: '/pages/index/index' });
            }
          });
        }
      }, 1500);

    } catch (error) {
      console.error('登录失败:', error);

      const errorMsg = error.message || error.errMsg || '登录失败';
      wx.showModal({
        title: '登录失败',
        content: `错误信息：${errorMsg}\n\n请确保：\n1. login云函数已部署\n2. users集合已创建\n3. 云开发环境已配置`,
        showCancel: false
      });

      this.setData({ loading: false });
    }
  }
});
