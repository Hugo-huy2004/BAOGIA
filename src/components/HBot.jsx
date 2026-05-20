import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const QUESTION_TREE = {
  main: {
    text: "Xin chào cậu nha! Tớ là Bé Huy Chibi, trợ lý nhỏ siêu cute của Hugo Studio đây ạ. Cậu cần tớ hỗ trợ việc gì trong hệ thống thế nè?",
    options: [
      { label: "Hướng dẫn tính năng trong Member Portal", next: "portal_features" },
      { label: "Tìm hiểu thông tin và dịch vụ Hugo Studio", next: "about_hugo" },
      { label: "Kết nối trực tiếp với Admin", next: "live_support" }
    ]
  },
  portal_features: {
    text: "Cậu muốn tìm hiểu tính năng nào của Member Portal nè? Bảo tớ tớ chỉ cho nha!",
    options: [
      { label: "Hướng dẫn thiết kế trang Bio Link", next: "bio_link" },
      { label: "Hướng dẫn quản lý lịch đặt hẹn", next: "booking" },
      { label: "Hướng dẫn nâng cấp gói dịch vụ", next: "packages" },
      { label: "Hướng dẫn tích hợp Iframe đối tác", next: "partners" },
      { label: "Quay lại Menu chính", next: "main" }
    ]
  },
  bio_link: {
    text: "Để làm một trang Bio Link siêu chất, cậu hãy vào mục **Bio Editor** trong Member Portal nha. Ở đó cậu tha hồ chỉnh sửa thông tin cá nhân và chỉnh giao diện trong tab **Theme** theo style của riêng cậu nè.",
    options: [
      { label: "Cách thay đổi giao diện và Theme", next: "theme" },
      { label: "Cách cập nhật thông số đo chiều cao", next: "measurements" },
      { label: "Quay lại mục trước", next: "portal_features" },
      { label: "Quay lại Menu chính", next: "main" }
    ]
  },
  theme: {
    text: "Trong tab **Theme** ở mục **Bio Editor**, cậu có thể chọn 4 mẫu theme cực xịn gồm **Flat, Brutalism, Neo-brutalism, Glassmorphism**. Cậu còn đổi được màu nền, bo góc nút từ **0px đến 24px**, viền nút và bóng đổ nữa đó nha.",
    options: [
      { label: "Quay lại Menu chính", next: "main" },
      { label: "Yêu cầu gặp trực tiếp nhân viên hỗ trợ", next: "live_support" }
    ]
  },
  measurements: {
    text: "Hugo Studio có tính năng siêu đặc biệt dành cho KOL và Model nè! Cậu chỉ cần vào **Bio Editor** -> chọn **Thông số cơ bản** là điền được chiều cao, cân nặng, số đo ba vòng ngực-eo-mông và kỹ năng để làm portfolio nổi bật luôn.",
    options: [
      { label: "Quay lại Menu chính", next: "main" },
      { label: "Yêu cầu gặp trực tiếp nhân viên hỗ trợ", next: "live_support" }
    ]
  },
  booking: {
    text: "Khách hàng khi ghé thăm Bio Link của cậu chỉ cần bấm vào nút **Đăng ký lịch chụp/hẹn** là điền được thông tin đặt lịch. Lịch đặt của khách sẽ tự động đồng bộ ngay lập tức về tab **Quản lý lịch hẹn** trong Member Portal của cậu luôn đó, tiện cực kỳ nha.",
    options: [
      { label: "Xem lịch đặt hẹn ở đâu", next: "view_booking" },
      { label: "Quay lại Menu chính", next: "main" },
      { label: "Yêu cầu gặp trực tiếp nhân viên hỗ trợ", next: "live_support" }
    ]
  },
  view_booking: {
    text: "Cậu vào mục **Quản lý lịch hẹn** trong Member Portal là thấy ngay danh sách khách đăng ký nha. Ở đó hiển thị sẵn số Zalo và Email của khách để cậu liên hệ hẹn lịch chụp nhanh chóng nè.",
    options: [
      { label: "Quay lại Menu chính", next: "main" },
      { label: "Yêu cầu gặp trực tiếp nhân viên hỗ trợ", next: "live_support" }
    ]
  },
  packages: {
    text: "Hệ thống bên tớ có 3 gói siêu xịn: **Free Bio, Bio Plus và Bio VIP**. Hai gói trả phí Plus và VIP sẽ giúp cậu mở khóa toàn bộ theme cao cấp và ẩn sạch quảng cáo luôn nè. Khi Admin cấp gói, thời hạn dùng sẽ tự động cộng thêm vào tài khoản của cậu nhé.",
    options: [
      { label: "Làm sao để nâng cấp gói", next: "upgrade" },
      { label: "Quay lại Menu chính", next: "main" }
    ]
  },
  upgrade: {
    text: "Hiện tại quy trình kích hoạt gói Plus và VIP được duyệt thủ công bởi Admin hệ thống. Cậu hãy nhấn nút **Gửi yêu cầu** bên dưới để gửi thông tin cho Admin hỗ trợ kích hoạt gói cho cậu nha.",
    options: [
      { label: "Gửi yêu cầu nâng cấp gói dịch vụ", next: "live_support" },
      { label: "Quay lại Menu chính", next: "main" }
    ]
  },
  partners: {
    text: "Các đối tác liên kết muốn nhúng trình chỉnh sửa Bio Link của Hugo Studio lên trang web riêng của họ thì có thể sử dụng **Iframe URL** cùng khóa bảo mật do Admin cấp riêng trong **Admin Panel** nha.",
    options: [
      { label: "Quay lại Menu chính", next: "main" },
      { label: "Yêu cầu gặp trực tiếp nhân viên hỗ trợ", next: "live_support" }
    ]
  },
  about_hugo: {
    text: "Cậu muốn tìm hiểu thông tin nào về Hugo Studio tụi tớ nè?",
    options: [
      { label: "Hugo Studio là của ai", next: "who_is_hugo" },
      { label: "Hugo Studio cung cấp dịch vụ gì", next: "what_services" },
      { label: "Làm thế nào để hợp tác với Hugo Studio", next: "how_to_cooperate" },
      { label: "Quay lại Menu chính", next: "main" }
    ]
  },
  who_is_hugo: {
    text: "Hugo Studio được phát triển và vận hành bởi anh **Hugo Huy** đẹp trai cùng đội ngũ kỹ thuật hỗ trợ tận tình, luôn sẵn sàng đồng hành cùng cậu nè.",
    options: [
      { label: "Quay lại mục trước", next: "about_hugo" },
      { label: "Quay lại Menu chính", next: "main" }
    ]
  },
  what_services: {
    text: "Hugo Studio tụi tớ cung cấp công cụ **thiết kế trang Bio Link cá nhân**, nền tảng **quản lý lịch hẹn chụp ảnh cho KOL/Model**, gói tài khoản chuyên nghiệp và dịch vụ **tích hợp Iframe cho đối tác**.",
    options: [
      { label: "Quay lại mục trước", next: "about_hugo" },
      { label: "Quay lại Menu chính", next: "main" }
    ]
  },
  how_to_cooperate: {
    text: "Để hợp tác quảng cáo, làm đối tác nhúng Iframe hoặc đề xuất dự án phát triển, cậu hãy gửi yêu cầu hỗ trợ trực tiếp để tớ kết nối nhanh cho cậu với anh Admin nha.",
    options: [
      { label: "Yêu cầu gặp trực tiếp nhân viên hỗ trợ", next: "live_support" },
      { label: "Quay lại Menu chính", next: "main" }
    ]
  },
  live_support: {
    text: "Tớ đang chuyển cậu sang trang điền biểu mẫu hỗ trợ đây ạ. Cậu điền thông tin vào form để anh Admin nhắn tin Zalo 1:1 hỗ trợ trực tiếp cho cậu ngay nha.",
    options: []
  }
};

const HBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: QUESTION_TREE.main.text,
      time: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('main');
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Only show H-Bot in MemberPortal
  const isMemberPage = location.pathname.startsWith('/member');

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!isMemberPage) return null;

  const handleOptionClick = (option) => {
    if (isLoading) return;

    // 1. Add User selection to chat log
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: option.label,
      time: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const nextNodeKey = option.next;
    const nextNode = QUESTION_TREE[nextNodeKey];

    setTimeout(() => {
      // 2. Add Bot response to chat log
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: nextNode.text,
        time: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setCurrentStep(nextNodeKey);
      setIsLoading(false);

      // 3. Handle redirection to support request page if live_support
      if (nextNodeKey === 'live_support') {
        setTimeout(() => {
          setIsOpen(false);
          navigate('/support-request');
        }, 1500);
      }
    }, 600); // 600ms transition for a natural feel
  };

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
      {/* Floating Chat Box */}
      {isOpen && (
        <div className="mb-4 w-[360px] max-w-[calc(100vw-32px)] h-[500px] max-h-[calc(100vh-120px)] bg-white/90 dark:bg-[#12111a]/95 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden flex flex-col animate-fadeIn select-none">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative shrink-0">
                <img src="/image/avt5.png" alt="Bé Huy Chibi" className="w-full h-full object-contain" />
                {/* Active Indicator */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-indigo-600 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">Bé Huy Chibi</h4>
                <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                  Trợ lý nhỏ đáng yêu
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ minWidth: 0, minHeight: 0 }}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 shrink-0">
                    <img src="/image/avt5.png" alt="Bé Huy Chibi" className="w-full h-full object-contain" />
                  </div>
                )}
                
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

            {/* AI Loading indicator */}
            {isLoading && (
              <div className="flex gap-2 max-w-[85%] mr-auto">
                <div className="w-8 h-8 shrink-0">
                  <img src="/image/avt5.png" alt="Bé Huy Chibi" className="w-full h-full object-contain" />
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Options Menu Selection (Shopee Style) */}
          {!isLoading && currentStep !== 'live_support' && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 flex flex-col gap-2 shrink-0 max-h-[190px] overflow-y-auto">
              {QUESTION_TREE[currentStep]?.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(opt)}
                  className="w-full text-left px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-indigo-950/40 border border-slate-200/50 dark:border-slate-800/80 hover:border-indigo-500/55 dark:hover:border-indigo-500/55 text-xs text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-xl font-semibold transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-between group"
                  style={{ minWidth: 0, minHeight: 0 }}
                >
                  <span>{opt.label}</span>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-indigo-500 text-xs transition-colors">chevron_right</span>
                </button>
              ))}
            </div>
          )}

          {/* Processing / Redirection Status Banner */}
          {(isLoading || currentStep === 'live_support') && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 text-center text-xs text-slate-500 shrink-0">
              {currentStep === 'live_support' ? (
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center gap-1.5 animate-pulse">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  Đang chuyển hướng sang Zalo Support...
                </span>
              ) : (
                <span className="text-slate-400">H-Bot đang xử lý...</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="group relative w-16 h-16 transition-all duration-300 hover:-translate-y-0.5 select-none hover:scale-105 active:scale-95"
          style={{ minWidth: 0, minHeight: 0 }}
        >
          {/* Full transparent sticker rendering with no rounding or borders */}
          <img src="/image/avt5.png" alt="Bé Huy Chibi" className="w-full h-full object-contain" />
        </button>
      )}
    </div>
  );
};

export default HBot;
