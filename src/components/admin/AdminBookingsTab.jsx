import React, { useState, useEffect } from "react";

export default function AdminBookingsTab({ showNotification, triggerConfirm }) {
  const [bookings, setBookings] = useState([]);
  const [bookingSubTab, setBookingSubTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/bookings");
      if (res.ok) {
        setBookings(await res.json());
      }
    } catch (err) {
      console.error(err);
      showNotification("Lỗi kết nối khi tải lịch hẹn.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookingContacted = async (bookingId, currentStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacted: !currentStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(prev => prev.map(b => b._id === bookingId ? updated : b));
        showNotification(!currentStatus ? "Đã chuyển sang: Đã Liên Hệ" : "Đã chuyển về: Chờ Liên Hệ");
      }
    } catch (err) {
      showNotification("Lỗi cập nhật trạng thái.", "error");
    }
  };

  const handleDeleteBooking = (bookingId) => {
    triggerConfirm("Xóa yêu cầu này? Bạn không thể khôi phục.", async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setBookings(prev => prev.filter(b => b._id !== bookingId));
          showNotification("Đã xóa lịch hẹn.");
        }
      } catch (err) {
        showNotification("Lỗi khi xóa lịch hẹn.", "error");
      }
    });
  };

  const getAutoDeleteDays = (booking) => {
    if (!booking.contacted) return null;
    const daysSince = Math.floor((new Date() - new Date(booking.updatedAt || booking.createdAt)) / (1000 * 60 * 60 * 24));
    const daysLeft = 14 - daysSince;
    return daysLeft > 0 ? daysLeft : 0;
  };

  const pendingBookings = bookings.filter(b => !b.contacted);
  const contactedBookings = bookings.filter(b => b.contacted);
  const displayedBookings = bookingSubTab === "pending" ? pendingBookings : contactedBookings;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden animate-fadeIn">
      {/* Split sub-tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-4 bg-slate-50/50 dark:bg-[#181622]/40 gap-4">
        <button
          onClick={() => setBookingSubTab("pending")}
          className={`pb-3 font-bold text-xs relative transition-all flex items-center gap-2 ${
            bookingSubTab === "pending"
              ? "text-primary dark:text-[#a5b4fc]"
              : "text-slate-450 hover:text-slate-800 dark:text-slate-550 dark:hover:text-slate-350"
          }`}
        >
          <span>Chờ Liên Hệ</span>
          {pendingBookings.length > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
              {pendingBookings.length}
            </span>
          )}
          {bookingSubTab === "pending" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-[#a5b4fc] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setBookingSubTab("contacted")}
          className={`pb-3 font-bold text-xs relative transition-all flex items-center gap-2 ${
            bookingSubTab === "contacted"
              ? "text-primary dark:text-[#a5b4fc]"
              : "text-slate-450 hover:text-slate-800 dark:text-slate-550 dark:hover:text-slate-350"
          }`}
        >
          <span>Đã Liên Hệ</span>
          {contactedBookings.length > 0 && (
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-655 dark:text-slate-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
              {contactedBookings.length}
            </span>
          )}
          {bookingSubTab === "contacted" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-[#a5b4fc] rounded-full" />
          )}
        </button>
      </div>

      {displayedBookings.length > 0 ? (
        <div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/70 font-bold uppercase tracking-wider text-[9px]">
                  <th className="px-6 py-4 w-16 text-center">Trạng thái</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Lời nhắn</th>
                  <th className="px-6 py-4">Ngày gửi</th>
                  <th className="px-6 py-4 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 font-medium">
                {displayedBookings.map((booking) => {
                  const deleteDays = getAutoDeleteDays(booking);
                  return (
                    <tr key={booking._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleBookingContacted(booking._id, booking.contacted)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border shadow-sm ${
                            booking.contacted
                              ? "bg-emerald-50 border-emerald-255 text-emerald-600 dark:bg-[#102a1e] dark:border-[#104a30] dark:text-emerald-455"
                              : "bg-white border-slate-200 text-slate-400 hover:border-primary hover:text-primary dark:bg-slate-850 dark:border-slate-800"
                          }`}
                          title={booking.contacted ? "Đánh dấu chưa liên hệ" : "Đánh dấu đã liên hệ"}
                        >
                          <span className="material-symbols-outlined text-base">
                            {booking.contacted ? "check_box" : "check_box_outline_blank"}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-850 dark:text-white text-xs">{booking.fullName}</div>
                          <div className="text-[10px] text-slate-405 font-mono select-all">{booking.phone}</div>
                          <div className="text-[10px] text-slate-405 font-mono select-all">{booking.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-slate-600 dark:text-slate-350 text-xs line-clamp-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                          {booking.message || "Không có lời nhắn"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <div className="flex flex-col font-medium">
                          <span className="text-slate-800 dark:text-slate-200">
                            {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {deleteDays !== null && (
                            <span className="text-[9px] text-rose-500 font-bold mt-1">
                              Tự xóa sau {deleteDays} ngày
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                          className="text-rose-555 hover:text-rose-700 dark:hover:text-rose-400 w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center justify-center mx-auto"
                          title="Xóa yêu cầu"
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
          <div className="md:hidden divide-y divide-slate-150 dark:divide-slate-800/60 px-4">
            {displayedBookings.map((booking) => {
              const deleteDays = getAutoDeleteDays(booking);
              return (
                <div key={booking._id} className="py-4 space-y-2.5 first:pt-2 last:pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-850 dark:text-white text-xs truncate leading-tight">{booking.fullName}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
                        {new Date(booking.createdAt).toLocaleDateString('vi-VN')} • {new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleBookingContacted(booking._id, booking.contacted)}
                        className={`px-2 py-0.5 rounded-md text-[8.5px] font-extrabold uppercase border flex items-center gap-1 transition-all ${
                          booking.contacted
                            ? "bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-[#102a1e] dark:border-[#104a30] dark:text-emerald-455"
                            : "bg-white border-slate-200 text-slate-500 dark:bg-slate-850 dark:border-slate-800"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[10px] font-bold">
                          {booking.contacted ? "check_box" : "check_box_outline_blank"}
                        </span>
                        <span>{booking.contacted ? "Đã Gọi" : "Chờ"}</span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteBooking(booking._id)}
                        className="text-rose-500 hover:text-rose-700 w-7 h-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center justify-center border border-slate-200/50 dark:border-slate-800/80 shrink-0"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-350">
                    <a href={`tel:${booking.phone}`} className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#1a1626]/80 px-2.5 py-1 rounded-lg border border-slate-200/40 dark:border-slate-800/80 font-mono">
                      <span className="material-symbols-outlined text-[9px] font-bold">call</span>
                      <span>{booking.phone}</span>
                    </a>
                    <a href={`mailto:${booking.email}`} className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#1a1626]/80 px-2.5 py-1 rounded-lg border border-slate-200/40 dark:border-slate-800/80 font-mono truncate max-w-[190px]">
                      <span className="material-symbols-outlined text-[9px] font-bold">mail</span>
                      <span className="truncate">{booking.email}</span>
                    </a>
                  </div>

                  <p className="text-xs text-slate-655 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed italic">
                    "{booking.message || "Không có lời nhắn"}"
                  </p>

                  {deleteDays !== null && (
                    <div className="text-[9px] text-rose-600 dark:text-rose-450 bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">info</span>
                      <span>Tự động xóa sau {deleteDays} ngày</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl opacity-40">calendar_today</span>
          <p className="text-sm font-semibold">Chưa có lịch hẹn nào ở mục này</p>
        </div>
      )}
    </div>
  );
}
