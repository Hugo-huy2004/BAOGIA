import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import dataApi from '../services/dataApi';

/**
 * All Healing Journey (Bạn Học Đường check-in) state and logic, extracted
 * from MemberPortalPage so that component stays lean.
 *
 * @param {{ email: string, onNavigate: Function, showToast: Function, sendNotification: Function }} opts
 */
export function useHealingJourney({ email, onNavigate, showToast, sendNotification }) {
  const [showModal, setShowModal] = useState(false);
  const [state, setState] = useState({ active: false, day: 1, duration: 30, isExpired: false });
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState('');
  const [subStep, setSubStep] = useState('checkin'); // 'checkin' | 'wheel' | 'reminder' | 'graduation'
  const [consecutiveLow, setConsecutiveLow] = useState(false);
  const [wheelRatings, setWheelRatings] = useState([5, 5, 5, 5, 5]);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Confetti on graduation step
  useEffect(() => {
    if (!showModal || subStep !== 'graduation') return;
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    const end = Date.now() + 3000;
    const interval = setInterval(() => {
      if (Date.now() > end) return clearInterval(interval);
      confetti({ startVelocity: 30, spread: 360, ticks: 60, origin: { x: Math.random(), y: Math.random() - 0.2 } });
    }, 500);
    return () => clearInterval(interval);
  }, [showModal, subStep]);

  // Called on active tab change to trigger daily check-in prompt
  const syncFromStorage = useCallback(() => {
    const mode = localStorage.getItem('banhocduong_healing_mode');
    if (mode !== 'active') return;
    try {
      const raw = localStorage.getItem('banhocduong_history');
      setHistoryLogs(raw ? JSON.parse(raw) : []);
    } catch (_) {}
    const startDateStr = localStorage.getItem('banhocduong_healing_start_date') || '';
    const duration = parseInt(localStorage.getItem('banhocduong_healing_duration') || '30', 10);
    const lastCheckIn = localStorage.getItem('banhocduong_last_checkin_date') || '';
    if (!startDateStr) return;
    const diffDays = Math.floor((Date.now() - new Date(startDateStr).getTime()) / 86_400_000) + 1;
    if (diffDays > duration) {
      setState({ active: true, day: diffDays, duration, isExpired: true });
      setSubStep('graduation');
      setShowModal(true);
    } else if (lastCheckIn !== new Date().toDateString()) {
      setState({ active: true, day: diffDays, duration, isExpired: false });
      setSubStep('checkin');
      setShowModal(true);
    }
  }, []);

  // Watch for BanHocDuong duration adaptation alert from other tabs
  useEffect(() => {
    const check = () => {
      const raw = localStorage.getItem('banhocduong_duration_adaptation_alert');
      if (!raw) return;
      try {
        const { reducedDays } = JSON.parse(raw);
        showToast(`Tiến triển tinh thần tuyệt vời! Lộ trình rút ngắn -${reducedDays} ngày.`, 'success');
        localStorage.removeItem('banhocduong_duration_adaptation_alert');
        const histRaw = localStorage.getItem('banhocduong_history');
        setHistoryLogs(histRaw ? JSON.parse(histRaw) : []);
      } catch (_) {}
    };
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, [showToast]);

  const finalizeCheckIn = useCallback(async (m, n, wheelData) => {
    try {
      const rawLogs = localStorage.getItem('banhocduong_history');
      const logs = rawLogs ? JSON.parse(rawLogs) : [];
      logs.push({ date: new Date().toISOString(), type: 'checkin', day: state.day, mood: m, note: n, wheelRatings: wheelData });
      const lastCheckin = new Date().toDateString();

      if (email) {
        await dataApi.saveCompanionHistory({
          email,
          healingActive: true,
          healingDuration: state.duration,
          healingStartDate: localStorage.getItem('banhocduong_healing_start_date') || new Date().toISOString(),
          lastCheckinDate: lastCheckin,
          lastTestDate: localStorage.getItem('banhocduong_last_test_date') || '',
          chatDistressCount: Number(localStorage.getItem('banhocduong_chat_distress_count') || 0),
          historyLogs: logs,
        }).catch(console.error);
      }

      localStorage.setItem('banhocduong_history', JSON.stringify(logs));
      localStorage.setItem('banhocduong_last_checkin_date', lastCheckin);
      setHistoryLogs(logs);

      const checkins = logs.filter(l => l.type === 'checkin');
      const lastTwo = checkins.slice(-2);
      const isConsecLow = lastTwo.length >= 2 && lastTwo.every(l => l.mood <= 2);
      setConsecutiveLow(isConsecLow);

      // Persist wellness milestone to inbox if low mood detected
      if (isConsecLow && sendNotification) {
        sendNotification({
          category: 'wellness',
          type: 'warning',
          title: 'Cảnh báo sức khỏe tâm thần',
          message: 'Bạn Học Đường phát hiện tâm trạng của bạn đang trầm xuống liên tục. Hãy thực hành bài tập hít thở hoặc trò chuyện với trợ lý nhé.',
          actionUrl: '/member/portal?tab=utilities',
        });
      }

      const lastTestDate = localStorage.getItem('banhocduong_last_test_date') || '';
      let needsTest = m <= 2;
      if (!needsTest && lastTestDate) {
        const diffDays = Math.floor((Date.now() - new Date(lastTestDate).getTime()) / 86_400_000);
        needsTest = diffDays >= (m >= 4 ? 6 : 3);
      } else if (!needsTest && !lastTestDate) {
        needsTest = true;
      }

      if (needsTest) {
        setSubStep('reminder');
      } else {
        setShowModal(false);
        showToast(m >= 4
          ? 'Tâm trạng tốt! Tiếp tục duy trì năng lượng tích cực nhé! ☀️'
          : 'Đã ghi nhận cảm xúc hôm nay! Chúc cậu một ngày tốt lành 🌟',
          'success');
      }
    } catch (e) {
      console.error(e);
      setShowModal(false);
    }
  }, [email, state, showToast, sendNotification]);

  const handleSubmit = useCallback(() => {
    const isWheelDay = state.day === 1 || state.day % 3 === 0;
    isWheelDay ? setSubStep('wheel') : finalizeCheckIn(mood, note, null);
  }, [state.day, mood, note, finalizeCheckIn]);

  const handleWheelSubmit = useCallback(() => {
    finalizeCheckIn(mood, note, wheelRatings);
  }, [mood, note, wheelRatings, finalizeCheckIn]);

  const handleGraduation = useCallback(async () => {
    if (email) {
      await dataApi.saveCompanionHistory({
        email, healingActive: false, healingDuration: 30,
        healingStartDate: null, lastCheckinDate: '', lastTestDate: '',
        chatDistressCount: 0, historyLogs,
      }).catch(console.error);
    }
    if (sendNotification) {
      sendNotification({
        category: 'wellness',
        type: 'success',
        title: 'Hành trình chữa lành hoàn thành! 🎉',
        message: `Bạn đã hoàn thành lộ trình ${state.duration} ngày. Chúc mừng bạn!`,
      });
    }
    ['banhocduong_healing_mode','banhocduong_healing_duration','banhocduong_healing_start_date',
     'banhocduong_last_checkin_date','banhocduong_last_test_date','banhocduong_chat_distress_count']
      .forEach(k => localStorage.removeItem(k));
    setState({ active: false, day: 1, duration: 30, isExpired: false });
    setShowModal(false);
  }, [email, historyLogs, state.duration, sendNotification]);

  const goToTest = useCallback(() => {
    setShowModal(false);
    onNavigate('utilities', 'psychology', 'tests', 'dass');
    showToast('Đã chuyển hướng đến bài trắc nghiệm lâm sàng DASS-21.', 'success');
  }, [onNavigate, showToast]);

  const goToBreath = useCallback(() => {
    setShowModal(false);
    onNavigate('utilities', 'psychology', 'breath', null);
    showToast('Đã chuyển hướng đến bài tập Hít thở 4-7-8.', 'success');
  }, [onNavigate, showToast]);

  const goToChat = useCallback(() => {
    setShowModal(false);
    onNavigate('utilities', 'psychology', 'chat', null);
    showToast('Đã chuyển hướng đến Trợ lý Bạn Học Đường.', 'success');
  }, [onNavigate, showToast]);

  return {
    showModal, setShowModal,
    state, setState,
    mood, setMood,
    note, setNote,
    subStep, setSubStep,
    consecutiveLow,
    wheelRatings, setWheelRatings,
    historyLogs, setHistoryLogs,
    syncFromStorage,
    handleSubmit, handleWheelSubmit, handleGraduation,
    goToTest, goToBreath, goToChat,
  };
}
