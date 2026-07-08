import React, { useState, useEffect } from "react";
import { Check, X, FileText, Mail, Calendar } from "lucide-react";
import { notify } from "../../lib/notify";

export default function AdminHugoTeamTab() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCv, setSelectedCv] = useState(null);

  useEffect(() => {
    loadApplicants();
  }, []);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hugoteam/admin/applicants");
      if (res.ok) {
        const data = await res.json();
        setApplicants(data.applicants || []);
      }
    } catch (error) {
      console.error("Failed to load applicants:", error);
      notify.error("Lỗi khi tải đơn đăng ký");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (email, name) => {
    try {
      const res = await fetch("/api/hugoteam/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        notify.success(`✅ ${name} đã được phê duyệt!`);
        setApplicants(applicants.filter(a => a.email !== email));
        setSelectedCv(null);
      } else {
        notify.error("Lỗi khi phê duyệt");
      }
    } catch (error) {
      console.error("Approve error:", error);
      notify.error("Lỗi khi phê duyệt");
    }
  };

  const handleReject = async (email, name) => {
    if (!window.confirm(`Bạn chắc chắn từ chối ${name}?`)) return;

    try {
      const res = await fetch("/api/hugoteam/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        notify.success(`❌ Đã từ chối ${name}`);
        setApplicants(applicants.filter(a => a.email !== email));
        setSelectedCv(null);
      } else {
        notify.error("Lỗi khi từ chối");
      }
    } catch (error) {
      console.error("Reject error:", error);
      notify.error("Lỗi khi từ chối");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Hugo Team - Quản Lý Đơn Đăng Ký</h2>
        <span className="rounded-full bg-primary/20 text-primary px-4 py-2 font-bold">
          {applicants.length} đơn chờ duyệt
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
      ) : applicants.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Không có đơn đăng ký nào chờ duyệt</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applicants List */}
          <div className="lg:col-span-2 space-y-3">
            {applicants.map((app) => (
              <div
                key={app.email}
                onClick={() => setSelectedCv(app)}
                className={`rounded-xl border p-4 cursor-pointer transition-all ${
                  selectedCv?.email === app.email
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{app.name}</h3>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {app.email}
                      </p>
                      <p className="flex items-center gap-2">
                        🎓 {app.school || "Chưa cập nhật"}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <FileText className="w-5 h-5 text-accent flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {/* CV Preview & Actions */}
          {selectedCv && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-bold text-foreground mb-4">Xem Xét Đơn</h3>

              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground">{selectedCv.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedCv.email}</p>
                  <p className="text-xs text-accent mt-2">📄 {selectedCv.cv}</p>
                </div>

                {/* CV Link */}
                <a
                  href={selectedCv.cvPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Xem CV (PDF)
                </a>

                {/* Actions */}
                <div className="space-y-2 border-t border-border pt-4">
                  <button
                    onClick={() => handleApprove(selectedCv.email, selectedCv.name)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-success/20 text-success font-bold rounded-lg hover:bg-success/30 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Phê Duyệt
                  </button>
                  <button
                    onClick={() => handleReject(selectedCv.email, selectedCv.name)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive/20 text-destructive font-bold rounded-lg hover:bg-destructive/30 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Từ Chối
                  </button>
                </div>

                {/* Criteria Checklist */}
                <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2 border-t border-border pt-4">
                  <p className="font-semibold text-foreground mb-2">Tiêu Chí:</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>Sinh viên nam năm 2-3</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>Ngành CNTT</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>Kiến thức cơ bản lập trình</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>Thái độ tích cực</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
