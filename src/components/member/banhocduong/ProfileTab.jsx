import React, { useMemo } from "react";
import RadarChart from "./charts/RadarChart";
import LineChart from "./charts/LineChart";
import { ShieldCheck, User, Phone, Mail, MapPin, Calendar as CalendarIcon, Activity, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";

export default function ProfileTab({ historyLogs, bio, onNavigateToTab, showToast }) {
  const dassTests = historyLogs.filter(l => l.test === "dass42");
  const mmpiTests = historyLogs.filter(l => l.test === "mmpi30");
  const phq9Tests = historyLogs.filter(l => l.test === "phq9");
  const gad7Tests = historyLogs.filter(l => l.test === "gad7");
  const who5Tests = historyLogs.filter(l => l.test === "who5");

  const totalTestsCount = dassTests.length + mmpiTests.length + phq9Tests.length + gad7Tests.length + who5Tests.length;

  const getMedicalEvaluation = useMemo(() => {
    const anomaliesList = [];
    const chatAnomalies = historyLogs.filter(l => l.type === "anomaly_detected" || l.type === "chat_anomaly");
    const checkins = historyLogs.filter(l => l.type === "checkin");

    const lowMoods = checkins.filter(c => c.mood <= 2);
    if (lowMoods.length >= 3) {
      anomaliesList.push({
        title: "Tâm trạng suy giảm kéo dài",
        desc: `Ghi nhận ${lowMoods.length} lần check-in có trạng thái Mệt mỏi hoặc Kiệt sức liên tục.`,
        severity: "medium"
      });
    }

    if (phq9Tests.length > 0) {
      const latest = phq9Tests[phq9Tests.length - 1];
      if (latest.score >= 15) {
        anomaliesList.push({
          title: "Chỉ số Trầm cảm PHQ-9 cảnh báo",
          desc: `Bài test PHQ-9 đạt ${latest.score}/27 điểm (Mức độ Nặng/Rất nặng).`,
          severity: "high"
        });
      }
    }

    if (dassTests.length > 0) {
      const latest = dassTests[dassTests.length - 1];
      const elevated = [];
      if (latest.severities) {
        if (["severe", "extremely_severe"].includes(latest.severities.D)) elevated.push(`Trầm cảm (${latest.severities.D === "severe" ? "Nặng" : "Cực đoan"})`);
        if (["severe", "extremely_severe"].includes(latest.severities.A)) elevated.push(`Lo âu (${latest.severities.A === "severe" ? "Nặng" : "Cực đoan"})`);
        if (["severe", "extremely_severe"].includes(latest.severities.S)) elevated.push(`Căng thẳng (${latest.severities.S === "severe" ? "Nặng" : "Cực đoan"})`);
      }
      
      if (elevated.length > 0) {
        anomaliesList.push({
          title: "Chỉ số lâm sàng DASS vượt ngưỡng",
          desc: `Bài kiểm tra DASS-42 ghi nhận tình trạng ${elevated.join(", ")}.`,
          severity: "high"
        });
      }
    }

    if (mmpiTests.length > 0) {
      const latest = mmpiTests[mmpiTests.length - 1];
      const elevatedScales = latest.clinical ? latest.clinical.filter(c => c.score >= 70) : [];
      if (elevatedScales.length > 0) {
        const list = elevatedScales.map(s => `${s.code} (${s.score}T)`);
        anomaliesList.push({
          title: "Xu hướng hành vi MMPI vượt ngưỡng",
          desc: `Phát hiện bất thường lâm sàng tại các thang đo: ${list.join(", ")}.`,
          severity: "high"
        });
      }
    }

    if (chatAnomalies.length > 0) {
      const lastAnomaly = chatAnomalies[chatAnomalies.length - 1];
      anomaliesList.push({
        title: "Dấu hiệu bất ổn trong hội thoại",
        desc: `Phát hiện từ khóa căng thẳng: "${lastAnomaly.text}".`,
        severity: "medium"
      });
    }

    let rec = "";
    if (anomaliesList.some(a => a.severity === "high")) {
      rec = "Cảnh báo: Chỉ số sức khỏe tinh thần của cậu đang có dấu hiệu bất ổn lâm sàng nghiêm trọng. Hãy liên hệ chuyên viên tâm lý hoặc phòng y tế ngay lập tức.";
    } else if (anomaliesList.length > 0) {
      rec = "Lưu ý: Hệ thống phát hiện một số căng thẳng nhẹ. Hãy dành thời gian nghỉ ngơi, ngủ đủ giấc và tiếp tục trò chuyện cùng Chuyên viên Đồng Hành.";
    } else {
      rec = "Tin vui: Cảm xúc và chỉ số sinh hoạt của cậu cực kỳ ổn định. Hãy duy trì năng lượng tích cực này nhé!";
    }

    return { anomalies: anomaliesList, recommendation: rec };
  }, [historyLogs]);

  const { anomalies, recommendation } = getMedicalEvaluation;

  // Render
  return (
    <div className="p-4 sm:p-6 space-y-6 text-left animate-fadeIn bg-transparent">
      {/* Thông tin hồ sơ cá nhân */}
      <div className="p-5 rounded-xl border bg-white dark:bg-[#1a1924] border-zinc-250/50 dark:border-zinc-800/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
          <User className="w-5 h-5 text-indigo-500" />
          <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">Thông Tin Người Tham Vấn</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <User className="w-4 h-4 text-zinc-400 mt-0.5" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Họ và tên</p>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{bio?.displayName || bio?.name || "Chưa cập nhật"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <Mail className="w-4 h-4 text-zinc-400 mt-0.5" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Email</p>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{bio?.email || "Chưa cập nhật"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <Phone className="w-4 h-4 text-zinc-400 mt-0.5" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Số điện thoại</p>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{bio?.phone || "Chưa cập nhật"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <CalendarIcon className="w-4 h-4 text-zinc-400 mt-0.5" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Sinh nhật</p>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{bio?.dob || "Chưa cập nhật"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 sm:col-span-2">
            <MapPin className="w-4 h-4 text-zinc-400 mt-0.5" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Địa chỉ</p>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{bio?.address || bio?.location || "Chưa cập nhật"}</p>
            </div>
          </div>
        </div>
        {(!bio?.phone || !bio?.dob || !bio?.address) && (
          <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-md">
            * Một số thông tin còn thiếu. Cậu có thể trò chuyện với Chuyên viên Đồng Hành để hệ thống tự động cập nhật nhé.
          </p>
        )}
      </div>

      {/* Bảng thống kê */}
      <div className="p-5 rounded-xl border bg-white dark:bg-[#1a1924] border-zinc-250/50 dark:border-zinc-800/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
          <Activity className="w-5 h-5 text-emerald-500" />
          <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">Bảng Thống Kê & Chỉ Số</h4>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg text-center">
            <p className="text-2xl font-black text-indigo-500">{totalTestsCount}</p>
            <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">Bài test đã làm</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg text-center">
            <p className="text-2xl font-black text-emerald-500">{historyLogs.filter(l => l.type === "checkin").length}</p>
            <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">Lần Check-in</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg text-center">
            <p className="text-2xl font-black text-rose-500">{anomalies.length}</p>
            <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">Bất thường</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg text-center">
            <p className="text-2xl font-black text-amber-500">{phq9Tests.length}</p>
            <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">Test Trầm Cảm</p>
          </div>
        </div>

        {totalTestsCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg p-3 bg-zinc-50/30 dark:bg-black/10">
              <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider text-center mb-2">Chỉ số Bánh Xe Cuộc Sống</h5>
              <div className="h-48">
                <RadarChart historyLogs={historyLogs} />
              </div>
            </div>
            <div className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg p-3 bg-zinc-50/30 dark:bg-black/10">
              <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider text-center mb-2">Biến thiên Cảm xúc (Gần đây)</h5>
              <div className="h-48">
                <LineChart historyLogs={historyLogs} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-zinc-400 text-[10px] font-bold">
            Chưa đủ dữ liệu để vẽ biểu đồ thống kê. Hãy thực hiện thêm các bài test nhé.
          </div>
        )}
      </div>

      {/* Đánh giá & Khuyến nghị */}
      <div className="p-5 rounded-xl border bg-white dark:bg-[#1a1924] border-zinc-250/50 dark:border-zinc-800/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">Đánh Giá & Khuyến Nghị</h4>
        </div>
        
        {anomalies.length > 0 && (
          <div className="space-y-2">
            {anomalies.map((anom, idx) => (
              <div key={idx} className={`p-3 rounded-lg flex gap-3 items-start border ${anom.severity === "high" ? "bg-red-500/5 border-red-500/20 text-red-800 dark:text-red-300" : "bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300"}`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${anom.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                <div>
                  <h5 className="text-[10.5px] font-black uppercase tracking-wider">{anom.title}</h5>
                  <p className="text-[10px] opacity-90 font-semibold">{anom.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-lg flex gap-3 items-start">
          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
          <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold leading-relaxed">
            {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
