import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import dataApi from "../services/dataApi";
import HugoLogo from "../components/HugoLogo";

export default function PaymentGatewayPage() {
  const { id } = useParams();
  const location = useLocation();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if there's a status in URL after PayOS redirect
  const searchParams = new URLSearchParams(location.search);
  const payosStatus = searchParams.get('status');

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const res = await dataApi.get(`/api/payos/info/${id}`);
        if (res.data.success) {
          setPaymentInfo(res.data.data);
        } else {
          setError(res.data.error || "Không tìm thấy giao dịch.");
        }
      } catch (err) {
        setError("Không tìm thấy giao dịch hoặc lỗi kết nối.");
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentInfo();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0910] text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-zinc-400 font-bold tracking-widest uppercase text-xs animate-pulse">
          Đang tải giao dịch...
        </p>
      </div>
    );
  }

  if (error || !paymentInfo) {
    return (
      <div className="min-h-screen bg-[#0b0910] text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-4">
          <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <h1 className="text-2xl font-black">Lỗi Giao Dịch</h1>
        <p className="text-zinc-400 max-w-sm">{error || "Giao dịch không tồn tại hoặc đã hết hạn."}</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-colors"
        >
          Về Trang Chủ
        </button>
      </div>
    );
  }

  const isPaid = paymentInfo.status === 'PAID';
  const isCancelled = paymentInfo.status === 'CANCELLED' || payosStatus === 'cancelled';

  return (
    <div className="min-h-screen bg-[#0b0910] text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <header className="py-6 px-6 relative z-10 flex flex-col items-center justify-center border-b border-white/5 bg-white/5 backdrop-blur-md">
        <HugoLogo className="text-2xl mb-2" />
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em] bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
          CỔNG CHUYỂN KHOẢN THÔNG MINH
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-lg mx-auto p-6 sm:p-8 flex flex-col justify-center relative z-10">
        
        {/* Status Alert */}
        {isPaid && (
          <div className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl text-center space-y-3 animate-fadeIn">
            <span className="material-symbols-outlined text-5xl text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">check_circle</span>
            <h2 className="text-xl font-black text-emerald-400">Chuyển Khoản Thành Công</h2>
            <p className="text-sm text-zinc-300">Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của Hugo Studio.</p>
          </div>
        )}

        {isCancelled && !isPaid && (
          <div className="mb-8 p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-center space-y-3 animate-fadeIn">
            <span className="material-symbols-outlined text-5xl text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">cancel</span>
            <h2 className="text-xl font-black text-rose-400">Đã Hủy Giao Dịch</h2>
            <p className="text-sm text-zinc-300">Giao dịch này đã bị hủy. Vui lòng liên hệ Hugo Studio nếu bạn cần hỗ trợ thêm.</p>
          </div>
        )}

        {/* Invoice Card */}
        <div className="bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
          
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="text-center space-y-2 mb-10 relative z-10">
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Tổng Chuyển Khoản</p>
            <h2 className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {paymentInfo.amount.toLocaleString('vi-VN')} <span className="text-2xl text-emerald-500/50">VNĐ</span>
            </h2>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1.5">Lý do chuyển khoản</p>
              <p className="text-lg font-semibold text-white leading-relaxed">{paymentInfo.reason}</p>
            </div>

            <div className="flex justify-between items-center px-2 text-sm">
              <span className="text-zinc-400">Mã giao dịch</span>
              <span className="font-mono text-zinc-200 bg-white/5 px-2 py-1 rounded-md">{paymentInfo.customLinkId}</span>
            </div>
            
            <div className="flex justify-between items-center px-2 text-sm">
              <span className="text-zinc-400">Ngày tạo</span>
              <span className="text-zinc-200">{new Date(paymentInfo.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          {!isPaid && !isCancelled && (
            <div className="mt-10 relative z-10">
              <button 
                onClick={() => window.location.href = paymentInfo.checkoutUrl}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <div className="relative flex items-center justify-center gap-3">
                  <span className="font-bold text-lg text-white">Tiến Hành Chuyển Khoản</span>
                  <span className="material-symbols-outlined text-white/90">arrow_forward</span>
                </div>
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                <img src="https://payos.vn/wp-content/uploads/2025/06/Casso-payOSLogo-1.svg" alt="PayOS" className="h-5" />
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-xs font-bold uppercase tracking-widest">Powered by PayOS</span>
              </div>
            </div>
          )}
        </div>

        {/* Ads / Branding Banner */}
        <div className="mt-12 bg-gradient-to-r from-[#1c1c1e] to-[#25252b] rounded-3xl p-6 border border-white/5 flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px]" />
          <div className="w-16 h-16 shrink-0 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-3xl text-primary">auto_awesome</span>
          </div>
          <div className="text-center sm:text-left relative z-10">
            <h4 className="text-white font-bold text-lg mb-1">Thiết kế Profile Chuyên Nghiệp</h4>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">Nâng tầm thương hiệu cá nhân của bạn với giải pháp danh thiếp điện tử thông minh từ Hugo Studio.</p>
            <a href="https://wishpax.hugo/services" target="_blank" rel="noopener noreferrer" className="inline-block text-primary font-bold text-xs uppercase tracking-widest hover:text-indigo-400 transition-colors">
              Khám phá ngay →
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-zinc-600 text-xs font-medium relative z-10">
        &copy; {new Date().getFullYear()} Hugo Studio. All rights reserved.
      </footer>
    </div>
  );
}
