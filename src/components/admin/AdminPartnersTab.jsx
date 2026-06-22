import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { partnerApi } from "../../services/api/PartnerApi";

export default function AdminPartnersTab({ showNotification, triggerConfirm }) {
  const { t } = useTranslation();
  const [partners, setPartners] = useState([]);
  const [partnerForm, setPartnerForm] = useState({ name: "", iframeUrl: "" });
  const [previewPartner, setPreviewPartner] = useState(null);
  const [exportPartner, setExportPartner] = useState(null);
  const [exportLinkPartner, setExportLinkPartner] = useState(null);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerPage, setPartnerPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await partnerApi.getPartners();
      setPartners(data || []);
    } catch (err) {
      console.error(err);
      showNotification("Lỗi khi tải danh sách đối tác", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleAddPartner = async (e) => {
    e.preventDefault();
    const shouldExportIframe = e.nativeEvent?.submitter?.value === "export-iframe";
    if (!partnerForm.name || !partnerForm.iframeUrl) {
      showNotification(t("admin.texts.txt_158"), "error");
      return;
    }

    try {
      const newPartner = await partnerApi.createPartner(partnerForm);
      showNotification(t("admin.texts.txt_159"));
      setPartners(prev => [newPartner, ...prev]);
      setPartnerForm({ name: "", iframeUrl: "" });
      if (shouldExportIframe) {
        setExportPartner(newPartner);
      }
    } catch (e) {
      console.error(e);
      showNotification(t("admin.texts.txt_161"), "error");
    }
  };

  const handleDeletePartner = (partnerId) => {
    triggerConfirm(t("admin.texts.txt_162"), async () => {
      try {
        await partnerApi.deletePartner(partnerId);
        showNotification(t("admin.texts.txt_163"));
        setPartners(prev => prev.filter(p => p._id !== partnerId));
        if (previewPartner?._id === partnerId) setPreviewPartner(null);
        if (exportPartner?._id === partnerId) setExportPartner(null);
        if (exportLinkPartner?._id === partnerId) setExportLinkPartner(null);
      } catch (e) {
        console.error(e);
        showNotification(t("admin.texts.txt_165"), "error");
      }
    });
  };

  const getFaviconUrl = (iframeUrl) => {
    try {
      let url = iframeUrl;
      if (iframeUrl.includes('<iframe')) {
        const match = iframeUrl.match(/src=["']([^"']+)["']/);
        if (match) url = match[1];
      }
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch (e) {
      return "";
    }
  };

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    (p.iframeUrl || "").toLowerCase().includes(partnerSearch.toLowerCase())
  );

  const PARTNERS_PER_PAGE = 8;
  const totalPartnerPages = Math.max(1, Math.ceil(filteredPartners.length / PARTNERS_PER_PAGE));
  const paginatedPartners = filteredPartners.slice(
    (partnerPage - 1) * PARTNERS_PER_PAGE,
    partnerPage * PARTNERS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      {/* Left panel: Add partner form */}
      <div className="lg:col-span-4 bg-white dark:bg-background rounded-xl p-6 border border-border dark:border-border/80 shadow-sm space-y-5">
        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">add_link</span>
          {t("adminTabs.partners.addBtn")}
        </h3>
        
        <form onSubmit={handleAddPartner} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{t("adminTabs.partners.partnerName")}</label>
            <input
              type="text"
              required
              placeholder={t("adminTabs.partners.partnerNamePlaceholder")}
              value={partnerForm.name}
              onChange={(e) => setPartnerForm(p => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-border dark:border-border bg-white dark:bg-card text-xs p-3 text-foreground dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{t("adminTabs.partners.website")}</label>
            <textarea
              rows="5"
              required
              placeholder={t("adminTabs.partners.websitePlaceholder")}
              value={partnerForm.iframeUrl}
              onChange={(e) => setPartnerForm(p => ({ ...p, iframeUrl: e.target.value }))}
              className="w-full rounded-xl border border-border dark:border-border bg-white dark:bg-card text-xs p-3 text-foreground dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              value="save"
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground font-bold text-xs py-3 rounded-xl transition-colors border border-border dark:border-border active:scale-98"
            >
              Liên Kết
            </button>
            <button
              type="submit"
              value="export-iframe"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform shadow-md flex items-center justify-center gap-1.5 active:scale-98"
            >
              <span className="material-symbols-outlined text-sm">iframe</span>
              {t("adminTabs.partners.createExportBtn")}
            </button>
          </div>
        </form>
      </div>

      {/* Right panel: Active partner list & iframe preview */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* List */}
        <div className="bg-white dark:bg-background rounded-xl border border-border dark:border-border/80 shadow-sm overflow-hidden flex flex-col justify-between min-h-[350px]">
          
          {/* Header with Search */}
          <div className="px-6 py-4 border-b border-border dark:border-border/80 bg-slate-50/50 dark:bg-card/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-muted-foreground text-base">handshake</span>
              Danh Sách Đối Tác ({partners.length})
            </h3>
            
            {/* Real-time search */}
            <div className="w-full sm:w-56 relative shrink-0">
              <input
                type="text"
                placeholder={t("adminTabs.partners.search")}
                value={partnerSearch}
                onChange={(e) => { setPartnerSearch(e.target.value); setPartnerPage(1); }}
                className="w-full rounded-xl border border-border dark:border-border bg-slate-100 dark:bg-card text-[11px] py-1.5 pl-8 pr-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">search</span>
            </div>
          </div>

          {/* Items List */}
          {paginatedPartners.length > 0 ? (
            <div className="divide-y divide-border dark:divide-border/60 flex-grow">
              {paginatedPartners.map((partner) => {
                const iconUrl = getFaviconUrl(partner.iframeUrl);
                return (
                  <div key={partner._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-card border border-border/50 dark:border-border flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        {iconUrl ? (
                          <img 
                            src={iconUrl} 
                            alt="" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                            className="w-5 h-5 object-contain" 
                          />
                        ) : (
                          <span className="material-symbols-outlined text-muted-foreground text-lg">link</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground text-xs truncate">{partner.name}</h4>
                        <p className="text-[10px] text-muted-foreground truncate max-w-sm font-mono mt-0.5">{partner.iframeUrl}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => setExportPartner(partner)}
                        className="bg-primary hover:bg-primary/90 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[10px]">code</span>
                        {t("adminTabs.partners.exportIframe")}
                      </button>
                      <button
                        onClick={() => setExportLinkPartner(partner)}
                        className="bg-success hover:bg-success/90 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[10px]">link</span>
                        {t("adminTabs.partners.exportLink")}
                      </button>
                      <button
                        onClick={() => setPreviewPartner(partner)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-border/50 dark:border-border transition-colors shadow-sm active:scale-95"
                      >
                        Xem Thử
                      </button>
                      <button
                        onClick={() => handleDeletePartner(partner._id)}
                        className="text-destructive hover:text-destructive/80 dark:hover:text-destructive p-1.5 rounded-full hover:bg-destructive/10 dark:hover:bg-destructive/15 transition-colors"
                        title={t("adminTabs.partners.delete")}
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground flex-grow flex items-center justify-center">
              {partnerSearch ? (
                <p className="italic">{t("adminTabs.partners.empty")}</p>
              ) : (
                <div className="space-y-2 max-w-sm">
                  <p className="font-bold text-muted-foreground not-italic">{t("adminTabs.partners.empty")}</p>
                  <p className="text-[11px] leading-relaxed">
                    {t("adminTabs.partners.createInstruction")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination bar */}
          {totalPartnerPages > 1 && (
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/10 border-t border-border dark:border-border/60 flex items-center justify-between text-xs font-bold text-muted-foreground shrink-0">
              <span>Trang {partnerPage} / {totalPartnerPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPartnerPage(p => Math.max(p - 1, 1))}
                  disabled={partnerPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPartnerPage(p => Math.min(p + 1, totalPartnerPages))}
                  disabled={partnerPage === totalPartnerPages}
                  className="px-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview modal drawer formatted as a browser frame */}
        {previewPartner && (
          <div className="bg-white dark:bg-background rounded-xl border border-border dark:border-border/80 shadow-sm p-6 space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-border dark:border-border pb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-muted-foreground text-sm">visibility</span>
                {t("adminTabs.partners.previewPrefix")} {previewPartner.name}
              </h4>
              <button 
                onClick={() => setPreviewPartner(null)}
                className="text-muted-foreground hover:text-muted-foreground dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="w-full bg-muted dark:bg-card rounded-xl overflow-hidden border border-border dark:border-border flex flex-col shadow-inner">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-200/60 dark:bg-slate-900/60 border-b border-border dark:border-border select-none">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                  <span className="w-2.5 h-2.5 rounded-full bg-success" />
                </div>
                <div className="flex-grow max-w-md mx-auto bg-white/70 dark:bg-black/30 rounded-lg text-[10px] text-center text-muted-foreground py-1 font-mono truncate px-4">
                  {previewPartner.iframeUrl.includes('<iframe') ? "Embedded Code Output" : previewPartner.iframeUrl}
                </div>
              </div>
              
              <div className="w-full bg-white dark:bg-background min-h-[420px] relative z-10 flex">
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
    </div>
  );
}
