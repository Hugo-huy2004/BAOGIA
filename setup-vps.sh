#!/bin/bash

# ==============================================================================
# Script tự động cấu hình Bảo mật & Tối ưu hóa cho Ubuntu VPS (2GB RAM)
# Dành cho hệ thống Hugo Studio / Price Doc Portal
# ==============================================================================

# Định dạng màu cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}====================================================================${NC}"
echo -e "${YELLOW}   BẮT ĐẦU CẤU HÌNH BẢO MẬT & TỐI ƯU VPS (Dành cho Ubuntu Server)   ${NC}"
echo -e "${YELLOW}====================================================================${NC}"

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Lỗi: Vui lòng chạy script này với quyền root hoặc sử dụng sudo.${NC}"
  exit 1
fi

# ==============================================================================
# BƯỚC 1: CẤU HÌNH BỘ NHỚ SWAP (RAM ẢO)
# Rất quan trọng đối với VPS 2GB RAM để tránh treo máy khi quá tải (OOM crash)
# ==============================================================================
echo -e "\n${GREEN}[1/5] Kiểm tra và cấu hình bộ nhớ SWAP (RAM ảo)...${NC}"
SWAP_EXIST=$(swapon --show | wc -l)

if [ "$SWAP_EXIST" -eq 0 ]; then
  echo -e "${YELLOW}Chưa phát hiện vùng nhớ Swap. Tiến hành khởi tạo 2GB Swap file...${NC}"
  
  # Tạo file swap dung lượng 2GB
  fallocate -l 2G /swapfile
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Lệnh fallocate thất bại, thử tạo bằng dd...${NC}"
    dd if=/dev/zero of=/swapfile bs=1M count=2048
  fi
  
  # Phân quyền chỉ cho root
  chmod 600 /swapfile
  # Tạo vùng nhớ swap
  mkswap /swapfile
  # Kích hoạt swap
  swapon /swapfile
  # Ghi vào fstab để tự khởi động cùng OS
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  
  # Tối ưu hóa swappiness (Đặt bằng 10 để ưu tiên dùng RAM vật lý trước khi dùng SSD)
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  
  # Tối ưu hóa cache pressure
  sysctl vm.vfs_cache_pressure=50
  echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
  
  echo -e "${GREEN}✓ Đã tạo và tối ưu hóa thành công 2GB RAM ảo (Swap).${NC}"
else
  echo -e "${GREEN}✓ Hệ thống đã có sẵn vùng nhớ Swap. Bỏ qua bước này.${NC}"
fi

# ==============================================================================
# BƯỚC 2: CẤU HÌNH TƯỜNG LỬA UFW (FIREWALL)
# Chỉ cho phép SSH (22), HTTP (80) và HTTPS (443) đi vào hệ thống
# ==============================================================================
echo -e "\n${GREEN}[2/5] Thiết lập tường lửa UFW...${NC}"

# Reset UFW về mặc định
ufw --force reset > /dev/null

# Thiết lập quy tắc mặc định
ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null

# Mở các cổng cần thiết
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP Web'
ufw allow 443/tcp comment 'HTTPS Secure Web'

# Bật tường lửa
echo "y" | ufw enable > /dev/null

echo -e "${GREEN}✓ Tường lửa UFW đã kích hoạt thành công.${NC}"
echo -e "${YELLOW}Đang hiển thị trạng thái UFW:${NC}"
ufw status verbose

# ==============================================================================
# BƯỚC 3: CÀI ĐẶT & CẤU HÌNH FAIL2BAN
# Chống tấn công dò mật khẩu (brute-force) SSH
# ==============================================================================
echo -e "\n${GREEN}[3/5] Cài đặt và thiết lập bảo vệ Fail2ban...${NC}"

# Cài đặt dịch vụ
apt-get update > /dev/null
apt-get install -y fail2ban > /dev/null

# Cấu hình file jail.local để tránh bị ghi đè
cat <<EOT > /etc/fail2ban/jail.local
[DEFAULT]
bantime = 1d
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = %(sshd_log)s
backend = %(sshd_backend)s
EOT

