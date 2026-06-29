// pages/featured-detail/featured-detail.js
const request = require('../../utils/request.js');

Page({
  data: {
    // 内容数据
    contentData: {
      title: '',
      description: '',
      courseInfo: []
    },
    // 媒体列表（图片和视频）
    mediaList: [],
    // 轮播图自动播放
    autoplay: true,
    submitting: false,
    // 当前播放的视频索引
    currentVideoIndex: -1,
    // 表单数据
    formData: {
      name: '',
      phone: '',
      remark: ''
    },
    // 订阅消息模板ID（需要在微信公众平台申请）
    // 配置说明：打开 cloudfunctions/sendSubscribeMessage/index.js 查看如何申请模板
    subscribeTemplateId: 'YOUR_USER_TEMPLATE_ID', // 替换为你的模板ID
    // 报名表单是否显示（由数据库配置控制）
    registrationVisible: true // 默认显示，加载配置后会更新
  },

  onLoad(options) {
    // 加载全局配置
    this.loadGlobalConfig();

    // 从上一页接收参数
    if (options.id) {
      this.loadContentDetail(options.id)
    } else {
      // 如果没有传入ID，加载默认数据（示例数据）
      this.loadDefaultData()
    }
  },

  async loadGlobalConfig() {
    try {
      const cached = wx.getStorageSync('globalConfig_registration');
      if (cached && Date.now() - cached.time < 5 * 60 * 1000) {
        this.setData({ registrationVisible: cached.visible !== false });
        return;
      }

      const res = await request.callFunction('getGlobalConfig', {
        key: 'registration_form'
      }, {
        showLoad: false,
        showError: false
      });

      const visible = res?.visible !== false;
      wx.setStorageSync('globalConfig_registration', { visible: res?.visible, time: Date.now() });
      this.setData({ registrationVisible: visible });
    } catch (error) {
      console.error('加载全局配置失败:', error);
      this.setData({ registrationVisible: true });
    }
  },

  // 加载内容详情
  loadContentDetail(id) {
    wx.showLoading({ title: '加载中...' })

    // 这里应该调用云函数获取详情数据
    // wx.cloud.callFunction({
    //   name: 'getFeaturedDetail',
    //   data: { id }
    // }).then(res => {
    //   this.setData({
    //     contentData: res.result.data,
    //     mediaList: res.result.mediaList
    //   })
    //   wx.hideLoading()
    // }).catch(err => {
    //   wx.hideLoading()
    //   wx.showToast({ title: '加载失败', icon: 'none' })
    // })

    // 临时使用模拟数据
    setTimeout(() => {
      this.loadDefaultData()
      wx.hideLoading()
    }, 500)
  },

  // 加载默认数据（示例）
  async loadDefaultData() {
    const mediaList = [
      {
        type: 'image',
        url: 'https://lovebeyonddays.com/common/zi_2.png'
      },
      {
        type: 'image',
        url: 'https://lovebeyonddays.com/common/die_2.png'
      },
      {
        type: 'video',
        url: 'https://lovebeyonddays.com/common/video3.mp4'
      }
    ];

    // 处理图片URL - 将cloud://转换为临时HTTP链接，解决iOS显示问题
    try {
      // 提取所有需要转换的URL
      const urlsToConvert = mediaList.map(item => item.url);
      const convertedUrls = await request.getTempFileURL(urlsToConvert);

      // 更新mediaList中的URL
      const processedMediaList = mediaList.map((item, index) => ({
        ...item,
        url: Array.isArray(convertedUrls) ? convertedUrls[index] : convertedUrls
      }));

      this.setData({
        contentData: {
          title: '游泳培训课程',
          description: '专业教练一对一指导，零基础也能快速学会游泳。提供成人班、儿童班、私教课等多种课程选择。',
          courseInfo: [
            { label: '课程时长', value: '10课时/期' },
            { label: '上课时间', value: '周一至周日 9:00-21:00' },
            { label: '上课地点', value: '市体育中心游泳馆' },
            { label: '课程费用', value: '￥1980起' }
          ]
        },
        mediaList: processedMediaList
      });
    } catch (error) {
      console.error('转换图片URL失败:', error);
      // 失败时使用原始URL
      this.setData({
        contentData: {
          title: '游泳培训课程',
          description: '专业教练一对一指导，零基础也能快速学会游泳。提供成人班、儿童班、私教课等多种课程选择。',
          courseInfo: [
            { label: '课程时长', value: '10课时/期' },
            { label: '上课时间', value: '周一至周日 9:00-21:00' },
            { label: '上课地点', value: '市体育中心游泳馆' },
            { label: '课程费用', value: '￥1980起' }
          ]
        },
        mediaList: mediaList
      });
    }
  },

  // 视频播放事件
  onVideoPlay(e) {
    const index = e.currentTarget.dataset.index
    // 暂停轮播图自动播放
    this.setData({
      autoplay: false,
      currentVideoIndex: index
    })
  },

  // 表单输入事件
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value
    })
  },

  onRemarkInput(e) {
    this.setData({
      'formData.remark': e.detail.value
    })
  },

  // 验证手机号
  validatePhone(phone) {
    const reg = /^1[3-9]\d{9}$/
    return reg.test(phone)
  },

  // 提交报名
  onSubmit() {
    const { name, phone, remark } = this.data.formData

    // 表单验证
    if (!name || !name.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      })
      return
    }

    if (!phone || !phone.trim()) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    if (!this.validatePhone(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }

    // 先请求订阅消息授权，授权后再提交
    this.requestSubscribe()
  },

  // 请求订阅消息授权
  requestSubscribe() {
    const templateId = this.data.subscribeTemplateId

    // 如果未配置模板ID，直接提交（跳过订阅）
    if (!templateId || templateId === 'YOUR_USER_TEMPLATE_ID') {
      console.log('未配置订阅消息模板ID，跳过订阅授权')
      this.submitRegistration()
      return
    }

    // 请求订阅消息
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        console.log('订阅授权结果:', res)
        // 无论用户是否同意订阅，都继续提交报名
        // res[templateId] === 'accept' 表示用户同意
        // res[templateId] === 'reject' 表示用户拒绝
        this.submitRegistration()
      },
      fail: (err) => {
        console.error('订阅授权失败:', err)
        // 订阅失败也继续提交报名
        this.submitRegistration()
      }
    })
  },

  // 提交报名信息
  submitRegistration() {
    if (this.data.submitting) return;
    const { name, phone, remark } = this.data.formData

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' })

    request.callFunction('submitRegistration', {
      name: name.trim(),
      phone: phone.trim(),
      remark: remark.trim(),
      contentId: this.data.contentData.id || '',
      contentTitle: this.data.contentData.title || '游泳培训课程'
    }, {
      showLoad: false
    }).then(res => {
      wx.hideLoading()

      if (res.code === 0) {
        wx.showModal({
          title: '提交成功',
          content: '我们将尽快与您联系，请保持手机畅通',
          showCancel: false,
          success: () => {
            this.setData({
              formData: { name: '', phone: '', remark: '' }
            })
          }
        })
      } else {
        wx.showToast({
          title: res.message || '提交失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('提交报名失败:', err)
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({ submitting: false });
    })
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: this.data.contentData.title,
      path: `/pages/featured-detail/featured-detail?id=${this.data.contentData.id || ''}`,
      imageUrl: this.data.mediaList.length > 0 ? this.data.mediaList[0].url : ''
    }
  }
})
