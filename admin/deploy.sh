# ============================================================
# 游龙管理后台 — 阿里云 (Alibaba Cloud Linux 3) 部署
# 按顺序逐条执行
# ============================================================

# 1. 安装 Node.js 18
dnf install -y curl
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs
node -v && npm -v

# 2. 安装 Nginx + PM2 + Git
dnf install -y nginx git
systemctl enable nginx
systemctl start nginx
npm install -g pm2
pm2 -v

# 3. 克隆项目
cd /opt
rm -rf swim-admin
git clone https://github.com/Toni-Stark/ChengKou.git swim-admin
cd swim-admin

# 4. 创建 .env
cat > admin/server/.env << 'EOF'
PORT=3001
ADMIN_PASSWORD=admin123
JWT_SECRET=change-this-to-random-string-2026
WX_APPID=wxe3604d6ab28c58c5
WX_APPSECRET=1616d20e5eca92f58ea434b3f8550151
CLOUD_ENV_ID=cloud1-8g5xgr7v7d7daeb3
EOF

# 5. 安装依赖并构建前端
cd /opt/swim-admin/admin/server && npm install
cd /opt/swim-admin/admin/web && npm install && npm run build

# 6. 配置 Nginx
cat > /etc/nginx/conf.d/admin.conf << 'NGINX'
server {
    listen 80;
    server_name admin.lovebeyonddays.com;

    location / {
        root /opt/swim-admin/admin/web/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX

nginx -t && systemctl reload nginx

# 7. 启动后端
cd /opt/swim-admin/admin/server
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd

# 8. 设置防火墙
firewall-cmd --add-service=http --permanent 2>/dev/null
firewall-cmd --add-service=https --permanent 2>/dev/null
firewall-cmd --reload 2>/dev/null

# 验证
pm2 status
curl http://127.0.0.1:3001/api/health
echo "=== 部署完成 ==="
