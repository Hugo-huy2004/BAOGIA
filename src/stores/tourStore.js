import { create } from 'zustand';

export const TOUR_DEFINITIONS = {
  bio_editor: [
    {
      selector: '#portal-tab-account',
      title: 'Trang Bio Editor',
      content: 'Đây là khu vực chính để thiết kế và quản lý trang Bio Link cá nhân của bạn.',
      placement: 'bottom',
      beforeStep: (actions) => actions.switchTab('account')
    },
    {
      selector: '#account-sec-profile, #account-sec-profile-mobile',
      title: 'Chỉnh Sửa Thông Tin',
      content: 'Nhấn vào đây để cập nhật ảnh đại diện, tên hiển thị, địa chỉ liên hệ và mô tả bản thân.',
      placement: 'right',
      beforeStep: (actions) => { actions.switchTab('account'); actions.switchSubTab(null); }
    },
    {
      selector: '#account-sec-design, #account-sec-design-mobile',
      title: 'Giao Diện & Theme',
      content: 'Khám phá các theme cao cấp (Flat, Brutalism, Glassmorphism), tùy chỉnh màu nền, bo góc nút bấm hoặc kiểu viền độc đáo.',
      placement: 'left',
      beforeStep: (actions) => { actions.switchTab('account'); actions.switchSubTab(null); }
    },
    {
      selector: '#account-sec-links, #account-sec-links-mobile',
      title: 'Liên Kết Mạng Xã Hội',
      content: 'Thêm tài khoản mạng xã hội của bạn (Facebook, Instagram, Zalo...) kèm icon đẹp mắt để kết nối với người theo dõi.',
      placement: 'right',
      beforeStep: (actions) => { actions.switchTab('account'); actions.switchSubTab(null); }
    },
    {
      selector: '#account-sec-career, #account-sec-career-mobile',
      title: 'Chiều Cao & Số Đo (Portfolio)',
      content: 'Tính năng đặc biệt cho phép KOL/Model cập nhật chiều cao, cân nặng, số đo ba vòng để làm Portfolio nổi bật.',
      placement: 'left',
      beforeStep: (actions) => { actions.switchTab('account'); actions.switchSubTab(null); }
    }
  ],
  booking: [
    {
      selector: '#portal-tab-manage',
      title: 'Quản Lý Lịch Hẹn',
      content: 'Nơi hiển thị toàn bộ lịch đặt hẹn chụp/gặp mặt của khách hàng. Bạn có thể xem số Zalo và email của khách để tiện liên hệ.',
      placement: 'bottom',
      beforeStep: (actions) => actions.switchTab('manage')
    }
  ],
  utilities: [
    {
      selector: '#portal-tab-utilities',
      title: 'Tiện Ích Đa Năng',
      content: 'Bộ công cụ bổ trợ phong phú giúp phục vụ nhu cầu làm việc, học tập và giải trí của bạn.',
      placement: 'bottom',
      beforeStep: (actions) => actions.switchTab('utilities')
    },
    {
      selector: '#utility-card-helpdesk',
      title: 'HugoHelpdesk',
      content: 'Tạo mã QR chứa thông tin liên hệ (NFC) và thiết kế mẫu chữ ký email xịn xò để chèn vào Gmail hoặc Outlook.',
      placement: 'top',
      beforeStep: (actions) => actions.switchTab('utilities')
    },
    {
      selector: '#utility-card-psychology',
      title: 'HugoPSY',
      content: 'Góc tư vấn tâm lý tự động cùng AI, làm trắc nghiệm lâm sàng định kỳ (DASS-42) và thực hành các bài tập giảm stress.',
      placement: 'top',
      beforeStep: (actions) => actions.switchTab('utilities')
    },
    {
      selector: '#utility-card-chess',
      title: 'HugoChess',
      content: 'Chơi cờ vua thư giãn, đấu với Bot Stockfish hoặc tạo phòng thi đấu cùng bạn bè để tích điểm xếp hạng JOY.',
      placement: 'top',
      beforeStep: (actions) => actions.switchTab('utilities')
    }
  ]
};

export const useTourStore = create((set, get) => ({
  activeTour: null,
  stepIndex: 0,
  portalActions: null,
  onTourEndCallback: null,

  registerPortalActions: (actions) => set({ portalActions: actions }),
  registerOnTourEnd: (callback) => set({ onTourEndCallback: callback }),

  startTour: async (tourName) => {
    const steps = TOUR_DEFINITIONS[tourName];
    if (!steps || steps.length === 0) return;

    set({ activeTour: tourName, stepIndex: 0 });
    
    // Execute pre-step action for first step
    const firstStep = steps[0];
    const { portalActions } = get();
    if (firstStep.beforeStep && portalActions) {
      firstStep.beforeStep(portalActions);
    }
  },

  nextStep: () => {
    const { activeTour, stepIndex, portalActions } = get();
    if (!activeTour) return;

    const steps = TOUR_DEFINITIONS[activeTour];
    if (stepIndex + 1 < steps.length) {
      const nextIdx = stepIndex + 1;
      set({ stepIndex: nextIdx });

      const nextStepObj = steps[nextIdx];
      if (nextStepObj.beforeStep && portalActions) {
        nextStepObj.beforeStep(portalActions);
      }
    } else {
      get().exitTour(true);
    }
  },

  prevStep: () => {
    const { activeTour, stepIndex, portalActions } = get();
    if (!activeTour) return;

    if (stepIndex > 0) {
      const prevIdx = stepIndex - 1;
      set({ stepIndex: prevIdx });

      const prevStepObj = TOUR_DEFINITIONS[activeTour][prevIdx];
      if (prevStepObj.beforeStep && portalActions) {
        prevStepObj.beforeStep(portalActions);
      }
    }
  },

  exitTour: (completed = false) => {
    const { activeTour, onTourEndCallback } = get();
    set({ activeTour: null, stepIndex: 0 });
    if (onTourEndCallback) {
      onTourEndCallback(activeTour, completed);
    }
  }
}));
