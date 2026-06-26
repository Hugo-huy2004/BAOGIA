import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { bookingApi } from "../../services/api/BookingApi";
import { supportTicketApi } from "../../services/api/SupportTicketApi";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminContactSupportTab({ showNotification, triggerConfirm }) {
  const { t } = useTranslation();
  
  // Data
  const [bookings, setBookings] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeSubTab, setActiveSubTab] = useState("bookings"); // 'bookings' | 'support'
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // 'all' | 'pending' | 'resolved'
  
  // Selection
  const [selectedItem, setSelectedItem] = useState(null); // The object of currently selected item

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsData, ticketsData] = await Promise.all([
        bookingApi.getBookings(),
        supportTicketApi.getTickets({ limit: 100 }) // Fetching up to 100 tickets to manage locally for simplicity in split-pane
      ]);
      setBookings(bookingsData || []);
      setSupportTickets(ticketsData?.tickets || []);
    } catch (err) {
      console.error(err);
      showNotification("Lỗi khi tải dữ liệu liên hệ & hỗ trợ", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Clear selection on tab change
  useEffect(() => {
    setSelectedItem(null);
    setSearchQuery("");
  }, [activeSubTab]);

  // Derived lists
  const filteredList = useMemo(() => {
    let list = [];
    if (activeSubTab === "bookings") {
      list = bookings.map(b => ({
        id: b._id,
        type: 'booking',
        name: b.fullName,
        email: b.email,
        phone: b.phone,
        content: b.message || t('adminTabs.bookings.empty'),
        status: b.contacted ? 'resolved' : 'pending',
        createdAt: b.createdAt,
        expiresAt: b.expiresAt,
        raw: b
      }));
    } else {
      list = supportTickets.map(t => ({
        id: t._id,
        type: 'support',
        name: t.fullName,
        email: t.email,
        phone: t.phone,
        content: t.issue,
        status: t.status === 'resolved' ? 'resolved' : 'pending',
        createdAt: t.createdAt,
        raw: t
      }));
    }

    // Apply status filter
    if (statusFilter !== "all") {
      list = list.filter(item => item.status === statusFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.phone && item.phone.toLowerCase().includes(q)) ||
        (item.content && item.content.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [bookings, supportTickets, activeSubTab, statusFilter, searchQuery, t]);

  const pendingBookingsCount = useMemo(() => bookings.filter(b => !b.contacted).length, [bookings]);
  const pendingTicketsCount = useMemo(() => supportTickets.filter(t => t.status !== 'resolved').length, [supportTickets]);

  // Auto-select first item if none selected and list changes
  useEffect(() => {
    if (!selectedItem && filteredList.length > 0 && !loading) {
      setSelectedItem(filteredList[0]);
    } else if (selectedItem && filteredList.length === 0) {
      setSelectedItem(null);
    } else if (selectedItem && filteredList.length > 0) {
      // Refresh selected item to get latest status
      const updated = filteredList.find(i => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
      else setSelectedItem(null); // It was filtered out
    }
  }, [filteredList, loading]); // eslint-disable-line

  // Handlers
  const handleToggleBookingContacted = async (bookingId, currentContacted) => {
    const nextContacted = !currentContacted;
    try {
      const updated = await bookingApi.toggleContacted(bookingId, nextContacted);
      showNotification(nextContacted ? t("admin.texts.txt_147") : t("admin.texts.txt_148"));
      setBookings(prev => prev.map(b => b._id === bookingId ? updated : b));
    } catch (e) {
      showNotification(t("admin.texts.txt_150"), "error");
    }
  };

  const handleDeleteBooking = (bookingId) => {
    triggerConfirm(t("admin.texts.txt_151"), async () => {
      try {
        await bookingApi.deleteBooking(bookingId);
        showNotification(t("admin.texts.txt_152"));
        setBookings(prev => prev.filter(b => b._id !== bookingId));
        if (selectedItem?.id === bookingId) setSelectedItem(null);
      } catch (e) {
        showNotification(t("admin.texts.txt_154"), "error");
      }
    });
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      await supportTicketApi.resolveTicket(ticketId);
      showNotification(t("admin.texts.txt_155"));
      setSupportTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: 'resolved' } : t));
    } catch (err) {
      showNotification(t("admin.texts.txt_157"), "error");
    }
  };

  // Utilities
  const getAutoDeleteDays = (expiresAt) => {
    if (!expiresAt) return null;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const expMidnight = new Date(expiresAt);
    expMidnight.setHours(0, 0, 0, 0);
    const diffTime = expMidnight.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-background rounded-[24px] border border-border shadow-sm flex flex-col overflow-hidden min-h-[70dvh] md:min-h-[600px] md:h-[calc(100dvh-140px)] animate-fadeIn">
      
      {/* ── HEADER ── */}
      <div className="border-b border-border bg-slate-50/50 dark:bg-card/40 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4">
          
          {/* Sub-tabs */}
          <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl w-max">
            <button
              onClick={() => setActiveSubTab("bookings")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeSubTab === "bookings" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lịch Hẹn
              {pendingBookingsCount > 0 && (
                <span className="px-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-black leading-[18px] text-center bg-destructive text-white">
                  {pendingBookingsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab("support")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeSubTab === "support" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Hỗ Trợ 1:1
              {pendingTicketsCount > 0 && (
                <span className="px-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-black leading-[18px] text-center bg-destructive text-white">
                  {pendingTicketsCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${statusFilter === "all" ? "bg-white dark:bg-slate-700 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${statusFilter === "pending" ? "bg-white dark:bg-slate-700 shadow-sm text-warning" : "text-muted-foreground hover:text-foreground"}`}
              >
                Cần Xử Lý
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${statusFilter === "resolved" ? "bg-white dark:bg-slate-700 shadow-sm text-success" : "text-muted-foreground hover:text-foreground"}`}
              >
                Đã Xong
              </button>
            </div>
            <div className="relative w-48 hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-white dark:bg-background text-xs focus:outline-none input-premium-focus"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── SPLIT PANE CONTENT ── */}
      <div className="flex flex-1 min-h-0">
        
        {/* LEFT PANE: List */}
        <div className="w-full md:w-1/3 lg:w-[35%] border-r border-border bg-slate-50/30 dark:bg-card/20 flex flex-col shrink-0">
          <div className="md:hidden p-3 border-b border-border shrink-0">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white dark:bg-background text-xs focus:outline-none input-premium-focus"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {filteredList.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl opacity-20 mb-2">inbox</span>
                <p className="text-xs font-medium">Không có dữ liệu</p>
              </div>
            ) : (
              filteredList.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-3.5 rounded-[16px] transition-all border ${
                      isSelected 
                        ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20 dark:bg-primary/10 dark:border-primary/50" 
                        : "bg-white dark:bg-background border-border hover:border-border/80 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {item.name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground truncate block">{item.email}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`w-2.5 h-2.5 rounded-full mb-1 ml-auto ${item.status === 'resolved' ? 'bg-success' : 'bg-warning animate-pulse'}`} />
                        <span className="text-[9px] text-muted-foreground block font-mono">
                          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs line-clamp-2 ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {item.content}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Details */}
        <div className="hidden md:flex flex-1 flex-col bg-white dark:bg-background overflow-hidden relative">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div 
                key={selectedItem.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8"
              >
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8">
                  <div className={`px-3 py-1.5 rounded-lg border font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 ${
                    selectedItem.status === 'resolved' 
                      ? "bg-success/10 border-success/30 text-success" 
                      : "bg-warning/10 border-warning/30 text-warning"
                  }`}>
                    <span className="material-symbols-outlined text-sm">
                      {selectedItem.status === 'resolved' ? 'check_circle' : 'pending'}
                    </span>
                    {selectedItem.status === 'resolved' ? 'Đã Xử Lý / Đã Liên Hệ' : 'Đang Chờ Xử Lý'}
                  </div>

                  <div className="flex gap-2">
                    {selectedItem.type === 'booking' && (
                      <button
                        onClick={() => handleToggleBookingContacted(selectedItem.id, selectedItem.raw.contacted)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 ${
                          selectedItem.status === 'resolved'
                            ? "bg-slate-50 border-border text-muted-foreground hover:bg-slate-100 dark:bg-slate-800"
                            : "bg-primary text-white border-primary hover:bg-primary/90 shadow-md"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {selectedItem.status === 'resolved' ? 'undo' : 'done_all'}
                        </span>
                        {selectedItem.status === 'resolved' ? 'Đánh dấu chưa liên hệ' : 'Đánh dấu ĐÃ LIÊN HỆ'}
                      </button>
                    )}

                    {selectedItem.type === 'support' && selectedItem.status === 'pending' && (
                      <button
                        onClick={() => handleResolveTicket(selectedItem.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-success text-white hover:bg-success/90 transition-colors flex items-center gap-2 shadow-md"
                      >
                        <span className="material-symbols-outlined text-base">done_all</span>
                        Xác nhận đã Xử Lý
                      </button>
                    )}
                    
                    {selectedItem.type === 'booking' && (
                      <button
                        onClick={() => handleDeleteBooking(selectedItem.id)}
                        className="w-9 h-9 rounded-xl border border-destructive/30 text-destructive flex items-center justify-center hover:bg-destructive/10 transition-colors shrink-0"
                        title="Xóa lịch hẹn này"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Details */}
                <div className="space-y-8 max-w-3xl">
                  {/* Sender Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Người gửi</p>
                      <p className="font-bold text-foreground text-sm">{selectedItem.name}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Thời gian tạo</p>
                      <p className="font-medium text-foreground text-sm font-mono">
                        {new Date(selectedItem.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {/* Contact Methods */}
                  <div className="flex flex-wrap gap-3">
                    {selectedItem.phone && (
                      <a href={`tel:${selectedItem.phone}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border text-foreground hover:border-primary hover:text-primary transition-all font-mono text-sm font-bold shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">call</span>
                        {selectedItem.phone}
                      </a>
                    )}
                    {selectedItem.email && (
                      <a href={`mailto:${selectedItem.email}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border text-foreground hover:border-primary hover:text-primary transition-all font-mono text-sm font-bold shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">mail</span>
                        {selectedItem.email}
                      </a>
                    )}
                  </div>

                  {/* Message Body */}
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Nội dung chi tiết</p>
                    <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-border text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {selectedItem.content}
                    </div>
                  </div>

                  {/* Metadata / Auto Delete */}
                  {selectedItem.type === 'booking' && selectedItem.expiresAt && (
                    <div className="pt-4">
                      {(() => {
                        const days = getAutoDeleteDays(selectedItem.expiresAt);
                        return days > 0 ? (
                          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs font-bold">
                            <span className="material-symbols-outlined text-lg">timer</span>
                            Hệ thống sẽ tự động xóa yêu cầu này sau {days} ngày nữa.
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground p-8"
              >
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-border/50">
                  <span className="material-symbols-outlined text-4xl opacity-50">forum</span>
                </div>
                <p className="text-base font-bold text-foreground">Chọn một yêu cầu để xem chi tiết</p>
                <p className="text-sm mt-2 text-center max-w-sm leading-relaxed">
                  Quản lý tất cả lịch hẹn tư vấn và yêu cầu hỗ trợ 1:1 từ thành viên trong hệ thống.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
