import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import dataApi from "../services/dataApi";
import HugoLogo from "../components/HugoLogo";

const BANKS = [
  { name: 'Vietcombank', code: 'vcb', bin: '970436', logo: 'https://cdn.vietqr.io/img/VCB.png' },
  { name: 'MBBank', code: 'mb', bin: '970422', logo: 'https://cdn.vietqr.io/img/MB.png' },
  { name: 'Techcombank', code: 'tcb', bin: '970407', logo: 'https://cdn.vietqr.io/img/TCB.png' },
  { name: 'VietinBank', code: 'icb', bin: '970415', logo: 'https://cdn.vietqr.io/img/ICB.png' },
  { name: 'BIDV', code: 'bidv', bin: '970418', logo: 'https://cdn.vietqr.io/img/BIDV.png' },
  { name: 'ACB', code: 'acb', bin: '970416', logo: 'https://cdn.vietqr.io/img/ACB.png' },
  { name: 'VPBank', code: 'vpb', bin: '970432', logo: 'https://cdn.vietqr.io/img/VPB.png' },
  { name: 'TPBank', code: 'tpb', bin: '970423', logo: 'https://cdn.vietqr.io/img/TPB.png' }
];

const getMerchantBankName = (bin) => {
  const bank = BANKS.find(b => b.bin === bin || b.code === bin);
  if (bank) return bank.name;
  
  const fallbackRegistry = {
    '970436': 'Vietcombank',
    '970422': 'MBBank',
    '970407': 'Techcombank',
    '970415': 'VietinBank',
    '970418': 'BIDV',
    '970416': 'ACB',
    '970432': 'VPBank',
    '970423': 'TPBank',
    '970405': 'Agribank',
    '970403': 'Sacombank',
    '970443': 'SHB',
    '970441': 'VIB',
    '970426': 'MSB',
    '970437': 'HDBank',
    '970440': 'SeABank',
    '970449': 'LPBank',
    '970431': 'Eximbank',
    '970448': 'OCB',
  };
  return fallbackRegistry[bin] || 'Đối tác PayOS';
};