# Khởi động lại dịch vụ
systemctl restart fail2ban
systemctl enable fail2ban > /dev/null

echo -e "${GREEN}✓ Đã cài đặt Fail2ban. Tự động BAN IP nhập sai thông tin SSH quá 5 lần trong 24 giờ.${NC}"

# ==============================================================================
# BƯỚC 4: THIẾT LẬP BẢO MẬT SSH KEY
# (Nhắc nhở và hướng dẫn tắt password login)
# ==============================================================================
echo -e "\n${GREEN}[4/5] Hướng dẫn thắt chặt bảo mật SSH Key...${NC}"
echo -e "${YELLOW}Để ngăn cản hoàn toàn việc hacker brute-force mật khẩu SSH:${NC}"
echo -e "1. Hãy đảm bảo bạn đã tạo SSH Key trên máy tính cục bộ của bạn bằng lệnh:"
echo -e "   ${GREEN}ssh-keygen -t ed25519 -C \"your_email@example.com\"${NC}"
echo -e "2. Đưa public key lên VPS bằng cách chạy trên máy tính cục bộ:"
echo -e "   ${GREEN}ssh-copy-id -i ~/.ssh/id_ed25519.pub root@vps_ip_cua_ban${NC}"
echo -e "3. Sau khi chắc chắn đã đăng nhập được bằng SSH Key, hãy sửa file cấu hình SSH trên VPS:"
echo -e "   ${GREEN}sudo nano /etc/ssh/sshd_config${NC}"
echo -e "   Đặt giá trị: ${GREEN}PasswordAuthentication no${NC}"
echo -e "   Sau đó khởi động lại SSH: ${GREEN}sudo systemctl restart ssh${NC}"

# ==============================================================================
# BƯỚC 5: TỐI ƯU HÓA NGINX & BẢO MẬT HEADER (Hiding signatures)
# ==============================================================================
echo -e "\n${GREEN}[5/5] Cấu hình ẩn thông tin dịch vụ trên Web Server (Nginx)...${NC}"

NGINX_CONF="/etc/nginx/nginx.conf"
if [ -f "$NGINX_CONF" ]; then
  # Kiểm tra xem có dòng server_tokens off chưa
  if grep -q "server_tokens" "$NGINX_CONF"; then
    sed -i 's/server_tokens.*/server_tokens off;/g' "$NGINX_CONF"
  else
    # Thêm vào trong block http {
    sed -i '/http {/a \\tserver_tokens off;' "$NGINX_CONF"
  fi
  
  nginx -t && systemctl reload nginx
  echo -e "${GREEN}✓ Đã cấu hình ẩn phiên bản Nginx (server_tokens off).${NC}"
else
  echo -e "${YELLOW}Nginx chưa được cài đặt trực tiếp trên host này. Cấu hình sẽ tự áp dụng nếu cài đặt sau này.${NC}"
fi

# Cấu hình ẩn thông tin PHP nếu có
PHP_INI_PATHS=$(find /etc/php/ -name "php.ini" 2>/dev/null)
if [ -n "$PHP_INI_PATHS" ]; then
  for ini in $PHP_INI_PATHS; do
    sed -i 's/expose_php =.*/expose_php = Off/g' "$ini"
    echo -e "${GREEN}✓ Đã cấu hình ẩn phiên bản PHP (expose_php = Off) trong file: $ini${NC}"
  done
  # Restart php-fpm nếu đang chạy
  systemctl restart 'php*-fpm' 2>/dev/null
fi

echo -e "\n${GREEN}====================================================================${NC}"
echo -e "${GREEN}     CẤU HÌNH HOÀN TẤT! VPS CỦA BẠN ĐÃ ĐƯỢC TỐI ƯU & BẢO MẬT     ${NC}"
echo -e "${GREEN}====================================================================${NC}"
EOT

# Make the script executable
chmod +x /Users/wishpaxhugo/Documents/JOBS/PRICE_DOC/setup-vps.sh
