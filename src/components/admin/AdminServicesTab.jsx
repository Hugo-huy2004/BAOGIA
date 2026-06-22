import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAdminSession } from '../../services/authSession';
import { toast } from 'react-hot-toast';
import { packageApi } from '../../services/api/PackageApi';
import { userApi } from '../../services/api/UserApi';
import SmartUserSearch from './SmartUserSearch';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminServicesTab({ showNotification, triggerConfirm }) {
  const { t } = useTranslation();
  const [activeSegment, setActiveSegment] = useState('payos'); // 'payos' | 'joy' | 'packages'
  
  // PayOS States
  const [links, setLinks] = useState([]);
  const [payosLoading, setPayosLoading] = useState(false);
  const [payosForm, setPayosForm] = useState({ amount: '', reason: '' });
  const [payosUser, setPayosUser] = useState(null);
  const [displayAmount, setDisplayAmount] = useState('');

  // Joy States
  const [cards, setCards] = useState([]);
  const [joyLoading, setJoyLoading] = useState(true);
  const [joyForm, setJoyForm] = useState({ amount: '', note: '', count: 1 });
  const [joyMode, setJoyMode] = useState('voucher'); // 'voucher' | 'direct'
  const [joyUser, setJoyUser] = useState(null);
  const [creatingJoy, setCreatingJoy] = useState(false);

  // Packages States
  const [packageTemplates, setPackageTemplates] = useState([]);
  const [newPkg, setNewPkg] = useState({ name: "", duration: "", durationUnit: "months", benefits: "" });
  const [assignForm, setAssignForm] = useState({ packageId: "", customDuration: "" });
  const [assignUser, setAssignUser] = useState(null);
  const [memberPkgSearchEmail, setMemberPkgSearchEmail] = useState("");
  const [searchedMemberBio, setSearchedMemberBio] = useState(null);
  const [pkgLoading, setPkgLoading] = useState(false);

  const getHeaders = () => {
    const session = getAdminSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
    };
  };

  const generateRandomCode = (prefix = 'HUGO') => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${randomPart}`;
  };

  const fetchLinks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payos/all`, { headers: getHeaders(), credentials: 'include' });
      const data = await response.json();
      if (data.success) setLinks(data.data);
    } catch (err) {}
  };

  const fetchCards = async () => {
    setJoyLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/joy-gift-cards`, { headers: getHeaders(), credentials: 'include' });
      const data = await r.json();
      setCards(Array.isArray(data) ? data : []);
    } catch (_) {} finally { setJoyLoading(false); }
  };

  const fetchPackageTemplates = async () => {
    setPkgLoading(true);
    try {
      const data = await packageApi.getPackages();
      setPackageTemplates(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setPkgLoading(false);
    }
  };

  useEffect(() => {
    setPayosForm(prev => ({ ...prev, reason: generateRandomCode() }));
    fetchLinks();
    fetchCards();
    fetchPackageTemplates();
  }, []);

  // PayOS Handlers
  const formatAmount = (value) => {
    if (!value) return '';
    const cleanNumber = value.replace(/\D/g, '');
    return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const cleanValue = rawValue.replace(/\D/g, '');
    if (cleanValue.length > 12) return;
    setDisplayAmount(formatAmount(cleanValue));
    setPayosForm(prev => ({ ...prev, amount: cleanValue }));
  };

  const handlePayosSubmit = async (e) => {
    e.preventDefault();
    setPayosLoading(true);
    const numericAmount = Number(payosForm.amount);
    if (!numericAmount || numericAmount < 2000) {
      toast.error('Số tiền tối thiểu phải là 2.000 đ');
      setPayosLoading(false);
      return;
    }
    try {
      let endpoint = `${API_BASE_URL}/payos/create`;
      let bodyData = { amount: numericAmount, reason: payosForm.reason.toUpperCase() };

      if (payosUser) {
        endpoint = `${API_BASE_URL}/payos/request-payment`;
        bodyData.email = payosUser.email;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(bodyData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(payosUser ? `Đã gửi yêu cầu thanh toán đến ${payosUser.displayName}!` : 'Tạo link thành công!');
        setPayosForm({ amount: '', reason: generateRandomCode() });
        setDisplayAmount('');
        setPayosUser(null);
        fetchLinks();
      } else {
        toast.error(data.error || 'Lỗi khi tạo link');
      }
    } catch (err) {
      toast.error('Lỗi kết nối server');
    } finally {
      setPayosLoading(false);
    }
  };

  const copyToClipboard = (text, type = 'link') => {
    const url = type === 'link' ? `${window.location.origin}/pay/${text}` : text;
    navigator.clipboard.writeText(url);
    toast.success('Đã copy!');
  };

  const handleDeleteLink = async (customLinkId) => {
    const loadId = toast.loading('Đang xử lý hủy giao dịch...');
    try {
      const response = await fetch(`${API_BASE_URL}/payos/cancel/${customLinkId}`, {
        method: 'POST', headers: getHeaders(), credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Hủy và xóa giao dịch thành công!', { id: loadId });
        fetchLinks();
      } else {
        toast.error(data.error || 'Lỗi khi hủy giao dịch', { id: loadId });
      }
    } catch (err) {
      toast.error('Lỗi kết nối khi hủy giao dịch', { id: loadId });
    }
  };

  // Joy Handlers
  async function handleJoyCreate(e) {
    e.preventDefault();
    if (!joyForm.amount) return;
    setCreatingJoy(true);
    try {
      if (joyMode === 'direct') {
        if (!joyUser) {
          toast.error('Vui lòng chọn người dùng để nạp trực tiếp');
          setCreatingJoy(false);
          return;
        }
        const r = await fetch(`${API_BASE_URL}/joy-gift-cards/direct-add`, {
          method: 'POST',
          headers: getHeaders(),
          credentials: 'include',
          body: JSON.stringify({ email: joyUser.email, amount: Number(joyForm.amount), note: joyForm.note }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Lỗi nạp điểm');
        toast.success(`Đã nạp ${joyForm.amount} JOY cho ${joyUser.displayName}`);
        setJoyUser(null);
        setJoyForm({ amount: '', note: '', count: 1 });
      } else {
        const r = await fetch(`${API_BASE_URL}/joy-gift-cards`, {
          method: 'POST',
          headers: getHeaders(),
          credentials: 'include',
          body: JSON.stringify({ amount: Number(joyForm.amount), note: joyForm.note, count: Number(joyForm.count) || 1 }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Lỗi tạo mã');
        setCards(prev => [...data, ...prev]);
        toast.success(`Đã tạo thành công ${data.length} mã JOY`);
        setJoyForm({ amount: '', note: '', count: 1 });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreatingJoy(false);
    }
  }

  async function handleJoyDelete(id) {
    try {
      const r = await fetch(`${API_BASE_URL}/joy-gift-cards/${id}`, { method: 'DELETE', headers: getHeaders(), credentials: 'include' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Lỗi xoá mã');
      setCards(prev => prev.filter(c => c._id !== id));
      toast.success('Đã xoá mã JOY');
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Package Handlers
  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!newPkg.name || !newPkg.duration) return toast.error("Vui lòng nhập tên và thời hạn");
    try {
      await packageApi.createPackage({
        name: newPkg.name,
        duration: Number(newPkg.duration),
        durationUnit: newPkg.durationUnit,
        benefits: newPkg.benefits.split("\n").map(b => b.trim()).filter(Boolean)
      });
      toast.success("Tạo gói thành công");
      setNewPkg({ name: "", duration: "", durationUnit: "months", benefits: "" });
      fetchPackageTemplates();
    } catch (e) { toast.error(e.message || "Lỗi tạo gói"); }
  };

  const handleDeletePackageTemplate = async (id) => {
    if(!triggerConfirm) {
      try {
        await packageApi.deletePackage(id);
        toast.success("Đã xoá gói");
        fetchPackageTemplates();
      } catch (e) { toast.error("Lỗi xoá gói"); }
      return;
    }
    triggerConfirm("Bạn chắc chắn muốn xoá gói này?", async () => {
      try {
        await packageApi.deletePackage(id);
        toast.success("Đã xoá gói");
        fetchPackageTemplates();
      } catch (e) { toast.error("Lỗi xoá gói"); }
    });
  };

  const handleRegenerateGiftCode = async (packageId) => {
    if(!triggerConfirm) {
      try {
        const data = await packageApi.regenerateCode(packageId);
        toast.success("Tạo mã mới thành công");
        setPackageTemplates(prev => prev.map(pkg => pkg._id === packageId ? data.package : pkg));
      } catch (e) { toast.error("Lỗi tạo mã"); }
      return;
    }
    triggerConfirm("Tạo lại mã Gift Code?", async () => {
      try {
        const data = await packageApi.regenerateCode(packageId);
        toast.success("Tạo mã mới thành công");
        setPackageTemplates(prev => prev.map(pkg => pkg._id === packageId ? data.package : pkg));
      } catch (e) { toast.error("Lỗi tạo mã"); }
    });
  };

  const handleAssignPackageToUser = async (e) => {
    e.preventDefault();
    if (!assignUser || !assignForm.packageId) return toast.error("Vui lòng chọn người dùng và gói cước");
    try {
      await packageApi.assignToUser({ email: assignUser.email, packageId: assignForm.packageId, customDuration: assignForm.customDuration });
      toast.success(`Đã cấp gói cho ${assignUser.email}`);
      setAssignForm({ packageId: "", customDuration: "" });
      setAssignUser(null);
    } catch (e) { toast.error(e.message || "Lỗi cấp gói"); }
  };

  const handleSearchUserPackages = async (emailToSearch) => {
    const email = emailToSearch || memberPkgSearchEmail;
    if (!email) return toast.error("Nhập email cần tìm");
    try {
      const data = await userApi.getBioByEmail(email);
      if (data && data.bio) setSearchedMemberBio(data.bio);
      else toast.error("Không tìm thấy");
    } catch (e) { toast.error("Lỗi tìm kiếm"); }
  };

  const formatExpiration = (expiresAt) => {
    if (!expiresAt) return <span className="font-bold text-success dark:text-success">Vĩnh viễn</span>;
    const expDate = new Date(expiresAt);
    const diffTime = expDate.getTime() - new Date().getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const formattedDate = expDate.toLocaleDateString('vi-VN');
    if (diffDays <= 0) return <span className="text-destructive font-bold">Hết hạn ({formattedDate})</span>;
    return <span className="text-foreground font-bold">{formattedDate} <span className="text-[10px] text-success ml-1">(Còn {diffDays} ngày)</span></span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground">Dịch vụ & Gói Cước</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Quản lý giao dịch, thẻ quà tặng và gói dịch vụ</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit overflow-x-auto">
          <button
            onClick={() => setActiveSegment('payos')}
            className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeSegment === 'payos' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
              PayOS
            </div>
          </button>
          <button
            onClick={() => setActiveSegment('joy')}
            className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeSegment === 'joy' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">redeem</span>
              Voucher JOY
            </div>
          </button>
          <button
            onClick={() => setActiveSegment('packages')}
            className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeSegment === 'packages' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">package_2</span>
              Gói Dịch Vụ
            </div>
          </button>
        </div>
      </div>

      {activeSegment === 'packages' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            {/* Create package form */}
            <div className="bg-white dark:bg-background rounded-xl p-6 border border-border dark:border-border/80 shadow-sm space-y-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">add_card</span>
                Tạo Gói Cước Mới
              </h3>
              <form onSubmit={handleCreatePackage} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Tên gói</label>
                  <input type="text" required value={newPkg.name} onChange={(e) => setNewPkg(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-border dark:border-border bg-white dark:bg-card text-xs p-3 font-semibold focus:outline-none input-premium-focus" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Thời hạn</label>
                    <input type="number" required min="1" value={newPkg.duration} onChange={(e) => setNewPkg(p => ({ ...p, duration: e.target.value }))} className="w-full rounded-xl border border-border dark:border-border bg-white dark:bg-card text-xs p-3 font-semibold focus:outline-none input-premium-focus" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Đơn vị</label>
                    <select value={newPkg.durationUnit} onChange={(e) => setNewPkg(p => ({ ...p, durationUnit: e.target.value }))} className="w-full rounded-xl border border-border dark:border-border bg-white dark:bg-card text-xs p-3 font-semibold focus:outline-none input-premium-focus">
                      <option value="months">Tháng</option>
                      <option value="days">Ngày</option>
                      <option value="years">Năm</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Quyền lợi (Mỗi dòng 1 mục)</label>
                  <textarea rows="4" value={newPkg.benefits} onChange={(e) => setNewPkg(p => ({ ...p, benefits: e.target.value }))} className="w-full rounded-xl border border-border dark:border-border bg-white dark:bg-card text-xs p-3 font-semibold focus:outline-none input-premium-focus" />
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex justify-center items-center gap-2">
                  <span className="material-symbols-outlined text-sm">save</span> Tạo Gói Mới
                </button>
              </form>
            </div>

            {/* Grant package form */}
            <div className="bg-white dark:bg-background rounded-xl p-6 border border-border dark:border-border/80 shadow-sm space-y-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">card_membership</span>
                Cấp phát gói cước
              </h3>
              <form onSubmit={handleAssignPackageToUser} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Thành viên</label>
                  <SmartUserSearch 
                    selectedUser={assignUser} 
                    onSelect={setAssignUser} 
                    onClear={() => setAssignUser(null)} 
                    placeholder="Tìm để cấp gói..." 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Chọn Gói</label>
                  <select required value={assignForm.packageId} onChange={(e) => setAssignForm(p => ({ ...p, packageId: e.target.value }))} className="w-full rounded-xl border border-border dark:border-border bg-white dark:bg-card text-xs p-3 font-semibold focus:outline-none input-premium-focus">
                    <option value="">-- Chọn --</option>
                    {packageTemplates.map(pkg => (
                      <option key={pkg._id} value={pkg._id}>{pkg.name} ({pkg.duration} {pkg.durationUnit})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex justify-center items-center gap-2">
                  <span className="material-symbols-outlined text-sm">verified</span> Cấp Phát
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {/* List Templates */}
            <div className="bg-white dark:bg-background rounded-xl border border-border dark:border-border/80 shadow-sm overflow-hidden min-h-[300px]">
              <div className="px-6 py-4 border-b border-border dark:border-border/80 bg-slate-50/50 dark:bg-card/40 flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">view_list</span>
                  Danh Sách Gói Cước ({packageTemplates.length})
                </h3>
              </div>
              <div className="divide-y divide-border dark:divide-border/60">
                {packageTemplates.map((pkg) => (
                  <div key={pkg._id} className="p-5 hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                        {pkg.name}
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">{pkg.duration} {pkg.durationUnit}</span>
                      </h4>
                      <div className="mt-3 flex items-center gap-2">
                        <code className="text-xs font-mono font-bold text-accent bg-muted px-2 py-1 rounded select-all">{pkg.giftCode || "N/A"}</code>
                        <button onClick={() => copyToClipboard(pkg.giftCode, 'code')} className="p-1 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[16px]">content_copy</span></button>
                        <button onClick={() => handleRegenerateGiftCode(pkg._id)} className="p-1 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[16px]">autorenew</span></button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {pkg.benefits.map((benefit, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-white dark:bg-slate-800 border border-border/60 px-2 py-0.5 rounded-md">
                            <span className="material-symbols-outlined text-[10px] text-success">check</span> {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handleDeletePackageTemplate(pkg._id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors"><span className="material-symbols-outlined">delete</span></button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Search User Packages */}
            <div className="bg-white dark:bg-background rounded-xl p-6 border border-border dark:border-border/80 shadow-sm space-y-5">
               <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">manage_accounts</span>
                  Tra Cứu Gói Của Thành Viên
               </h3>
               <div className="flex gap-2">
                  <input type="email" value={memberPkgSearchEmail} onChange={e => setMemberPkgSearchEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchUserPackages()} className="flex-1 rounded-xl border border-border bg-card text-xs p-3 font-semibold focus:outline-none input-premium-focus" placeholder="Nhập email cần tra cứu..." />
                  <button onClick={() => handleSearchUserPackages()} className="px-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">search</span> Tìm</button>
               </div>
               {searchedMemberBio && (
                 <div className="border border-border/85 rounded-xl p-4 bg-zinc-50/50 dark:bg-card/40 mt-4">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-bold text-xs">{searchedMemberBio.displayName}</h4>
                        <p className="text-[10px] text-muted-foreground">{searchedMemberBio.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] font-bold uppercase tracking-wider">Hết hạn</div>
                        <div className="text-[10px] font-mono mt-0.5">{formatExpiration(searchedMemberBio.expiresAt)}</div>
                      </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Forms Section for PayOS / Joy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {activeSegment === 'payos' ? (
                <div className="bg-white dark:bg-background rounded-[22px] border border-border/50 shadow-sm p-6 space-y-5">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">payments</span>
                    {payosUser ? 'Gửi Yêu Cầu Thanh Toán' : 'Tạo Link Chuyển Khoản'}
                  </h3>
                  <form onSubmit={handlePayosSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Người nhận (Tùy chọn)</label>
                      <SmartUserSearch 
                        selectedUser={payosUser} 
                        onSelect={setPayosUser} 
                        onClear={() => setPayosUser(null)} 
                        placeholder="Để trống nếu tạo link chung..." 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số tiền (VNĐ)</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₫</span>
                          <input
                            type="text" required value={displayAmount} onChange={handleAmountChange}
                            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs focus:outline-none input-premium-focus transition-all text-foreground font-bold"
                            placeholder="VD: 50.000"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã giao dịch / Lý do</label>
                        <input
                          type="text" required maxLength={25} value={payosForm.reason} onChange={(e) => setPayosForm({ ...payosForm, reason: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs focus:outline-none input-premium-focus transition-all text-foreground font-mono uppercase font-bold"
                          placeholder="Nhập mã không dấu"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {[{ l: 'Gia hạn gói', p: 'GIAHAN' }, { l: 'Mã mặc định', p: 'HUGO' }].map((item, idx) => (
                            <button key={idx} type="button" onClick={() => setPayosForm(prev => ({ ...prev, reason: generateRandomCode(item.p) }))} className="px-2 py-1 bg-slate-100 dark:bg-slate-800/60 text-[9px] font-bold text-muted-foreground rounded-lg transition-colors uppercase">
                              + {item.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button type="submit" disabled={payosLoading} className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 uppercase tracking-wider flex justify-center items-center gap-2">
                      {payosLoading ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : (payosUser ? 'Gửi Yêu Cầu Thanh Toán' : 'Tạo Link VietQR')}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-background rounded-[22px] border border-border/50 shadow-sm p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-lg">card_giftcard</span>
                      {joyMode === 'direct' ? 'Nạp Trực Tiếp JOY' : 'Sản Xuất Hàng Loạt Voucher JOY'}
                    </h3>
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
                      <button onClick={() => setJoyMode('voucher')} className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-colors ${joyMode === 'voucher' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-500' : 'text-slate-400 hover:text-slate-300'}`}>Voucher</button>
                      <button onClick={() => setJoyMode('direct')} className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-colors ${joyMode === 'direct' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-500' : 'text-slate-400 hover:text-slate-300'}`}>Nạp Trực Tiếp</button>
                    </div>
                  </div>
                  <form onSubmit={handleJoyCreate} className="space-y-4">
                    {joyMode === 'direct' && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn thành viên để nạp</label>
                        <SmartUserSearch 
                          selectedUser={joyUser} 
                          onSelect={setJoyUser} 
                          onClear={() => setJoyUser(null)} 
                          placeholder="Tìm người dùng..." 
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mệnh giá JOY</label>
                        <input type="number" required min="1" value={joyForm.amount} onChange={e => setJoyForm(p => ({ ...p, amount: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-foreground font-bold focus:outline-none input-premium-focus" placeholder="VD: 50" />
                      </div>
                      {joyMode === 'voucher' && (
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số lượng mã</label>
                          <input type="number" min="1" max="500" value={joyForm.count} onChange={e => setJoyForm(p => ({ ...p, count: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-foreground font-bold focus:outline-none input-premium-focus" />
                        </div>
                      )}
                      <div className={`space-y-1 ${joyMode === 'direct' ? 'sm:col-span-2' : ''}`}>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lý do (Tùy chọn)</label>
                        <input type="text" value={joyForm.note} onChange={e => setJoyForm(p => ({ ...p, note: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-foreground font-bold focus:outline-none input-premium-focus" placeholder="Sự kiện, phần thưởng..." />
                      </div>
                    </div>
                    <button type="submit" disabled={creatingJoy || (joyMode === 'direct' && !joyUser)} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 uppercase tracking-wider flex justify-center items-center gap-2">
                      {creatingJoy ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : (joyMode === 'direct' ? 'Cộng Điểm Ngay' : 'Tạo Thẻ JOY')}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-white dark:bg-background rounded-[22px] border border-border/50 shadow-sm p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className={`material-symbols-outlined ${activeSegment === 'payos' ? 'text-secondary' : 'text-amber-500'} text-lg`}>info</span>
                  {activeSegment === 'payos' ? 'Cổng Thanh Toán PayOS' : 'Thẻ Quà Tặng JOY'}
                </h3>
                <ul className="space-y-3 text-[11px] text-muted-foreground">
                  {activeSegment === 'payos' ? (
                    <>
                      <li className="flex items-start gap-2.5"><span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5">check_circle</span><span>Tự động tạo link thanh toán VietQR chuyển khoản nhanh 24/7.</span></li>
                      <li className="flex items-start gap-2.5"><span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5">check_circle</span><span>Xác minh giao dịch realtime qua Webhook phản hồi tức thời.</span></li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2.5"><span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">check_circle</span><span>Tạo hàng loạt mã Voucher chứa điểm JOY cho các sự kiện.</span></li>
                      <li className="flex items-start gap-2.5"><span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">check_circle</span><span>Theo dõi trạng thái thẻ chưa sử dụng và người dùng đã nạp thẻ.</span></li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* History Tables */}
          <div className="bg-white dark:bg-background rounded-[22px] border border-border/50 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">history</span>
              {activeSegment === 'payos' ? 'Lịch Sử Giao Dịch PayOS' : 'Danh Sách Mã Voucher JOY'}
            </h3>
            
            {activeSegment === 'payos' ? (
              <div className="overflow-x-auto rounded-[18px] border border-slate-100 dark:border-slate-800/80">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80">
                    <tr>
                      <th className="p-4">Mã Giao Dịch</th>
                      <th className="p-4">Số Tiền</th>
                      <th className="p-4">Nội Dung</th>
                      <th className="p-4">Trạng Thái</th>
                      <th className="p-4 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {links.map(link => (
                      <tr key={link._id} className="table-row-floating">
                        <td className="p-4 font-mono text-[10px] text-muted-foreground">{link.customLinkId}</td>
                        <td className="p-4 font-bold text-primary">{(link.amount || 0).toLocaleString('vi-VN')} ₫</td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{link.reason}</td>
                        <td className="p-4">
                          {link.status === 'PAID' ? (
                            <span className="text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold">PAID</span>
                          ) : (
                            <span className="text-amber-600 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-bold">{link.status}</span>
                          )}
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-1">
                          <button onClick={() => copyToClipboard(link.customLinkId, 'link')} className="p-2 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-base">content_copy</span></button>
                          <button onClick={() => handleDeleteLink(link.customLinkId)} className="p-2 text-slate-400 hover:text-rose-500"><span className="material-symbols-outlined text-base">delete</span></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[18px] border border-slate-100 dark:border-slate-800/80">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80">
                    <tr>
                      <th className="p-4">Mã JOY (Voucher)</th>
                      <th className="p-4">Mệnh Giá</th>
                      <th className="p-4">Trạng Thái</th>
                      <th className="p-4">Ghi Chú</th>
                      <th className="p-4 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {cards.map(c => (
                      <tr key={c._id} className="table-row-floating">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold tracking-widest text-slate-800 dark:text-slate-200">{c.code}</span>
                            <button onClick={() => copyToClipboard(c.code, 'code')} className="p-1 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[14px]">content_copy</span></button>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-amber-500">+{c.amount} JOY</td>
                        <td className="p-4">
                          {c.redeemed ? (
                            <span className="text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded-full text-[10px] font-bold">Đã nạp bởi {c.redeemedBy}</span>
                          ) : (
                            <span className="text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold">Chưa dùng</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 text-[11px]">{c.note || '-'}</td>
                        <td className="p-4 text-center">
                          {!c.redeemed && <button onClick={() => handleJoyDelete(c._id)} className="p-2 text-slate-400 hover:text-rose-500"><span className="material-symbols-outlined text-base">delete</span></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
