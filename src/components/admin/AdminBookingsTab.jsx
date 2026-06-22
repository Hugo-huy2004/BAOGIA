import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { bookingApi } from "../../services/api/BookingApi";

export default function AdminBookingsTab({ showNotification, triggerConfirm }) {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [bookingSubTab, setBookingSubTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.getBookings();
      setBookings(data || []);
    } catch (err) {
      console.error(err);
      showNotification("Lỗi khi tải lịch hẹn", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleToggleBookingContacted = async (bookingId, currentContacted) => {
    const nextContacted = !currentContacted;
    try {
      const updated = await bookingApi.toggleContacted(bookingId, nextContacted);
      showNotification(nextContacted ? t("admin.texts.txt_147") : t("admin.texts.txt_148"));
      setBookings(prev => prev.map(b => b._id === bookingId ? updated : b));
    } catch (e) {
      console.error(e);
      showNotification(t("admin.texts.txt_150"), "error");
    }
  };

  const handleDeleteBooking = (bookingId) => {
    triggerConfirm(t("admin.texts.txt_151"), async () => {
      try {
        await bookingApi.deleteBooking(bookingId);
        showNotification(t("admin.texts.txt_152"));
        setBookings(prev => prev.filter(b => b._id !== bookingId));
      } catch (e) {
        console.error(e);
        showNotification(t("admin.texts.txt_154"), "error");
      }
    });
  };

  const getAutoDeleteDays = (booking) => {
    if (!booking.contacted || !booking.expiresAt) return null;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const expMidnight = new Date(booking.expiresAt);
    expMidnight.setHours(0, 0, 0, 0);
    const diffTime = expMidnight.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const pendingBookings = bookings.filter(b => !b.contacted);
  const contactedBookings = bookings.filter(b => b.contacted);
  const displayedBookings = bookingSubTab === "pending" ? pendingBookings : contactedBookings;

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-background rounded-xl border border-border dark:border-border/80 shadow-sm overflow-hidden animate-fadeIn">
      {/* Split sub-tabs navigation */}
      <div className="flex border-b border-border dark:border-border px-6 pt-4 bg-slate-50/50 dark:bg-card/40 gap-4">
        <button
          onClick={() => setBookingSubTab("pending")}
          className={`pb-3 font-bold text-xs relative transition-all flex items-center gap-2 ${
            bookingSubTab === "pending"
              ? "text-primary"
              : "text-muted-foreground hover:text-slate-800 dark:text-muted-foreground dark:hover:text-foreground"
          }`}
        >
          <span>{t("admin.texts.txt_123")}</span>
          {pendingBookings.length > 0 && (
            <span className="bg-destructive text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
              {pendingBookings.length}
            </span>
          )}
          {bookingSubTab === "pending" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-primary rounded-full" />
          )}
        </button>

        <button
          onClick={() => setBookingSubTab("contacted")}
          className={`pb-3 font-bold text-xs relative transition-all flex items-center gap-2 ${
            bookingSubTab === "contacted"
              ? "text-primary"
              : "text-muted-foreground hover:text-slate-800 dark:text-muted-foreground dark:hover:text-foreground"
          }`}
        >
          <span>{t("admin.texts.txt_124")}</span>
          {contactedBookings.length > 0 && (
            <span className="bg-slate-200 dark:bg-slate-800 text-muted-foreground dark:text-muted-foreground text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
              {contactedBookings.length}
            </span>
          )}
          {bookingSubTab === "contacted" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-primary rounded-full" />
          )}
        </button>
      </div>

      {displayedBookings.length > 0 ? (
        <div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-muted-foreground border-b border-border dark:border-border/70 font-bold uppercase tracking-wider text-[9px]">
                  <th className="px-6 py-4 w-16 text-center">{t("admin.texts.txt_125")}</th>
                  <th className="px-6 py-4">{t("admin.texts.txt_126")}</th>
                  <th className="px-6 py-4">{t("admin.texts.txt_127")}</th>
                  <th className="px-6 py-4">{t("admin.texts.txt_128")}</th>
                  <th className="px-6 py-4 text-center">{t("admin.texts.txt_129")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border/60 font-medium">
                {displayedBookings.map((booking) => {
                  const deleteDays = getAutoDeleteDays(booking);
                  return (
                    <tr key={booking._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleBookingContacted(booking._id, booking.contacted)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border shadow-sm ${
                            booking.contacted
                              ? "bg-success/10 border-success/30 text-success dark:bg-success/15 dark:border-success/25 dark:text-success"
                              : "bg-white border-border text-muted-foreground hover:border-primary hover:text-primary dark:bg-slate-800 dark:border-border"
                          }`}
                          title={booking.contacted ? t("admin.texts.txt_214") : t("admin.texts.txt_215")}
                        >
                          <span className="material-symbols-outlined text-base">
                            {booking.contacted ? "check_box" : "check_box_outline_blank"}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-foreground text-xs">{booking.fullName}</div>
                          <div className="text-[10px] text-muted-foreground font-mono select-all">{booking.phone}</div>
                          <div className="text-[10px] text-muted-foreground font-mono select-all">{booking.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-muted-foreground text-xs line-clamp-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-border dark:border-border/60 leading-relaxed">
                          {booking.message || t("admin.texts.txt_216")}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <div className="flex flex-col font-medium">
                          <span className="text-foreground">
                            {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {deleteDays !== null && (
                            <span className="text-[9px] text-destructive font-bold mt-1">
                              Tự xóa sau {deleteDays} ngày
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                          className="text-destructive hover:text-destructive/80 dark:hover:text-destructive w-8 h-8 rounded-lg hover:bg-destructive/10 dark:hover:bg-destructive/15 transition-colors flex items-center justify-center mx-auto"
                          title={t("admin.texts.txt_217")}
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Compressed Mobile List View */}
          <div className="md:hidden divide-y divide-border dark:divide-border/60 px-4">
            {displayedBookings.map((booking) => {
              const deleteDays = getAutoDeleteDays(booking);
              return (
                <div key={booking._id} className="py-4 space-y-2.5 first:pt-2 last:pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-xs truncate leading-tight">{booking.fullName}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                        {new Date(booking.createdAt).toLocaleDateString('vi-VN')} • {new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleBookingContacted(booking._id, booking.contacted)}
                        className={`px-2 py-0.5 rounded-md text-[8.5px] font-extrabold uppercase border flex items-center gap-1 transition-all ${
                          booking.contacted
                            ? "bg-success/10 border-success/30 text-success dark:bg-success/15 dark:border-success/25 dark:text-success"
                            : "bg-white border-border text-muted-foreground dark:bg-slate-800 dark:border-border"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[10px] font-bold">
                          {booking.contacted ? "check_box" : "check_box_outline_blank"}
                        </span>
                        <span>{booking.contacted ? t("admin.texts.txt_218") : t("admin.texts.txt_219")}</span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteBooking(booking._id)}
                        className="text-destructive hover:text-destructive/80 w-7 h-7 rounded-md hover:bg-destructive/10 dark:hover:bg-destructive/15 transition-colors flex items-center justify-center border border-border/50 dark:border-border/80 shrink-0"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-bold text-muted-foreground">
                    <a href={`tel:${booking.phone}`} className="flex items-center gap-1 bg-slate-100/80 dark:bg-card/60 px-2.5 py-1 rounded-lg border border-border/40 dark:border-border/80 font-mono">
                      <span className="material-symbols-outlined text-[9px] font-bold">call</span>
                      <span>{booking.phone}</span>
                    </a>
                    <a href={`mailto:${booking.email}`} className="flex items-center gap-1 bg-slate-100/80 dark:bg-card/60 px-2.5 py-1 rounded-lg border border-border/40 dark:border-border/80 font-mono truncate max-w-[190px]">
                      <span className="material-symbols-outlined text-[9px] font-bold">mail</span>
                      <span className="truncate">{booking.email}</span>
                    </a>
                  </div>

                  <p className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-border dark:border-border/60 leading-relaxed italic">
                    "{booking.message || t('adminTabs.bookings.empty')}"
                  </p>

                  {deleteDays !== null && (
                    <div className="text-[9px] text-destructive dark:text-destructive bg-destructive/5 border border-destructive/10 p-2 rounded-lg font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">info</span>
                      <span>{t("adminTabs.bookings.autoDelete", { days: deleteDays })}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl opacity-40">calendar_today</span>
          <p className="text-sm font-semibold">{t("adminTabs.bookings.empty")}</p>
        </div>
      )}
    </div>
  );
}
