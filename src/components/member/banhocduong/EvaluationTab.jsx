import React, { useMemo } from "react";
import { AlertTriangle, Clock, Calendar, TrendingDown, Activity, LineChart as LineChartIcon } from "lucide-react";

export default function EvaluationTab({ historyLogs, bio, onNavigateToTab, showToast }) {
  const formatDateTime = (isoString) => {
    try {
      const d = new Date(isoString);
      const pad = (n) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return "Không xác định";
    }
  };

  const getMedicalEvaluation = useMemo(() => {
    const anomaliesList = [];
    const chatAnomalies = historyLogs.filter(l => l.type === "anomaly_detected");
    const checkins = historyLogs.filter(l => l.type === "checkin");
    const dassTests = historyLogs.filter(l => l.test === "dass42");
    const mmpiTests = historyLogs.filter(l => l.test === "mmpi30");
    const phq9Tests = historyLogs.filter(l => l.test === "phq9");
    const uploadAnomalies = historyLogs.filter(l => l.type === "upload_error");

    const lowMoods = checkins.filter(c => c.mood <= 2);
    if (lowMoods.length >= 3) {
      anomaliesList.push({
        title: "Tâm trạng suy giảm kéo dài",
        desc: `Ghi nhận ${lowMoods.length} lần check-in có trạng thái Mệt mỏi hoặc Kiệt sức liên tục.`,
        severity: "medium"
      });
    }

    const lateNightEvents = historyLogs.filter(l => {
      if (!l.date) return false;
      const d = new Date(l.date);
      const hours = d.getHours();
      return hours >= 23 || hours < 5;
    });
    if (lateNightEvents.length >= 4) {
      anomaliesList.push({
        title: "Hoạt động khuya thường xuyên",
        desc: `Phát hiện ${lateNightEvents.length} lần hoạt động sau 23h đêm, có nguy cơ rối loạn chu kỳ ngủ.`,
        severity: "low"
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

    const unreliableMmpis = mmpiTests.filter(m => m.isReliable === false);
    if (unreliableMmpis.length > 0) {
      anomaliesList.push({
        title: "Kiểm định MMPI tin cậy thấp",
        desc: `Có ${unreliableMmpis.length} kết quả trắc nghiệm MMPI nghi ngờ độ tin cậy của chỉ số L-F-K.`,
        severity: "medium"
      });
    }

    if (uploadAnomalies.length > 0) {
      anomaliesList.push({
        title: "Lỗi tải báo cáo sức khỏe",
        desc: `Ghi nhận ${uploadAnomalies.length} lần tải lên tệp không đúng định dạng quy chuẩn.`,
        severity: "medium"
      });
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
        const scaleNames = { Hs: "Nghi bệnh", D: "Trầm cảm", Hy: "Hysteria", Pd: "Sai lệch nhân cách", Mf: "Nam/Nữ tính", Pa: "Hoang tưởng", Pt: "Suy nhược tâm thần", Sc: "Tâm thần phân liệt", Ma: "Hưng cảm nhẹ", Si: "Hướng ngoại xã hội" };
        const list = elevatedScales.map(s => `${scaleNames[s.code] || s.code} (${s.score} T-score)`);
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
        desc: `Phát hiện các từ khóa áp lực/căng thẳng trong tin nhắn: "${lastAnomaly.text}" (Từ khóa: ${lastAnomaly.triggers ? lastAnomaly.triggers.join(", ") : "stress"}).`,
        severity: "medium"
      });
    }

    let rec = "";
    if (anomaliesList.some(a => a.severity === "high")) {
      rec = "Chỉ số sức khỏe tinh thần của cậu đang có dấu hiệu bất ổn lâm sàng nghiêm trọng. Tớ khuyến nghị cậu nên giảm bớt cường độ bài vở/công việc, thực hành thở sâu 4-7-8 mỗi đêm và trò chuyện thường xuyên hơn với tớ. Nếu cảm xúc này kéo dài liên tục trên 2 tuần, hãy liên hệ trực tiếp với chuyên viên tư vấn tâm lý hoặc phòng y tế để được hỗ trợ kịp thời nhé.";
    } else if (anomaliesList.length > 0) {
      rec = "Tớ nhận thấy một vài căng thẳng nhẹ và sự mất cân bằng trong sinh hoạt của cậu. Cậu hãy dành thêm thời gian nghỉ ngơi, ngủ đủ giấc và tiếp tục chia sẻ nỗi lòng cùng tớ mỗi khi mệt mỏi nhé.";
    } else {
      rec = "Cảm xúc và chỉ số sinh hoạt của cậu dạo gần đây cực kỳ tốt và cân bằng ổn định. Hãy tiếp tục duy trì năng lượng tích cực này, hít thở điều hòa và trò chuyện cùng tớ khi cần nhé!";
    }

    return { anomalies: anomaliesList, recommendation: rec };
  }, [historyLogs]);

  const { anomalies, recommendation } = getMedicalEvaluation;
  const hasAnomalies = anomalies.length > 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 text-left animate-fadeIn bg-transparent">
      {/* Overview Recommendations */}
      <div className="p-5 rounded-xl border bg-white dark:bg-[#1a1924] border-zinc-250/50 dark:border-zinc-800/60 shadow-sm space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-xl"></div>
        <div className="flex items-center gap-2 pl-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">Tổng Quan Đánh Giá & Khuyến Nghị</h4>
        </div>
        <p className="pl-2 text-[11px] text-zinc-600 dark:text-zinc-350 leading-relaxed font-bold">
          {recommendation}
        </p>
      </div>

      {/* Comparative Progress Table */}
      {(() => {
        const dassTests = historyLogs.filter(l => l.test === "dass42");
        const mmpiTests = historyLogs.filter(l => l.test === "mmpi30");
        const phq9Tests = historyLogs.filter(l => l.test === "phq9");
        const gad7Tests = historyLogs.filter(l => l.test === "gad7");
        const who5Tests = historyLogs.filter(l => l.test === "who5");

        const hasAnyTests = dassTests.length > 0 || mmpiTests.length > 0 || phq9Tests.length > 0 || gad7Tests.length > 0 || who5Tests.length > 0;
        if (!hasAnyTests) return null;

        const getDassComp = () => {
          if (dassTests.length < 2) return null;
          return { initial: dassTests[0], current: dassTests[dassTests.length - 1] };
        };
        const getMmpiComp = () => {
          if (mmpiTests.length < 2) return null;
          return {
            initialElev: mmpiTests[0].clinical ? mmpiTests[0].clinical.filter(c => c.score >= 70).length : 0,
            currentElev: mmpiTests[mmpiTests.length - 1].clinical ? mmpiTests[mmpiTests.length - 1].clinical.filter(c => c.score >= 70).length : 0
          };
        };

        const dassComp = getDassComp();
        const mmpiComp = getMmpiComp();

        return (
          <div className="p-5 rounded-xl border bg-white dark:bg-[#1a1924] border-zinc-250/50 dark:border-zinc-800/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
              <TrendingDown className="w-5 h-5 text-emerald-500" />
              <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">Lịch Sử & So Sánh Kết Quả Tham Vấn</h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[8.5px] font-black uppercase text-zinc-450 tracking-wider text-left">
                    <th className="py-2.5">Thang Đo Lâm Sàng</th>
                    <th className="py-2.5">Chỉ Số Đầu Tiên</th>
                    <th className="py-2.5">Chỉ Số Hiện Tại</th>
                    <th className="py-2.5">Biến Thiên</th>
                    <th className="py-2.5">Nhận Định Tiến Trình</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 font-bold">
                  {dassComp && (
                    <>
                      <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">DASS-42: Trầm Cảm</td>
                        <td className="py-3 text-zinc-500">{dassComp.initial.scores.D} điểm</td>
                        <td className="py-3 text-zinc-800 dark:text-zinc-100">{dassComp.current.scores.D} điểm</td>
                        <td className={`py-3 ${dassComp.current.scores.D - dassComp.initial.scores.D < 0 ? "text-emerald-500" : dassComp.current.scores.D - dassComp.initial.scores.D > 0 ? "text-red-500" : "text-zinc-500"}`}>
                          {dassComp.current.scores.D - dassComp.initial.scores.D < 0 ? `${dassComp.current.scores.D - dassComp.initial.scores.D}đ` : dassComp.current.scores.D - dassComp.initial.scores.D > 0 ? `+${dassComp.current.scores.D - dassComp.initial.scores.D}đ` : "0đ"}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${dassComp.current.scores.D - dassComp.initial.scores.D < 0 ? "bg-emerald-500/10 text-emerald-600" : dassComp.current.scores.D - dassComp.initial.scores.D > 0 ? "bg-red-500/10 text-red-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                            {dassComp.current.scores.D - dassComp.initial.scores.D < 0 ? "Tiến bộ" : dassComp.current.scores.D - dassComp.initial.scores.D > 0 ? "Bất thường" : "Ổn định"}
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                  {mmpiComp && (
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">Mini-MMPI: Vượt ngưỡng</td>
                      <td className="py-3 text-zinc-500">{mmpiComp.initialElev}/10 thang</td>
                      <td className="py-3 text-zinc-800 dark:text-zinc-100">{mmpiComp.currentElev}/10 thang</td>
                      <td className={`py-3 ${mmpiComp.currentElev - mmpiComp.initialElev < 0 ? "text-emerald-500" : mmpiComp.currentElev - mmpiComp.initialElev > 0 ? "text-red-500" : "text-zinc-500"}`}>
                        {mmpiComp.currentElev - mmpiComp.initialElev < 0 ? `${mmpiComp.currentElev - mmpiComp.initialElev}` : mmpiComp.currentElev - mmpiComp.initialElev > 0 ? `+${mmpiComp.currentElev - mmpiComp.initialElev}` : "0"}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${mmpiComp.currentElev - mmpiComp.initialElev < 0 ? "bg-emerald-500/10 text-emerald-600" : mmpiComp.currentElev - mmpiComp.initialElev > 0 ? "bg-red-500/10 text-red-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                          {mmpiComp.currentElev - mmpiComp.initialElev < 0 ? "Tiến bộ" : mmpiComp.currentElev - mmpiComp.initialElev > 0 ? "Bất thường" : "Ổn định"}
                        </span>
                      </td>
                    </tr>
                  )}
                  {phq9Tests.length > 1 && (() => {
                    const initial = phq9Tests[0];
                    const current = phq9Tests[phq9Tests.length - 1];
                    const diff = current.score - initial.score;
                    return (
                      <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">PHQ-9: Trầm Cảm</td>
                        <td className="py-3 text-zinc-500">{initial.score} điểm</td>
                        <td className="py-3 text-zinc-800 dark:text-zinc-100">{current.score} điểm</td>
                        <td className={`py-3 ${diff < 0 ? "text-emerald-500" : diff > 0 ? "text-red-500" : "text-zinc-500"}`}>
                          {diff < 0 ? `${diff}đ` : diff > 0 ? `+${diff}đ` : "0đ"}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${diff < 0 ? "bg-emerald-500/10 text-emerald-600" : diff > 0 ? "bg-red-500/10 text-red-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                            {diff < 0 ? "Tiến bộ" : diff > 0 ? "Bất thường" : "Ổn định"}
                          </span>
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Anomalies List */}
      {hasAnomalies && (
        <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/10 space-y-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
            <h4 className="text-sm font-black uppercase tracking-wider">Cảnh Báo Biến Động Bất Thường</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {anomalies.map((a, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${a.severity === 'high' ? 'border-red-500/30 bg-red-500/10' : 'border-amber-500/20 bg-amber-500/5'} shadow-sm space-y-2`}>
                <span className={`text-[10px] font-black uppercase tracking-wider ${a.severity === 'high' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {a.title}
                </span>
                <p className="text-[10px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">
                  {a.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual chronological timeline */}
      <div className="p-5 rounded-xl border bg-white dark:bg-[#1a1924] border-zinc-250/50 dark:border-zinc-800/60 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">Lịch Sử Điều Trị & Phân Tích</h4>
        </div>

        {historyLogs.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-[11px] font-bold">
            Chưa ghi nhận hoạt động trị liệu hoặc kiểm tra nào.
          </div>
        ) : (
          <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 space-y-8 py-2">
            {[...historyLogs].reverse().map((log, idx) => {
              let title = "Hoạt động trị liệu";
              let color = "bg-indigo-500 border-indigo-200";
              let desc = log.reason || log.desc || "";

              if (log.type === "checkin") {
                title = `Check-in cảm xúc`;
                color = "bg-emerald-500 border-emerald-200";
                desc = `Đánh giá tâm trạng: ${
                  log.mood === 5 ? "Rất tốt" : log.mood === 4 ? "Tốt" : log.mood === 3 ? "Bình thường" : log.mood === 2 ? "Mỏi mệt" : "Kiệt sức"
                }. ${log.note ? `Ghi chú: "${log.note}"` : ""}`;
              } else if (log.test) {
                title = `Thực hiện test ${log.test.toUpperCase()}`;
                color = "bg-blue-500 border-blue-200";
                if (log.test === "dass42") {
                  desc = `Kết quả: Trầm cảm ${log.scores.D}/42, Lo âu ${log.scores.A}/42, Căng thẳng ${log.scores.S}/42. Đánh giá: ${log.severities.D}`;
                } else if (log.test === "mmpi30") {
                  const elev = log.clinical ? log.clinical.filter(c => c.score >= 70).length : 0;
                  desc = `Kiểm tra Mini-MMPI: ${elev}/10 thang đo vượt ngưỡng thích ứng lâm sàng.`;
                } else {
                  desc = `Điểm số đánh giá: ${log.score} điểm.`;
                }
              } else if (log.type === "duration_change") {
                title = "Kích hoạt Đồng Hành";
                color = "bg-amber-500 border-amber-200";
                desc = log.reason || "";
              }

              return (
                <div key={idx} className="relative pl-8">
                  {/* Timeline dot */}
                  <div className={`absolute left-[-9px] top-1.5 w-4 h-4 rounded-full border-[3px] ${color} z-10 shadow-sm`} />
                  
                  <div className="space-y-2 p-4 rounded-xl border border-zinc-150/70 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-black/20 hover:border-indigo-500/30 transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">{title}</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-zinc-450 font-bold bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-md shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDateTime(log.date)}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-350 font-bold leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
