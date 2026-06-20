import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function AdminPartnersTab({ showNotification, triggerConfirm }) {
  const { t } = useTranslation();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [partnerForm, setPartnerForm] = useState({ name: "", iframeUrl: "" });
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerPage, setPartnerPage] = useState(1);
  
  const [previewPartner, setPreviewPartner] = useState(null);
  const [exportPartner, setExportPartner] = useState(null);
  const [exportLinkPartner, setExportLinkPartner] = useState(null);

  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/partners");
      if (res.ok) {
        setPartners(await res.json());
      }
    } catch (err) {
      console.error(err);
      showNotification(t("admin.texts.txt_95"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPartner = async (e) => {
    e.preventDefault();
    const shouldExportIframe = e.nativeEvent.submitter.value === 'export-iframe';
    
    if (!partnerForm.name.trim() || !partnerForm.iframeUrl.trim()) {
      showNotification(t("admin.texts.txt_96"), "warning");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerForm)
      });
      if (response.ok) {
        const newPartner = await response.json();
        showNotification(t("admin.texts.txt_97"));
        setPartners(prev => [newPartner, ...prev]);
        setPartnerForm({ name: "", iframeUrl: "" });
        if (shouldExportIframe) {
          setExportPartner(newPartner);
        }
      } else {
        showNotification(t("admin.texts.txt_98"), "error");
      }
    } catch (err) {
      console.error(err);
      showNotification(t("admin.texts.txt_99"), "error");
    }
  };

  const handleDeletePartner = (partnerId) => {
  const { t } = useTranslation();
    triggerConfirm(t("admin.texts.txt_100"), async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/partners/${partnerId}`, {
          method: "DELETE"
        });
        if (response.ok) {
          showNotification(t("admin.texts.txt_101"));
          setPartners(prev => prev.filter(p => p._id !== partnerId));
          if (previewPartner?._id === partnerId) setPreviewPartner(null);
          if (exportPartner?._id === partnerId) setExportPartner(null);
          if (exportLinkPartner?._id === partnerId) setExportLinkPartner(null);
        } else {
          showNotification(t("admin.texts.txt_102"), "error");
        }
      } catch (err) {
        console.error(err);
        showNotification(t("admin.texts.txt_103"), "error");
      }
    });
  };

  const getFaviconUrl = (urlStr) => {
    try {
      const isEmbed = urlStr.includes('<iframe');
      if (isEmbed) {
        const match = urlStr.match(/src="([^"]+)"/);
        if (match && match[1]) {
          const u = new URL(match[1]);
          return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
        }
        return null;
      }
      const u = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
    } catch (e) {
      return null;
    }
  };

  const getPartnerBioEditorUrl = (partner, emailPlaceholder = "") => {
    const params = new URLSearchParams({
      partnerId: partner._id,
      token: partner.accessToken || ""
    });
    if (emailPlaceholder) params.set("email", emailPlaceholder);
    return `${window.location.origin}/partner/bio-editor?${params.toString()}`;
  };

  const getPartnerBioIframeCode = (partner) => {
    return `<iframe src="${getPartnerBioEditorUrl(partner)}" width="100%" height="820" style="border:0; border-radius:16px; box-shadow:0 12px 40px rgba(15,23,42,0.12);" allow="clipboard-write"></iframe>`;
  };

  const filteredPartners = partners.filter(p => 
    (p.name?.toLowerCase() || "").includes(partnerSearch.toLowerCase()) || 
    (p.iframeUrl?.toLowerCase() || "").includes(partnerSearch.toLowerCase())
  );
  const totalPartnerPages = Math.ceil(filteredPartners.length / ITEMS_PER_PAGE);
  const paginatedPartners = filteredPartners.slice((partnerPage - 1) * ITEMS_PER_PAGE, partnerPage * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      {/* Left panel: Add partner form */}
      <div className="lg:col-span-4 bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">add_link</span>
          Thêm Đối Tác Mới
        </h3>
        
        <form onSubmit={handleAddPartner} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("admin.texts.txt_89")}</label>
            <input
              type="text"
              required
              placeholder={t("admin.texts.txt_104")}
              value={partnerForm.name}
              onChange={(e) => setPartnerForm(p => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-805 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("admin.texts.txt_90")}</label>
            <textarea
              rows="5"
              required
              placeholder={t("admin.texts.txt_105")}
              value={partnerForm.iframeUrl}
              onChange={(e) => setPartnerForm(p => ({ ...p, iframeUrl: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-805 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              value="save"
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 active:scale-98"
            >
              Liên Kết
            </button>
            <button
              type="submit"
              value="export-iframe"
              className="w-full bg-primary hover:bg-indigo-650 text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform shadow-md flex items-center justify-center gap-1.5 active:scale-98"
            >
              <span className="material-symbols-outlined text-sm">iframe</span>
              {t("admin.texts.txt_91")}
            </button>
          </div>
        </form>
      </div>

      {/* Right panel: Active partner list & iframe preview */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* List */}
        <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col justify-between min-h-[350px]">
          
          {/* Header with Search */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#181622]/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-base">handshake</span>
              Danh Sách Đối Tác ({partners.length})
            </h3>
            
            {/* Real-time search */}
            <div className="w-full sm:w-56 relative shrink-0">
              <input
                type="text"
                placeholder={t("admin.texts.txt_106")}
                value={partnerSearch}
                onChange={(e) => { setPartnerSearch(e.target.value); setPartnerPage(1); }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#1c1626] text-[11px] py-1.5 pl-8 pr-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">search</span>
            </div>
          </div>

          {/* Items List */}
          {paginatedPartners.length > 0 ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800/60 flex-grow">
              {paginatedPartners.map((partner) => {
                const iconUrl = getFaviconUrl(partner.iframeUrl);
                return (
                  <div key={partner._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Logo from Favicon */}
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1f1929] border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        {iconUrl ? (
                          <img 
                            src={iconUrl} 
                            alt="" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                            className="w-5 h-5 object-contain" 
                          />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400 text-lg">link</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-white text-xs truncate">{partner.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate max-w-sm font-mono mt-0.5">{partner.iframeUrl}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => setExportPartner(partner)}
                        className="bg-primary hover:bg-indigo-650 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95"
                      >
                        Xuất Iframe
                      </button>
                      <button
                        onClick={() => setExportLinkPartner(partner)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95"
                      >
                        Xuất Link
                      </button>
                      <button
                        onClick={() => setPreviewPartner(partner)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700 transition-colors shadow-sm active:scale-95"
                      >
                        Xem Thử
                      </button>
                      <button
                        onClick={() => handleDeletePartner(partner._id)}
                        className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-450 p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                        title={t("admin.texts.txt_107")}
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 flex-grow flex items-center justify-center">
              {partnerSearch ? (
                <p className="italic">{t("admin.texts.txt_92")}</p>
              ) : (
                <div className="space-y-2 max-w-sm">
                  <p className="font-bold text-slate-500 dark:text-slate-300 not-italic">{t("admin.texts.txt_93")}</p>
                  <p className="text-[11px] leading-relaxed">
                    Nhập thông tin ở khung bên trái rồi bấm <strong>{t("admin.texts.txt_94")}</strong> để lấy mã nhúng ngay.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination bar */}
          {totalPartnerPages > 1 && (
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-500 shrink-0">
              <span>Trang {partnerPage} / {totalPartnerPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPartnerPage(p => Math.max(p - 1, 1))}
                  disabled={partnerPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161420] text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPartnerPage(p => Math.min(p + 1, totalPartnerPages))}
                  disabled={partnerPage === totalPartnerPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161420] text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview modal drawer formatted as a browser frame */}
        {previewPartner && (
          <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-sm">visibility</span>
                Xem trước đối tác: {previewPartner.name}
              </h4>
              <button 
                onClick={() => setPreviewPartner(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Modern Browser Mock Frame */}
            <div className="w-full bg-[#f1f5f9] dark:bg-[#1c1a27] rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 flex flex-col shadow-inner">
              {/* Browser top-bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-200/60 dark:bg-slate-900/60 border-b border-slate-300 dark:border-slate-800 select-none">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-grow max-w-md mx-auto bg-white/70 dark:bg-black/30 rounded-lg text-[10px] text-center text-slate-500 py-1 font-mono truncate px-4">
                  {previewPartner.iframeUrl.includes('<iframe') ? "Embedded Code Output" : previewPartner.iframeUrl}
                </div>
              </div>
              
              {/* Browser window body */}
              <div className="w-full bg-white dark:bg-[#100e16] min-h-[420px] relative z-10 flex">
                {previewPartner.iframeUrl.includes('<iframe') ? (
                  <div 
                    className="w-full h-full min-h-[420px] flex [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:min-h-[420px]"
                    dangerouslySetInnerHTML={{ __html: previewPartner.iframeUrl }}
                  />
                ) : (
                  <iframe
                    src={previewPartner.iframeUrl}
                    className="w-full h-full min-h-[420px] flex-grow"
                    style={{ border: 'none' }}
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EXPORT DIRECT PARTNER LINK MODAL */}
      {exportLinkPartner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-405">
                <span className="material-symbols-outlined text-xl">link</span>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">Xuất Link Đối Tác: {exportLinkPartner.name}</h3>
              </div>
              <button 
                onClick={() => setExportLinkPartner(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                {t("adminTabs.partners.linkModalDesc1")}
              </p>

              <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-2">
                <span className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-305 uppercase tracking-wider">{t("adminTabs.partners.linkReady")}</span>
                <textarea
                  readOnly
                  rows={3}
                  className="w-full bg-white dark:bg-black/40 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 text-[10px] font-mono text-slate-700 dark:text-emerald-200 focus:outline-none resize-none"
                  value={getPartnerBioEditorUrl(exportLinkPartner)}
                />
              </div>

              <div className="bg-slate-50 dark:bg-[#1f1929] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("adminTabs.partners.linkParam")} <code>{`${getPartnerBioEditorUrl(exportLinkPartner)}&email=CUSTOMER_EMAIL`}</code>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setExportLinkPartner(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl transition-all"
              >
                {t("adminTabs.partners.close")}
              </button>
              <button
                onClick={() => {
                  const link = getPartnerBioEditorUrl(exportLinkPartner);
                  navigator.clipboard.writeText(link);
                  showNotification(`Đã sao chép link đối tác ${exportLinkPartner.name}! 📋`);
                  setExportLinkPartner(null);
                }}
                className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform shadow-md"
              >
                {t("adminTabs.partners.copyLink")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT IFRAME PARTNER MODAL */}
      {exportPartner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <span className="material-symbols-outlined text-xl">share</span>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">{t("adminTabs.partners.iframeModalTitle")} {exportPartner.name}</h3>
              </div>
              <button 
                onClick={() => setExportPartner(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                {t("adminTabs.partners.iframeModalDesc1")} <strong>Hugo Studio</strong> {t("adminTabs.partners.iframeModalDesc2")} <code>email</code> {t("adminTabs.partners.iframeModalDesc3")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-indigo-50/70 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                  <span className="block text-[9px] font-bold text-indigo-600 dark:text-indigo-305 uppercase tracking-wider">{t("adminTabs.partners.iframeReady")}</span>
                  <p className="mt-1 text-[10px] font-mono text-slate-600 dark:text-slate-305 break-all">
                    {getPartnerBioEditorUrl(exportPartner)}
                  </p>
                </div>
                <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <span className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-305 uppercase tracking-wider">{t("adminTabs.partners.iframeAuto")}</span>
                  <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-305 leading-relaxed">
                    {t("adminTabs.partners.iframeAutoDesc")}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#1f1929] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("adminTabs.partners.iframeCode")}</span>
                <textarea
                  readOnly
                  rows={4}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-[10px] font-mono text-indigo-600 dark:text-[#a5b4fc] focus:outline-none resize-none"
                  value={getPartnerBioIframeCode(exportPartner)}
                />
              </div>

              <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl space-y-1.5 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">info</span>
                  <span className="material-symbols-outlined text-xs">info</span>
                  {t("adminTabs.partners.iframeGuide")}
                </p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>{t("adminTabs.partners.iframeRule1")}</li>
                  <li>{t("adminTabs.partners.iframeRule2")}</li>
                  <li>{t("adminTabs.partners.iframeRule3")}</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setExportPartner(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl transition-all"
              >
                {t("adminTabs.partners.close")}
              </button>
              <button
                onClick={() => {
                  const code = getPartnerBioIframeCode(exportPartner);
                  navigator.clipboard.writeText(code);
                  showNotification(`Đã sao chép mã nhúng Iframe đối tác ${exportPartner.name}! 📋`);
                  setExportPartner(null);
                }}
                className="flex-grow bg-primary hover:bg-indigo-650 text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform shadow-md"
              >
                {t("adminTabs.partners.copyIframe")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
