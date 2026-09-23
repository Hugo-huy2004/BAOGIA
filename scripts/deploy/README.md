# scripts/deploy

Script dựng máy chủ, chạy bằng tay khi mở một VPS mới. Không nằm trong
`npm run` và không chạy trong CI.

- `setup-vps.sh` — dựng một VPS trống để chạy Node. Xem `docs/tach-tai-render.md`.

**`start.sh` cố ý nằm ở thư mục gốc, đừng dời.** Service Render tạo tay có thể
đang đặt Start Command là `bash start.sh`; đổi đường dẫn là lần deploy kế tiếp
chết ngay (`docs/tach-tai-render.md`, mục 104).
