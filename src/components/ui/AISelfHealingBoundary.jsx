/**
 * AISelfHealingBoundary.jsx
 * Màn hình bảo vệ & tự động sửa lỗi ngầm (Apple Glassmorphic Self-Healing UI Boundary).
 */

import React, { Component } from "react";
import { AISelfHealingEngine } from "../../utils/aiSelfHealingEngine";

export default class AISelfHealingBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Lỗi giao diện không xác định" };
  }

  componentDidCatch(error, errorInfo) {
    AISelfHealingEngine.handleError({
      type: "REACT_UI_CRASH",
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  handleAutoFix = () => {
    this.setState({ hasError: false, errorMessage: "" });
    AISelfHealingEngine.softResetAppState();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full p-6 flex flex-col items-center justify-center text-center bg-card/60 backdrop-blur-xl border border-border/40 rounded-[32px] shadow-2xl my-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-4 animate-bounce">
            <span className="material-symbols-outlined text-[28px]">auto_fix_high</span>
          </div>

          <h3 className="text-base font-black uppercase tracking-wider text-foreground mb-1.5">
            AI Tự Động Khôi Phục Ứng Dụng
          </h3>
          <p className="text-xs text-muted-foreground max-w-md leading-relaxed mb-6">
            Hệ thống AI vừa tự động bắt và ghi nhận log sự cố ngầm. Trải nghiệm của bạn sẽ được khôi phục ngay lập tức.
          </p>

          <button
            onClick={this.handleAutoFix}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Tự Động Khôi Phục Ngay
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
