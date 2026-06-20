import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import RadarChart from "./charts/RadarChart";
import LineChart from "./charts/LineChart";
import { ShieldCheck, User, Phone, Mail, MapPin, Calendar as CalendarIcon, Activity, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";

export default function ProfileTab({ historyLogs: rawHistoryLogs, bio, onNavigateToTab, showToast }) {
  const { t } = useTranslation();
  const historyLogs = Array.isArray(rawHistoryLogs) ? rawHistoryLogs : [];
  const dassTests = historyLogs.filter(l => l.test === "dass42");
  const mmpiTests = historyLogs.filter(l => l.test === "mmpi30");
  const phq9Tests = historyLogs.filter(l => l.test === "phq9");
  const gad7Tests = historyLogs.filter(l => l.test === "gad7");
  const who5Tests = historyLogs.filter(l => l.test === "who5");

  const totalTestsCount = dassTests.length + mmpiTests.length + phq9Tests.length + gad7Tests.length + who5Tests.length;
  const latestDass = dassTests.length > 0 ? dassTests[dassTests.length - 1] : null;

  const getMedicalEvaluation = useMemo(() => {
    const anomaliesList = [];
    const chatAnomalies = historyLogs.filter(l => l.type === "anomaly_detected" || l.type === "chat_anomaly");
    const checkins = historyLogs.filter(l => l.type === "checkin");

    const lowMoods = checkins.filter(c => c.mood <= 2);
    if (lowMoods.length >= 3) {
      anomaliesList.push({
        title: t("companion.profile.lowMoodTitle", "Tâm trạng suy giảm kéo dài"),
        desc: t("companion.profile.lowMoodDesc", { count: lowMoods.length }),
        severity: "medium"
      });
    }

    if (phq9Tests.length > 0) {
      const latest = phq9Tests[phq9Tests.length - 1];
      if (latest.score >= 15) {
        anomaliesList.push({
          title: t("companion.profile.phq9AlertTitle", "Chỉ số Trầm cảm PHQ-9 cảnh báo"),
          desc: t("companion.profile.phq9AlertDesc", { score: latest.score }),
          severity: "high"
        });
      }
    }

    if (dassTests.length > 0) {
      const latest = dassTests[dassTests.length - 1];
      const elevated = [];
      if (latest.severities) {
        if (["severe", "extremely_severe"].includes(latest.severities.D)) {
          elevated.push(`${t("companion.profile.dassDepression", "Trầm cảm")} (${latest.severities.D === "severe" ? t("companion.profile.severe", "Nặng") : t("companion.profile.extremelySevere", "Cực đoan")})`);
        }
        if (["severe", "extremely_severe"].includes(latest.severities.A)) {
          elevated.push(`${t("companion.profile.dassAnxiety", "Lo âu")} (${latest.severities.A === "severe" ? t("companion.profile.severe", "Nặng") : t("companion.profile.extremelySevere", "Cực đoan")})`);
        }
        if (["severe", "extremely_severe"].includes(latest.severities.S)) {
          elevated.push(`${t("companion.profile.dassStress", "Căng thẳng")} (${latest.severities.S === "severe" ? t("companion.profile.severe", "Nặng") : t("companion.profile.extremelySevere", "Cực đoan")})`);
        }
      }
      
      if (elevated.length > 0) {
        anomaliesList.push({
          title: t("companion.profile.dassAlertTitle", "Chỉ số lâm sàng DASS vượt ngưỡng"),
          desc: t("companion.profile.dassAlertDesc", { elevated: elevated.join(", ") }),
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
          title: t("companion.profile.mmpiAlertTitle", "Xu hướng hành vi MMPI vượt ngưỡng"),
          desc: t("companion.profile.mmpiAlertDesc", { list: list.join(", ") }),
          severity: "high"
        });
      }
    }

    if (chatAnomalies.length > 0) {
      const lastAnomaly = chatAnomalies[chatAnomalies.length - 1];
      anomaliesList.push({
        title: t("companion.profile.chatAlertTitle", "Dấu hiệu bất ổn trong hội thoại"),
        desc: t("companion.profile.chatAlertDesc", { text: lastAnomaly.text }),
        severity: "medium"
      });
    }

    let rec = "";
    if (anomaliesList.some(a => a.severity === "high")) {
      rec = t("companion.profile.recHigh", "Cảnh báo: Chỉ số sức khỏe tinh thần của cậu đang có dấu hiệu bất ổn lâm sàng nghiêm trọng. Hãy liên hệ chuyên viên tâm lý hoặc phòng y tế ngay lập tức.");
    } else if (anomaliesList.length > 0) {
      rec = t("companion.profile.recMedium", "Lưu ý: Hệ thống phát hiện một số căng thẳng nhẹ. Hãy dành thời gian nghỉ ngơi, ngủ đủ giấc và tiếp tục trò chuyện cùng Chuyên viên Đồng Hành.");
    } else {
      rec = t("companion.profile.recNormal", "Tin vui: Cảm xúc và chỉ số sinh hoạt của cậu cực kỳ ổn định. Hãy duy trì năng lượng tích cực này nhé!");
    }

    return { anomalies: anomaliesList, recommendation: rec };
  }, [historyLogs]);

  const { anomalies, recommendation } = getMedicalEvaluation;

  // Render
  return (
    <div className="p-4 sm:p-6 text-left animate-fadeIn bg-transparent h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Thông tin hồ sơ cá nhân (Col 1) */}
        <div className="col-span-1 lg:col-span-1 p-5 rounded-2xl border bg-white/60 dark:bg-[#1a1924]/60 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
            <User className="w-5 h-5 text-indigo-500" />
            <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.profile.title", "Thông Tin Cá Nhân")}</h4>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50">
              <User className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">{t("companion.profile.fullName", "Họ và tên")}</p>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{bio?.displayName || bio?.name || t("companion.profile.notSet", "Chưa cập nhật")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50">
              <Mail className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Email</p>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{bio?.email || t("companion.profile.notSet", "Chưa cập nhật")}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50">
                <Phone className="w-4 h-4 text-zinc-400" />
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider mt-1">{t("companion.profile.phone", "SĐT")}</p>
                <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">{bio?.phone || t("companion.profile.empty", "Trống")}</p>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50">
                <CalendarIcon className="w-4 h-4 text-zinc-400" />
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider mt-1">{t("companion.profile.birthday", "Sinh nhật")}</p>
                <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">{bio?.dob || t("companion.profile.empty", "Trống")}</p>
              </div>
            </div>
          </div>
          {(!bio?.phone || !bio?.dob || !bio?.address) && (
            <p className="text-[9px] font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 mt-auto">
              {t("companion.profile.missingInfo", "* Một số thông tin còn thiếu. Hãy trò chuyện với AI để cập nhật thêm.")}
            </p>
          )}
        </div>

        {/* Bảng thống kê (Col 2,3) */}
        <div className="col-span-1 lg:col-span-2 p-5 rounded-2xl border bg-white/60 dark:bg-[#1a1924]/60 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
            <Activity className="w-5 h-5 text-emerald-500" />
            <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.profile.statsTitle", "Thống Kê Tổng Quan")}</h4>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl flex flex-col items-center justify-center border border-transparent hover:border-indigo-500/20 transition-all">
              <p className="text-3xl font-black text-indigo-500 drop-shadow-sm">{totalTestsCount}</p>
              <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">{t("companion.profile.statsTests", "Bài test")}</p>
            </div>
            <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl flex flex-col items-center justify-center border border-transparent hover:border-emerald-500/20 transition-all">
              <p className="text-3xl font-black text-emerald-500 drop-shadow-sm">{historyLogs.filter(l => l.type === "checkin").length}</p>
              <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">{t("companion.profile.statsCheckins", "Check-in")}</p>
            </div>
            <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl flex flex-col items-center justify-center border border-transparent hover:border-rose-500/20 transition-all">
              <p className="text-3xl font-black text-rose-500 drop-shadow-sm">{anomalies.length}</p>
              <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">{t("companion.profile.statsAnomalies", "Bất thường")}</p>
            </div>
            <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl flex flex-col items-center justify-center border border-transparent hover:border-amber-500/20 transition-all">
              <p className="text-3xl font-black text-amber-500 drop-shadow-sm">{phq9Tests.length}</p>
              <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">{t("companion.profile.statsDepression", "Test Trầm Cảm")}</p>
            </div>
          </div>

          <div className="mt-2 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-xl flex gap-3 items-center">
            <Sparkles className="w-6 h-6 text-emerald-500 shrink-0 animate-pulse" />
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold leading-relaxed">
              {recommendation}
            </p>
          </div>
        </div>

        {/* Đánh giá (Col 1) */}
        {anomalies.length > 0 && (
          <div className="col-span-1 lg:col-span-1 p-5 rounded-2xl border bg-white/60 dark:bg-[#1a1924]/60 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.profile.clinicalAlerts", "Cảnh Báo Lâm Sàng")}</h4>
            </div>
            <div className="space-y-2.5 overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800 pr-1">
              {anomalies.map((anom, idx) => (
                <div key={idx} className={`p-3 rounded-xl flex gap-2.5 items-start border ${anom.severity === "high" ? "bg-red-500/5 border-red-500/20 text-red-800 dark:text-red-300" : "bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300"}`}>
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${anom.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-wider">{anom.title}</h5>
                    <p className="text-[9.5px] opacity-90 font-semibold mt-1">{anom.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Biểu đồ (Col 2,3 or Col 1,2,3 depending on anomalies) */}
        <div className={`col-span-1 ${anomalies.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} p-5 rounded-2xl border bg-white/60 dark:bg-[#1a1924]/60 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col gap-4`}>
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.profile.deepAnalysis", "Phân Tích Chuyên Sâu")}</h4>
          </div>
          {totalTestsCount > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <div className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-3 bg-white/50 dark:bg-black/20 flex flex-col">
                <h5 className="text-[9px] font-black text-zinc-500 uppercase tracking-wider text-center mb-2">{t("companion.profile.wheelTitle", "Chỉ số Bánh Xe Cuộc Sống")}</h5>
                <div className="flex-1 min-h-[160px]">
                  <RadarChart scores={latestDass?.scores} />
                </div>
              </div>
              <div className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-3 bg-white/50 dark:bg-black/20 flex flex-col">
                <h5 className="text-[9px] font-black text-zinc-500 uppercase tracking-wider text-center mb-2">{t("companion.profile.emotionTitle", "Biến thiên Cảm xúc")}</h5>
                <div className="flex-1 min-h-[160px]">
                  <LineChart 
                    data={historyLogs.filter(l => l.type === "checkin").map(c => ({ value: c.mood }))} 
                    maxScore={5} 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 flex flex-col items-center justify-center h-full text-zinc-400">
              <Sparkles className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-[10px] font-bold">{t("companion.profile.noChartData", "Chưa đủ dữ liệu biểu đồ. Hãy làm thêm bài test.")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
