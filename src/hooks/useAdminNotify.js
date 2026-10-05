import { useState, useCallback } from "react";

function playPopSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

/**
 * Toast notification + confirm modal — hai thứ này hay đi cùng nhau và
 * trước đây trải khắp AdminPanel.jsx. Tập trung ở một hook để tái dùng.
 */
export function useAdminNotify() {
  // Toast
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const showNotification = useCallback((msg, type = "success") => {
    playPopSound();
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  }, []);

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, message: "", onConfirm: null,
  });

  const triggerConfirm = useCallback((message, onConfirm) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    toastMsg, toastType, showNotification,
    confirmModal, triggerConfirm, closeConfirm,
  };
}
