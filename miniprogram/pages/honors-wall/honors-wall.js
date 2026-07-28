const request = require('../../utils/request.js');

const LEVEL_COLORS = {
  top: '#faad14',
  intermediate: '#1890ff',
  primary: '#52c41a'
};

const LEVEL_BG = {
  top: '#fffbe6',
  intermediate: '#e6f7ff',
  primary: '#f6ffed'
};

Page({
    data: {
    wallHonors: [],
    chestHonors: [],
    wallWidth: 0,
    wallHeight: 0,
    screenWidth: 375,
    screenHeight: 600,
    saving: false,
    saved: true,
    showApplyModal: false,
    shells: {}
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({
      screenWidth: sys.windowWidth,
      screenHeight: sys.windowHeight
    });
    this.loadHonors();
  },

  onShow() {
    this.loadHonors();
  },

  async loadHonors() {
    try {
      const result = await request.callFunction('getUserHonors', {}, { showLoad: true, showError: false });
      const rdata = result?.data || result || {};
      const list = rdata.list || [];
      const shells = rdata.shells || {};
      const wall = [];
      const chest = [];
      list.forEach(h => {
        if (h.placed) wall.push({ ...h, flipped: false });
        else chest.push(h);
      });
      const maxCol = Math.max(wall.length, 1);
      const wallW = this.data.screenWidth * 3;
      const cardSize = 240;
      const wallH = Math.max(maxCol * (cardSize / 3 + 20) + 200, this.data.screenHeight * 0.6);
      this.setData({
        wallHonors: wall,
        chestHonors: chest,
        wallWidth: wallW,
        wallHeight: wallH,
        shells
      });
    } catch (e) {
      console.warn('加载荣誉失败:', e);
    }
  },

  // 翻面
  onTouchStart(e) {
    const honorId = e.currentTarget.dataset.id;
    const touch = e.touches[0];
    this._touchData = { honorId, sx: touch.pageX, sy: touch.pageY, time: Date.now() };
  },

  onTouchEnd(e) {
    const td = this._touchData;
    if (!td) return;
    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.pageX - td.sx);
    const dy = Math.abs(touch.pageY - td.sy);
    const dt = Date.now() - td.time;
    // 短距离 + 短时间 = 点击
    if (dx < 10 && dy < 10 && dt < 300) {
      const idx = this.data.wallHonors.findIndex(h => h._id === td.honorId);
      if (idx >= 0) {
        this.setData({ [`wallHonors[${idx}].flipped`]: !this.data.wallHonors[idx].flipped });
      }
    }
    this._touchData = null;
  },

  // 仓库点击 → 放到墙上
  onChestTap(e) {
    const honor = e.currentTarget.dataset.honor;
    const placed = this.data.wallHonors;
    const cardW = 220, cardH = 220;
    const maxX = this.data.wallWidth - cardW;
    const maxY = this.data.wallHeight - cardH - 80;

    // 找不重叠的位置
    let x = Math.random() * maxX * 0.5 + 20;
    let y = Math.random() * maxY * 0.4 + 20;
    let attempt = 0;
    while (this.isOverlapping(x, y, cardW, cardH, placed) && attempt < 40) {
      x = Math.random() * maxX * 0.9 + 10;
      y = Math.random() * maxY * 0.8 + 10;
      attempt++;
    }

    honor.x = Math.round(x);
    honor.y = Math.round(y);
    honor.placed = true;

    const wall = [...placed, honor];
    const chest = this.data.chestHonors.filter(h => h._id !== honor._id);
    this.setData({ wallHonors: wall, chestHonors: chest });
    this.savePosition(honor._id, true, honor.x, honor.y);
  },

  // 拖拽结束
  onWallChange(e) {
    const honorId = e.currentTarget.dataset.id;
    const { x, y, source } = e.detail;
    if (source !== 'touch' && source !== 'friction') return;
    const idx = this.data.wallHonors.findIndex(h => h._id === honorId);
    if (idx < 0) return;
    this.setData({
      [`wallHonors[${idx}].x`]: x,
      [`wallHonors[${idx}].y`]: y,
      [`wallHonors[${idx}]._lastMoved`]: Date.now()
    });
    this.savePosition(honorId, true, x, y);
  },

  debounceSave: null,
  savePosition(id, placed, x, y) {
    if (this.debounceSave) clearTimeout(this.debounceSave);
    this.setData({ saving: true, saved: false });
    this.debounceSave = setTimeout(() => {
      request.callFunction('updateHonorPosition', { honorId: id, placed: !!placed, x, y }, { showLoad: false, showError: false })
        .then(() => this.setData({ saving: false, saved: true }))
        .catch(() => this.setData({ saving: false, saved: false }));
    }, 800);
  },

  // 长按移除 → 放回仓库
  onWallLongPress(e) {
    const honorId = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['放回勋章仓库'],
      success: (res) => {
        if (res.tapIndex === 0) {
          const honor = this.data.wallHonors.find(h => h._id === honorId);
          if (!honor) return;
          honor.placed = false;
          delete honor.x;
          delete honor.y;
          const wall = this.data.wallHonors.filter(h => h._id !== honorId);
          const chest = [honor, ...this.data.chestHonors];
          this.setData({ wallHonors: wall, chestHonors: chest });
          this.savePosition(honorId, false, 0, 0);
        }
      }
    });
  },

  isOverlapping(x, y, w, h, list) {
    const margin = 30;
    return list.some(item => {
      if (!item.placed || item.x === undefined) return false;
      const ix = item.x || 0, iy = item.y || 0;
      return !(x + w + margin < ix || ix + w + margin < x || y + h + margin < iy || iy + h + margin < y);
    });
  },

  copyWechat() {
    wx.setClipboardData({ data: 'lllh2033', success: () => wx.showToast({ title: '已复制微信号', icon: 'success'}) });
  },

  showApply() {
    this.setData({ showApplyModal: true });
  },

  hideApply() {
    this.setData({ showApplyModal: false });
  }
});
