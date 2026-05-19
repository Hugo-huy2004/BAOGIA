import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function FAQPage() {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [floatingElements, setFloatingElements] = useState([]);

  useEffect(() => {
    // Generate random floating elements
    const elements = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 15 + Math.random() * 10
    }));
    setFloatingElements(elements);
  }, []);

  const faqs = [
    {
      question: "Hugo Studio có giờ làm việc không?",
      answer: "Hugo Studio là cung cấp dịch vụ cá nhân và trực tiếp 1:1 với khách hàng, nên không có thời gian cố định, nên các bạn cứ thoải mái gửi ping pong tin nhắn đến Hugo Studio nha!",
      icon: "schedule",
      color: "from-amber-500 to-orange-500"
    },
    {
      question: "Hugo Studio hiện team có nhiều thành viên không?",
      answer: "Chúng tớ chỉ có 2 thành viên là Hugo Wishpax Lê và Jason Phan đang cùng một team full-stack để mang đến trải nghiệm tối ưu cho các bạn.",
      icon: "people",
      color: "from-emerald-500 to-teal-500"
    },
    {
      question: "Có dịch vụ nào được trải nghiệm thử tại Hugo Studio không?",
      answer: "Do đang là sinh viên, nên tớ biết các bạn nhà sỉ tử của chúng mình rất mong mỏi có được một trang giới thiệu về bản thân mình. Chính vì thế, Hugo Studio đang cung cấp dịch vụ tạo Bio miễn phí bao gồm tên miền đọc quyền dành cho các bạn có mail .edu. Hãy vào trang Đăng Nhập và trải nghiệm với Hugo Studio nha.",
      icon: "card_giftcard",
      color: "from-pink-500 to-rose-500"
    },
    {
      question: "Chi phí của Hugo Studio thế nào?",
      answer: "Rất rẻ, và kết quả hơn với những gì các bạn mong đợi.",
      icon: "price_check",
      color: "from-cyan-500 to-blue-500"
    },
    {
      question: "Ngày lễ, Hugo Studio có nghỉ không?",
      answer: "Các bạn cứ an tâm nha, khi nào nghỉ, chúng mình sẽ có một thông báo trên trang, mà đa số chúng tớ đang đi du lịch đấy.",
      icon: "beach_access",
      color: "from-violet-500 to-purple-500"
    }
  ];

  const toggleExpand = (idx) => {
    setExpandedIdx(expandedIdx === idx ? null : idx);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black dark:from-[#0b0a0f] dark:via-slate-950 dark:to-black relative overflow-hidden pt-20 pb-16">
      {/* Animated background glows */}
      <style>{`
        @keyframes float-x {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(30px) translateY(-30px); }
        }
        @keyframes float-y {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float-x {
          animation: float-x 6s ease-in-out infinite;
        }
        .animate-float-y {
          animation: float-y 8s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 1000px 100%;
        }
        .gradient-animated {
          background-size: 400% 400%;
          animation: gradient-shift 8s ease infinite;
        }
      `}</style>

      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[#6366f1]/20 blur-3xl animate-pulse-glow" />
      <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-[#0ea5e9]/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-[#fbbf24]/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />

      {/* Floating animated elements */}
      {floatingElements.map((el) => (
        <div
          key={el.id}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] opacity-30 animate-float-y pointer-events-none"
          style={{
            left: `${el.left}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-y ${el.duration}s ease-in-out infinite`,
            animationDelay: `${el.delay}s`
          }}
        />
      ))}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-0 relative z-10">
        {/* Animated Header Section */}
        <div className="text-center space-y-4 sm:space-y-6 mb-16 md:mb-20">
          {/* Top badge with shimmer */}
          <div className="inline-block animate-shimmer">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#6366f1]/20 via-[#0ea5e9]/20 to-[#fbbf24]/20 text-[#6366f1] border border-[#6366f1]/40 backdrop-blur-sm">
              ✦ Câu Hỏi Thường Gặp
            </span>
          </div>

          {/* Main heading with gradient animation */}
          <div className="space-y-2">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
              <span className="text-white">Giải Đáp</span>
              <br />
              <span className="bg-gradient-to-r from-[#6366f1] via-[#0ea5e9] via-[#fbbf24] to-[#ec4899] bg-clip-text text-transparent bg-[length:200%_auto] gradient-animated">
                Những Thắc Mắc
              </span>
            </h1>
          </div>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Có bất kỳ câu hỏi gì về Hugo Studio? Chúng tớ đây sẵn sàng giúp bạn! 😊
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* FAQ Items */}
          <div className="lg:col-span-2 space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                onClick={() => toggleExpand(idx)}
                className="group cursor-pointer"
              >
                {/* Question Card with hover effects */}
                <div className="relative bg-white/5 dark:bg-white/8 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 dark:hover:bg-white/12 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#6366f1]/10 overflow-hidden">
                  {/* Hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/0 to-[#0ea5e9]/0 group-hover:from-[#6366f1]/5 group-hover:to-[#0ea5e9]/5 transition-all duration-300 pointer-events-none" />
                  
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#6366f1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Icon with animated background */}
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${faq.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                        <span className="material-symbols-outlined text-2xl text-white">
                          {faq.icon}
                        </span>
                      </div>
                      
                      {/* Question Text */}
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-display text-lg sm:text-xl font-bold text-white leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#6366f1] group-hover:to-[#0ea5e9] group-hover:bg-clip-text transition-all duration-300">
                          {faq.question}
                        </h3>
                      </div>
                    </div>

                    {/* Animated expand icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      expandedIdx === idx 
                        ? `bg-gradient-to-br ${faq.color} shadow-lg` 
                        : "bg-white/10 group-hover:bg-white/20"
                    }`}>
                      <span className={`material-symbols-outlined text-xl transition-all duration-300 ${
                        expandedIdx === idx ? "text-white rotate-180" : "text-slate-400 group-hover:text-white"
                      }`}>
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Answer Section - Smooth expandable */}
                <div className={`overflow-hidden transition-all duration-500 ease-out ${
                  expandedIdx === idx ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                }`}>
                  <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 ml-6 sm:ml-10 shadow-xl">
                    {/* Animated left border */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#6366f1] via-[#0ea5e9] to-[#fbbf24]" />
                    
                    <p className="text-slate-200 leading-relaxed text-base relative pl-4">
                      {faq.answer}
                    </p>
                    
                    {/* Special CTA */}
                    {idx === 2 && (
                      <Link 
                        to="/login"
                        className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] text-white font-semibold text-sm hover:scale-105 hover:shadow-lg hover:shadow-[#6366f1]/20 transition-all duration-300 group/btn relative overflow-hidden"
                      >
                        <span className="relative z-10">Đăng Nhập Ngay</span>
                        <span className="material-symbols-outlined text-sm relative z-10 group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0ea5e9] to-[#6366f1] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Illustration Side - Right Column */}
          <div className="lg:col-span-1 flex justify-center lg:justify-end mt-12 lg:mt-0">
            <div className="relative w-full max-w-xs">
              {/* Multi-layer decorative background */}
              <div className="absolute -inset-8 bg-gradient-to-r from-[#6366f1]/20 via-[#0ea5e9]/20 to-[#fbbf24]/20 rounded-3xl blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Main image card with premium styling */}
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden group hover:shadow-[0_20px_60px_rgba(99,102,241,0.3)] transition-all duration-500">
                {/* Animated overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#6366f1]/0 via-transparent to-[#0ea5e9]/0 group-hover:from-[#6366f1]/10 group-hover:to-[#0ea5e9]/10 transition-all duration-500 pointer-events-none" />
                
                {/* Image with frame */}
                <div className="relative overflow-hidden rounded-2xl aspect-square mb-6 border border-white/20">
                  <img
                    src="/image/avt5.png"
                    alt="Hugo Studio Team"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Image overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#6366f1]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Text section with animation */}
                <div className="relative z-10 text-center space-y-3">
                  <h3 className="font-display text-2xl font-bold text-white">
                    Đội Ngũ
                    <br />
                    <span className="bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] bg-clip-text text-transparent">
                      Hugo Studio
                    </span>
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Sẵn sàng giúp bạn mang ý tưởng thành hiện thực 🚀
                  </p>
                  
                  {/* Animated badges */}
                  <div className="flex flex-wrap gap-2 justify-center pt-4">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-colors duration-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Available
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition-colors duration-300">
                      <span className="material-symbols-outlined text-xs">favorite</span>
                      Passionate
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </main>
  );
}
