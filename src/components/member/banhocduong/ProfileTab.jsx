import React from "react";
import { ShieldCheck, TrendingDown, TrendingUp, AlertTriangle, Clock, Calendar, CheckCircle, ArrowRight } from "lucide-react";

export default function ProfileTab({ historyLogs, bio }) {
  const dassTests = historyLogs.filter(l => l.test === "dass42");
  const mmpiTests = historyLogs.filter(l => l.test === "mmpi30");
  const phq9Tests = historyLogs.filter(l => l.test === "phq9");
  const gad7Tests = historyLogs.filter(l => l.test === "gad7");
  const who5Tests = historyLogs.filter(l => l.test === "who5");

  const totalTestsCount = dassTests.length + mmpiTests.length + phq9Tests.length + gad7Tests.length + who5Tests.length;

  const formatDateTime = (isoString) => {
    try {
      const d = new Date(isoString);
      const pad = (n) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return "Không xác định";
    }
  };

  const getDassCompare = () => {
    if (dassTests.length === 0) return null;
    const initial = dassTests[0];
    const current = dassTests[dassTests.length - 1];
    
    const getDiff = (key) => current.scores[key] - initial.scores[key];
    return {
      initial,
      current,
      diffD: getDiff("D"),
      diffA: getDiff("A"),
      diffS: getDiff("S")
    };
  };

  const getMmpiCompare = () => {
    if (mmpiTests.length === 0) return null;
    const initial = mmpiTests[0];
    const current = mmpiTests[mmpiTests.length - 1];

    const getElevated = (t) => t.clinical ? t.clinical.filter(c => c.score >= 70).length : 0;
    return {
      initial,
      current,
      initialElev: getElevated(initial),
      currentElev: getElevated(current)
    };
  };

  // Detect anomalies
  const anomalies = React.useMemo(() => {
    const list = [];
    const checkins = historyLogs.filter(l => l.type === "checkin");
    
    // Mood check
    const lowMoods = checkins.filter(c => c.mood <= 2);
    if (lowMoods.length > 0) {
      list.push({
        title: "Tâm trạng suy giảm kéo dài",
        desc: `Ghi nhận ${lowMoods.length} ngày cậu có tâm trạng mệt mỏi hoặc kiệt sức.`,
        type: "mood"
      });
    }

    // Sleep check (late activity)
    const lateNightEvents = historyLogs.filter(l => {
      if (!l.date) return false;
      const d = new Date(l.date);
      const hours = d.getHours();
      return hours >= 23 || hours < 5;
    });
    if (lateNightEvents.length > 0) {
      list.push({
        title: "Hoạt động khuya thường xuyên",
        desc: `Có ${lateNightEvents.length} lần hoạt động từ 23h - 5h sáng, nguy cơ rối loạn chu kỳ ngủ.`,
        type: "sleep"
      });
    }

    // Clinical DASS checks
    if (dassTests.length > 0) {
      const latest = dassTests[dassTests.length - 1];
      if (latest.scores && (latest.scores.D >= 21 || latest.scores.A >= 15 || latest.scores.S >= 26)) {
        list.push({
          title: "Chỉ số lâm sàng DASS vượt ngưỡng cao",
          desc: "Phát hiện chỉ số căng thẳng hoặc lo âu lâm sàng đạt mức nặng.",
          type: "clinical"
        });
      }
    }

    // Clinical MMPI checks
    if (mmpiTests.length > 0) {
      const latest = mmpiTests[mmpiTests.length - 1];
      const elevatedCount = latest.clinical ? latest.clinical.filter(c => c.score >= 70).length : 0;
      if (elevatedCount >= 3) {
        list.push({
          title: "Xu hướng hành vi vượt ngưỡng (MMPI)",
          desc: `Phát hiện ${elevatedCount} thang đo nhân cách vượt ngưỡng lâm sàng thích ứng (> 70 T-score).`,
          type: "clinical"
        });
      }
    }

    return list;
  }, [historyLogs]);

  const dassComp = getDassCompare();
  const mmpiComp = getMmpiCompare();

  return (
    <div className="p-4 sm:p-6 space-y-6 text-left animate-fadeIn">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border bg-white dark:bg-[#1a1924] border-zinc-250/50 dark:border-zinc-800/60 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase font-black block">Tổng số lượt đánh giá</span>
            <span className="text-lg font-black text-zinc-850 dark:text-white">{totalTestsCount} lần</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-[#1a1924] border-zinc-250/50 dark:border-zinc-800/60 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase font-black block">Biến thiên uất ức (PHQ-9)</span>
            <span className="text-lg font-black text-zinc-850 dark:text-white">
              {phq9Tests.length > 1 ? (
                (() => {
                  const diff = phq9Tests[phq9Tests.length - 1].score - phq9Tests[0].score;
                  return diff < 0 ? `${diff} điểm (Tốt hơn)` : diff > 0 ? `+${diff} điểm` : "Không đổi";
                })()
              ) : "Cần thêm lượt test"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-[#1a1924] border-zinc-250/50 dark:border-zinc-800/60 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase font-black block">Cảnh báo bất thường</span>
            <span className="text-lg font-black text-zinc-850 dark:text-white">{anomalies.length} cảnh báo</span>
          </div>
        </div>
      </div>

      {/* Comparisons Table */}
      <div className="p-5 rounded-2xl border bg-white dark:bg-[#1a1924] border-zinc-250/50 dark:border-zinc-800/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-500 text-lg font-black">compare_arrows</span>
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">Bảng Đánh Giá Trước & Sau Khi Trị Liệu</h4>
        </div>
        
        {totalTestsCount === 0 ? (
          <div className="text-center py-6 text-zinc-400 text-[10px] font-bold">
            Chưa có kết quả test lâm sàng nào. Hãy thực hiện test hoặc quét kết quả phòng khám để bắt đầu hồ sơ theo dõi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10.5px] border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[8.5px] font-black uppercase text-zinc-450 tracking-wider text-left">
                  <th className="py-2.5">Thang Đo Lâm Sàng</th>
                  <th className="py-2.5">Chỉ Số Đầu Tiên</th>
                  <th className="py-2.5">Chỉ Số Hiện Tại</th>
                  <th className="py-2.5">Biến Thiên (Trước vs Sau)</th>
                  <th className="py-2.5">Nhận Định Tiến Trình</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 font-bold">
                {dassComp && (
                  <>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">DASS-42: Trầm Cảm (D)</td>
                      <td className="py-3 text-zinc-500">{dassComp.initial.scores.D} điểm</td>
                      <td className="py-3 text-zinc-800 dark:text-zinc-100">{dassComp.current.scores.D} điểm</td>
                      <td className={`py-3 ${dassComp.diffD < 0 ? "text-emerald-500" : dassComp.diffD > 0 ? "text-red-500" : "text-zinc-500"}`}>
                        {dassComp.diffD < 0 ? `${dassComp.diffD}đ` : dassComp.diffD > 0 ? `+${dassComp.diffD}đ` : "0đ"}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${dassComp.diffD < 0 ? "bg-emerald-500/10 text-emerald-600" : dassComp.diffD > 0 ? "bg-red-500/10 text-red-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                          {dassComp.diffD < 0 ? "Tiến bộ" : dassComp.diffD > 0 ? "Bất thường" : "Ổn định"}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">DASS-42: Lo Âu (A)</td>
                      <td className="py-3 text-zinc-500">{dassComp.initial.scores.A} điểm</td>
                      <td className="py-3 text-zinc-800 dark:text-zinc-100">{dassComp.current.scores.A} điểm</td>
                      <td className={`py-3 ${dassComp.diffA < 0 ? "text-emerald-500" : dassComp.diffA > 0 ? "text-red-500" : "text-zinc-500"}`}>
                        {dassComp.diffA < 0 ? `${dassComp.diffA}đ` : dassComp.diffA > 0 ? `+${dassComp.diffA}đ` : "0đ"}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${dassComp.diffA < 0 ? "bg-emerald-500/10 text-emerald-600" : dassComp.diffA > 0 ? "bg-red-500/10 text-red-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                          {dassComp.diffA < 0 ? "Tiến bộ" : dassComp.diffA > 0 ? "Bất thường" : "Ổn định"}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">DASS-42: Căng Thẳng (S)</td>
                      <td className="py-3 text-zinc-500">{dassComp.initial.scores.S} điểm</td>
                      <td className="py-3 text-zinc-800 dark:text-zinc-100">{dassComp.current.scores.S} điểm</td>
                      <td className={`py-3 ${dassComp.diffS < 0 ? "text-emerald-500" : dassComp.diffS > 0 ? "text-red-500" : "text-zinc-500"}`}>
                        {dassComp.diffS < 0 ? `${dassComp.diffS}đ` : dassComp.diffS > 0 ? `+${dassComp.diffS}đ` : "0đ"}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${dassComp.diffS < 0 ? "bg-emerald-500/10 text-emerald-600" : dassComp.diffS > 0 ? "bg-red-500/10 text-red-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                          {dassComp.diffS < 0 ? "Tiến bộ" : dassComp.diffS > 0 ? "Bất thường" : "Ổn định"}
                        </span>
                      </td>
                    </tr>
                  </>
                )}

                {mmpiComp && (
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">Mini-MMPI: Số thang đo vượt ngưỡng</td>
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

                {phq9Tests.length > 0 && (() => {
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

                {gad7Tests.length > 0 && (() => {
                  const initial = gad7Tests[0];
                  const current = gad7Tests[gad7Tests.length - 1];
                  const diff = current.score - initial.score;
                  return (
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">GAD-7: Lo Âu</td>
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

                {who5Tests.length > 0 && (() => {
                  const initial = who5Tests[0];
                  const current = who5Tests[who5Tests.length - 1];
                  const diff = (current.score * 4) - (initial.score * 4);
                  return (
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">WHO-5: Chỉ số hạnh phúc (đạt %)</td>
                      <td className="py-3 text-zinc-500">{initial.score * 4}%</td>
                      <td className="py-3 text-zinc-800 dark:text-zinc-100">{current.score * 4}%</td>
                      <td className={`py-3 ${diff > 0 ? "text-emerald-500" : diff < 0 ? "text-red-500" : "text-zinc-500"}`}>
                        {diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : "0%"}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${diff > 0 ? "bg-emerald-500/10 text-emerald-600" : diff < 0 ? "bg-red-500/10 text-red-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                          {diff > 0 ? "Tiến bộ" : diff < 0 ? "Bất thường" : "Ổn định"}
                        </span>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warning/Abnormalities section */}
      {anomalies.length > 0 && (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/10 space-y-3">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h4 className="text-xs font-black uppercase tracking-wider">Cảnh Báo Biến Động Bất Thường Phát Hiện</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {anomalies.map((a, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-red-500/10 bg-white/40 dark:bg-[#1a1924]/40 space-y-1.5 shadow-sm">
                <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider">{a.title}</span>
                <p className="text-[9.5px] text-zinc-650 dark:text-zinc-400 leading-relaxed font-bold">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual chronological timeline */}
      <div className="p-5 rounded-2xl border bg-white dark:bg-[#1a1924] border-zinc-250/50 dark:border-zinc-800/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">Dòng Thời Gian Lịch Sử Điều Trị & Phân Tích</h4>
        </div>

        {historyLogs.length === 0 ? (
          <div className="text-center py-6 text-zinc-400 text-[10px] font-bold">
            Chưa ghi nhận hoạt động trị liệu hoặc kiểm tra nào.
          </div>
        ) : (
          <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-3.5 space-y-6 py-2">
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
                <div key={idx} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className={`absolute left-[-6.5px] top-1.5 w-3 h-3 rounded-full border-2 ${color} z-10`} />
                  
                  <div className="space-y-1.5 p-3 rounded-xl border border-zinc-150/70 dark:border-zinc-800/40 bg-zinc-50/20 dark:bg-black/5 hover:border-indigo-500/20 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">{title}</span>
                      <div className="flex items-center gap-1 text-[8.5px] text-zinc-400 font-bold">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDateTime(log.date)}</span>
                      </div>
                    </div>
                    <p className="text-[9.5px] text-zinc-550 dark:text-zinc-400 font-bold leading-relaxed">{desc}</p>
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
