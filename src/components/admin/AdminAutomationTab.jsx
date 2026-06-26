import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { BaseApi } from "../../services/api/BaseApi";
import { Spinner } from "../ui/Spinner";

const api = new BaseApi();

export default function AdminAutomationTab({ showNotification, stats, users }) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    category: "system",
    actionUrl: "",
    targetEmail: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      return showNotification("Tiêu đề và nội dung là bắt buộc", "error");
    }

    const targetLabel = formData.targetEmail.trim()
      ? (formData.targetEmail.trim().toLowerCase() === 'all' ? 'TOÀN BỘ người dùng đang hoạt động' : `người dùng ${formData.targetEmail.trim()}`)
      : "TOÀN BỘ người dùng đang hoạt động";
    if (!window.confirm(`Bạn có chắc chắn muốn gửi thông báo này tới ${targetLabel}?`)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await api.fetchWithAuth("/notifications/broadcast-all", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");

      showNotification("Đã phát sóng thông báo thành công!");
      setResult(data.message);
      setFormData({
        title: "",
        message: "",
        type: "info",
        category: "system",
        actionUrl: "",
        targetEmail: ""
      });
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">campaign</span>
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground">Tự Động Hóa & Phân Phối</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Hệ thống Broadcast Notifications
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cột Form Gửi */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">send</span>
                Soạn Thông Báo Mới
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBroadcast} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tiêu đề thông báo <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="VD: Cập nhật tính năng mới..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nội dung <span className="text-destructive">*</span></label>
                  <textarea
                    required
                    rows="4"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                    placeholder="Nội dung chi tiết sẽ gửi đến người dùng..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loại hiển thị</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary transition-all"
                    >
                      <option value="info">Thông tin (Info - Xanh dương)</option>
                      <option value="success">Thành công (Success - Xanh lá)</option>
                      <option value="warning">Cảnh báo (Warning - Vàng)</option>
                      <option value="error">Lỗi/Quan trọng (Error - Đỏ)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Danh mục</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary transition-all"
                    >
                      <option value="system">Hệ thống (System)</option>
                      <option value="wellness">Sức khỏe (Wellness)</option>
                      <option value="package">Gói cước (Package)</option>
                      <option value="joy">Quà tặng (Joy)</option>
                      <option value="security">Bảo mật (Security)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email người nhận (Tùy chọn)</label>
                  <input
                    type="email"
                    value={formData.targetEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetEmail: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary transition-all"
                    placeholder="Email cụ thể hoặc gõ all để gửi toàn bộ"
                  />
                  <p className="text-[10px] text-muted-foreground">Nhập email nếu chỉ muốn gửi cho một thành viên cụ thể. Gõ `all` hoặc để trống để broadcast toàn hệ thống.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Đường dẫn đính kèm (Tùy chọn)</label>
                  <input
                    type="text"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, actionUrl: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary transition-all"
                    placeholder="VD: /member/portal?tab=banhocduong"
                  />
                  <p className="text-[10px] text-muted-foreground">Khi người dùng bấm vào thông báo, họ sẽ được chuyển hướng tới đường dẫn này.</p>
                </div>

                {result && (
                  <div className="p-4 rounded-xl bg-success/10 border border-success/30 flex items-start gap-3">
                    <span className="material-symbols-outlined text-success">check_circle</span>
                    <p className="text-sm text-success font-semibold leading-relaxed">{result}</p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {loading ? <Spinner size="sm" color="text-white" /> : <span className="material-symbols-outlined">rocket_launch</span>}
                    Phát Sóng Thông Báo
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Cột Info/Hướng dẫn */}
        <div className="space-y-6">
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-warning text-xl">info</span>
                <h3 className="font-bold text-warning text-sm">Cơ chế hoạt động</h3>
              </div>
              <ul className="text-xs text-foreground/80 space-y-2 list-disc list-inside leading-relaxed">
                <li>Nếu để trống email người nhận, thông báo sẽ được gửi tới <strong>{stats?.active || 0}</strong> thành viên đang hoạt động trên hệ thống.</li>
                <li>Nếu nhập email người nhận, chỉ đúng tài khoản đó mới nhận in-app và push.</li>
                <li>Mỗi thành viên sẽ nhận được 1 thông báo hiển thị ở biểu tượng chuông (In-App).</li>
                <li>Những thành viên đã cấp quyền <strong>Push Notification</strong> trên trình duyệt/điện thoại sẽ nhận được ngay thông báo đẩy popup.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mẹo nhỏ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nên gửi thông báo vào các khung giờ vàng (19h - 21h) để đạt tỷ lệ tương tác cao nhất. Không nên lạm dụng việc gửi Push Notification để tránh gây phiền nhiễu cho người dùng.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
