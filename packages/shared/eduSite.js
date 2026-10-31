// Education Hugo — trang học Coding riêng, chạy trên CÙNG bản build và backend
// với www, tách theo tên miền (như partner.hugowishpax.studio). Tài khoản là
// tài khoản Hugo Studio: đăng ký ở đâu cũng dùng được cả hai bên.
export const EDU_HOST = "education.hugowishpax.studio";
export const EDU_ORIGIN = `https://${EDU_HOST}`;

/** Dev mở bằng http://education.localhost:3000 (trình duyệt tự trỏ *.localhost về máy). */
export const isEduHost = (hostname) => hostname === EDU_HOST || /^education\.localhost$/.test(hostname || "");
