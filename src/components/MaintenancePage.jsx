import React from "react";
import HugoLogo from "./HugoLogo";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-muted to-muted dark:from-background dark:via-card dark:to-card flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <HugoLogo className="text-5xl" />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
            Bảo Trì Hệ Thống
          </h1>

          {/* Subheading */}
          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
            Hugo Studio đang được nâng cấp để mang lại trải nghiệm tốt hơn cho bạn.
          </p>

          {/* Description */}
          <p className="text-sm text-muted-foreground">
            Chúng tôi sẽ quay lại trong thời gian sớm nhất. Cảm ơn bạn đã chờ đợi!
          </p>
        </div>

        {/* Loading Animation */}
        <div className="mt-12 mb-12 flex justify-center gap-2">
          <div 
            className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0s" }} 
          />
          <div 
            className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }} 
          />
          <div 
            className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }} 
          />
        </div>

        {/* Info Card */}
        <div className="bg-white dark:bg-background rounded-2xl border border-border p-6 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-primary text-xl font-bold">✓</span>
            <span className="text-sm text-muted-foreground text-left">
              Dữ liệu của bạn được bảo mật hoàn toàn
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-primary text-xl font-bold">✓</span>
            <span className="text-sm text-muted-foreground text-left">
              Chúng tôi sẽ hoàn tất trong 24 giờ tới.
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-primary text-xl font-bold">✓</span>
            <span className="text-sm text-muted-foreground text-left">
              Cảm ơn bạn đã kiên nhẫn chờ đợi
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-8 inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full border border-border">
          <span className="inline-block w-2 h-2 bg-warning rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Đang bảo trì
          </span>
        </div>
      </div>
    </div>
  );
}
