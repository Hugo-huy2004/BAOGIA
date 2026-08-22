import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/apiBase";
import { useHeadMeta } from "../../hooks/useHeadMeta";

const SCOPE_COPY = {
  profile: {
    icon: "account_circle",
    title: "Hồ sơ cơ bản",
    description: "Tên hiển thị và ảnh đại diện của bạn.",
  },
  email: {
    icon: "mail",
    title: "Địa chỉ email",
    description: "Email đã xác minh trên Hugo Studio.",
  },
};

export default function OAuthAuthorizePage() {
  useHeadMeta({
    title: "Ủy quyền đăng nhập | Hugo Studio",
    description: "Xác nhận đăng nhập một ứng dụng bằng tài khoản Hugo Studio.",
    robots: "noindex, nofollow, noarchive",
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [context, setContext] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const requestParams = useMemo(() => Object.fromEntries(new URLSearchParams(location.search)), [location.search]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/oauth/authorize/context${location.search}`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          const returnPath = `${location.pathname}${location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(returnPath)}`, { replace: true });
          return null;
        }
        if (!response.ok) throw new Error(data.error_description || data.error || "Yêu cầu ủy quyền không hợp lệ.");
        return data;
      })
      .then((data) => {
        if (!cancelled && data) setContext(data);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || "Không thể tải yêu cầu ủy quyền.");
      });
    return () => { cancelled = true; };
  }, [location.pathname, location.search, navigate]);

  const decide = async (decision) => {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/oauth/authorize/decision`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...requestParams, decision }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.redirectTo) {
        throw new Error(data.error_description || data.error || "Không thể hoàn tất ủy quyền.");
      }
      window.location.assign(data.redirectTo);
    } catch (requestError) {
      setError(requestError.message || "Không thể hoàn tất ủy quyền.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 px-4 py-10 text-white flex items-center justify-center">
      <div className="w-full max-w-lg overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur-2xl">
        <div className="border-b border-white/10 px-6 py-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-950 font-black">H</div>
          <div>
            <p className="text-sm font-black">Hugo Studio</p>
            <p className="text-xs text-slate-400">Trung tâm tài khoản và ủy quyền</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {!context && !error && (
            <div className="py-14 text-center text-sm text-slate-400">
              <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
              <p className="mt-3">Đang kiểm tra yêu cầu đăng nhập…</p>
            </div>
          )}

          {error && !context && (
            <div className="py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-rose-400">gpp_bad</span>
              <h1 className="mt-4 text-lg font-black">Không thể ủy quyền</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{error}</p>
            </div>
          )}

          {context && (
            <>
              <div className="text-center">
                {context.application.logoUrl ? (
                  <img src={context.application.logoUrl} alt="" className="mx-auto h-16 w-16 rounded-2xl bg-white object-cover" />
                ) : (
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-600 text-2xl font-black">
                    {context.application.name?.slice(0, 1)?.toUpperCase() || "A"}
                  </div>
                )}
                <h1 className="mt-5 text-xl font-black">{context.application.name} muốn đăng nhập</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Ứng dụng sẽ dùng tài khoản <span className="font-bold text-white">{context.member.email}</span> của bạn.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Ứng dụng được phép</p>
                <div className="mt-3 space-y-3">
                  {context.scopes.map((scope) => {
                    const copy = SCOPE_COPY[scope] || { icon: "check", title: scope, description: "Quyền được yêu cầu." };
                    return (
                      <div key={scope} className="flex gap-3">
                        <span className="material-symbols-outlined text-xl text-blue-400">{copy.icon}</span>
                        <div>
                          <p className="text-sm font-bold">{copy.title}</p>
                          <p className="text-xs text-slate-400">{copy.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Hugo Studio không chia sẻ mật khẩu hoặc cookie đăng nhập. Bạn có thể yêu cầu quản trị viên thu hồi kết nối bất cứ lúc nào.
              </p>
              {error && <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" disabled={submitting} onClick={() => decide("deny")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold hover:bg-white/10 disabled:opacity-50">
                  Từ chối
                </button>
                <button type="button" disabled={submitting} onClick={() => decide("approve")}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50">
                  {submitting ? "Đang xử lý…" : "Cho phép"}
                </button>
              </div>

              {(context.application.homepageUrl || context.application.privacyUrl) && (
                <div className="mt-5 flex justify-center gap-4 text-xs text-slate-500">
                  {context.application.homepageUrl && <a href={context.application.homepageUrl} target="_blank" rel="noreferrer" className="hover:text-white">Trang chủ ứng dụng</a>}
                  {context.application.privacyUrl && <a href={context.application.privacyUrl} target="_blank" rel="noreferrer" className="hover:text-white">Quyền riêng tư</a>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
