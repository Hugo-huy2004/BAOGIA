// ============================================================
// CHẶNG 6 — KỸ SƯ DEVOPS & PHÁT HÀNH RA THỊ TRƯỜNG (Bài 91-100)
// Trọng tâm: vận hành hệ thống thực tế trên Internet — VPS,
// Nginx, SSL, tường lửa, PM2 — đón người dùng thật.
// ============================================================
export const DEVOPS_LESSONS = [
  {
    id: "lesson91",
    title: "91. Phân tích chi phí, Thuê & Thiết lập Máy chủ ảo VPS",
    lang: "html",
    file: "src/lesson91.html",
    duration: "55 phút",
    overview: {
      description: "Bước chân đầu tiên vào hạ tầng: so sánh nhà cung cấp VPS theo tiêu chí, chọn cấu hình vừa túi, kết nối SSH lần đầu và các thao tác an toàn ngày số 0.",
      outcomes: [
        "So sánh VPS theo 4 tiêu chí: giá, vị trí máy chủ, băng thông, cấu hình",
        "Kết nối SSH và các lệnh Linux sinh tồn: ls, cd, nano, apt",
        "Làm 3 việc an toàn ngày đầu: update, tạo user thường, tắt đăng nhập root bằng mật khẩu"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**VPS** (Virtual Private Server) — máy chủ ảo riêng, toàn quyền root. Nhà cung cấp phổ biến: DigitalOcean, Vultr, Linode, AWS Lightsail, hoặc trong nước (Viettel, VNG Cloud). Đồ án chỉ cần: **1 vCPU, 1GB RAM, Ubuntu Server LTS** (~5-6 USD/tháng); chọn location Singapore cho độ trễ VN thấp.

Kết nối và ngày số 0:
\`\`\`bash
ssh root@<ip_vps>                  # đăng nhập lần đầu
apt update && apt upgrade -y       # 1. vá hệ thống
adduser hugo && usermod -aG sudo hugo   # 2. tạo user thường có sudo
# 3. dùng SSH key thay mật khẩu:
ssh-keygen -t ed25519              # (chạy ở MÁY BẠN)
ssh-copy-id hugo@<ip_vps>          # đẩy public key lên VPS
# rồi tắt PasswordAuthentication trong /etc/ssh/sshd_config
\`\`\`

> Làm việc hằng ngày bằng user thường + sudo, không dùng root trực tiếp. IP công khai của VPS bị bot quét 24/7 ngay từ phút đầu tiên — ba việc ngày số 0 không phải tùy chọn.`,
    labSteps: [
      "Dựng bảng so sánh 3 nhà cung cấp VPS: giá gói 1GB, location gần VN, băng thông, có backup không.",
      "Viết khối <pre> chuỗi lệnh ngày số 0: ssh → apt update/upgrade → adduser + sudo → ssh-keygen → ssh-copy-id.",
      "Chú thích từng lệnh 1 dòng — tự gõ để thuộc, không dán.",
      "Viết mục 'vì sao': 3 lý do không làm việc bằng root và không dùng mật khẩu SSH.",
      "Nếu có VPS thật: thực hiện trọn chuỗi, dán kết quả lệnh whoami và lsb_release -a vào trang."
    ],
    commonMistakes: [
      { symptom: "Dùng root + mật khẩu '123456' — VPS bị chiếm sau vài giờ.", cause: "Bot brute-force SSH quét mọi IP liên tục.", fix: "SSH key ed25519 + tắt PasswordAuthentication + user thường ngay ngày đầu." },
      { symptom: "Thuê gói 8GB RAM 'cho chắc' tốn 40 USD/tháng.", cause: "Không phân tích nhu cầu.", fix: "Đồ án 1GB là đủ — nâng cấp VPS mất 2 phút khi thật sự cần, tiền lãng phí không quay lại." },
      { symptom: "Mất file key, không vào được VPS.", cause: "Không sao lưu private key.", fix: "Backup key an toàn (trình quản lý mật khẩu); nhà cung cấp nào cũng có console cứu hộ — biết trước đường lui." }
    ],
    challenge: "Viết script ngày-số-0 (setup.sh) gom toàn bộ lệnh: update, tạo user, cứng hóa SSH — chạy một phát xong máy mới.",
    checklist: [
      "Bảng so sánh 3 nhà cung cấp có số liệu",
      "Thuộc chuỗi lệnh ngày số 0 không nhìn tài liệu",
      "Giải thích được vì sao cấm root + mật khẩu"
    ],
    tasks: ["Dựng bảng so sánh VPS và khối lệnh ngày số 0: ssh, apt update, adduser, ssh-keygen, ssh-copy-id kèm chú thích."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 91: Thuê & Thiết lập VPS</title>
</head>
<body>
    <h1>Hồ sơ hạ tầng: VPS ngày số 0</h1>
    <!-- TODO 1: bảng so sánh 3 nhà cung cấp (giá/location/băng thông/backup) -->
    <!-- TODO 2: <pre> chuỗi lệnh: ssh root@ip, apt update && apt upgrade,
         adduser + usermod -aG sudo, ssh-keygen, ssh-copy-id -->
    <!-- TODO 3: 3 lý do cấm root + mật khẩu -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("<table") && c.includes("ssh") && c.includes("apt update") && c.includes("adduser") && c.includes("ssh-keygen") && c.includes("ssh-copy-id");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Cách đăng nhập SSH an toàn chuẩn production là gì?",
      snippet: "ssh hugo@vps — xác thực bằng [ ??? ]",
      options: [
        { text: "Mật khẩu dài", correct: false },
        { text: "SSH key (ed25519) + tắt đăng nhập bằng mật khẩu", correct: true },
        { text: "Mã OTP qua SMS", correct: false },
        { text: "Không cần xác thực trong mạng nội bộ", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "VPS là gì?", o: ["Hosting chia sẻ", "Máy chủ ảo riêng có toàn quyền root", "Tên miền", "CDN"], a: 1 },
      { q: "Hệ điều hành khuyên dùng cho VPS đồ án?", o: ["Windows 11", "Ubuntu Server LTS", "macOS", "Android"], a: 1 },
      { q: "Vì sao không làm việc hằng ngày bằng root?", o: ["Root chạy chậm", "Một lệnh sai là phá cả máy, không có lớp chặn — dùng user thường + sudo", "Root tốn phí", "Ubuntu cấm"], a: 1 },
      { q: "Việc ĐẦU TIÊN sau khi ssh vào VPS mới?", o: ["Cài game", "apt update && apt upgrade — vá lỗ hổng hệ thống", "Đổi hostname", "Cài GUI"], a: 1 }
    ]
  },
  {
    id: "lesson92",
    title: "92. Cài đặt môi trường Node.js / PHP hiệu năng cao trên Linux",
    lang: "html",
    file: "src/lesson92.html",
    duration: "55 phút",
    overview: {
      description: "Biến VPS trắng thành máy chạy được code: cài Node.js LTS từ NodeSource (hoặc PHP-FPM), clone repo, cài dependencies production và tách cấu hình bằng .env trên server.",
      outcomes: [
        "Cài Node.js LTS đúng cách qua NodeSource (không dùng bản apt cũ)",
        "Clone repo + npm ci --omit=dev cho production",
        "Tạo .env trên server bằng nano — hiểu vì sao secret không đi cùng git"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Chuỗi cài môi trường Node production:

\`\`\`bash
# Node.js LTS từ NodeSource (bản apt mặc định thường quá cũ)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v && npm -v                    # kiểm chứng

# Lấy code và cài phụ thuộc
git clone https://github.com/<ban>/<do-an>.git && cd <do-an>
npm ci --omit=dev                    # ci = cài đúng theo lockfile, bỏ devDependencies

# Cấu hình bí mật — tạo TẠI CHỖ, không nằm trong git (bài 67)
nano .env                            # JWT_SECRET, GEMINI_KEY, DB_URI...
NODE_ENV=production node server.js   # chạy thử lần đầu
\`\`\`

> \`npm ci\` khác \`npm install\`: ci cài CHÍNH XÁC theo package-lock.json — production phải tái lập được từng byte. Stack PHP thì thay bằng: \`apt install php8.2-fpm php8.2-mysql composer\`. \`NODE_ENV=production\` bật tối ưu của framework và tắt thông báo debug.`,
    labSteps: [
      "Viết khối lệnh cài Node LTS qua NodeSource + kiểm chứng node -v (chú thích vì sao không apt install nodejs trực tiếp).",
      "Viết khối clone repo + npm ci --omit=dev — chú thích khác biệt ci vs install.",
      "Viết nội dung .env production mẫu (che giá trị): NODE_ENV, PORT, JWT_SECRET, GEMINI_KEY, DB_URI.",
      "Viết khối chạy thử: NODE_ENV=production node server.js + curl localhost:8081/api/health kiểm tra.",
      "Viết nhánh PHP song song (apt install php-fpm composer) cho bạn nào chọn stack LAMP.",
      "Có VPS thật: thực hiện trọn chuỗi và dán kết quả curl health-check vào trang."
    ],
    commonMistakes: [
      { symptom: "apt install nodejs ra bản Node 12 cổ đại, code ES mới sập.", cause: "Kho apt mặc định lỗi thời.", fix: "Luôn cài từ NodeSource setup_20.x (hoặc nvm) để có LTS đúng." },
      { symptom: "npm install trên server ra dependency khác máy dev, bug 'chỉ có trên production'.", cause: "install giải phóng version theo semver range.", fix: "npm ci — tôn trọng tuyệt đối lockfile; commit lockfile vào git." },
      { symptom: "Copy file .env từ máy dev lên server qua chat/email.", cause: "Kênh truyền secret không an toàn.", fix: "Gõ trực tiếp bằng nano trên server hoặc dùng scp; giá trị production KHÁC dev (JWT_SECRET mới)." }
    ],
    challenge: "Viết health-check endpoint /api/health trả { status: 'ok', version, uptime } — và dùng nó làm bài kiểm tra sau mọi lần deploy.",
    checklist: [
      "Thuộc chuỗi: NodeSource → apt-get → node -v",
      "Giải thích được npm ci vs npm install",
      ".env production tạo tại chỗ, giá trị khác dev"
    ],
    tasks: ["Viết khối lệnh: cài Node từ NodeSource, git clone, npm ci --omit=dev, .env production mẫu và lệnh chạy thử + curl health."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 92: Môi trường Node/PHP trên VPS</title>
</head>
<body>
    <h1>Cài môi trường chạy trên Linux</h1>
    <!-- TODO 1: <pre> NodeSource setup_20.x + apt-get install nodejs + node -v -->
    <!-- TODO 2: <pre> git clone + npm ci --omit=dev -->
    <!-- TODO 3: .env production mẫu (NODE_ENV, PORT, JWT_SECRET, GEMINI_KEY, DB_URI) -->
    <!-- TODO 4: chạy thử + curl localhost/api/health -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("nodesource") && c.includes("npm ci") && c.includes(".env") && c.includes("node_env=production") && c.includes("git clone") && c.includes("curl");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Trên production, vì sao dùng npm ci thay vì npm install?",
      snippet: "npm ci --omit=dev",
      options: [
        { text: "Gõ ngắn hơn", correct: false },
        { text: "Cài CHÍNH XÁC theo package-lock.json — môi trường tái lập được từng phiên bản", correct: true },
        { text: "Tự cài Node mới", correct: false },
        { text: "Không cần mạng", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Vì sao không apt install nodejs từ kho mặc định?", o: ["Tốn phí", "Bản trong kho thường quá cũ — dùng NodeSource/nvm để có LTS", "Không tương thích Ubuntu", "Thiếu npm"], a: 1 },
      { q: "--omit=dev khi cài production để làm gì?", o: ["Cài nhanh gấp đôi", "Bỏ devDependencies (test, lint) không cần khi chạy thật", "Tắt log", "Bảo mật npm"], a: 1 },
      { q: "File .env trên server production nên như thế nào?", o: ["Copy y nguyên từ dev", "Tạo tại chỗ, giá trị RIÊNG cho production (secret mới)", "Commit vào git cho tiện", "Không cần .env"], a: 1 },
      { q: "NODE_ENV=production có tác dụng gì?", o: ["Đổi port", "Bật tối ưu framework, tắt thông báo debug", "Tự scale", "Nén code"], a: 1 }
    ]
  },
  {
    id: "lesson93",
    title: "93. Cài đặt & Bảo mật cơ sở dữ liệu (MySQL) trên VPS",
    lang: "html",
    file: "src/lesson93.html",
    duration: "55 phút",
    overview: {
      description: "Trái tim dữ liệu lên máy chủ thật: cài MySQL, chạy nghi thức mysql_secure_installation, tạo user ứng dụng quyền tối thiểu và nạp schema + seed của đồ án.",
      outcomes: [
        "Cài MySQL Server và chạy mysql_secure_installation",
        "Tạo database + user ứng dụng với quyền tối thiểu (không dùng root)",
        "Nạp schema từ file .sql và chạy seed (bài 68) trên server"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
\`\`\`bash
sudo apt install mysql-server -y
sudo mysql_secure_installation      # nghi thức bắt buộc: đặt mật khẩu root,
                                    # xoá user vô danh, cấm root đăng nhập từ xa, xoá db test
\`\`\`

Nguyên tắc **quyền tối thiểu** — app không bao giờ dùng root:
\`\`\`sql
CREATE DATABASE doan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY '<mật-khẩu-mạnh>';
GRANT SELECT, INSERT, UPDATE, DELETE ON doan.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
\`\`\`

> \`utf8mb4\` — bắt buộc để lưu tiếng Việt + emoji đầy đủ (utf8 cũ của MySQL chỉ 3 byte). \`'app_user'@'localhost'\` — chỉ kết nối từ chính máy, cổng 3306 KHÔNG mở ra Internet (tường lửa bài 96 sẽ khóa chặt). Nạp cấu trúc: \`mysql -u app_user -p doan < schema.sql\` rồi chạy seed có chốt production đã viết ở bài 68.`,
    labSteps: [
      "Viết khối cài đặt: apt install mysql-server + mysql_secure_installation, chú thích 4 việc nghi thức này làm.",
      "Viết khối SQL: CREATE DATABASE utf8mb4 + CREATE USER app_user@localhost + GRANT 4 quyền + FLUSH.",
      "Chú thích: vì sao KHÔNG grant ALL và không grant DROP cho app_user.",
      "Viết khối nạp schema: mysql -u app_user -p doan < schema.sql và cách chạy seed bài 68.",
      "Cập nhật DB_URI trong .env (bài 92) trỏ về app_user — không phải root.",
      "Có VPS: thực hiện và dán kết quả SHOW TABLES; vào trang."
    ],
    commonMistakes: [
      { symptom: "App kết nối bằng root cho 'đỡ lằng nhằng'.", cause: "Bỏ nguyên tắc quyền tối thiểu.", fix: "SQL injection lọt qua app cầm quyền root = mất cả server DB; app_user chỉ 4 quyền CRUD." },
      { symptom: "Emoji và một số chữ tiếng Việt lưu thành dấu ?.", cause: "Database tạo bằng utf8 (3 byte) cũ.", fix: "Luôn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci từ lúc tạo." },
      { symptom: "Mở cổng 3306 ra Internet để 'tiện quản lý bằng Workbench'.", cause: "Đổi tiện lợi lấy cửa hậu cho hacker.", fix: "3306 chỉ localhost; quản lý từ xa qua SSH tunnel: ssh -L 3306:localhost:3306." }
    ],
    challenge: "Viết script backup.sh dùng mysqldump xuất database ra file nén theo ngày + cron chạy 2h sáng hằng ngày — bài học xương máu rẻ nhất là bài chưa xảy ra.",
    checklist: [
      "Thuộc 4 việc của mysql_secure_installation",
      "app_user chỉ có 4 quyền CRUD trên đúng 1 database",
      "Biết vì sao 3306 không bao giờ mở công khai"
    ],
    tasks: ["Viết khối cài + secure_installation, khối SQL tạo db utf8mb4/user/GRANT quyền tối thiểu và lệnh nạp schema."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 93: MySQL trên VPS</title>
</head>
<body>
    <h1>Cài & bảo mật database</h1>
    <!-- TODO 1: <pre> apt install mysql-server + mysql_secure_installation -->
    <!-- TODO 2: <pre> CREATE DATABASE utf8mb4; CREATE USER app_user@localhost; GRANT SELECT, INSERT, UPDATE, DELETE; FLUSH PRIVILEGES; -->
    <!-- TODO 3: mysql -u app_user -p doan < schema.sql + seed -->
    <!-- TODO 4: vì sao 3306 không mở ra Internet -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("mysql_secure_installation") && c.includes("utf8mb4") && c.includes("create user") && c.includes("grant select, insert, update, delete") && c.includes("flush privileges") && c.includes("3306");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Ứng dụng nên kết nối database bằng tài khoản nào?",
      snippet: "DB_URI=mysql://[ ??? ]:pass@localhost/doan",
      options: [
        { text: "root — cho đủ quyền khỏi lỗi", correct: false },
        { text: "User riêng chỉ có SELECT/INSERT/UPDATE/DELETE trên đúng database đó", correct: true },
        { text: "User vô danh", correct: false },
        { text: "Tài khoản SSH", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "utf8mb4 khác utf8 cũ của MySQL thế nào?", o: ["Không khác", "4 byte — lưu đủ emoji và mọi ký tự Unicode", "Chạy chậm hơn nhiều", "Chỉ cho tiếng Anh"], a: 1 },
      { q: "mysql_secure_installation KHÔNG làm việc nào?", o: ["Đặt mật khẩu root", "Xoá user vô danh", "Tự tạo backup hằng ngày", "Xoá database test"], a: 2 },
      { q: "Cổng 3306 nên được cấu hình thế nào?", o: ["Mở công khai cho tiện", "Chỉ nghe localhost; quản lý từ xa qua SSH tunnel", "Đổi thành 3307 là an toàn", "Tắt hẳn"], a: 1 },
      { q: "Nguyên tắc quyền tối thiểu giúp gì khi bị SQL injection?", o: ["Chặn hoàn toàn injection", "Giới hạn thiệt hại — kẻ tấn công không DROP/ra ngoài database được", "Tự vá lỗi", "Không giúp gì"], a: 1 }
    ]
  },
  {
    id: "lesson94",
    title: "94. Nginx tối ưu: Reverse Proxy & Điều phối lưu lượng",
    lang: "html",
    file: "src/lesson94.html",
    duration: "60 phút",
    overview: {
      description: "Người gác cổng của production: Nginx đứng cổng 80/443 điều phối — file tĩnh tự phục vụ, /api đẩy về Node, /ws nâng cấp WebSocket, SPA fallback về index.html.",
      outcomes: [
        "Viết server block: serve SPA tĩnh + try_files fallback",
        "Cấu hình location /api proxy_pass về Node cổng nội bộ",
        "Cấu hình WebSocket upgrade cho /ws và gzip + cache tĩnh"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Reverse proxy** — client chỉ thấy Nginx; Node trốn sau cổng nội bộ 8081:

\`\`\`nginx
# /etc/nginx/sites-available/doan
server {
    listen 80;
    server_name doan.vn;
    root /var/www/doan/dist;                 # build frontend

    location / { try_files $uri $uri/ /index.html; }   # SPA fallback (bài 76!)

    location /api {
        proxy_pass http://localhost:8081;
        proxy_set_header X-Real-IP $remote_addr;        # rate limit bài 83 cần IP thật
        proxy_set_header Host $host;
    }
    location /ws {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;                          # WebSocket bắt buộc
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    gzip on; gzip_types text/css application/javascript application/json;
    location ~* \\.(js|css|png|webp)$ { expires 30d; add_header Cache-Control "public, immutable"; }
}
\`\`\`
Kích hoạt: \`ln -s\` sang sites-enabled → \`nginx -t\` (kiểm cú pháp — LUÔN chạy trước) → \`systemctl reload nginx\`.`,
    labSteps: [
      "Viết trọn server block theo khuôn — tự gõ từng location, chú thích vai trò mỗi khối.",
      "Chú thích nối kiến thức: try_files giải bug F5-404 của SPA (bài 76); X-Real-IP nuôi rate limiter (bài 83).",
      "Viết khối WebSocket — thiếu 3 dòng upgrade là chat bài 84 chết ngoài production.",
      "Viết chuỗi kích hoạt: ln -s → nginx -t → systemctl reload (chú thích vì sao reload thay vì restart).",
      "Bật gzip + cache 30 ngày cho tĩnh — nối bài thi hiệu năng (39, 82).",
      "Có VPS: cấu hình thật và dán kết quả curl -I http://ip (thấy Server: nginx) vào trang."
    ],
    commonMistakes: [
      { symptom: "F5 tại /dashboard trên production ra 404.", cause: "Thiếu try_files fallback về index.html.", fix: "location / { try_files $uri $uri/ /index.html; } — món nợ bài 76 trả ở đây." },
      { symptom: "Chat hoạt động ở localhost, lên production socket rớt ngay.", cause: "Thiếu bộ ba header Upgrade cho WebSocket.", fix: "proxy_http_version 1.1 + Upgrade + Connection \"upgrade\" trong location /ws." },
      { symptom: "Sửa config xong reload — Nginx chết cả trang vì lỗi cú pháp.", cause: "Bỏ qua nginx -t.", fix: "Nghi thức thép: nginx -t xanh rồi mới reload; -t đỏ thì sửa xong mới được đụng service." }
    ],
    challenge: "Thêm rate limit tầng Nginx: limit_req_zone theo IP 10r/s cho /api — lá chắn TRƯỚC cả khi request chạm Node (đỡ đòn cho bài 83).",
    checklist: [
      "Server block đủ 3 location: /, /api, /ws",
      "Thuộc nghi thức nginx -t trước reload",
      "Giải thích được vì sao Node trốn sau cổng nội bộ"
    ],
    tasks: ["Viết server block đủ: try_files SPA, proxy_pass /api (X-Real-IP), /ws upgrade, gzip + cache tĩnh, chuỗi ln -s → nginx -t → reload."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 94: Nginx Reverse Proxy</title>
</head>
<body>
    <h1>Người gác cổng Nginx</h1>
    <!-- TODO 1: <pre> server block — root dist, try_files /index.html -->
    <!-- TODO 2: location /api proxy_pass + X-Real-IP; location /ws + Upgrade -->
    <!-- TODO 3: gzip on + cache tĩnh 30d -->
    <!-- TODO 4: ln -s, nginx -t, systemctl reload -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("proxy_pass") && c.includes("try_files") && c.includes("upgrade") && c.includes("nginx -t") && c.includes("gzip") && c.includes("x-real-ip");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "SPA bị 404 khi F5 tại /dashboard trên production — thiếu gì trong Nginx?",
      snippet: "location / { [ ... ] $uri $uri/ /index.html; }",
      options: [
        { text: "proxy_pass", correct: false },
        { text: "try_files — fallback mọi route ảo về index.html", correct: true },
        { text: "gzip on", correct: false },
        { text: "listen 443", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Reverse proxy nghĩa là gì?", o: ["Proxy quay ngược DNS", "Nginx đứng cổng công khai, chuyển tiếp vào dịch vụ nội bộ phía sau", "VPN", "Trình duyệt ẩn danh"], a: 1 },
      { q: "Vì sao Node nghe cổng nội bộ 8081 thay vì 80 trực tiếp?", o: ["Node không mở được 80", "Nginx lo TLS/gzip/tĩnh/điều phối tốt hơn — Node chỉ lo logic", "Cổng 80 tốn phí", "Thói quen"], a: 1 },
      { q: "Lệnh nào kiểm tra cú pháp config trước khi reload?", o: ["nginx -v", "nginx -t", "nginx --check", "systemctl test"], a: 1 },
      { q: "WebSocket qua Nginx cần gì đặc biệt?", o: ["Không cần gì", "proxy_http_version 1.1 + header Upgrade/Connection", "Cổng riêng 9000", "Tắt gzip toàn cục"], a: 1 }
    ]
  },
  {
    id: "lesson95",
    title: "95. Tên miền, DNS & Chứng chỉ SSL HTTPS",
    lang: "html",
    file: "src/lesson95.html",
    duration: "55 phút",
    overview: {
      description: "Từ IP khô khan thành thương hiệu có ổ khóa: trỏ DNS A record, cài Let's Encrypt bằng certbot, tự động gia hạn và ép toàn bộ lưu lượng về HTTPS.",
      outcomes: [
        "Cấu hình DNS: A record trỏ domain và www về IP VPS",
        "Cài SSL miễn phí: certbot --nginx tự cấu hình + redirect 301",
        "Kiểm chứng tự động gia hạn bằng certbot renew --dry-run"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**DNS** — danh bạ của Internet:
> **A record**: \`doan.vn → 143.198.x.x\` (IP VPS) • thêm bản ghi cho \`www\` • **TTL** thấp (300s) khi đang triển khai để đổi nhanh. Kiểm tra lan truyền: \`dig doan.vn +short\`.

**SSL Let's Encrypt** — miễn phí, tự động, chuẩn ngành (kiến thức HTTPS bài 51 thành hiện thực):
\`\`\`bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d doan.vn -d www.doan.vn
# certbot tự: xác minh domain -> cấp chứng chỉ 90 ngày
#            -> sửa Nginx listen 443 ssl -> tạo redirect 80 -> 443
sudo certbot renew --dry-run        # kiểm chứng cỗ máy tự gia hạn
\`\`\`

> Chứng chỉ Let's Encrypt sống 90 ngày — certbot cài sẵn timer tự gia hạn, việc của bạn là VERIFY nó chạy (dry-run). Sau khi có HTTPS: bật HSTS (bài 51) và kiểm tra mixed content — mọi tài nguyên phải https.`,
    labSteps: [
      "Viết bảng DNS cần tạo: A @ → IP, A www → IP, TTL 300 — kèm chú thích từng cột.",
      "Viết chuỗi lệnh certbot theo khuôn + chú thích 4 việc certbot tự làm.",
      "Viết lệnh kiểm chứng: dig +short, certbot renew --dry-run, curl -I http://doan.vn (phải thấy 301 → https).",
      "Chú thích: thêm header HSTS vào server block 443 (nối bài 51).",
      "Viết mục 'mixed content': cách tìm (DevTools console) và cách sửa (đổi mọi http:// nội bộ thành đường dẫn tương đối).",
      "Có domain thật: thực hiện và dán ảnh ổ khóa + kết quả dry-run vào trang."
    ],
    commonMistakes: [
      { symptom: "Trỏ DNS xong vào domain vẫn ra trang cũ/không vào được.", cause: "DNS cần thời gian lan truyền + cache resolver.", fix: "Đặt TTL 300 trước khi đổi, kiểm bằng dig +short, kiên nhẫn 5-30 phút." },
      { symptom: "3 tháng sau website chết vì chứng chỉ hết hạn.", cause: "Tin rằng cài xong là xong, không verify auto-renew.", fix: "certbot renew --dry-run ngay sau khi cài + kiểm systemctl list-timers có certbot.timer." },
      { symptom: "Có HTTPS nhưng trình duyệt vẫn báo 'không an toàn'.", cause: "Mixed content — ảnh/script còn tải qua http://.", fix: "Soát console DevTools, đổi mọi URL nội bộ sang tương đối hoặc https." }
    ],
    challenge: "Chấm điểm SSL của domain bằng SSL Labs (ssllabs.com/ssltest) — mục tiêu hạng A; đọc phần bị trừ điểm và sửa.",
    checklist: [
      "Bảng DNS đúng 2 bản ghi A + TTL hợp lý",
      "Thuộc chuỗi certbot + 4 việc nó tự làm",
      "Biết verify auto-renew và quét mixed content"
    ],
    tasks: ["Viết bảng DNS A record, chuỗi certbot --nginx -d, lệnh kiểm chứng dig/dry-run/curl 301 và ghi chú HSTS + mixed content."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 95: DNS & SSL</title>
</head>
<body>
    <h1>Tên miền + Ổ khóa HTTPS</h1>
    <!-- TODO 1: bảng DNS: A @ -> IP, A www -> IP, TTL 300 -->
    <!-- TODO 2: <pre> certbot --nginx -d doan.vn -d www.doan.vn -->
    <!-- TODO 3: dig +short, certbot renew --dry-run, curl -I (301) -->
    <!-- TODO 4: HSTS + mixed content -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("a record") || c.includes("bản ghi a") ? (c.includes("certbot") && c.includes("--nginx") && c.includes("renew --dry-run") && c.includes("301") && c.includes("hsts")) : false;
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Chứng chỉ Let's Encrypt có hạn 90 ngày — việc của bạn là gì?",
      snippet: "sudo certbot renew --dry-run",
      options: [
        { text: "Đặt lịch tự gia hạn tay mỗi 3 tháng", correct: false },
        { text: "Verify cỗ máy tự gia hạn của certbot chạy được (dry-run + timer)", correct: true },
        { text: "Mua chứng chỉ trả phí cho khỏe", correct: false },
        { text: "Không cần làm gì cả", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "A record trong DNS làm gì?", o: ["Trỏ domain về địa chỉ IP", "Chuyển email", "Xác minh SSL", "Chống DDoS"], a: 0 },
      { q: "certbot --nginx tự làm gì?", o: ["Chỉ tải chứng chỉ", "Xác minh domain, cấp chứng chỉ, sửa config Nginx, tạo redirect 301", "Cài Nginx", "Đăng ký domain"], a: 1 },
      { q: "Mixed content là gì?", o: ["Trộn HTML với PHP", "Trang https còn tài nguyên tải qua http — mất ổ khóa an toàn", "Nhiều ngôn ngữ", "CSS lẫn JS"], a: 1 },
      { q: "Lệnh nào kiểm tra domain đã trỏ đúng IP?", o: ["ping -ssl", "dig doan.vn +short", "curl --dns", "nginx -t"], a: 1 }
    ]
  },
  {
    id: "lesson96",
    title: "96. Tường lửa UFW & Fail2ban chống tấn công hạ tầng",
    lang: "html",
    file: "src/lesson96.html",
    duration: "55 phút",
    overview: {
      description: "Đóng mọi cánh cửa trừ cửa chính: UFW chỉ mở 22/80/443, Fail2ban tự cấm IP dò mật khẩu SSH — hai lá chắn hạ tầng hoàn thiện mô hình phòng thủ nhiều lớp.",
      outcomes: [
        "Cấu hình UFW: default deny incoming, chỉ allow OpenSSH + Nginx Full",
        "Cài Fail2ban với jail sshd: 5 lần sai = cấm IP 1 giờ",
        "Vẽ được bản đồ phòng thủ 4 lớp: UFW → Fail2ban → Nginx → App"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**UFW** (Uncomplicated Firewall) — nguyên tắc: đóng tất, mở đúng thứ cần:
\`\`\`bash
sudo ufw default deny incoming     # chặn mọi chiều vào
sudo ufw default allow outgoing
sudo ufw allow OpenSSH             # 22 — PHẢI mở trước khi enable kẻo tự khóa mình!
sudo ufw allow 'Nginx Full'        # 80 + 443
sudo ufw enable && sudo ufw status verbose
\`\`\`
Nhờ vậy MySQL 3306 (bài 93), Node 8081 (bài 94) — tự động vô hình từ Internet.

**Fail2ban** — đọc log, thấy IP sai mật khẩu liên tục là cấm bằng luật tường lửa:
\`\`\`ini
# /etc/fail2ban/jail.local
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
\`\`\`
\`fail2ban-client status sshd\` — xem danh sách IP đang bị cấm (thường có 'khách' chỉ sau vài giờ).

Bản đồ phòng thủ 4 lớp: **UFW** (cổng) → **Fail2ban** (hành vi) → **Nginx** (rate limit, header) → **App** (JWT, validate, bcrypt — Chặng 4/5).`,
    labSteps: [
      "Viết chuỗi UFW theo khuôn — GẠCH CHÂN chú thích: allow OpenSSH TRƯỚC ufw enable (tự khóa mình là mất VPS).",
      "Chú thích: sau UFW, cổng 3306/8081 còn truy cập được từ Internet không? Vì sao vẫn chạy bình thường?",
      "Viết jail.local cho sshd: maxretry 5, findtime 10m, bantime 1h — giải thích từng tham số.",
      "Viết lệnh vận hành: ufw status verbose, fail2ban-client status sshd, cách unban một IP.",
      "Vẽ bản đồ phòng thủ 4 lớp bằng <pre> ASCII — mỗi lớp ghi tên bài đã học tương ứng.",
      "Có VPS: bật cả hai, để qua đêm rồi xem 'danh sách khách' bị Fail2ban cấm."
    ],
    commonMistakes: [
      { symptom: "ufw enable xong văng khỏi SSH, không vào lại được VPS.", cause: "Quên allow OpenSSH trước khi bật.", fix: "Nghi thức: allow OpenSSH LUÔN chạy trước enable; lỡ rồi thì cứu qua console web của nhà cung cấp." },
      { symptom: "bantime 1 phút — bot quay lại ngay sau đó.", cause: "Cấu hình quá hiền.", fix: "bantime tối thiểu 1h; recidive jail cho kẻ tái phạm cấm 1 tuần." },
      { symptom: "Tin rằng có tường lửa là miễn nhiễm mọi tấn công.", cause: "Hiểu sai vai trò từng lớp.", fix: "UFW chặn CỔNG, không chặn nổi SQLi đi qua cổng 443 hợp lệ — vẫn cần đủ 4 lớp." }
    ],
    challenge: "Thêm jail chống dò đường Nginx: bắt các IP quét /wp-admin, /.env, /phpmyadmin (log 404 hàng loạt) và cấm 24h.",
    checklist: [
      "Thuộc nghi thức: allow OpenSSH trước enable",
      "Giải thích được 3 tham số maxretry/findtime/bantime",
      "Vẽ được 4 lớp phòng thủ kèm vai trò từng lớp"
    ],
    tasks: ["Viết chuỗi UFW (deny incoming, allow OpenSSH + Nginx Full), jail.local sshd (5/10m/1h) và bản đồ phòng thủ 4 lớp."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 96: UFW & Fail2ban</title>
</head>
<body>
    <h1>Tường lửa & Chống dò mật khẩu</h1>
    <!-- TODO 1: <pre> ufw default deny incoming, allow OpenSSH (TRƯỚC enable!), allow 'Nginx Full', enable -->
    <!-- TODO 2: <pre> jail.local [sshd] maxretry=5 findtime=10m bantime=1h -->
    <!-- TODO 3: <pre> bản đồ 4 lớp: UFW -> Fail2ban -> Nginx -> App -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("deny incoming") && c.includes("openssh") && c.includes("nginx full") && c.includes("maxretry") && c.includes("bantime") && c.includes("fail2ban");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Trước khi chạy ufw enable, lệnh nào BẮT BUỘC chạy trước?",
      snippet: "sudo ufw [ ??? ] && sudo ufw enable",
      options: [
        { text: "ufw reset", correct: false },
        { text: "ufw allow OpenSSH — kẻo tự khóa mình khỏi VPS", correct: true },
        { text: "ufw status", correct: false },
        { text: "ufw reload", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Triết lý cấu hình tường lửa đúng?", o: ["Mở tất, đóng thứ nguy hiểm", "Đóng tất (deny incoming), chỉ mở đúng cổng cần: 22/80/443", "Mở theo yêu cầu người dùng", "Không cần tường lửa nếu có SSL"], a: 1 },
      { q: "Fail2ban hoạt động dựa trên gì?", o: ["Quét virus", "Đọc log, phát hiện IP sai liên tục và cấm bằng luật tường lửa", "Chặn quốc gia", "AI phân tích"], a: 1 },
      { q: "Sau khi bật UFW, cổng 3306 của MySQL thế nào?", o: ["Vẫn mở công khai", "Vô hình từ Internet nhưng app trên cùng máy vẫn kết nối localhost bình thường", "MySQL ngừng chạy", "Tự đổi cổng"], a: 1 },
      { q: "UFW có chặn được SQL Injection không?", o: ["Có, chặn hết", "Không — SQLi đi qua cổng 443 hợp lệ; cần lớp app phòng thủ (prepared statements)", "Có nếu bật Fail2ban", "Chỉ chặn trên IPv6"], a: 1 }
    ]
  },
  {
    id: "lesson97",
    title: "97. PM2 / Systemd: Chạy ngầm bền bỉ & Quản lý log",
    lang: "html",
    file: "src/lesson97.html",
    duration: "55 phút",
    overview: {
      description: "App phải sống khi bạn ngủ: PM2 giữ Node chạy ngầm, tự hồi sinh khi crash, sống sót qua reboot, và hệ thống log xoay vòng để 3h sáng có chuyện còn tra được án.",
      outcomes: [
        "Chạy app bằng PM2: start, status, logs, restart, cluster mode",
        "Cấu hình sống sót reboot: pm2 startup + pm2 save",
        "Quản lý log: pm2-logrotate chống log ăn sạch ổ đĩa"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Chạy \`node server.js\` trong SSH — đóng terminal là app chết. **PM2** — process manager chuẩn ngành cho Node:

\`\`\`bash
sudo npm install -g pm2
pm2 start server.js --name doan -i max     # -i max: cluster mode tận dụng mọi CPU core
pm2 status                                 # bảng tình trạng: online/errored, RAM, CPU
pm2 logs doan --lines 100                  # xem log trực tiếp
pm2 restart doan                           # khởi động lại không downtime (cluster)

# Sống sót qua reboot — bộ đôi bắt buộc:
pm2 startup            # sinh lệnh đăng ký systemd (chạy lệnh nó in ra)
pm2 save               # chốt danh sách app hiện tại để hồi sinh sau reboot

# Log xoay vòng — không có nó, log sẽ ăn sạch ổ đĩa:
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
\`\`\`
PM2 tự restart khi app crash (watchdog). Stack PHP tương đương: php-fpm đã là service systemd sẵn.`,
    labSteps: [
      "Viết chuỗi PM2 cơ bản: install → start --name -i max → status → logs — chú thích từng lệnh.",
      "Chú thích cluster mode: vì sao -i max tận dụng đa nhân trong khi Node đơn luồng (nối bài 36).",
      "Viết bộ đôi sống sót reboot: pm2 startup + pm2 save — giải thích thiếu một trong hai thì sao.",
      "Viết cấu hình pm2-logrotate max_size 10M, retain 14 — tính thử: không xoay vòng, log 50MB/ngày sau 1 năm là bao nhiêu?",
      "Viết kịch bản diễn tập: kill -9 process → PM2 tự hồi sinh; reboot → app tự dậy — 2 bài kiểm tra bắt buộc.",
      "Có VPS: chạy trọn chuỗi + reboot thật, dán pm2 status sau reboot vào trang."
    ],
    commonMistakes: [
      { symptom: "Reboot VPS bảo trì xong web chết, khách gọi báo lỗi.", cause: "Có pm2 start nhưng thiếu startup + save.", fix: "Bộ đôi startup + save là nghi thức bắt buộc; diễn tập reboot để kiểm chứng." },
      { symptom: "Sau 4 tháng ổ đĩa đầy 100%, DB không ghi nổi, cả hệ thống sập.", cause: "Log không xoay vòng.", fix: "pm2-logrotate ngay ngày đầu + df -h vào thói quen kiểm tra định kỳ." },
      { symptom: "App crash liên tục, PM2 hồi sinh liên tục — không ai biết.", cause: "Có watchdog nhưng không có cảnh báo.", fix: "pm2 status định kỳ + max_restarts giới hạn + xem logs tìm nguyên nhân gốc thay vì để hồi sinh vô hạn." }
    ],
    challenge: "Viết ecosystem.config.js khai báo app: name, instances, env production, max_memory_restart 500M — cấu hình PM2 dạng code, commit được vào git.",
    checklist: [
      "Thuộc chuỗi start/status/logs/restart",
      "Diễn tập đủ 2 bài: crash tự hồi sinh + reboot tự dậy",
      "Log đã xoay vòng có trần dung lượng"
    ],
    tasks: ["Viết chuỗi PM2 (start -i max, status, logs), bộ đôi startup + save và cấu hình pm2-logrotate 10M/14 ngày."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 97: PM2 & Log</title>
</head>
<body>
    <h1>Chạy ngầm bền bỉ với PM2</h1>
    <!-- TODO 1: <pre> pm2 start server.js --name doan -i max; pm2 status; pm2 logs -->
    <!-- TODO 2: <pre> pm2 startup + pm2 save — sống sót reboot -->
    <!-- TODO 3: <pre> pm2 install pm2-logrotate + max_size 10M + retain 14 -->
    <!-- TODO 4: kịch bản diễn tập: kill -9 và reboot -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("pm2 start") && c.includes("pm2 startup") && c.includes("pm2 save") && c.includes("logrotate") && c.includes("pm2 logs") && c.includes("reboot");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Muốn app Node tự sống dậy sau khi VPS reboot, cần bộ đôi lệnh nào?",
      snippet: "pm2 [ ??? ] && pm2 [ ??? ]",
      options: [
        { text: "pm2 restart + pm2 logs", correct: false },
        { text: "pm2 startup + pm2 save", correct: true },
        { text: "pm2 stop + pm2 start", correct: false },
        { text: "pm2 status + pm2 monit", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Vì sao không chạy node server.js trực tiếp trong SSH cho production?", o: ["Chạy chậm hơn", "Đóng terminal là app chết; crash không ai hồi sinh", "Tốn RAM hơn PM2", "Node cấm"], a: 1 },
      { q: "PM2 cluster mode (-i max) làm gì?", o: ["Tạo nhiều VPS", "Chạy nhiều instance app trên các CPU core, chia tải + restart không downtime", "Nén code", "Tăng RAM"], a: 1 },
      { q: "Log không xoay vòng dẫn đến hậu quả gì?", o: ["Log bị mã hóa", "Ăn dần sạch ổ đĩa — đến lúc DB không ghi nổi là sập cả hệ thống", "Không sao", "PM2 tự xoá"], a: 1 },
      { q: "Cách kiểm chứng cấu hình 'sống sót reboot' đúng?", o: ["Đọc lại docs", "Diễn tập: reboot thật và xem pm2 status sau khi máy dậy", "Tin vào pm2 save", "Hỏi nhà cung cấp"], a: 1 }
    ]
  },
  {
    id: "lesson98",
    title: "98. Kiểm thử Production: Tải, tốc độ & checklist bảo mật cuối",
    lang: "html",
    file: "src/lesson98.html",
    duration: "60 phút",
    overview: {
      description: "Nghiệm thu như kỹ sư thật: đánh tải bằng autocannon xem hệ chịu bao nhiêu người, đo tốc độ từ thiết bị thật, và tổng duyệt checklist bảo mật – vận hành lần cuối.",
      outcomes: [
        "Đánh tải API bằng autocannon và đọc chỉ số: req/s, latency p99, lỗi",
        "Đo thực địa: Lighthouse trên URL production + 4G thật trên điện thoại",
        "Tổng duyệt checklist 3 mảng: bảo mật, hiệu năng, vận hành"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Load test** — biết giới hạn TRƯỚC khi người dùng tìm ra nó:
\`\`\`bash
npx autocannon -c 50 -d 30 https://doan.vn/api/health
# -c 50: 50 kết nối đồng thời, -d 30: trong 30 giây
# Đọc kết quả: Req/Sec (thông lượng) — Latency p99 (1% chậm nhất) — Non-2xx (lỗi)
\`\`\`
> Đọc p99 chứ đừng chỉ đọc trung bình: trung bình 80ms nhưng p99 4 giây nghĩa là cứ 100 người có 1 người khổ sở. Đánh tải cả endpoint có DB (GET /api/posts) — health check nhẹ không nói lên điều gì.

**Đo thực địa**: Lighthouse trên URL https thật (không phải localhost) + mở bằng 4G trên điện thoại thật — CDN, TLS, khoảng cách địa lý chỉ hiện ra ở đây.

**Tổng duyệt 3 mảng** (gom toàn khóa): Bảo mật — checklist bài 56 + 83 + headers + SSL Labs A. Hiệu năng — CWV xanh (39), gzip/cache (94), p99 < 500ms. Vận hành — reboot test (97), backup chạy (93), log xoay vòng, .env ngoài git.`,
    labSteps: [
      "Viết khối lệnh autocannon 2 bài: /api/health (nhẹ) và /api/posts (chạm DB) — chú thích vì sao phải đánh cả hai.",
      "Dựng bảng đọc kết quả: Req/Sec, Latency trung bình, p99, Non-2xx — điền số đo được (hoặc số giả định kèm nhận xét đạt/không).",
      "Viết kịch bản đo thực địa 3 bước: Lighthouse URL thật, điện thoại 4G, một người bạn ở xa truy cập.",
      "Dựng checklist tổng duyệt 3 mảng × 5 mục/mảng — mỗi mục ghi rõ 'bằng chứng' (lệnh/ảnh chụp nào chứng minh).",
      "Chạy checklist trên đồ án thật — mục nào FAIL ghi kế hoạch sửa kèm deadline.",
      "Commit 'test: production verification' kèm bảng số liệu."
    ],
    commonMistakes: [
      { symptom: "Đánh tải mỗi /health rồi tuyên bố 'chịu được 5000 req/s'.", cause: "Health check không chạm DB — số đẹp vô nghĩa.", fix: "Đánh endpoint thật có truy vấn; đó mới là giới hạn thật của hệ." },
      { symptom: "Chỉ nhìn latency trung bình 80ms và hài lòng.", cause: "Trung bình che giấu đuôi chậm.", fix: "p99 là con số của người dùng xui nhất — chuẩn nghiệm thu phải theo p99." },
      { symptom: "Test mọi thứ trên wifi văn phòng cạnh server.", cause: "Điều kiện quá lý tưởng.", fix: "4G thật + người ở tỉnh khác — sản phẩm sống ở điều kiện của người dùng, không phải của dev." }
    ],
    challenge: "Tìm điểm gãy: tăng dần -c 50 → 100 → 200 → 400 đến khi Non-2xx xuất hiện — ghi lại con số 'hệ chịu tối đa X kết nối đồng thời' vào README.",
    checklist: [
      "Có số liệu tải cho cả endpoint nhẹ lẫn endpoint chạm DB",
      "Đã đo từ thiết bị/mạng thật ngoài môi trường dev",
      "Checklist 3 mảng tick đủ kèm bằng chứng"
    ],
    tasks: ["Viết lệnh autocannon 2 endpoint, bảng chỉ số (Req/s, p99, Non-2xx), kịch bản đo thực địa và checklist 3 mảng × 5 mục."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 98: Nghiệm thu Production</title>
</head>
<body>
    <h1>Kiểm thử tải & Tổng duyệt cuối</h1>
    <!-- TODO 1: <pre> autocannon -c 50 -d 30 /api/health và /api/posts -->
    <!-- TODO 2: bảng Req/Sec, Latency, p99, Non-2xx -->
    <!-- TODO 3: kịch bản đo thực địa: Lighthouse, 4G điện thoại thật -->
    <!-- TODO 4: checklist 3 mảng bảo mật/hiệu năng/vận hành (5 mục/mảng + bằng chứng) -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("autocannon") && c.includes("p99") && c.includes("lighthouse") && c.includes("<table") && c.includes("4g") && (c.includes("non-2xx") || c.includes("req/sec"));
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Vì sao đọc latency p99 thay vì chỉ đọc trung bình?",
      snippet: "avg: 80ms — p99: 4000ms ???",
      options: [
        { text: "p99 luôn nhỏ hơn", correct: false },
        { text: "Trung bình che giấu đuôi chậm — p99 là trải nghiệm của người dùng xui nhất", correct: true },
        { text: "Trung bình khó tính", correct: false },
        { text: "Chuẩn HTTP quy định", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "autocannon -c 50 -d 30 nghĩa là gì?", o: ["50 giây, 30 kết nối", "50 kết nối đồng thời trong 30 giây", "50 request tổng", "50 CPU"], a: 1 },
      { q: "Vì sao phải đánh tải endpoint chạm DB thay vì chỉ /health?", o: ["Health bị chặn", "Giới hạn thật của hệ nằm ở truy vấn DB — health nhẹ cho số ảo", "DB thích tải", "Không cần thiết"], a: 1 },
      { q: "Chỉ số Non-2xx tăng vọt khi đánh tải nghĩa là gì?", o: ["Mạng người test lỗi", "Hệ đã quá tải bắt đầu trả lỗi — đây là điểm gãy", "autocannon hỏng", "DNS sai"], a: 1 },
      { q: "Đo thực địa khác gì đo local?", o: ["Không khác", "Có TLS, khoảng cách địa lý, mạng di động thật — điều kiện của người dùng thật", "Local chính xác hơn", "Thực địa chỉ để quay video"], a: 1 }
    ]
  },
  {
    id: "lesson99",
    title: "99. Deploy chính thức & Nghiệm thu vận hành",
    lang: "html",
    file: "src/lesson99.html",
    duration: "60 phút",
    overview: {
      description: "Ngày phát hành: quy trình deploy chuẩn có đường lui rollback, giám sát 48 giờ đầu, trang trạng thái và nghi thức nghiệm thu bàn giao — sản phẩm chính thức sống trên Internet.",
      outcomes: [
        "Viết deploy.sh chuẩn: pull tag → build → migrate → reload không downtime",
        "Chuẩn bị đường lui: rollback về tag trước trong 2 phút",
        "Lập kế hoạch giám sát 48h đầu + kênh nhận phản hồi người dùng"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Quy trình deploy chuẩn** (mọi bước đều đã học — giờ xâu chuỗi):

\`\`\`bash
#!/bin/bash
set -e                              # gặp lỗi là DỪNG, không deploy nửa vời
cd /var/www/doan
git fetch --tags && git checkout v1.0.0     # deploy theo TAG (bài 90), không theo main
npm ci --omit=dev                            # bài 92
npm run build                                # frontend mới vào dist/
# node migrate.js                            # thay đổi schema DB nếu có
pm2 reload doan                              # bài 97 — reload không downtime
curl -sf https://doan.vn/api/health || echo "CANH BAO: health check fail!"
\`\`\`

**Rollback** — đường lui phải sẵn TRƯỚC khi tiến: \`git checkout v0.9.0 && npm ci && pm2 reload\` — 2 phút về bản cũ. Deploy theo tag chính là để câu lệnh này tồn tại.

**48 giờ đầu**: pm2 logs theo dõi lỗi mới • df -h / free -m mỗi ngày • kênh phản hồi (form/Zalo) gắn ngay trên trang • KHÔNG deploy thêm tính năng mới trong 48h — chỉ hotfix.`,
    labSteps: [
      "Viết deploy.sh hoàn chỉnh theo khuôn — chú thích từng dòng, đặc biệt set -e và deploy theo tag.",
      "Viết rollback.sh: nhận tham số tag, checkout → ci → reload → health check.",
      "Diễn tập trên giấy (hoặc thật): deploy v1.0.0 → giả định lỗi → rollback v0.9.0 — bấm giờ, mục tiêu dưới 5 phút.",
      "Lập kế hoạch 48h: bảng 6 mốc kiểm tra (giờ thứ 1, 6, 12, 24, 36, 48) — mỗi mốc xem gì (logs, RAM, disk, phản hồi).",
      "Dựng khối 'nghiệm thu bàn giao': URL sống + tài khoản demo + link repo + tài liệu (bài 69) + số liệu tải (bài 98).",
      "Thông báo phát hành: viết bài giới thiệu ngắn gửi 10 người dùng đầu tiên (yêu cầu đồ án!)."
    ],
    commonMistakes: [
      { symptom: "Deploy thẳng từ nhánh main đang phát triển dở.", cause: "Không deploy theo tag.", fix: "Chỉ deploy tag đã qua nghiệm thu bài 98 — main là công trường, tag là sản phẩm." },
      { symptom: "Deploy lỗi giữa chừng, nửa mới nửa cũ, không dám đụng tiếp.", cause: "Script không có set -e và không có đường lui.", fix: "set -e dừng ngay khi lỗi + rollback.sh luôn sẵn sàng TRƯỚC khi deploy." },
      { symptom: "Phát hành xong lặn mất 1 tuần, người dùng gặp lỗi không ai biết.", cause: "Thiếu kế hoạch giám sát sau phát hành.", fix: "48h đầu là thời gian vàng: lịch kiểm tra cụ thể + kênh phản hồi hiển thị rõ trên trang." }
    ],
    challenge: "Nâng cấp lên zero-downtime thực thụ: thư mục releases/v1.0.0, symlink current trỏ vào — deploy là build ở thư mục mới rồi 'lật' symlink, rollback là lật ngược lại (khuôn Capistrano).",
    checklist: [
      "deploy.sh có set -e, theo tag, kết bằng health check",
      "Diễn tập rollback dưới 5 phút thành công",
      "Kế hoạch 48h + gói nghiệm thu bàn giao đầy đủ"
    ],
    tasks: ["Viết deploy.sh (set -e, checkout tag, npm ci, build, pm2 reload, curl health), rollback.sh và bảng giám sát 48h."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 99: Ngày phát hành</title>
</head>
<body>
    <h1>Deploy chính thức</h1>
    <!-- TODO 1: <pre> deploy.sh — set -e, git checkout v1.0.0, npm ci, build, pm2 reload, curl health -->
    <!-- TODO 2: <pre> rollback.sh — về tag trước trong 2 phút -->
    <!-- TODO 3: bảng giám sát 48h (6 mốc x nội dung kiểm tra) -->
    <!-- TODO 4: gói nghiệm thu: URL, tài khoản demo, repo, docs, số liệu tải -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("set -e") && c.includes("git checkout v") && c.includes("pm2 reload") && c.includes("rollback") && c.includes("curl") && c.includes("<table");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Deploy production nên checkout theo cái gì?",
      snippet: "git checkout [ ??? ] && npm ci && pm2 reload",
      options: [
        { text: "Nhánh main mới nhất", correct: false },
        { text: "Tag phiên bản đã nghiệm thu (v1.0.0) — main là công trường, tag là sản phẩm", correct: true },
        { text: "Commit bất kỳ hôm nay", correct: false },
        { text: "Nhánh của từng dev", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "set -e đầu script deploy có tác dụng gì?", o: ["Chạy nhanh hơn", "Gặp lệnh lỗi là dừng ngay — không deploy nửa vời", "Ẩn output", "Tự sudo"], a: 1 },
      { q: "Đường lui rollback phải chuẩn bị khi nào?", o: ["Khi có sự cố", "TRƯỚC khi deploy — đường lui sẵn thì mới dám tiến", "Sau 48h", "Không cần nếu test kỹ"], a: 1 },
      { q: "48 giờ đầu sau phát hành nên làm gì?", o: ["Deploy thêm tính năng mới", "Chỉ giám sát + hotfix; theo lịch kiểm tra logs/RAM/disk/phản hồi", "Tắt log cho nhẹ", "Nghỉ ngơi hoàn toàn"], a: 1 },
      { q: "Bước CUỐI của mọi lần deploy là gì?", o: ["Xoá log", "Health check trên URL thật — xác nhận hệ sống", "Đổi mật khẩu", "Tăng version"], a: 1 }
    ]
  },
  {
    id: "lesson100",
    title: "100. Bảo vệ & Nộp Đề Án Tốt Nghiệp HugoCoder",
    lang: "html",
    file: "src/lesson100.html",
    duration: "Buổi bảo vệ",
    overview: {
      description: "Vạch đích: nộp link sản phẩm sống + hồ sơ bảo vệ để Hugo Studio kiểm duyệt — vượt qua là nhận 4.000 JOY, giấy chứng nhận tốt nghiệp và danh hiệu Kỹ sư Full-Stack Web thực thụ.",
      outcomes: [
        "Nộp gói tốt nghiệp đầy đủ: URL sống, repo, tài liệu, tài khoản demo",
        "Tự tin trình bày sản phẩm theo khung 5 phút",
        "Nhận phản hồi kiểm duyệt và biết quy trình nộp lại nếu chưa đạt"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Yêu cầu sản phẩm khi nộp** (đối chiếu SRS bài 65):
1. **Fullstack** — frontend + backend OOP + database, chạy sống trên Internet qua HTTPS.
2. **AI** — tối thiểu một tính năng AI thật (chatbot/kiểm duyệt/phân tích — bài 86-88).
3. **Cộng đồng** — chat giữa thành viên (bài 84) và **tối thiểu 10 người dùng hoạt động** (bài 68 + người thật).
4. **Song ngữ** — Việt + một ngôn ngữ khác (bài 79).
5. **Hồ sơ** — repo sạch có README/CHANGELOG (bài 69, 90), tài khoản demo cho giám khảo.

**Khung trình bày 5 phút**: 30s bài toán → 1 phút demo luồng vàng → 1 phút kiến trúc (sơ đồ bài 66) → 1 phút điểm kỹ thuật đắt giá nhất (AI, realtime, bảo mật) → 30s số liệu (tải, người dùng) → 1 phút Q&A.

**Quy trình duyệt**: nộp link → trạng thái *Đang chờ duyệt* → Hugo Studio thẩm định → **Đạt**: +4.000 JOY, giấy chứng nhận, quà VVIP • **Chưa đạt**: nhận nhận xét chi tiết, sửa và nộp lại không giới hạn.`,
    labSteps: [
      "Đối chiếu lần cuối 5 yêu cầu sản phẩm — mục nào thiếu quay lại đúng bài cột mốc xử lý.",
      "Chuẩn bị gói nộp: URL production, link repo, tài khoản demo (giám khảo không đăng ký hộ bạn), 3 dòng mô tả sản phẩm.",
      "Viết kịch bản trình bày 5 phút theo khung — tập nói 2 lần có bấm giờ.",
      "Kiểm tra phút chót: mở sản phẩm bằng 4G + trình duyệt ẩn danh, đi trọn luồng vàng một lượt.",
      "Điền form nộp bên dưới và bấm gửi — theo dõi trạng thái duyệt tại đây."
    ],
    commonMistakes: [
      { symptom: "Nộp link localhost:3000 hoặc link chết.", cause: "Chưa hoàn tất Chặng 6.", fix: "Sản phẩm phải sống trên Internet qua HTTPS — giám khảo mở là chạy." },
      { symptom: "Giám khảo vào trang trắng vì không có tài khoản.", cause: "Quên cấp demo account.", fix: "Kèm sẵn tài khoản demo (và một tài khoản admin nếu có khu quản trị) trong ghi chú nộp bài." },
      { symptom: "Bị hỏi 'vì sao chọn kiến trúc này' và im lặng.", cause: "Không ôn lại ADR của chính mình.", fix: "Đọc lại ADR bài 66 và bản cam kết bài 70 — câu trả lời bạn đã viết từ lâu." }
    ],
    challenge: "Sau khi tốt nghiệp: viết bài chia sẻ hành trình 100 bài lên cộng đồng HugoCommunication — người học tốt nhất là người dạy lại được.",
    checklist: [
      "Đủ 5 yêu cầu sản phẩm đã tự đối chiếu",
      "Gói nộp đầy đủ: URL + repo + demo account + mô tả",
      "Đã tập trình bày 5 phút có bấm giờ"
    ],
    tasks: ["Nộp link dự án online kèm ghi chú (repo, tài khoản demo) và chờ Hugo Studio kiểm duyệt."],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "graduation_submission"
  }
];
