/**
 * Sinh cấu hình cổng API cho nginx TỪ services.manifest.js.
 *
 * Viết tay file nginx là cách chắc chắn nhất để nó trôi khỏi code: thêm route
 * trong Express mà quên nginx thì route mới 404 trên production, còn xoá route
 * mà quên nginx thì còn một location trỏ vào hư không. Sinh từ bản khai thì hai
 * bên không lệch được.
 *
 * Chạy:  npm run gen:nginx            → in ra màn hình
 *        npm run gen:nginx -- --write → ghi nginx/gateway.conf
 *
 * File sinh ra dùng cho VPS (Docker Compose hoặc nginx cài thẳng). Render hiện
 * tại KHÔNG dùng tới — Render không cho đặt nginx trước service. Sinh sẵn để
 * ngày chuyển VPS không phải viết lại, và để nhìn thấy bản đồ định tuyến.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

const { SERVICES, WS_CHANNELS, CORE_UPSTREAM, prefixRoutingTable, processServices } =
  await import(path.join(here, "..", "services.manifest.js"));

const slug = (id) => id.replace(/-/g, "_");

const upstreams = [
  `upstream ${CORE_UPSTREAM.id} {\n    server ${CORE_UPSTREAM.host}:${CORE_UPSTREAM.port};\n    keepalive 32;\n}`,
  ...processServices().map((service) =>
    `upstream svc_${slug(service.id)} {\n    server ${service.host || "127.0.0.1"}:${service.port};\n    keepalive 16;\n}`),
];

const upstreamOf = (service) =>
  service.mode === "process" ? `svc_${slug(service.id)}` : CORE_UPSTREAM.id;

// nginx khớp prefix DÀI NHẤT trước, không theo thứ tự trong file — nên
// /api/admin/brain vẫn thắng /api/admin dù đứng ở đâu. Vẫn sắp giảm dần để
// người đọc thấy đúng thứ tự ưu tiên thật.
const locations = prefixRoutingTable()
  .sort((a, b) => b.prefix.length - a.prefix.length)
  .map(({ prefix, services }) => [
    `    # ${services.map((service) => service.id).join(", ")}`,
    // `^~ /api/x` chứ KHÔNG phải `/api/x/`: có gạch chéo cuối thì nginx không
    // khớp `/api/packages` trần, mà đó là lời gọi thật (`router.get('/')` phục
    // vụ nó). Hôm nay nó rơi xuống nhánh /api/ nên vẫn chạy; ngày service này
    // tách ra process riêng thì rơi nhầm về core và 404.
    // `^~` còn chặn regex location cướp mất. Đánh đổi: `/api/packages-abc`
    // cũng khớp — vô hại, upstream tự trả 404 y như bây giờ.
    `    location ^~ ${prefix} {`,
    services.some((service) => service.cacheable)
      // Chỉ prefix đã tự đặt s-maxage trong code mới được cache. Route khác trả
      // dữ liệu riêng từng người — cache là phát nhầm cho người lạ.
      ? `        proxy_cache_bypass $http_authorization;\n        proxy_no_cache    $http_authorization;`
      : `        proxy_cache off;`,
    `        proxy_pass http://${upstreamOf(services[0])};`,
    `        include /etc/nginx/snippets/proxy-common.conf;`,
    `    }`,
  ].join("\n"));

const wsLocations = WS_CHANNELS.map((channel) => [
  `    # ${channel.id} — ${channel.note}`,
  `    location = ${channel.path} {`,
  `        proxy_pass http://${channel.port ? `svc_${slug(channel.id)}` : CORE_UPSTREAM.id};`,
  `        proxy_http_version 1.1;`,
  // Thiếu hai dòng Upgrade/Connection là handshake bị nuốt, client treo ở
  // "connecting" mà không có lỗi nào — bẫy kinh điển của WebSocket sau proxy.
  `        proxy_set_header Upgrade $http_upgrade;`,
  `        proxy_set_header Connection "upgrade";`,
  `        proxy_read_timeout 3600s;`,
  `        include /etc/nginx/snippets/proxy-common.conf;`,
  `    }`,
].join("\n"));

const conf = `# ============================================================================
# nginx — cổng API Hugo Studio
#
# TỆP NÀY DO MÁY SINH. Đừng sửa tay: chạy \`npm run gen:nginx -- --write\`.
# Nguồn: server/services.manifest.js
#
# ${SERVICES.length} service · ${prefixRoutingTable().length} prefix · ${WS_CHANNELS.length} kênh WS
# ============================================================================

${upstreams.join("\n\n")}

server {
    listen 443 ssl;
    http2 on;
    server_name api.hugowishpax.studio;

    # ssl_certificate / ssl_certificate_key do certbot quản lý.

    client_max_body_size 25m;

    # /health đứng riêng: uptime check gọi nó, đi qua cả chuỗi proxy thì một
    # upstream chậm sẽ báo động nhầm là cả API chết.
    location = /health {
        proxy_pass http://${CORE_UPSTREAM.id};
        include /etc/nginx/snippets/proxy-common.conf;
        access_log off;
    }

${wsLocations.join("\n\n")}

${locations.join("\n\n")}

    # Bắt phần còn lại của /api. Có nhánh này thì route mới quên khai vẫn chạy
    # (rơi về core) thay vì 404 — nhưng check-gateway.mjs bắt lỗi đó ở CI, đây
    # chỉ là lưới an toàn lúc chạy.
    location /api/ {
        proxy_pass http://${CORE_UPSTREAM.id};
        include /etc/nginx/snippets/proxy-common.conf;
    }

    location / {
        return 404;
    }
}
`;

const snippet = `# Header dùng chung cho mọi proxy_pass. Tách ra một tệp để ${prefixRoutingTable().length} khối
# location không lặp năm dòng giống nhau, và để sửa một chỗ là đổi hết.
#
# X-Forwarded-For phải đúng: server đặt \`app.set('trust proxy', 1)\` và
# express-rate-limit lấy req.ip từ đây. Sai header này thì cả userbase dồn vào
# một bucket rate-limit và ai cũng ăn 429.
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_connect_timeout 5s;
proxy_send_timeout    60s;
proxy_read_timeout    60s;
`;

if (process.argv.includes("--write")) {
  const outDir = path.join(repoRoot, "nginx");
  await mkdir(path.join(outDir, "snippets"), { recursive: true });
  await writeFile(path.join(outDir, "gateway.conf"), conf);
  await writeFile(path.join(outDir, "snippets", "proxy-common.conf"), snippet);
  console.log(`Đã ghi nginx/gateway.conf (${prefixRoutingTable().length} location) + nginx/snippets/proxy-common.conf`);
} else {
  console.log(conf);
}

process.exit(0);
