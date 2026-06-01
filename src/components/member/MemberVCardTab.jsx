import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";

export default function MemberVCardTab({ bio, showToast, onBack, getApiUrl }) {
  const { t } = useTranslation();
  const [vcardSubTab, setVcardSubTab] = useState("mycard"); // 'mycard', 'backup'
  const [contactsList, setContactsList] = useState(bio?.backedUpContacts || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "" });

  useEffect(() => {
    if (bio?.backedUpContacts) {
      setContactsList(bio.backedUpContacts);
    }
  }, [bio]);

  const vcardDownloadUrl = `${getApiUrl()}/vcard/${bio?.slug}`;
  const backupDownloadUrl = `${getApiUrl()}/vcard/backup/${bio?.slug}`;

  const handleMobileSync = async () => {
    if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
      if (showToast) {
        showToast("Tính năng đồng bộ yêu cầu kết nối bảo mật (HTTPS).", "warning");
      }
      return;
    }

    if (typeof navigator === "undefined" || !navigator.contacts) {
      if (showToast) {
        showToast(t("memberPortal.utilitiesPage.vcard.toastUnsupported") || "Trình duyệt của bạn chưa hỗ trợ tự động đồng bộ danh bạ. Vui lòng sử dụng Chrome trên Android hoặc thêm thủ công.", "warning");
      }
      return;
    }

    try {
      setSyncing(true);
      const fields = ["name", "tel", "email"];
      const options = { multiple: true };
      const selected = await navigator.contacts.select(fields, options);
      
      if (!selected || selected.length === 0) {
        setSyncing(false);
        return;
      }

      const formatted = selected.map(c => ({
        name: c.name?.[0] || "",
        phone: c.tel?.[0] || "",
        email: c.email?.[0] || ""
      }));

      const res = await fetch(`${getApiUrl()}/bios/contacts/sync/${bio._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: formatted })
      });

      if (!res.ok) throw new Error("Sync failed");
      const data = await res.json();
      
      setContactsList(data.contacts || []);
      if (showToast) {
        showToast(t("memberPortal.utilitiesPage.vcard.toastSyncSuccess", { count: data.count }), "success");
      }
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast(t("memberPortal.utilitiesPage.vcard.toastSyncError"), "error");
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) {
      if (showToast) showToast("Vui lòng nhập tên và số điện thoại", "warning");
      return;
    }

    try {
      setSyncing(true);
      const res = await fetch(`${getApiUrl()}/bios/contacts/sync/${bio._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: [newContact] })
      });

      if (!res.ok) throw new Error("Add failed");
      const data = await res.json();
      
      setContactsList(data.contacts || []);
      setNewContact({ name: "", phone: "", email: "" });
      setShowManualAdd(false);
      if (showToast) {
        showToast("Đã thêm liên hệ vào danh sách sao lưu", "success");
      }
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast("Lỗi khi thêm liên hệ thủ công", "error");
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      const res = await fetch(`${getApiUrl()}/bios/contacts/${bio._id}/${contactId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Delete failed");
      const data = await res.json();
      setContactsList(data.contacts || []);
      if (showToast) {
        showToast(t("memberPortal.utilitiesPage.vcard.toastDeleteSuccess"), "success");
      }
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast(t("memberPortal.utilitiesPage.vcard.toastDeleteError"), "error");
      }
    }
  };

  const copyVcardLink = () => {
    navigator.clipboard.writeText(vcardDownloadUrl);
    if (showToast) {
      showToast(t("memberPortal.utilitiesPage.vcard.toastCopySuccess"), "success");
    }
  };

  const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const filteredContacts = contactsList.filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.phone || '').includes(searchQuery)
  );

  return (
    <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-6">
      <SubUtilityHeader 
        title={t("memberPortal.utilitiesPage.vcard.title")} 
        icon="contact_phone" 
        colorClass="text-rose-500" 
        onBack={onBack}
      />
      
      {/* Sub-tab Selector */}
      <div className="flex border-b border-zinc-200/30 dark:border-zinc-800/80 mb-6">
        <button 
          onClick={() => setVcardSubTab("mycard")}
          className={`pb-2.5 text-[10.5px] font-extrabold uppercase tracking-wider transition-colors border-b-2 mr-6 flex items-center gap-1.5 ${
            vcardSubTab === "mycard" 
              ? "border-rose-500 text-rose-500 font-black" 
              : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          <span className="material-symbols-outlined text-sm">badge</span> {t("memberPortal.utilitiesPage.vcard.myCard")}
        </button>
        <button 
          onClick={() => setVcardSubTab("backup")}
          className={`pb-2.5 text-[10.5px] font-extrabold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
            vcardSubTab === "backup" 
              ? "border-rose-500 text-rose-500 font-black" 
              : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          <span className="material-symbols-outlined text-sm">cloud_sync</span> {t("memberPortal.utilitiesPage.vcard.backup")} ({contactsList.length})
        </button>
      </div>

      {vcardSubTab === "mycard" ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Profile Card Mockup */}
          <div className="md:col-span-5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 text-center flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-rose-500 shadow-lg bg-zinc-950">
                {bio?.avatarUrl ? (
                  <img src={bio.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-rose-500 font-black text-xl">
                    {bio?.displayName?.charAt(0)}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-100">{bio?.displayName}</h4>
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{bio?.jobTitle || "Thành viên Hugo Studio"}</p>
              </div>

              <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-2 text-left">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span className="material-symbols-outlined text-xs">phone</span>
                  <span>{bio?.phone || "Chưa cập nhật SĐT"}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span className="material-symbols-outlined text-xs">mail</span>
                  <span className="truncate">{bio?.contactEmail || bio?.email}</span>
                </div>
              </div>
            </div>

            {isMobile ? (
              <a 
                href={vcardDownloadUrl}
                download
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black text-[11.5px] uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 animate-pulse"
              >
                <span className="material-symbols-outlined text-sm">download</span> {t("memberPortal.utilitiesPage.vcard.mobileSaveBtn")}
              </a>
            ) : (
              <a 
                href={vcardDownloadUrl}
                download
                className="w-full py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-xs">download</span> {t("memberPortal.utilitiesPage.vcard.desktopDownloadBtn")}
              </a>
            )}
          </div>

          {/* Responsive instructions */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            {isMobile ? (
              <div className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">phone_iphone</span> {t("memberPortal.utilitiesPage.vcard.mobileInstructionTitle")}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {t("memberPortal.utilitiesPage.vcard.mobileInstructionDesc")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center p-6 bg-zinc-50 dark:bg-[#1a1926]/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[24px] shadow-sm">
                <div className="sm:col-span-4 flex flex-col items-center justify-center space-y-2">
                  <div className="bg-white p-2.5 border border-zinc-200/80 flex items-center justify-center shrink-0 w-28 h-28 shadow-sm" style={{ borderRadius: '20px' }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(vcardDownloadUrl)}`} 
                      alt="vCard QR Code" 
                      className="w-full h-full object-contain"
                      style={{ borderRadius: '12px' }}
                    />
                  </div>
                  <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">QR lưu nhanh</span>
                </div>
                
                <div className="sm:col-span-8 space-y-2">
                  <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">qr_code_scanner</span> {t("memberPortal.utilitiesPage.vcard.desktopInstructionTitle")}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                    {t("memberPortal.utilitiesPage.vcard.desktopInstructionDesc")}
                  </p>
                </div>
              </div>
            )}

            {/* Public Link Box - Redesigned as a premium code copy block */}
            <div className="bg-zinc-50 dark:bg-[#1a1926]/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[24px] p-6 shadow-sm space-y-4">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t("memberPortal.utilitiesPage.vcard.publicLinkTitle")}</h4>
                <p className="text-[9.5px] text-zinc-400">{t("memberPortal.utilitiesPage.vcard.publicLinkDesc")}</p>
              </div>

              <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-[#12111a] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
                <div className="font-mono text-[10.5px] text-zinc-550 dark:text-zinc-400 break-all select-all flex-1 px-3 py-1 font-bold">
                  {vcardDownloadUrl}
                </div>
                <button 
                  onClick={copyVcardLink}
                  className="px-4 py-2 rounded-lg text-[9.5px] font-extrabold uppercase bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white tracking-wider transition-all active:scale-95 flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <span className="material-symbols-outlined text-[11px]">content_copy</span> {t("memberPortal.utilitiesPage.vcard.copyBtn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Contact Backup & Sync Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Control Panel (Sync / Restore) */}
          <div className="lg:col-span-5 space-y-5">
            {isMobile ? (
              /* Mobile Sync Control */
              <div className="bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/80 space-y-4">
                <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-rose-500">mobile_friendly</span> {t("memberPortal.utilitiesPage.vcard.syncTitle")}
                </h4>
                <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                  {t("memberPortal.utilitiesPage.vcard.syncDesc")}
                </p>

                {syncing ? (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-400/20 text-center rounded-xl space-y-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] text-indigo-500 font-bold">{t("memberPortal.utilitiesPage.vcard.syncingText")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleMobileSync}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-[10.5px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">cloud_upload</span> {t("memberPortal.utilitiesPage.vcard.syncBtn")}
                    </button>
                    <button
                      onClick={() => setShowManualAdd(true)}
                      className="w-full py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-[10.5px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span> {t("memberPortal.utilitiesPage.vcard.manualAddBtn") || "Thêm thủ công"}
                    </button>
                  </div>
                )}
                
                <div className="text-[9px] text-zinc-400 leading-relaxed pt-1 italic">
                  {t("memberPortal.utilitiesPage.vcard.syncWarning")}
                </div>
              </div>
            ) : (
              /* Desktop Sync QR Code */
              <div className="bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/80 space-y-4">
                <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-indigo-500">qr_code_2</span> {t("memberPortal.utilitiesPage.vcard.syncQrTitle")}
                </h4>
                
                {/* QR leading to mobile login/member portal */}
                <div className="bg-white p-2.5 rounded-xl border border-zinc-200 flex items-center justify-center w-36 h-36 mx-auto shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} 
                    alt="Sync Portal QR" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[10px] text-zinc-550 dark:text-zinc-450 text-center leading-relaxed">
                  {t("memberPortal.utilitiesPage.vcard.syncQrDesc")}
                </p>
              </div>
            )}

            {/* Restore / Download backups */}
            <div className="bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/80 space-y-3.5">
              <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-500">settings_backup_restore</span> {t("memberPortal.utilitiesPage.vcard.restoreTitle")}
              </h4>
              <p className="text-[10.5px] text-zinc-550 dark:text-zinc-400 leading-relaxed">
                {t("memberPortal.utilitiesPage.vcard.restoreDesc")}
              </p>

              <a 
                href={backupDownloadUrl}
                download
                className={`w-full py-2.5 rounded-xl text-white font-black text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md ${
                  contactsList.length > 0 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" 
                    : "bg-zinc-300 dark:bg-zinc-800 cursor-not-allowed text-zinc-400 pointer-events-none"
                }`}
              >
                <span className="material-symbols-outlined text-xs">download_for_offline</span> {t("memberPortal.utilitiesPage.vcard.restoreBtn")}
              </a>
            </div>
          </div>

          {/* Synced Contacts Address Book Database Table (Right column) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <h4 className="text-xs font-black uppercase text-zinc-450 tracking-wider">
                {t("memberPortal.utilitiesPage.vcard.backupDbTitle")} ({contactsList.length})
              </h4>
              
              {/* Search filter input */}
              <div className="relative max-w-xs w-full sm:w-60">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
                <input 
                  type="text"
                  placeholder={t("memberPortal.utilitiesPage.vcard.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1a1824] text-[11px] focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* List / Table */}
            <div className="border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto bg-zinc-50/20 dark:bg-[#12111a]/40 shadow-inner">
              {filteredContacts.length > 0 ? (
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-zinc-100/50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 uppercase font-black tracking-wider">
                      <th className="py-2.5 px-4">Tên</th>
                      <th className="py-2.5 px-4">Số điện thoại</th>
                      <th className="py-2.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                    {filteredContacts.map((c) => (
                      <tr key={c._id} className="hover:bg-zinc-100/30 dark:hover:bg-zinc-800/20 transition-all">
                        <td className="py-2.5 px-4 font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">{c.name}</td>
                        <td className="py-2.5 px-4 text-zinc-550 font-mono">{c.phone || "---"}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button 
                            onClick={() => handleDeleteContact(c._id)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Xóa sao lưu"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-10 text-center space-y-2">
                  <span className="material-symbols-outlined text-3xl text-zinc-350 dark:text-zinc-700 animate-pulse">cloud_off</span>
                  <p className="text-[11px] text-zinc-400 font-bold">{t("memberPortal.utilitiesPage.vcard.emptyBackup")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Contact Modal */}
      {showManualAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12111a] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-rose-500">person_add</span>
                Thêm liên hệ thủ công
              </h3>
              <button 
                onClick={() => setShowManualAdd(false)} 
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                disabled={syncing}
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Tên liên hệ</label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Nguyễn Văn A"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1a1824] text-[11.5px] focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Số điện thoại</label>
                <input
                  type="tel"
                  required
                  placeholder="Vd: 0912345678"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1a1824] text-[11.5px] focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Email (không bắt buộc)</label>
                <input
                  type="email"
                  placeholder="Vd: email@example.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1a1824] text-[11.5px] focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualAdd(false)}
                  disabled={syncing}
                  className="py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors disabled:opacity-50 uppercase tracking-widest"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-[11px] font-black shadow-md transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {syncing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">save</span>
                  )}
                  Lưu liên hệ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
