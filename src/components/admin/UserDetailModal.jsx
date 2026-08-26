import { useState, useEffect } from 'react';
import adminBrainApi from '../../services/api/AdminBrainApi';
import { notify } from '../../lib/notify';
import { formatJoy, formatJoyCompact, formatJoyDual, parseJoyInput, JOY_UNITS } from '../../utils/joyFormatter';
import { JOY_DENOMS, toDenom } from '../../../shared/joyCurrency.js';
import { maskPhone } from '../../utils/phoneSecurity';
import { formatFullAddress, profileAnswerDisplayName, religionDisplayName } from '../../lib/profileDisplay';

export default function UserDetailModal({ user, onClose, onRefresh }) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // profile | joy | orders | tickets | email | security

  // Profile Edit & Expiration Extension State
  const [editingProfile, setEditingProfile] = useState(false);
  const [showFullPhone, setShowFullPhone] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '', headline: '', phone: '', address: '', jobTitle: '', education: '',
    countryCode: '', adminArea: '', locality: '', exactAddress: '', verifiedLatitude: '',
    verifiedLongitude: '', locationVerifiedAt: '', ethnicity: '', religion: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // JOY Adjustment Form State
  const [joyAmount, setJoyAmount] = useState('');
  const [joyUnit, setJoyUnit] = useState('JOY'); // JOY | kJOY | MJOY
  const [joyReason, setJoyReason] = useState('');
  const [joySubmitting, setJoySubmitting] = useState(false);

  // JOY Reconciliation Audit State
  const [reconData, setReconData] = useState(null);
  const [reconLoading, setReconLoading] = useState(false);

  // Direct Email Form State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailInstructions, setEmailInstructions] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  // Voucher Issuance State
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherJoyReward, setVoucherJoyReward] = useState('');
  const [voucherMessage, setVoucherMessage] = useState('');
  const [sendingVoucher, setSendingVoucher] = useState(false);

  const handleSendVoucher = async (e) => {
    e.preventDefault();
    setSendingVoucher(true);
    try {
      const res = await adminBrainApi.sendUserVoucher(user._id, {
        voucherCode,
        joyReward: voucherJoyReward,
        message: voucherMessage
      });
      notify.success(res.message || 'Đã gửi tặng Voucher và JOY thành công');
      setVoucherCode('');
      setVoucherJoyReward('');
      setVoucherMessage('');
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      notify.error(err.message || 'Lỗi gửi Voucher');
    } finally {
      setSendingVoucher(false);
    }
  };

  // AI Ticket Reply State
  const [replyingTicketId, setReplyingTicketId] = useState(null);
  const [aiDraftReply, setAiDraftReply] = useState('');
  const [aiDraftLoading, setAiDraftLoading] = useState(false);

  // Order Refund State
  const [refundingOrderId, setRefundingOrderId] = useState(null);

  const fetchDetails = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await adminBrainApi.getUserDetails(user._id);
      setDetails(data);
      if (data?.bio) {
        setProfileForm({
          displayName: data.bio.displayName || '',
          headline: data.bio.headline || '',
          phone: data.bio.phone || '',
          address: data.bio.address || '',
          jobTitle: data.bio.jobTitle || '',
          education: data.bio.education || '',
          countryCode: data.bio.countryCode || '',
          adminArea: data.bio.adminArea || '',
          locality: data.bio.locality || '',
          exactAddress: data.bio.exactAddress || '',
          verifiedLatitude: data.bio.verifiedLatitude || '',
          verifiedLongitude: data.bio.verifiedLongitude || '',
          locationVerifiedAt: data.bio.locationVerifiedAt || '',
          ethnicity: data.bio.ethnicity || '',
          religion: data.bio.religion || '',
          joyDenom: data.bio.joyDenom || 'vi'
        });
      }
      fetchReconciliation();
    } catch (err) {
      notify.error(err.message || 'Lỗi khi tải chi tiết người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliation = async () => {
    if (!user?._id) return;
    setReconLoading(true);
    try {
      const res = await adminBrainApi.getJoyReconciliation(user._id);
      setReconData(res.reconciliation);
    } catch (err) {
      console.error('Lỗi đối soát Ví JOY:', err);
    } finally {
      setReconLoading(false);
    }
  };

  const handleExecuteReconcile = async () => {
    if (!user?._id) return;
    setReconLoading(true);
    try {
      const res = await adminBrainApi.executeJoyReconciliation(user._id);
      notify.success(res.message || 'Đã đối soát và đồng bộ chuẩn hóa Ví JOY');
      setReconData(res.reconciliation);
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      notify.error(err.message || 'Lỗi khi đối soát Ví JOY');
    } finally {
      setReconLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await adminBrainApi.updateUserProfileAndExpiration(user._id, profileForm);
      notify.success(res.message || 'Đã cập nhật hồ sơ thành công');
      setEditingProfile(false);
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      notify.error(err.message || 'Lỗi cập nhật hồ sơ');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExtendExpiration = async (addDays) => {
    setSavingProfile(true);
    try {
      const res = await adminBrainApi.updateUserProfileAndExpiration(user._id, { addDays });
      notify.success(res.message || `Đã gia hạn thêm ${addDays} ngày HSD`);
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      notify.error(err.message || 'Lỗi gia hạn HSD');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAdjustJoy = async (e) => {
    e.preventDefault();
    const rawAmt = Number(joyAmount);
    if (!rawAmt || isNaN(rawAmt)) {
      return notify.error('Vui lòng nhập số lượng JOY hợp lệ');
    }
    setJoySubmitting(true);
    try {
      const res = await adminBrainApi.adjustUserJoy(user._id, rawAmt, joyReason, joyUnit);
      notify.success(res.message || 'Đã điều chỉnh JOY thành công');
      setJoyAmount('');
      setJoyReason('');
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      notify.error(err.message || 'Lỗi điều chỉnh JOY');
    } finally {
      setJoySubmitting(false);
    }
  };

  const handleApplyPreset = (value, unit) => {
    setJoyAmount(value);
    setJoyUnit(unit);
  };

  const handleSendDirectEmail = async (e) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailInstructions.trim()) {
      return notify.error('Vui lòng điền tiêu đề và nội dung hướng dẫn email');
    }
    setEmailSending(true);
    try {
      const res = await adminBrainApi.sendDirectUserEmail(user._id, {
        subject: emailSubject,
        instructions: emailInstructions
      });
      notify.success(res.message || 'Đã gửi email thành công');
      setEmailSubject('');
      setEmailInstructions('');
    } catch (err) {
      notify.error(err.message || 'Lỗi gửi email');
    } finally {
      setEmailSending(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi phiên làm việc của ${user.displayName}?`)) return;
    try {
      const res = await adminBrainApi.revokeUserSession(user._id);
      notify.success(res.message || 'Đã đăng xuất cưỡng chế người dùng');
      fetchDetails();
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleToggleWalletFreeze = async () => {
    try {
      const res = await adminBrainApi.toggleUserWalletFreeze(user._id);
      notify.success(res.message || 'Đã cập nhật trạng thái Ví JOY');
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      notify.error(err.message || 'Lỗi khi đóng băng Ví JOY');
    }
  };

  const handleToggleEduStatus = async () => {
    try {
      const res = await adminBrainApi.toggleUserEduStatus(user._id);
      notify.success(res.message || 'Đã cập nhật trạng thái EDU');
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      notify.error(err.message || 'Lỗi khi cập nhật EDU');
    }
  };

  const handleCancelAndRefundOrder = async (orderId) => {
    setRefundingOrderId(orderId);
    try {
      const res = await adminBrainApi.cancelAndRefundStoreOrder(orderId);
      notify.success(res.message || 'Đã hủy đơn hàng và hoàn tiền JOY');
      fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      notify.error(err.message || 'Lỗi khi hoàn tiền');
    } finally {
      setRefundingOrderId(null);
    }
  };

  const handleAIDraftReply = async (ticketId) => {
    setReplyingTicketId(ticketId);
    setAiDraftLoading(true);
    try {
      const res = await adminBrainApi.draftTicketReply(ticketId);
      setAiDraftReply(res.reply || '');
    } catch (err) {
      notify.error(err.message || 'Lỗi tạo câu trả lời AI');
    } finally {
      setAiDraftLoading(false);
    }
  };

  if (!user) return null;
  const bio = details?.bio || user;
  const privateAddress = formatFullAddress(profileForm, 'vi');
  const hasVerifiedCoordinates = Number.isFinite(Number(profileForm.verifiedLatitude))
    && Number.isFinite(Number(profileForm.verifiedLongitude));

  const calculatedBaseJoy = parseJoyInput(joyAmount, joyUnit);
  const currentBalance = bio?.joyBalance ?? 0;
  const projectedBalance = currentBalance + calculatedBaseJoy;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xl animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#121422] text-slate-900 dark:text-white w-full max-w-5xl max-h-[90vh] rounded-[36px] border border-slate-200/80 dark:border-white/15 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent backdrop-blur-3xl">
          <div className="flex items-center gap-4">
            {bio.avatarUrl ? (
              <img src={bio.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-white/20 shadow-md" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-lg">
                {bio.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black tracking-wide text-slate-900 dark:text-white">{bio.displayName}</h3>
                {bio.starVip && (
                  <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[10px] font-extrabold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">star</span> VIP
                  </span>
                )}
                {bio.isJoyWalletFrozen && (
                  <span className="px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 text-[10px] font-black flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">ac_unit</span> ĐÓN BĂNG VÍ
                  </span>
                )}
                {bio.isEduVerified && (
                  <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 text-[10px] font-black flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">school</span> SINH VIÊN EDU
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span className="font-semibold">{bio.email}</span>
                <span>•</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">/bio/{bio.slug}</span>
                <span>•</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{formatJoyDual(bio.joyBalance || 0)}</span>
                {bio.joyDenom && (
                  <>
                    <span>•</span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 text-[11px]">
                      Đơn vị: {toDenom(bio.joyBalance || 0, bio.joyDenom).code} ({JOY_DENOMS[bio.joyDenom]?.name || bio.joyDenom})
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Segmented Navigation Capsules */}
        <div className="px-6 py-3 border-b border-slate-200/80 dark:border-white/10 flex items-center gap-2 bg-slate-50/80 dark:bg-[#0d0e18] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span> Hồ sơ &amp; HSD
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('joy')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'joy' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">account_balance_wallet</span> Ví JOY &amp; Đối soát
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'orders' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">shopping_bag</span> Đơn hàng Store ({(details?.orders || []).length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">support_agent</span> Tickets ({(details?.tickets || []).length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'email' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">mail</span> Gửi Email
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'security' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">shield</span> An ninh ({details?.securityCount || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 gap-3">
              <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
              <span>Đang tải thông tin thành viên...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: PROFILE & EXPIRATION & CONTROLS */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Top Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-3xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Thời hạn sử dụng (HSD)</div>
                      <div className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">event</span>
                        <span>{new Date(bio.expiresAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-3xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Trạng thái Ví JOY</div>
                      <div className={`text-sm font-black mt-1 flex items-center gap-1.5 ${bio.isJoyWalletFrozen ? 'text-rose-500' : 'text-emerald-500'}`}>
                        <span className="material-symbols-outlined text-base">{bio.isJoyWalletFrozen ? 'ac_unit' : 'check_circle'}</span>
                        <span>{bio.isJoyWalletFrozen ? 'Đang Đóng Băng' : 'Hoạt động Bình thường'}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-3xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Kiểm tra thông tin định kỳ</div>
                      {(() => {
                        const ic = bio.identityCheck || {};
                        const failed = (ic.failStreak || 0) > 0;
                        const overdue = ic.nextDueAt && new Date(ic.nextDueAt) <= new Date();
                        return (
                          <>
                            <div className={`text-sm font-black mt-1 flex items-center gap-1.5 ${failed ? 'text-rose-500' : overdue ? 'text-amber-500' : 'text-emerald-500'}`}>
                              <span className="material-symbols-outlined text-base">{failed ? 'gpp_bad' : overdue ? 'pending' : 'verified_user'}</span>
                              <span>{failed ? `Đã trượt ${ic.failStreak} đợt` : overdue ? 'Đang chờ trả lời' : 'Bình thường'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {ic.lastVerifiedAt
                                ? `Xác minh gần nhất: ${new Date(ic.lastVerifiedAt).toLocaleDateString('vi-VN')}${ic.lastField ? ` (${ic.lastField})` : ''}`
                                : 'Chưa từng xác minh'}
                              {ic.nextDueAt ? ` · Đợt kế: ${new Date(ic.nextDueAt).toLocaleDateString('vi-VN')}` : ''}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="p-4 rounded-3xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ưu đãi Sinh viên EDU</div>
                      <div className={`text-sm font-black mt-1 flex items-center gap-1.5 ${bio.isEduVerified ? 'text-indigo-500' : 'text-slate-400'}`}>
                        <span className="material-symbols-outlined text-base">school</span>
                        <span>{bio.isEduVerified ? 'Đã Xác minh EDU' : 'Chưa Xác minh'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expiration Direct Extension Bar */}
                  <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/30 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-widest text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">add_moderator</span> Gia hạn Ngày hết hạn HSD nhanh
                      </h4>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        HSD hiện tại: <strong className="text-blue-600 dark:text-blue-400">{new Date(bio.expiresAt).toLocaleDateString('vi-VN')}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleExtendExpiration(7)}
                        disabled={savingProfile}
                        className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all shadow-md active:scale-95"
                      >
                        +7 Ngày
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtendExpiration(30)}
                        disabled={savingProfile}
                        className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all shadow-md active:scale-95"
                      >
                        +30 Ngày (1 Tháng)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtendExpiration(90)}
                        disabled={savingProfile}
                        className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all shadow-md active:scale-95"
                      >
                        +90 Ngày (3 Tháng)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtendExpiration(365)}
                        disabled={savingProfile}
                        className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition-all shadow-md active:scale-95"
                      >
                        +365 Ngày (1 Năm)
                      </button>
                    </div>
                  </div>

                  {/* Profile Edit Form / View */}
                  <form onSubmit={handleSaveProfile} className="p-5 rounded-3xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-lg">badge</span> Thông tin cá nhân &amp; Chỉnh sửa
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingProfile(!editingProfile)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {editingProfile ? 'Đóng chỉnh sửa' : 'Bật chỉnh sửa'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Tên hiển thị</label>
                        <input
                          type="text"
                          disabled={!editingProfile}
                          value={profileForm.displayName}
                          onChange={(e) => setProfileForm(p => ({ ...p, displayName: e.target.value }))}
                          className="w-full px-3.5 py-2 rounded-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold outline-none disabled:opacity-80"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Tiêu đề (Headline)</label>
                        <input
                          type="text"
                          disabled={!editingProfile}
                          value={profileForm.headline}
                          onChange={(e) => setProfileForm(p => ({ ...p, headline: e.target.value }))}
                          className="w-full px-3.5 py-2 rounded-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none disabled:opacity-80"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Số điện thoại <span className="text-[10px] text-emerald-500 font-extrabold">(Bảo Mật)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowFullPhone(!showFullPhone)}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">{showFullPhone ? 'visibility_off' : 'visibility'}</span>
                            <span>{showFullPhone ? 'Che Số' : 'Hiện Số Thật'}</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          disabled={!editingProfile}
                          value={editingProfile || showFullPhone ? profileForm.phone : maskPhone(profileForm.phone)}
                          onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                          className="w-full px-3.5 py-2 rounded-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono font-bold outline-none disabled:opacity-80"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Địa điểm công khai trên Bio</label>
                        <input
                          type="text"
                          disabled={!editingProfile}
                          value={profileForm.address}
                          onChange={(e) => setProfileForm(p => ({ ...p, address: e.target.value }))}
                          className="w-full px-3.5 py-2 rounded-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none disabled:opacity-80"
                        />
                      </div>
                      {!editingProfile && (
                        <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                          <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined mt-0.5 text-blue-500">home_pin</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">Địa chỉ riêng tư đã xác minh</p>
                              <p className="mt-1 text-sm font-bold leading-relaxed text-slate-900 dark:text-white">{privateAddress || 'Chưa cung cấp'}</p>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <span><strong>Dân tộc:</strong> {profileAnswerDisplayName(profileForm.ethnicity, 'vi') || '—'}</span>
                                <span><strong>Tôn giáo:</strong> {religionDisplayName(profileForm.religion, 'vi') || '—'}</span>
                              </div>
                              {hasVerifiedCoordinates && (
                                <a
                                  href={`https://www.openstreetmap.org/?mlat=${profileForm.verifiedLatitude}&mlon=${profileForm.verifiedLongitude}#map=18/${profileForm.verifiedLatitude}/${profileForm.verifiedLongitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                  <span className="material-symbols-outlined text-sm">location_on</span>
                                  Xem vị trí đã xác minh trên bản đồ
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {editingProfile && [
                        ['countryCode', 'Mã quốc gia ISO'],
                        ['adminArea', 'Tỉnh / Thành phố / Bang'],
                        ['locality', 'Phường / Xã / Khu vực'],
                        ['exactAddress', 'Số nhà, đường, tòa nhà'],
                        ['verifiedLatitude', 'Vĩ độ đã xác minh'],
                        ['verifiedLongitude', 'Kinh độ đã xác minh'],
                        ['ethnicity', 'Dân tộc / bản sắc sắc tộc'],
                        ['religion', 'Mã tôn giáo / hệ phái'],
                      ].map(([field, label]) => (
                        <div key={field}>
                          <label className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">{label}</label>
                          <input
                            type="text"
                            value={profileForm[field] || ''}
                            onChange={(e) => setProfileForm((current) => ({ ...current, [field]: e.target.value }))}
                            className="w-full rounded-full border border-slate-200 bg-white px-3.5 py-2 text-slate-900 outline-none dark:border-white/10 dark:bg-black/40 dark:text-white"
                          />
                        </div>
                      ))}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Chức danh / Công việc</label>
                        <input
                          type="text"
                          disabled={!editingProfile}
                          value={profileForm.jobTitle}
                          onChange={(e) => setProfileForm(p => ({ ...p, jobTitle: e.target.value }))}
                          className="w-full px-3.5 py-2 rounded-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none disabled:opacity-80"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Học vấn</label>
                        <input
                          type="text"
                          disabled={!editingProfile}
                          value={profileForm.education}
                          onChange={(e) => setProfileForm(p => ({ ...p, education: e.target.value }))}
                          className="w-full px-3.5 py-2 rounded-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none disabled:opacity-80"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">payments</span> Đơn vị JOY Hiển Thị
                        </label>
                        <select
                          disabled={!editingProfile}
                          value={profileForm.joyDenom || 'vi'}
                          onChange={(e) => setProfileForm(p => ({ ...p, joyDenom: e.target.value }))}
                          className="w-full px-3.5 py-2 rounded-full bg-white dark:bg-black/40 border border-purple-500/40 text-purple-700 dark:text-purple-300 font-extrabold outline-none disabled:opacity-80 cursor-pointer"
                        >
                          {Object.entries(JOY_DENOMS).map(([key, denom]) => (
                            <option key={key} value={key} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                              {denom.code} — {denom.name} (Hệ số: x{denom.factor})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {editingProfile && (
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
                      >
                        Lưu thay đổi hồ sơ
                      </button>
                    )}
                  </form>

                  {/* Advanced Executive Admin Controls */}
                  <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/30 space-y-4 shadow-md">
                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-500">settings_remote</span> Bộ công cụ Điều khiển Thành viên Chuyên sâu
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={handleToggleWalletFreeze}
                        className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all shadow-sm ${
                          bio.isJoyWalletFrozen
                            ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                            : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white border-slate-300 dark:border-white/10'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{bio.isJoyWalletFrozen ? 'ac_unit' : 'lock_open'}</span>
                        <span>{bio.isJoyWalletFrozen ? 'Mở Đóng Băng Ví JOY' : 'Đóng Băng Ví JOY'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleEduStatus}
                        className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all shadow-sm ${
                          bio.isEduVerified
                            ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white border-slate-300 dark:border-white/10'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">school</span>
                        <span>{bio.isEduVerified ? 'Thu hồi Ưu đãi EDU' : 'Xác minh Sinh viên EDU'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRevokeSession}
                        className="p-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border border-rose-600 text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all shadow-md active:scale-95"
                      >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        <span>Đăng xuất Cưỡng chế</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: JOY WALLET MANAGEMENT & RECONCILIATION */}
              {activeTab === 'joy' && (
                <div className="space-y-6">
                  {/* JOY Reconciliation Audit Shield */}
                  <div className="p-4 rounded-3xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-xl ${
                          reconLoading ? 'animate-spin text-slate-400' :
                          reconData?.isHealthy ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {reconLoading ? 'sync' : reconData?.isHealthy ? 'verified_user' : 'gpp_maybe'}
                        </span>
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Kiểm toán Chống Gian lận Sổ cái Ví JOY</span>
                            {reconData && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                reconData.isHealthy ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                              }`}>
                                {reconData.isHealthy ? 'Hoàn hảo 100%' : 'Phát hiện sai lệch!'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {reconLoading ? 'Đang đối soát số dư với tổng giao dịch JoyLedger...' :
                             reconData?.isHealthy ? `Số dư Ví (${formatJoy(reconData.currentBalance)}) khớp 100% tổng sổ cái (${formatJoy(reconData.totalLedgerSum)}) qua ${reconData.txCount} giao dịch.` :
                             `Số dư Ví hiện tại (${formatJoy(reconData?.currentBalance || 0)}) khác tổng Sổ cái (${formatJoy(reconData?.totalLedgerSum || 0)}). Lệch: ${formatJoy(reconData?.drift || 0)}.`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={fetchReconciliation}
                          disabled={reconLoading}
                          className="px-3 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
                        >
                          Kiểm tra lại
                        </button>
                        {reconData && !reconData.isHealthy && (
                          <button
                            type="button"
                            onClick={handleExecuteReconcile}
                            disabled={reconLoading}
                            className="px-4 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold transition-all shadow-md animate-pulse"
                          >
                            1-Click Đồng bộ chuẩn hóa
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Voucher Issuance & Auto-Translation Card */}
                  <form onSubmit={handleSendVoucher} className="p-6 rounded-3xl bg-purple-500/10 border border-purple-500/30 space-y-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-purple-800 dark:text-purple-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-500">card_giftcard</span> Gửi Tặng Voucher &amp; JOY (Tự Động Dịch Ngôn Ngữ Thành Viên)
                      </h4>
                      <span className="px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase">
                        Auto-Translate ({bio.preferredLanguage || bio.countryCode || 'VI'})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Gửi tặng Voucher giảm giá hoặc JOY thưởng trực tiếp cho thành viên. Email thông báo sẽ được hệ thống <strong>tự động dịch sang ngôn ngữ chính ({bio.preferredLanguage || bio.countryCode || 'VI'})</strong> của người dùng.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Voucher / Quà tặng</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: VIP-GIFT-2026 hoặc SUMMER-JOY"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Số JOY tặng kèm (Nếu có)</label>
                        <input
                          type="number"
                          placeholder="Ví dụ: 1000 (JOY)"
                          value={voucherJoyReward}
                          onChange={(e) => setVoucherJoyReward(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-amber-600 dark:text-amber-400 font-black text-xs outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lời nhắn từ Quản trị viên</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Cảm ơn bạn đã đóng góp tích cực cho cộng đồng Hugo Studio!"
                        value={voucherMessage}
                        onChange={(e) => setVoucherMessage(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingVoucher || !voucherCode}
                      className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg disabled:opacity-50"
                    >
                      {sendingVoucher && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                      <span>Gửi Voucher &amp; Tự động Dịch cho Thành viên</span>
                    </button>
                  </form>
                  <form onSubmit={handleAdjustJoy} className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-5 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h4 className="text-sm font-black text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">tune</span> Điều chỉnh số dư Ví JOY theo đơn vị
                      </h4>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Số dư hiện tại: <span className="text-amber-600 dark:text-amber-400 font-extrabold">{formatJoyDual(currentBalance)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nạp/trừ nhanh chuẩn hóa:</div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleApplyPreset('100', 'JOY')} className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-xs font-bold">+100 JOY</button>
                        <button type="button" onClick={() => handleApplyPreset('1', 'kJOY')} className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-xs font-bold">+1 kJOY (+1,000)</button>
                        <button type="button" onClick={() => handleApplyPreset('10', 'kJOY')} className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-xs font-bold">+10 kJOY (+10,000)</button>
                        <button type="button" onClick={() => handleApplyPreset('100', 'kJOY')} className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-xs font-bold">+100 kJOY (+100,000)</button>
                        <button type="button" onClick={() => handleApplyPreset('-500', 'JOY')} className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40 text-xs font-bold">-500 JOY</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Số lượng (+ cộng, - trừ)</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="Ví dụ: 1.5 hoặc -500"
                          value={joyAmount}
                          onChange={(e) => setJoyAmount(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Đơn vị quy đổi (12 Đơn vị)</label>
                        <select
                          value={joyUnit}
                          onChange={(e) => setJoyUnit(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        >
                          {Object.values(JOY_UNITS).map((u) => (
                            <option key={u.key} value={u.key} className="bg-slate-900 text-white py-1">
                              {u.label} — {u.desc}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lý do điều chỉnh</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Thưởng sự kiện hoặc Xử lý sự cố"
                          value={joyReason}
                          onChange={(e) => setJoyReason(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>
                    </div>

                    {joyAmount && !isNaN(Number(joyAmount)) && Number(joyAmount) !== 0 && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between">
                        <div>
                          <div>Quy đổi cơ sở: <strong className="font-extrabold">{calculatedBaseJoy > 0 ? '+' : ''}{formatJoy(calculatedBaseJoy)}</strong></div>
                          <div className="text-[11px] opacity-80 mt-0.5">
                            Số dư sau giao dịch: {formatJoyDual(projectedBalance)}
                            {bio?.joyDenom && ` (Màn hình TV: ${toDenom(projectedBalance, bio.joyDenom).amount.toLocaleString()} ${toDenom(projectedBalance, bio.joyDenom).code})`}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-xl text-amber-600">verified</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={joySubmitting || !joyAmount}
                      className="px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-600 text-black font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg disabled:opacity-50"
                    >
                      {joySubmitting && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                      <span>Thực thi điều chỉnh JOY ({JOY_UNITS[joyUnit]?.label || joyUnit})</span>
                    </button>
                  </form>

                  {/* Joy Ledger History */}
                  <div className="p-5 rounded-3xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-lg">receipt_long</span> Lịch sử biến động JOY (20 giao dịch gần nhất)
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {(details?.joyLedger || []).length === 0 ? (
                        <div className="text-xs text-slate-500 italic py-2">Chưa có biến động JOY.</div>
                      ) : (
                        details.joyLedger.map((item) => (
                          <div key={item._id} className="p-3 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs shadow-sm">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{item.description || item.source}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">Nguồn: {item.source} • Sau GD: {formatJoyCompact(item.balanceAfter)}</div>
                            </div>
                            <div className={`font-black text-xs ${item.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {item.amount >= 0 ? `+${formatJoyDual(item.amount)}` : formatJoyDual(item.amount)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MEMBER UTILITY STORE ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-500 text-lg">shopping_bag</span> Lịch sử Mua sắm Store cá nhân ({(details?.orders || []).length} đơn)
                  </h4>

                  {(details?.orders || []).length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-8 text-center">Thành viên này chưa mua sản phẩm Store nào.</div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                      {details.orders.map((o) => (
                        <div key={o._id} className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs shadow-sm">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{o.productName}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Mã: {o.purchaseCode} • {new Date(o.createdAt).toLocaleString('vi-VN')}</div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                              {formatJoyDual(o.priceJoy)}
                            </span>
                            {o.status !== 'cancelled' ? (
                              <button
                                type="button"
                                onClick={() => handleCancelAndRefundOrder(o._id)}
                                disabled={refundingOrderId === o._id}
                                className="px-3 py-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black transition-all shadow-sm active:scale-95"
                              >
                                {refundingOrderId === o._id ? 'Đang hoàn tiền...' : 'Hủy đơn & Hoàn JOY'}
                              </button>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-600 dark:text-rose-400">
                                Đã hủy &amp; Hoàn JOY
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TICKETS & AI DRAFT REPLY */}
              {activeTab === 'tickets' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500 text-lg">support_agent</span> Ticket Yêu cầu Hỗ trợ ({(details?.tickets || []).length})
                  </h4>

                  {(details?.tickets || []).length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-8 text-center">Thành viên này chưa gửi ticket hỗ trợ nào.</div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {details.tickets.map((t) => (
                        <div key={t._id} className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-2 text-xs shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-slate-900 dark:text-white">{t.subject || 'Ticket Yêu cầu Hỗ trợ'}</div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}>
                              {t.status === 'resolved' ? 'Đã giải quyết' : 'Chờ xử lý'}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">{t.message}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200/50 dark:border-white/5">
                            <span>Ngày tạo: {new Date(t.createdAt).toLocaleString('vi-VN')}</span>
                            <button
                              type="button"
                              onClick={() => handleAIDraftReply(t._id)}
                              disabled={aiDraftLoading && replyingTicketId === t._id}
                              className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">auto_awesome</span>
                              <span>{aiDraftLoading && replyingTicketId === t._id ? 'Đang AI soạn...' : 'AI Soạn câu trả lời 1-Click'}</span>
                            </button>
                          </div>

                          {replyingTicketId === t._id && aiDraftReply && (
                            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-200 space-y-2 mt-2 animate-fadeIn">
                              <div className="font-bold flex items-center gap-1 text-indigo-500">
                                <span className="material-symbols-outlined text-sm">psychology</span> Phản hồi đề xuất bởi AI Brain:
                              </div>
                              <p className="whitespace-pre-line">{aiDraftReply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: DIRECT EMAIL COMPOSER */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <form onSubmit={handleSendDirectEmail} className="p-6 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 space-y-4 shadow-lg">
                    <h4 className="text-sm font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-cyan-500">mail</span> Gửi Email Trực tiếp đến {bio.email}
                    </h4>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tiêu đề Email (Subject) *</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Thông báo quan trọng về tài khoản của bạn"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Nội dung hướng dẫn / Thông điệp *</label>
                      <textarea
                        rows={5}
                        placeholder="Nhập nội dung chi tiết muốn gửi tới thành viên này..."
                        value={emailInstructions}
                        onChange={(e) => setEmailInstructions(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={emailSending}
                      className="px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all flex items-center gap-2 disabled:opacity-50 shadow-md active:scale-95"
                    >
                      {emailSending && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                      <span>Gửi Email Trực tiếp Ngay</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 6: SECURITY & EMERGENCY LOCK/UNLOCK */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-rose-800 dark:text-rose-300 flex items-center gap-2">
                          <span className="material-symbols-outlined text-rose-500">shield</span> Trạng thái An ninh &amp; Khóa Khẩn cấp
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Tổng sự cố an ninh liên quan: <strong className="text-rose-600 dark:text-rose-400">{details?.securityCount || 0} Sự cố</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRevokeSession}
                        className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition-all shadow-md active:scale-95"
                      >
                        Đăng xuất Cưỡng chế Ngay
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
