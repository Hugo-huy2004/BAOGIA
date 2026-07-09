import React, { useState } from "react";
import { Award, Mail, Star, Users, Check, Gift } from "lucide-react";
import { notify } from "../../../lib/notify";
import { useJoyStore } from "../../../stores/joyStore";

export default function CertificateModal({ open, bio, onClose, certType, onBioUpdate }) {
  if (!open) return null;

  const [claiming, setClaiming] = useState(false);
  const [awardClaimed, setAwardClaimed] = useState(bio?.courseCompletionAwardClaimed || false);

  const getCertificateId = () => {
    if (!bio?.email) return "HGC-TEMP-00000";
    let hash = 0;
    for (let i = 0; i < bio.email.length; i++) {
      hash = bio.email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idNum = Math.abs(hash) % 100000;
    const prefix = certType === "advanced" ? "HGA" : "HGI";
    return `${prefix}-${String(idNum).padStart(5, "0")}`;
  };

  // Retrieve exam scores from localStorage (fall back to 100 if completed but score not saved)
  const score4 = Number(localStorage.getItem("student_ide_score_lesson4") || 85);
  const score25 = Number(localStorage.getItem("student_ide_score_lesson25") || 90);
  const score50 = Number(localStorage.getItem("student_ide_score_lesson50") || 80);

  const averageScore = Math.round((score4 + score25 + score50) / 3);

  const getClassification = (avg) => {
    if (avg >= 90) return "Xuất Sắc (Excellent)";
    if (avg >= 80) return "Giỏi (Very Good)";
    if (avg >= 65) return "Khá (Good)";
    if (avg >= 60) return "Đạt (Pass)";
    return "Trung bình";
  };

  const classification = getClassification(averageScore);

  const handleClaimAward = async () => {
    setClaiming(true);
    try {
      const token = localStorage.getItem("token") || ""; // get token
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const r = await fetch(`${apiBase}/joy/award-course-completion`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(resData.error || `API failed with status ${r.status}`);
      }
      
      // Success!
      import("canvas-confetti").then((module) => {
        const conf = module.default || module;
        conf({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      });

      notify.success("Chúc mừng! Bạn đã nhận phần thưởng +10,000 JOY tốt nghiệp!");
      setAwardClaimed(true);
      if (bio?.email) {
        useJoyStore.getState().fetchBalance(bio.email);
      }
      if (onBioUpdate) {
        onBioUpdate({ courseCompletionAwardClaimed: true, joyBalance: resData.balance });
      }
    } catch (e) {
      console.error(e);
      notify.error(e.message || "Lỗi khi nhận thưởng, vui lòng thử lại.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-amber-500/35 rounded-3xl shadow-2xl overflow-hidden p-5 md:p-8 text-center text-zinc-100 max-h-[95vh] overflow-y-auto font-sans">
        
        {/* Double-border framing */}
        <div className="border-2 border-double border-amber-500/25 p-4 md:p-6 rounded-2xl relative bg-zinc-950">
          
          {/* Corner Ornaments */}
          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-500/50" />
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-500/50" />
          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-500/50" />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-500/50" />

          {/* Certificate Seal Decoration */}
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg border border-amber-300 relative">
              <Award className="w-8 h-8 text-zinc-950" />
              <div className="absolute -inset-1 rounded-full border border-amber-400/30 animate-ping opacity-25" />
            </div>
          </div>

          {/* Headings */}
          <h2 className="text-base md:text-xl font-serif font-black text-amber-400 tracking-wider uppercase">
            {certType === "advanced" 
              ? "CHỨNG CHỈ TỐT NGHIỆP HUGOCODER CAO CẤP" 
              : "CHỨNG CHỈ HOÀN THÀNH KHÓA HỌC TRUNG CẤP"}
          </h2>
          <p className="text-zinc-500 text-[9px] tracking-widest uppercase mt-0.5 font-bold">
            Hugo Studio Academic Board
          </p>

          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mx-auto my-3" />

          <p className="text-[11px] text-zinc-400 font-medium italic">
            Chứng nhận thành tích học tập xuất sắc trao tặng cho
          </p>

          {/* Student Name */}
          <h3 className="text-lg md:text-xl font-black text-amber-200 mt-1 tracking-wide truncate">
            {bio?.displayName || bio?.email || "Học viên Hugo Studio"}
          </h3>

          {/* Body content depending on cert type */}
          {certType === "intermediate" ? (
            <div className="space-y-4">
              <p className="text-[11px] text-zinc-400 max-w-md mx-auto mt-2 leading-relaxed font-sans">
                đã hoàn thành xuất sắc chặng <strong>HugoCoder Trung Cấp Nâng Cao (Bài 11-25)</strong>, nắm vững kiến thức về thiết kế RESTful API, quản trị định dạng dữ liệu JSON, mô hình lập trình MVC, quan hệ nâng cao CSDL MySQL và các quy tắc tối ưu giao diện UI/UX chuẩn mực.
              </p>

              {/* Exam Scores table for intermediate */}
              <div className="max-w-xs mx-auto bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2 mt-3 text-left">
                <span className="text-[9px] font-black uppercase text-amber-500/80 tracking-wider block border-b border-zinc-800 pb-1.5">Kết quả bài thi học trình:</span>
                <div className="space-y-1.5 text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Thi cuối kỳ 1 (Bài 4):</span>
                    <span className="font-mono text-zinc-200 font-bold">{score4}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Thi cuối kỳ 2 (Bài 25):</span>
                    <span className="font-mono text-zinc-200 font-bold">{score25}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] text-zinc-400 max-w-md mx-auto mt-2 leading-relaxed font-sans">
                đã xuất sắc chinh phục toàn bộ 50 bài học thực chiến của lộ trình <strong>HugoCoder Advanced Engineering & Cryptography</strong>. Hoàn thành đầy đủ các thuật toán nâng cao, cấu trúc dữ liệu, mật mã học bảo mật hệ thống và SEO/PWAs hiệu năng cao.
              </p>

              {/* Advanced grading and average */}
              <div className="max-w-xs mx-auto bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2 mt-3 text-left">
                <span className="text-[9px] font-black uppercase text-amber-500/80 tracking-wider block border-b border-zinc-800 pb-1.5">Xếp loại & Điểm số toàn khóa:</span>
                <div className="space-y-1.5 text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Điểm trung bình (GPA):</span>
                    <span className="font-mono text-amber-400 font-black">{averageScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Xếp hạng học lực:</span>
                    <span className="font-bold text-zinc-200">{classification}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invitation block to join HugoDev Team (Non-profit) */}
          <div className="mt-4 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-xl p-4 text-left space-y-2.5">
            <h4 className="text-[11px] font-black uppercase text-primary flex items-center gap-1.5 tracking-wider">
              <Users className="w-3.5 h-3.5" />
              Thư mời tham gia HugoTeam Developer Community
            </h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              Trân trọng kính mời bạn gia nhập đội ngũ nhà phát triển <strong>HugoTeam</strong>. Cùng nhau, chúng ta sẽ bắt tay thiết kế và xây dựng các dự án công nghệ phi lợi nhuận có giá trị thực tiễn cho cộng đồng, rèn luyện kỹ năng làm việc nhóm thực tế.
            </p>
          </div>

          {/* Advanced Only Claimable Reward Section */}
          {certType === "advanced" && (
            <div className="mt-4 border border-dashed border-amber-500/30 rounded-xl p-4 bg-amber-500/5 text-left space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1.5 tracking-wider">
                    <Gift className="w-4 h-4" />
                    Phần thưởng tốt nghiệp xuất sắc
                  </h4>
                  <p className="text-[9.5px] text-zinc-400 mt-0.5 leading-normal">
                    Học viên tốt nghiệp toàn khóa với điểm số trung bình lớn hơn 60% nhận ngay phần thưởng khích lệ.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-400 block">+10,000 JOY</span>
                </div>
              </div>

              {averageScore >= 60 ? (
                awardClaimed ? (
                  <div className="w-full py-2 bg-zinc-800 text-zinc-400 rounded-lg text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5 text-success" /> Đã nhận thưởng thành công
                  </div>
                ) : (
                  <button
                    onClick={handleClaimAward}
                    disabled={claiming}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:scale-[0.98] text-zinc-950 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 shadow"
                  >
                    {claiming ? "Đang xử lý..." : "Nhận 10,000 JOY thưởng tốt nghiệp"}
                  </button>
                )
              ) : (
                <div className="py-2 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] rounded-lg text-center font-bold">
                  Điểm trung bình cần đạt trên 60% để kích hoạt phần thưởng JOY.
                </div>
              )}
            </div>
          )}

          {/* Meta & ID */}
          <div className="grid grid-cols-2 gap-4 mt-5 text-left border-t border-zinc-900 pt-3.5 text-[9px] text-zinc-500 font-mono">
            <div>
              <span className="block uppercase font-bold tracking-wider">Mã chứng nhận:</span>
              <span className="font-bold text-amber-500/90">{getCertificateId()}</span>
            </div>
            <div className="text-right">
              <span className="block uppercase font-bold tracking-wider">Ngày cấp:</span>
              <span className="text-zinc-400 font-semibold">{new Date().toLocaleDateString("vi-VN")}</span>
            </div>
          </div>

          {/* Signature representation */}
          <div className="flex justify-center items-center gap-2 mt-4 text-[9px]">
            <div className="w-12 h-[1px] bg-zinc-800" />
            <span className="text-zinc-500 font-black italic tracking-widest uppercase">Hugo Studio Board</span>
            <div className="w-12 h-[1px] bg-zinc-800" />
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10"
          >
            <Award className="w-3.5 h-3.5" /> In chứng chỉ
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-xl text-xs transition-all"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
