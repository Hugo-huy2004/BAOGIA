import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dataApi from "../../services/dataApi";
import HugoLogo from "../../components/HugoLogo";

export default function SecretLinkUnlock() {
  const { slug, linkId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkData, setLinkData] = useState(null);
  
  const [passwordInput, setPasswordInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [shake, setShake] = useState(false);
  const [passwordError, setPasswordError] = useState(""); // Thêm state lưu lỗi sai pass

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const res = await dataApi.getBioBySlug(slug);
        if (!res || !res.bio) {
          setError("Không tìm thấy dữ liệu Bio.");
          setLoading(false);
          return;
        }
        
        const secretLinks = res.bio.secretLinks || [];
        const found = secretLinks.find(l => l.id === linkId);
        
        if (!found) {
          setError("Liên kết không tồn tại hoặc đã bị xóa.");
        } else {
          setLinkData(found);
        }
      } catch (err) {
        console.error(err);
        setError("Có lỗi xảy ra khi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    fetchLink();
  }, [slug, linkId]);

  const handleUnlock = async (e) => {
    if (e) e.preventDefault();
    if (!passwordInput.trim()) return;

    setChecking(true);
    setPasswordError("");
    
    try {
      const res = await dataApi.unlockSecretLink(slug, linkId, passwordInput);
      if (res && res.url) {
        // Mở URL mới, mã hoá siêu cấp trả về URL chuẩn
        window.location.href = res.url;
      }
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPasswordInput("");
      setPasswordError(err.message || "Mật khẩu không chính xác");
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-xl p-8 max-w-sm w-full text-center border border-zinc-800 shadow-2xl">
          <span className="material-symbols-outlined text-destructive text-5xl mb-4">error</span>
          <h2 className="text-white font-black text-xl mb-2">Lỗi Truy Cập</h2>
          <p className="text-zinc-400 text-sm">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 bg-white text-black font-black uppercase text-xs py-3 px-6 rounded-md hover:bg-zinc-200 transition-colors w-full"
          >
            Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className={`relative z-10 bg-card rounded-[2rem] p-8 sm:p-10 max-w-sm w-full border border-zinc-800 shadow-2xl transition-transform ${shake ? 'animate-shake' : ''}`}>
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
        </div>

        <div className="text-center space-y-2 mb-8">
          <h1 className="text-white font-black text-xl tracking-tight">Khóa Bảo Mật</h1>
          <p className="text-zinc-400 text-sm">
            Nội dung này đã được khóa. Vui lòng nhập mật khẩu để tiếp tục.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">key</span>
            <input
              type="password"
              placeholder="Nhập mật khẩu..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              disabled={checking}
              className={`w-full bg-zinc-900 border ${passwordError ? 'border-destructive/50 focus:border-destructive focus:ring-destructive' : 'border-zinc-800 focus:border-primary focus:ring-primary'} text-white rounded-lg py-4 pl-12 pr-4 focus:outline-none focus:ring-1 transition-all font-mono`}
            />
          </div>
          {passwordError && (
            <p className="text-destructive text-xs text-center font-medium animate-pulse">{passwordError}</p>
          )}

          <button
            type="submit"
            disabled={checking || !passwordInput.trim()}
            className="w-full py-4 rounded-lg bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {checking ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
            ) : (
              <>
                Mở Khóa <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 flex flex-col items-center justify-center gap-3">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[12px]">verified</span>
            Bảo mật tối cao bởi
          </p>
          <div className="scale-75 origin-top opacity-50 hover:opacity-100 transition-opacity">
            <HugoLogo />
          </div>
        </div>
      </div>
    </div>
  );
}
