import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTourStore } from '../stores/tourStore';
import { getMemberSession } from '../services/authSession';
import { useJoyStore } from '../stores/joyStore';
import { fetchProfile as fetchArcadeProfile } from '../services/arcadeApi';
import { isHBotVisible, setHBotVisible, HBOT_VISIBILITY_EVENT } from '../utils/floatingWidgetPref';

const VALID_TOUR_IDS = ['bio_editor', 'booking', 'utilities'];
const OPEN_TOUR_REGEX = /\[OPEN_TOUR:\s*(\w+)\]/i;

const QUESTION_TREE = {
  main: {
    text: "Xin chào cậu nha! Tớ là Culi, trợ lý nhỏ siêu cute của Hugo Studio đây ạ. Cậu cần tớ hỗ trợ việc gì trong hệ thống thế nè?",
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
      { label: "Hướng dẫn Tiện ích (Mã QR, Danh bạ, Chữ ký)", next: "utilities_features" },
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
  utilities_features: {
    text: "Hệ thống cung cấp các tiện ích tuyệt vời cho cậu nha:\n1. Trình tạo mã QR đa năng (Wifi, URL, Văn bản, Danh bạ)\n2. HugoSMail (Chữ ký Email thương hiệu)\n3. HugoPSY (Chữa lành)\n4. HugoCoder (Học lập trình)\n5. HugoChess (Đấu cờ vua online)\nCậu muốn Culi hướng dẫn cái nào nè?",
    options: [
      { label: "Trình tạo mã QR", next: "qr_generator" },
      { label: "HugoSMail", next: "email_signature" },
      { label: "HugoPSY", next: "psychology" },
      { label: "HugoCoder", next: "ide" },
      { label: "HugoChess (Cờ)", next: "chess" },
      { label: "Quay lại mục trước", next: "portal_features" }
    ]
  },
  qr_generator: {
    text: "Trình tạo QR (trong HugoHelpdesk) cho phép cậu tạo mã QR cho Wi-Fi, URL, Văn bản, hoặc cả Danh bạ (vCard) — quét là điện thoại tự động bật popup lưu danh bạ mà không cần Internet! Tải về siêu nét (PNG) hoặc in ra quét offline mượt mà.",
    options: [
      { label: "Quay lại", next: "utilities_features" },
      { label: "Yêu cầu gặp trực tiếp nhân viên hỗ trợ", next: "live_support" }
    ]
  },
  email_signature: {
    text: "Tab HugoSMail giúp cậu tạo chữ ký xịn xò. Cậu có thể chọn Font, màu sắc, tích hợp icon mạng xã hội tự động, rồi tải file HTML về hoặc Copy chèn thẳng vào Gmail/Outlook nha.",
    options: [
      { label: "Quay lại", next: "utilities_features" },
      { label: "Yêu cầu gặp trực tiếp nhân viên hỗ trợ", next: "live_support" }
    ]
  },
  psychology: {
    text: "HugoPSY (ở Tab Utilities) là góc lắng nghe chia sẻ cảm xúc, thực hiện test tâm lý định kỳ (DASS-42, MMPI), và cung cấp bài tập hít thở trị liệu giúp cậu xả stress sau giờ học.",
    options: [
      { label: "Quay lại", next: "utilities_features" },
      { label: "Yêu cầu gặp trực tiếp nhân viên hỗ trợ", next: "live_support" }
    ]
  },
  ide: {
    text: "Web-based IDE (ở Tab Utilities) là trình soạn thảo lập trình trực quan (C, C++, C#, Python, Web, PHP) chạy ngay trên trình duyệt, đi kèm các bài học lập trình cơ bản và hỗ trợ tải code về máy.",
    options: [
      { label: "Quay lại", next: "utilities_features" },
      { label: "Yêu cầu gặp trực tiếp nhân viên hỗ trợ", next: "live_support" }
    ]
  },
  chess: {
    text: "HugoChess (ở Tab Utilities) là không gian sảnh cờ vua mini giúp cậu thi đấu Stockfish AI, ghép đôi ngẫu nhiên hoặc tạo phòng đấu giao hữu cùng bạn bè để tích điểm xếp hạng JOY.",
    options: [
      { label: "Quay lại", next: "utilities_features" },
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
    text: "Để kết nối trực tiếp với Admin hỗ trợ, cậu xác nhận giúp tớ nhen! Tớ sẽ chuyển cậu sang trang điền biểu mẫu hỗ trợ ngay nè.",
    options: [
      { label: "Xác nhận giúp tớ nhen", next: "redirect_support" },
      { label: "Quay lại Menu chính", next: "main" }
    ]
  },
  redirect_support: {
    text: "Đang kết nối... Cậu đợi tớ một xíu siêu nhé!",
    options: []
  }
};

const PREFILL_MESSAGES = {
  theme: "Hỗ trợ chỉnh sửa giao diện, tùy chỉnh Theme hoặc thiết kế nút bấm trên Bio Link.",
  measurements: "Hỗ trợ thiết lập thông số cơ bản (chiều cao, cân nặng, số đo ba vòng) của Portfolio.",
  booking: "Hỗ trợ về tính năng đặt lịch hẹn chụp/hẹn và đồng bộ lịch đặt của khách hàng.",
  view_booking: "Hỗ trợ về tab Quản lý lịch hẹn và xem thông tin liên hệ của khách hàng.",
  upgrade: "Yêu cầu kích hoạt/nâng cấp tài khoản lên gói trả phí (Bio Plus hoặc Bio VIP).",
  partners: "Hỗ trợ và tư vấn tích hợp trình chỉnh sửa Bio Link (nhúng Iframe) lên website đối tác.",
  qr_generator: "Hỗ trợ sử dụng Trình tạo mã QR đa năng.",
  email_signature: "Hỗ trợ thiết kế và nhúng chữ ký HugoSMail.",
  psychology: "Hỗ trợ sử dụng chuyên mục HugoPSY.",
  ide: "Hỗ trợ sử dụng HugoCoder lập trình.",
  chess: "Hỗ trợ tham gia sảnh cờ vua HugoChess.",
  how_to_cooperate: "Đề xuất hợp tác quảng cáo, nhúng Iframe hoặc dự án phát triển với Hugo Studio.",
  main: "Yêu cầu gặp trực tiếp nhân viên hỗ trợ để được giải quyết vấn đề."
};

const TOUR_MAP = {
  bio_link: 'bio_editor',
  theme: 'bio_editor',
  measurements: 'bio_editor',
  booking: 'booking',
  view_booking: 'booking',
  utilities_features: 'utilities',
  qr_generator: 'utilities',
  email_signature: 'utilities',
  psychology: 'utilities',
  ide: 'utilities',
  chess: 'utilities'
};

const HBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(() => isHBotVisible());
  const [customInput, setCustomInput] = useState("");
  const [nudge, setNudge] = useState(null); // { text } | null — proactive companion bubble
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
  const supportSourceRef = useRef('main');
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const startTour = useTourStore(state => state.startTour);
  const registerOnTourEnd = useTourStore(state => state.registerOnTourEnd);

  // Hook up callback from Tour completion/dismissal
  useEffect(() => {
    registerOnTourEnd((tourName, completed) => {
      setIsOpen(true);
      const text = completed 
        ? "Culi chúc mừng cậu đã hoàn thành bài hướng dẫn trực quan! 🎉 Cậu có muốn Culi hướng dẫn thêm gì nữa không nè?"
        : "Tiếc quá cậu chưa xem hết hướng dẫn á. Khi nào cần cậu cứ bấm nút chạy hướng dẫn trực tiếp để xem lại nhé! Cậu cần Culi giúp gì khác không?";
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text,
        time: new Date()
      }]);
      setCurrentStep('main');
    });
  }, [registerOnTourEnd]);

  // Only show H-Bot in MemberPortal
  const isMemberPage = location.pathname.startsWith('/member');

  useEffect(() => {
    const onVisibilityChange = (e) => setVisible(e.detail.visible);
    window.addEventListener(HBOT_VISIBILITY_EVENT, onVisibilityChange);
    return () => window.removeEventListener(HBOT_VISIBILITY_EVENT, onVisibilityChange);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Proactive companion nudge — checks the cheapest already-existing signals once per
  // day per member, shows at most one (priority order below), never forces the chat open.
  useEffect(() => {
    if (!isMemberPage) return;
    const session = getMemberSession();
    if (!session?.email) return;

    const flagKey = `hbot_nudge_shown_${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(flagKey)) return;

    const apiBase = import.meta.env.VITE_API_URL || "/api";

    (async () => {
      try {
        const [checkinStatus, arcadeProfile] = await Promise.all([
          fetch(`${apiBase}/checkin/status?email=${encodeURIComponent(session.email)}`, { credentials: 'include' })
            .then(r => (r.ok ? r.json() : null)).catch(() => null),
          fetchArcadeProfile(session.email).catch(() => null)
        ]);
        await useJoyStore.getState().fetchBalance(session.email);
        const balance = useJoyStore.getState().balance;

        let text = null;
        if (checkinStatus && checkinStatus.canClaimToday && !checkinStatus.alreadyClaimedToday && !checkinStatus.weekLocked) {
          text = "Cậu chưa điểm danh hôm nay đó, ghé nhận JOY nhé! 🎁";
        } else if (arcadeProfile && Object.values(arcadeProfile).every(g => g.gamesPlayed === 0)) {
          text = "Cậu chưa thử HugoArcade — vài phút giải trí mà vẫn nhận JOY đó! 🎮";
        } else if (balance < 10) {
          text = "JOY của cậu đang thấp á — điểm danh, chơi HugoArcade hoặc đấu HugoChess để kiếm thêm nhé!";
        }

        if (text) {
          setNudge({ text });
          sessionStorage.setItem(flagKey, "1");
        }
      } catch (_) {}
    })();
  }, [isMemberPage]);

  const handleNudgeClick = () => {
    if (nudge) setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: nudge.text, time: new Date() }]);
    setNudge(null);
    setIsOpen(true);
  };

  const handleDismissNudge = (e) => {
    e.stopPropagation();
    setNudge(null);
  };

  if (!isMemberPage || !visible) return null;

  const handleHide = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    setVisible(false);
    setHBotVisible(false);
  };

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

    // If transitioning to live_support, record which step we are coming from
    if (nextNodeKey === 'live_support') {
      supportSourceRef.current = currentStep;
    }

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

      // 3. Handle redirection to support request page if redirect_support
      if (nextNodeKey === 'redirect_support') {
        const source = supportSourceRef.current || 'main';
        const prefill = PREFILL_MESSAGES[source] || PREFILL_MESSAGES.main;
        setTimeout(() => {
          setIsOpen(false);
          navigate('/support-request', { state: { prefilledMessage: prefill, fromBot: true } });
        }, 1500);
      }
    }, 600); // 600ms transition for a natural feel
  };

  // Smart natural language query processing (local matching + Gemini fallback)
  const handleCustomQuery = async () => {
    const query = customInput.trim();
    if (!query || isLoading) return;
    setCustomInput("");

    // 1. Add User message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // 2. Fuzzy/Keyword matching
    const q = query.toLowerCase();
    let matchStep = null;

    if (q.includes("theme") || q.includes("giao diện") || q.includes("màu nền") || q.includes("đổi màu") || q.includes("theme mới")) {
      matchStep = "theme";
    } else if (q.includes("chiều cao") || q.includes("cân nặng") || q.includes("số đo") || q.includes("ngực eo") || q.includes("mông")) {
      matchStep = "measurements";
    } else if (q.includes("bio") || q.includes("trang cá nhân") || q.includes("liên kết") || q.includes("tạo bio")) {
      matchStep = "bio_link";
    } else if (q.includes("đặt lịch") || q.includes("lịch hẹn") || q.includes("lịch chụp") || q.includes("booking")) {
      matchStep = "booking";
    } else if (q.includes("xem lịch") || q.includes("quản lý lịch")) {
      matchStep = "view_booking";
    } else if (q.includes("mã qr") || q.includes("wifi") || q.includes("qr code") || q.includes("tạo qr") || q.includes("danh bạ") || q.includes("vcard") || q.includes("offline")) {
      matchStep = "qr_generator";
    } else if (q.includes("chữ ký") || q.includes("signature") || q.includes("chữ ký email")) {
      matchStep = "email_signature";
    } else if (q.includes("bạn học đường") || q.includes("tâm lý") || q.includes("chữa lành") || q.includes("stress") || q.includes("hít thở")) {
      matchStep = "psychology";
    } else if (q.includes("ide") || q.includes("lập trình") || q.includes("code") || q.includes("viết code")) {
      matchStep = "ide";
    } else if (q.includes("cờ vua") || q.includes("chess") || q.includes("đấu cờ") || q.includes("vào sảnh cờ")) {
      matchStep = "chess";
    } else if (q.includes("gói") || q.includes("nâng cấp") || q.includes("plus") || q.includes("vip") || q.includes("free")) {
      matchStep = "packages";
    }

    if (matchStep) {
      setTimeout(() => {
        const node = QUESTION_TREE[matchStep];
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'bot',
          text: node.text,
          time: new Date()
        }]);
        setCurrentStep(matchStep);
        setIsLoading(false);
      }, 500);
      return;
    }

    // 3. Fallback: FastAPI Gemini Server Query
    try {
      const getAiUrl = () => {
        if (import.meta.env.VITE_AI_URL) return import.meta.env.VITE_AI_URL;
        const apiUrl = import.meta.env.VITE_API_URL || "";
        if (apiUrl.startsWith("http")) {
          try {
            const url = new URL(apiUrl);
            if (url.hostname.startsWith("api.")) {
              url.hostname = url.hostname.replace("api.", "ai.");
              return `${url.protocol}//${url.hostname}`;
            }
          } catch (e) {}
        }
        if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
          if (window.location.hostname.includes("hugowishpax.studio")) {
            return `${window.location.protocol}//ai.hugowishpax.studio`;
          }
        }
        return "http://localhost:8000";
      };

      const AI_URL = getAiUrl();
      const internalKey = import.meta.env.VITE_INTERNAL_API_KEY || "";
      const session = getMemberSession();
      // Last 10 turns, same { sender, text } shape gemini_service.py already parses —
      // no remapping needed. Excludes the just-appended user message (sent separately below).
      const recentHistory = messages.slice(-10).map(m => ({ sender: m.sender, text: m.text }));

      const res = await fetch(`${AI_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": internalKey
        },
        body: JSON.stringify({
          message: query,
          history: recentHistory,
          bio: session ? { displayName: session.displayName } : null,
          userId: session?.email || "unknown",
          persona: "guide"
        })
      });

      if (res.ok) {
        const data = await res.json();
        let text = data.reply || "Culi chưa hiểu rõ ý cậu lắm. Cậu có thể chọn các mục hướng dẫn có sẵn bên dưới hoặc gõ chi tiết hơn nha!";

        let tourId = null;
        const tourMatch = text.match(OPEN_TOUR_REGEX);
        if (tourMatch?.[1] && VALID_TOUR_IDS.includes(tourMatch[1])) {
          tourId = tourMatch[1];
          text = text.replace(OPEN_TOUR_REGEX, "").trim();
        }

        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text, tourId, time: new Date() }]);
      } else {
        throw new Error("API responded with non-200");
      }
    } catch (err) {
      console.warn("HBot fallback failed, utilizing local helper message:", err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: "Culi chưa rõ câu hỏi của cậu lắm á. Cậu thử hỏi rõ hơn về các tính năng như: Thiết kế Bio Link, Giao diện Theme, Quản lý lịch hẹn, HugoSMail, HugoPSY, hay Cờ vua nha!",
        time: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTour = (tourId) => {
    setIsOpen(false); // Minimize chatbox
    startTour(tourId);
  };

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  const lastBotMsg = [...messages].reverse().find(m => m.sender === 'bot');

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] md:bottom-6 right-4 md:right-6 z-[999] flex flex-col items-end">
      {/* Floating Chat Box */}
      {isOpen && (
        <div className="mb-3 w-[320px] sm:w-[360px] max-w-[calc(100vw-24px)] h-[380px] sm:h-[460px] md:h-[500px] max-h-[55vh] sm:max-h-[60vh] md:max-h-[calc(100vh-120px)] bg-background/95 dark:bg-card/95 backdrop-blur-lg rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col animate-fadeIn select-none">
          {/* Header */}
          <div className="p-4 bg-white/85 dark:bg-card/85 text-foreground flex items-center justify-between border-b border-border shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative shrink-0">
                <img src="/image/avt5.png" alt="Culi" className="w-full h-full object-contain" />
                {/* Active Indicator */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border border-background dark:border-card animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight text-foreground">Culi</h4>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                  Trợ lý nhỏ đáng yêu
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
              style={{ minWidth: 0, minHeight: 0 }}
            >
              <span className="material-symbols-outlined text-sm font-bold">close</span>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-white/50 dark:bg-black/10">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 shrink-0">
                    <img src="/image/avt5.png" alt="Culi" className="w-full h-full object-contain" />
                  </div>
                )}
                
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-tr-none font-medium'
                      : 'bg-muted text-foreground rounded-tl-none font-medium shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  
                  {/* Dynamic Onboarding Tour Button — fires from the fixed QUESTION_TREE
                      (TOUR_MAP[currentStep]) or from an AI free-text reply that requested
                      a tour via the [OPEN_TOUR: ...] tag (msg.tourId, parsed in handleCustomQuery). */}
                  {msg.sender === 'bot' && msg.id === lastBotMsg?.id && (TOUR_MAP[currentStep] || msg.tourId) && (
                    <button
                      type="button"
                      onClick={() => handleStartTour(msg.tourId || TOUR_MAP[currentStep])}
                      className="mt-2.5 w-full py-2 px-3 bg-primary hover:bg-primary/90 active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer pointer-events-auto"
                    >
                      <span className="material-symbols-outlined text-xs">play_circle</span>
                      👉 Hướng dẫn trực tiếp tính năng
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* AI Loading indicator */}
            {isLoading && (
              <div className="flex gap-2 max-w-[85%] mr-auto">
                <div className="w-8 h-8 shrink-0">
                  <img src="/image/avt5.png" alt="Culi" className="w-full h-full object-contain" />
                </div>
                <div className="p-3 bg-muted text-foreground rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Options Menu Selection (Apple Style) */}
          {!isLoading && currentStep !== 'redirect_support' && (
            <div className="p-3 border-t border-border bg-background flex flex-col gap-2 shrink-0 max-h-[190px] overflow-y-auto">
              {QUESTION_TREE[currentStep]?.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(opt)}
                  className="w-full text-left px-4 py-2.5 bg-background hover:bg-muted dark:bg-card dark:hover:bg-muted border-0 text-xs text-foreground hover:text-primary dark:hover:text-primary rounded-xl font-semibold transition-all active:scale-[0.99] flex items-center justify-between group"
                  style={{ minWidth: 0, minHeight: 0 }}
                >
                  <span>{opt.label}</span>
                  <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary text-xs transition-colors">chevron_right</span>
                </button>
              ))}
            </div>
          )}

          {/* Processing / Redirection Status Banner */}
          {(isLoading || currentStep === 'redirect_support') && (
            <div className="p-4 border-t border-border bg-background text-center text-xs text-muted-foreground shrink-0">
              {currentStep === 'redirect_support' ? (
                <span className="text-primary dark:text-primary font-semibold flex items-center justify-center gap-1.5 animate-pulse">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  Đang chuyển hướng sang Zalo Support...
                </span>
              ) : (
                <span className="text-muted-foreground">Culi đang xử lý...</span>
              )}
            </div>
          )}

          {/* Smart NLP Input field */}
          {!isLoading && currentStep !== 'redirect_support' && (
            <div className="p-2.5 border-t border-border bg-white dark:bg-card flex gap-2 shrink-0">
              <input
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCustomQuery(); }}
                placeholder="Hỏi Culi về hệ thống..."
                className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-xs focus:outline-none text-foreground"
              />
              <button
                onClick={handleCustomQuery}
                disabled={!customInput.trim()}
                className="px-3 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0"
              >
                Gửi
              </button>
            </div>
          )}
        </div>
      )}

      {/* Proactive companion nudge — never forces the chat open, just an inviting bubble */}
      {!isOpen && nudge && (
        <div className="relative mb-2 max-w-[220px] animate-fadeIn">
          <button
            type="button"
            onClick={handleNudgeClick}
            className="text-left bg-white dark:bg-card border border-border rounded-2xl rounded-br-sm shadow-lg p-3 pr-7 text-xs text-foreground font-medium leading-relaxed"
          >
            {nudge.text}
          </button>
          <button
            type="button"
            onClick={handleDismissNudge}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
          >
            <span className="material-symbols-outlined text-[12px]">close</span>
          </button>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <div className="relative">
          <button
            onClick={handleOpenChat}
            className="group relative w-12 h-12 md:w-16 md:h-16 transition-all duration-300 hover:-translate-y-0.5 select-none hover:scale-105 active:scale-95"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            {/* Full transparent sticker rendering with no rounding or borders */}
            <img src="/image/avt5.png" alt="Culi" className="w-full h-full object-contain" />
          </button>
          {/* Dismiss — hides Culi if it's getting in the way; re-enable from Settings */}
          <button
            type="button"
            onClick={handleHide}
            aria-label="Ẩn trợ lý Culi"
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-700 text-white border border-white/80 dark:border-zinc-900 flex items-center justify-center shadow-md active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-[12px] leading-none">close</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default HBot;
