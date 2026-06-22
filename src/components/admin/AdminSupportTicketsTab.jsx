import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supportTicketApi } from "../../services/api/SupportTicketApi";

export default function AdminSupportTicketsTab({ showNotification, triggerConfirm }) {
  const { t } = useTranslation();
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportPage, setSupportPage] = useState(1);
  const [supportLimit] = useState(15);
  const [supportTotalPages, setSupportTotalPages] = useState(1);
  const [supportStatusFilter, setSupportStatusFilter] = useState(""); // "" (All), "pending", "resolved"
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await supportTicketApi.getTickets({
        status: supportStatusFilter,
        page: supportPage,
        limit: supportLimit
      });
      setSupportTickets(data.tickets || []);
      setSupportTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
      showNotification("Lỗi khi tải danh sách ticket", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [supportPage, supportStatusFilter]);

  const handleResolveTicket = async (ticketId) => {
    try {
      await supportTicketApi.resolveTicket(ticketId);
      showNotification(t("admin.texts.txt_155"));
      fetchTickets();
    } catch (err) {
      showNotification(t("admin.texts.txt_157"), "error");
    }
  };

  if (loading && supportTickets.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-background rounded-xl border border-border dark:border-border/80 shadow-sm overflow-hidden animate-fadeIn">
      {/* Support Sub-tabs */}
      <div className="flex border-b border-border dark:border-border px-6 pt-4 bg-slate-50/50 dark:bg-card/40 gap-4">
        <button
          onClick={() => { setSupportStatusFilter(""); setSupportPage(1); }}
          className={`pb-3 font-bold text-xs relative transition-all ${
            supportStatusFilter === "" ? "text-primary" : "text-muted-foreground hover:text-slate-800 dark:hover:text-foreground"
          }`}
        >
          {t("admin.texts.txt_243")}
          {supportStatusFilter === "" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => { setSupportStatusFilter("pending"); setSupportPage(1); }}
          className={`pb-3 font-bold text-xs relative transition-all ${
            supportStatusFilter === "pending" ? "text-warning" : "text-muted-foreground hover:text-slate-800 dark:hover:text-foreground"
          }`}
        >
          {t("admin.texts.txt_244")}
          {supportStatusFilter === "pending" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-warning rounded-full" />}
        </button>
        <button
          onClick={() => { setSupportStatusFilter("resolved"); setSupportPage(1); }}
          className={`pb-3 font-bold text-xs relative transition-all ${
            supportStatusFilter === "resolved" ? "text-success dark:text-success" : "text-muted-foreground hover:text-slate-800 dark:hover:text-foreground"
          }`}
        >
          {t("admin.texts.txt_245")}
          {supportStatusFilter === "resolved" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-success rounded-full" />}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-muted-foreground border-b border-border dark:border-border/70 font-bold uppercase tracking-wider text-[9px]">
              <th className="px-6 py-4 w-20 text-center">{t("admin.texts.txt_246")}</th>
              <th className="px-6 py-4">{t("admin.texts.txt_247")}</th>
              <th className="px-6 py-4">{t("admin.texts.txt_248")}</th>
              <th className="px-6 py-4 w-40">{t("admin.texts.txt_249")}</th>
              <th className="px-6 py-4 w-32 text-center">{t("admin.texts.txt_250")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border/60">
            {supportTickets.length > 0 ? supportTickets.map((ticket) => (
              <tr key={ticket._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase border ${
                    ticket.status === 'resolved' 
                      ? "bg-success/10 border-success/30 text-success dark:bg-success/15" 
                      : "bg-warning/10 border-warning/30 text-warning dark:bg-warning/15"
                  }`}>
                    {ticket.status === 'resolved' ? t("admin.texts.txt_245") : t("admin.texts.txt_244")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-foreground">{ticket.userEmail}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{ticket.type}</div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap font-medium">
                    {ticket.message}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="font-mono text-[10px] text-muted-foreground flex flex-col gap-1">
                    <span>{new Date(ticket.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span>{new Date(ticket.createdAt).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {ticket.status === 'pending' ? (
                    <button
                      onClick={() => handleResolveTicket(ticket._id)}
                      className="bg-success hover:bg-success/90 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      {t("admin.texts.txt_251")}
                    </button>
                  ) : (
                    <span className="text-muted-foreground text-[10px] font-bold italic">
                      {t("admin.texts.txt_252")}
                    </span>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="p-12 text-center text-muted-foreground font-medium">
                  {t("admin.texts.txt_253")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {supportTotalPages > 1 && (
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/10 border-t border-border dark:border-border/60 flex justify-between items-center text-xs font-bold text-muted-foreground">
          <span>{t("admin.texts.txt_254", { current: supportPage, total: supportTotalPages })}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSupportPage(p => Math.max(1, p - 1))}
              disabled={supportPage === 1}
              className="px-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-background text-foreground disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
            >
              {t("admin.texts.txt_255")}
            </button>
            <button
              onClick={() => setSupportPage(p => Math.min(supportTotalPages, p + 1))}
              disabled={supportPage === supportTotalPages}
              className="px-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-background text-foreground disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
            >
              {t("admin.texts.txt_256")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