export default function PaymentGatewayPage() {
  const { id } = useParams();
  const location = useLocation();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  const [activeTab, setActiveTab] = useState('banking'); // banking, vietqr, momo, applepay

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

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleOpenBankApp = (bankCode) => {
    if (!paymentInfo) return;
    // ba contains the destination merchant bank details: accountNumber@bin
    const deepLink = `https://dl.vietqr.io/pay?app=${bankCode}&ba=${paymentInfo.accountNumber}@${paymentInfo.bin}&am=${paymentInfo.amount}&tn=${encodeURIComponent(paymentInfo.reason)}&bn=${encodeURIComponent(paymentInfo.accountName)}`;
    window.location.href = deepLink;
  };

  const handleOpenQRNewTab = () => {
    if (!paymentInfo) return;
    const qrImageUrl = `https://img.vietqr.io/image/${paymentInfo.bin}-${paymentInfo.accountNumber}-compact2.png?amount=${paymentInfo.amount}&addInfo=${encodeURIComponent(paymentInfo.reason)}&accountName=${encodeURIComponent(paymentInfo.accountName)}`;
    window.open(qrImageUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07050a] text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-bold tracking-widest uppercase text-[10px] animate-pulse">
          Đang tải thông tin hóa đơn...
        </p>
      </div>
    );
  }

  if (error || !paymentInfo) {
    return (
      <div className="min-h-screen bg-[#07050a] text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">Hóa đơn không hợp lệ</h1>
        <p className="text-zinc-400 max-w-sm text-sm">{error || "Giao dịch không tồn tại hoặc đã hết hạn."}</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-zinc-800/80 hover:bg-zinc-700/80 hover:scale-[1.02] border border-white/5 rounded-xl font-bold transition-all text-xs"
        >
          Về Trang Chủ
        </button>
      </div>
    );
  }

  const isPaid = paymentInfo.status === 'PAID';
  const isCancelled = paymentInfo.status === 'CANCELLED' || payosStatus === 'cancelled';
  const hasBankDetails = paymentInfo.bin && paymentInfo.accountNumber;
  const qrImageUrl = hasBankDetails
    ? `https://img.vietqr.io/image/${paymentInfo.bin}-${paymentInfo.accountNumber}-compact2.png?amount=${paymentInfo.amount}&addInfo=${encodeURIComponent(paymentInfo.reason)}&accountName=${encodeURIComponent(paymentInfo.accountName)}`
    : null;

  const tabs = [
    { id: 'banking', name: 'Banking App', icon: 'phone_iphone', desc: 'Mở App tự động điền' },
    { id: 'vietqr', name: 'Mã VietQR', icon: 'qr_code_scanner', desc: 'Quét mã chuyển khoản' },
    { id: 'momo', name: 'Ví MoMo', icon: 'account_balance_wallet', desc: 'Quét qua MoMo' },
    { id: 'applepay', name: 'Thẻ / Apple Pay', icon: 'credit_card', desc: 'Visa, Master, Apple Pay' }
  ];

  const RECOMMENDED_BANKS = ['vcb', 'mb', 'tcb'];

  return (
    <div className="min-h-screen bg-[#07050a] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden pb-12">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Brand Header */}
      <header className="py-6 px-6 relative z-10 flex flex-col items-center justify-center border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
        <HugoLogo className="text-2xl mb-1.5 animate-pulse-soft" />
        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.25em] bg-emerald-400/10 px-4 py-1.5 rounded-full border border-emerald-400/20">
          CỔNG CHUYỂN KHOẢN THÔNG MINH
        </span>
      </header>

      {/* Main Payment Section */}
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 flex flex-col justify-center relative z-10 space-y-6">
        
        {/* SUCCESS / PAID STATE */}
        {isPaid && (
          <div className="bg-[#100e1a]/80 backdrop-blur-2xl border border-emerald-500/20 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-6 animate-fadeIn">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <span className="material-symbols-outlined text-4xl animate-bounce-gentle">check_circle</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-emerald-400">Chuyển Khoản Thành Công!</h2>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                Hệ thống đã nhận được tiền của bạn. Dưới đây là biên lai giao dịch điện tử của bạn.
              </p>
            </div>

            {/* Virtual Dotted Receipt */}
            <div className="bg-black/40 rounded-2xl p-5 border border-white/5 text-left text-xs space-y-4 relative">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Số tiền đã trả</span>
                <span className="text-lg font-black text-emerald-400">
                  {paymentInfo.amount.toLocaleString('vi-VN')} <span className="text-[10px] text-emerald-500/70 font-extrabold">VNĐ</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Nội dung</span>
                <span className="font-semibold text-zinc-300">{paymentInfo.reason}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Mã giao dịch</span>
                <span className="font-mono text-zinc-300 bg-white/5 px-2.5 py-1 rounded-md">{paymentInfo.customLinkId}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Thời gian nhận</span>
                <span className="text-zinc-300 font-semibold">{new Date(paymentInfo.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-3 text-xs font-bold transition-all border border-white/5 hover:scale-[1.01]"
            >
              Quay lại trang chủ
            </button>
          </div>
        )}

        {/* CANCELLED STATE */}
        {isCancelled && !isPaid && (
          <div className="bg-[#100e1a]/80 backdrop-blur-2xl border border-rose-500/20 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-6 animate-fadeIn">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-orange-400" />
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-400 mx-auto drop-shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <span className="material-symbols-outlined text-4xl">cancel</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-rose-400">Giao dịch đã hủy</h2>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                Yêu cầu chuyển khoản này đã bị hủy hoặc không thành công. Vui lòng thử lại hoặc liên hệ với chúng tôi để được trợ giúp.
              </p>
            </div>

            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-3 text-xs font-bold transition-all border border-white/5 hover:scale-[1.01]"
            >
              Về Trang Chủ
            </button>
          </div>
        )}

        {/* ACTIVE PENDING STATE */}
        {!isPaid && !isCancelled && (
          <div className="bg-[#100e1a]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-fadeIn">
            
            {/* Header / Amount Block */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-white/[0.03] to-transparent border-b border-white/5 text-center relative">
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1 text-[9px] font-bold text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-soft" />
                CHỜ THANH TOÁN
              </div>

              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Tổng Số Tiền</span>
              <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent filter drop-shadow-[0_2px_15px_rgba(52,211,153,0.15)]">
                {paymentInfo.amount.toLocaleString('vi-VN')} <span className="text-lg text-emerald-500/80 font-black">VNĐ</span>
              </h2>
              <p className="text-zinc-400 text-xs mt-2 italic max-w-md mx-auto truncate" title={paymentInfo.reason}>
                "{paymentInfo.reason}"
              </p>
            </div>

            {/* Methods Selector (Tabs Navigation - Premium Glass Pill layout) */}
            <div className="px-4 py-3 bg-black/40 border-b border-white/5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white/[0.01] p-1.5 rounded-[22px] border border-white/5">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all relative overflow-hidden ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-b from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 text-emerald-400 shadow-[0_4px_20px_-5px_rgba(16,185,129,0.15)] font-bold'
                        : 'hover:bg-white/[0.02] border border-transparent text-zinc-400 font-medium hover:text-zinc-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg mb-1">{tab.icon}</span>
                    <span className="text-[10px] uppercase tracking-wider">{tab.name}</span>
                    <span className="text-[8px] text-zinc-500 mt-0.5 hidden sm:inline-block font-normal">{tab.desc}</span>
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Tab Panel */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* TAB 1: BANKING APP */}
              {activeTab === 'banking' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mở Ứng Dụng Ngân Hàng</h3>
                    <p className="text-[11px] text-zinc-400">
                      Chọn logo ngân hàng bạn dùng dưới đây. App Banking sẽ tự động mở lên và điền sẵn mọi thông tin.
                    </p>
                  </div>

                  {hasBankDetails ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      {BANKS.map(bank => (
                        <button
                          key={bank.code}
                          onClick={() => handleOpenBankApp(bank.code)}
                          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] hover:shadow-[0_4px_20px_rgba(16,185,129,0.05)] transition-all group active:scale-95 text-center relative overflow-hidden"
                          title={`Mở ứng dụng ${bank.name}`}
                        >
                          {RECOMMENDED_BANKS.includes(bank.code) && (
                            <span className="absolute top-1 right-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[6px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full scale-90">
                              Nhanh
                            </span>
                          )}
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center p-1.5 mb-2 group-hover:bg-white/10 transition-colors border border-white/5">
                            <img 
                              src={bank.logo} 
                              alt={bank.name} 
                              className="w-full h-full object-contain filter brightness-95 group-hover:brightness-100 group-hover:scale-105 transition-all"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors truncate w-full uppercase tracking-tight">
                            {bank.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl text-center text-xs text-amber-400">
                      Không có sẵn cấu hình ngân hàng. Vui lòng dùng nút thanh toán cổng PayOS ở Tab Thẻ/Apple Pay.
                    </div>
                  )}

                  <div className="pt-2 text-center text-[10px] text-zinc-550 flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-zinc-500">info</span>
                    <span>Chức năng tự động điền chỉ khả dụng khi thao tác trên thiết bị di động (Mobile).</span>
                  </div>
                </div>
              )}

              {/* TAB 2: VIETQR */}
              {activeTab === 'vietqr' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quét Mã VietQR Chuyển Khoản</h3>
                    <p className="text-[11px] text-zinc-400">
                      Mở ứng dụng ngân hàng bất kỳ, quét mã QR này và kiểm tra thông tin trước khi chuyển.
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6 bg-white/[0.01] border border-white/5 p-5 sm:p-6 rounded-[28px]">
                    {/* QR Display Card */}
                    {qrImageUrl ? (
                      <div className="w-full md:w-auto shrink-0 flex flex-col items-center">
                        <div className="relative p-4 bg-white rounded-[24px] shadow-2xl w-52 h-52 flex items-center justify-center border-4 border-black/40 group overflow-hidden">
                          <div className="absolute inset-0 border border-emerald-400/25 rounded-[20px] pointer-events-none z-10" />
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-scan z-10" />
                          <img 
                            src={qrImageUrl} 
                            alt="VietQR Code" 
                            className="w-full h-full object-contain relative z-0"
                          />
                        </div>
                        <button
                          onClick={handleOpenQRNewTab}
                          className="mt-3.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                          Mở mã QR tab mới
                        </button>
                      </div>
                    ) : (
                      <div className="w-52 h-52 bg-white/5 border border-dashed border-white/10 rounded-[24px] flex items-center justify-center text-center text-xs text-zinc-500">
                        Không tạo được mã QR
                      </div>
                    )}

                    {/* Detailed Invoice Info */}
                    <div className="flex-1 w-full space-y-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ngân hàng thụ hưởng</span>
                        <div className="font-bold text-zinc-200 text-sm">{getMerchantBankName(paymentInfo.bin)}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Chủ tài khoản nhận</span>
                        <div className="font-bold text-zinc-200 text-sm uppercase">{paymentInfo.accountName}</div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Số tài khoản nhận</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-sm text-zinc-150">{paymentInfo.accountNumber}</span>
                            <button
                              onClick={() => handleCopy(paymentInfo.accountNumber, 'accountNumber')}
                              className="p-1 hover:bg-white/10 rounded text-emerald-400 transition-colors"
                              title="Sao chép"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {copiedField === 'accountNumber' ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Nội dung chuyển khoản</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-150">{paymentInfo.reason}</span>
                            <button
                              onClick={() => handleCopy(paymentInfo.reason, 'reason')}
                              className="p-1 hover:bg-white/10 rounded text-emerald-400 transition-colors"
                              title="Sao chép"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {copiedField === 'reason' ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MOMO */}
              {activeTab === 'momo' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Thanh Toán Bằng Ví MoMo</h3>
                    <p className="text-[11px] text-zinc-400">
                      Sử dụng tính năng quét mã VietQR có sẵn trên MoMo để chuyển khoản ngân hàng nhanh.
                    </p>
                  </div>

                  <div className="bg-[#a2195b]/5 border border-[#a2195b]/20 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 shrink-0 bg-[#a2195b] rounded-xl flex items-center justify-center text-white text-base font-extrabold shadow-[0_0_15px_rgba(162,25,91,0.3)]">
                        MoMo
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Hướng dẫn quét mã ví MoMo</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Thao tác chuyển khoản ngân hàng hoàn toàn miễn phí</p>
                      </div>
                    </div>

                    <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed border-t border-white/5 pt-3">
                      <li>Bấm chọn tab <button onClick={() => setActiveTab('vietqr')} className="text-emerald-400 font-bold hover:underline">Mã VietQR</button> và chụp ảnh màn hình hoặc tải ảnh mã QR về máy.</li>
                      <li>Click nút **Mở Ví MoMo** bên dưới hoặc tự mở ứng dụng MoMo trên điện thoại.</li>
                      <li>Chọn tính năng **Quét Mã** (góc trên bên phải) rồi chọn hình ảnh QR vừa lưu.</li>
                      <li>Kiểm tra thông tin giao dịch thụ hưởng và thực hiện chuyển khoản.</li>
                    </ol>
                  </div>

                  <button
                    onClick={() => window.location.href = 'momo://'}
                    className="w-full relative group overflow-hidden bg-[#a2195b] hover:bg-[#b81d68] text-white rounded-2xl py-3.5 transition-all text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Mở ứng dụng Ví MoMo</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </button>
                </div>
              )}

              {/* TAB 4: APPLE PAY / CREDIT CARD */}
              {activeTab === 'applepay' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Thẻ Quốc Tế / Apple Pay</h3>
                    <p className="text-[11px] text-zinc-400">
                      Sử dụng thẻ Visa, Mastercard, JCB hoặc thanh toán một chạm bằng Apple Pay an toàn.
                    </p>
                  </div>

                  {/* Glassmorphic Credit Card mockup */}
                  <div className="relative w-full max-w-sm mx-auto h-44 bg-gradient-to-br from-[#1c1a2e] to-[#0a0812] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                    <div className="flex justify-between items-start">
                      <span className="material-symbols-outlined text-3xl text-white/70">contactless</span>
                      <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">HUGO STUDIO</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/30 tracking-widest uppercase">Thanh toán an toàn qua PayOS</div>
                      <div className="flex gap-1.5 items-center">
                        <div className="w-5 h-3 bg-white/20 rounded-sm" />
                        <div className="w-5 h-3 bg-white/20 rounded-sm" />
                        <div className="w-5 h-3 bg-white/20 rounded-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Primary checkout button */}
                  <button 
                    onClick={() => window.location.href = paymentInfo.checkoutUrl}
                    className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-3.5 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)]"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <div className="relative flex items-center justify-center gap-2">
                      <span className="font-bold text-xs text-white uppercase tracking-wider">Thanh toán qua cổng PayOS (Thẻ/ATM)</span>
                      <span className="material-symbols-outlined text-white text-sm">arrow_forward</span>
                    </div>
                  </button>

                  {/* Brand verification logs */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <div className="flex items-center gap-2 text-zinc-500 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all text-[9px] uppercase tracking-wider font-extrabold">
                      <span>Visa</span>
                      <div className="w-1 h-1 rounded-full bg-white/30" />
                      <span>Mastercard</span>
                      <div className="w-1 h-1 rounded-full bg-white/30" />
                      <span>JCB</span>
                      <div className="w-1 h-1 rounded-full bg-white/30" />
                      <span>Apple Pay</span>
                    </div>
                    <span className="hidden sm:inline text-zinc-700 text-xs">|</span>
                    <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-all">
                      <img src="https://payos.vn/wp-content/uploads/2025/06/Casso-payOSLogo-1.svg" alt="PayOS" className="h-3.5 dark:brightness-125" />
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">Bảo mật</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom metadata */}
            <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 text-[10px] text-zinc-550 flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="flex items-center gap-1">
                <span>Mã giao dịch:</span>
                <span className="font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded">{paymentInfo.customLinkId}</span>
              </div>
              <div>
                Ngày tạo: <span className="font-semibold text-zinc-455">{new Date(paymentInfo.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>

          </div>
        )}

        {/* Optional Branding Banner */}
        <div className="bg-[#100e1a]/50 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 flex flex-col sm:flex-row items-center gap-4 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] pointer-events-none" />
          <div className="w-11 h-11 shrink-0 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-xl text-primary animate-bounce-gentle">auto_awesome</span>
          </div>
          <div className="text-center sm:text-left relative z-10 flex-1">
            <h4 className="text-white font-bold text-xs mb-0.5">Thiết kế Profile Chuyên Nghiệp</h4>
            <p className="text-zinc-400 text-[10px] leading-relaxed mb-2">Nâng tầm thương hiệu cá nhân của bạn với danh thiếp điện tử Bento từ Hugo Studio.</p>
            <a 
              href="https://www.hugowishpax.studio" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block text-primary hover:text-indigo-400 font-bold text-[9px] uppercase tracking-widest transition-colors"
            >
              Khám phá ngay →
            </a>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-zinc-650 text-xs font-semibold relative z-10 mt-auto">
        &copy; {new Date().getFullYear()} Hugo Studio. All rights reserved.
      </footer>
    </div>
  );
}
