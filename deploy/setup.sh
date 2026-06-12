#!/usr/bin/env bash
# 一鍵安裝並啟動 SocialApp（50 人併發設定）
# 適用於 Ubuntu 22.04 / Debian 12
set -e

echo "=== 1. 安裝 Nginx + PHP 8.3 FPM ==="
apt-get update -qq
apt-get install -y nginx php8.3-fpm php8.3-sqlite3 php8.3-mbstring

echo "=== 2. 安裝 Node.js（如果還沒有）==="
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "=== 3. 安裝 pm2（管理 Node.js signaling server）==="
npm install -g pm2 2>/dev/null || true

echo "=== 4. 建置 React 前端 ==="
cd /workspaces/codespaces-react
npm install
npm run build

echo "=== 5. 安裝 signaling server 套件 ==="
cd /workspaces/codespaces-react/signaling
npm install

echo "=== 6. 設定 PHP-FPM pool ==="
cp /workspaces/codespaces-react/deploy/php-fpm-pool.conf \
   /etc/php/8.3/fpm/pool.d/socialapp.conf
# 停用預設 www pool 避免衝突
sed -i 's/^\[www\]/;[www]/' /etc/php/8.3/fpm/pool.d/www.conf 2>/dev/null || true

echo "=== 7. 設定 Nginx ==="
cp /workspaces/codespaces-react/deploy/nginx.conf \
   /etc/nginx/sites-available/socialapp
ln -sf /etc/nginx/sites-available/socialapp \
       /etc/nginx/sites-enabled/socialapp
rm -f /etc/nginx/sites-enabled/default
nginx -t  # 語法檢查

echo "=== 8. 建立必要目錄與權限 ==="
mkdir -p /workspaces/codespaces-react/backend/data
mkdir -p /workspaces/codespaces-react/backend/uploads/voices
mkdir -p /workspaces/codespaces-react/backend/uploads/avatars
chown -R www-data:www-data /workspaces/codespaces-react/backend/data
chown -R www-data:www-data /workspaces/codespaces-react/backend/uploads
chmod 755 /workspaces/codespaces-react/backend/data
chmod 755 /workspaces/codespaces-react/backend/uploads

echo "=== 9. 啟動所有服務 ==="
systemctl restart php8.3-fpm
systemctl restart nginx
systemctl enable php8.3-fpm nginx

# 用 pm2 管理 signaling server（自動重啟、日誌管理）
cd /workspaces/codespaces-react/signaling
pm2 start server.js --name socialapp-signaling
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

echo ""
echo "✅ 完成！"
echo "   前端：http://localhost:80"
echo "   Signaling：http://localhost:3001"
echo "   PHP-FPM：unix:/run/php/php8.3-fpm.sock"
echo ""
echo "查看狀態："
echo "   pm2 status"
echo "   systemctl status nginx"
echo "   systemctl status php8.3-fpm"
