import React from 'react';
import { useTranslation } from 'react-i18next';

const STATUS_STEPS = [
  'Đang liên hệ',
  'Đang lên thiết kế',
  'Đang thực hiện',
  'Đang Kiểm tra',
  'Hoàn tất'
];

export default function CustomerServiceTab({ project }) {
  const { t } = useTranslation();
  const isCompleted = project.status === 'Hoàn tất';
  const currentStepIndex = STATUS_STEPS.indexOf(project.status);

  // Removed renderFormattedNote as we now use HTML from ReactQuill
  const getHtmlContent = (text) => {
    if (!text) return '';
    if (!/<[a-z][\s\S]*>/i.test(text)) {
      return text.replace(/\n/g, '<br />');
    }
    return text;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Handler Info */}
      <div className="brand-panel flex flex-col items-start justify-between gap-4 rounded-[28px] p-6 md:flex-row md:items-center">
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Dự án đang thực hiện</h2>
          <div className="text-lg font-black text-foreground font-display">{project.servicePackage}</div>
        </div>
        
        <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-muted/50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-2xl">support_agent</span>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Người xử lý / Quản lý dự án</div>
            <div className="font-bold text-foreground mt-0.5">{project.handlerName || 'Đang cập nhật'}</div>
            {project.handlerPhone && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <span className="material-symbols-outlined text-[14px]">call</span>
                {project.handlerPhone}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="brand-panel relative overflow-hidden rounded-[28px] p-6 md:p-8">
        <h3 className="font-bold text-foreground mb-8 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">route</span>
          Tiến Trình Dự Án
        </h3>

        <div className="relative">
          {/* Track */}
          <div className="absolute top-5 left-0 h-1 w-full rounded-full bg-muted" />
          {/* Active Track */}
          <div 
            className="absolute top-5 left-0 h-1 rounded-full bg-gradient-to-r from-[#ef4444] via-[#6366f1] to-[#06b6d4] transition-all duration-1000"
            style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
          />

          <div className="relative flex justify-between">
            {STATUS_STEPS.map((step, index) => {
              const isPast = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center gap-3 w-20">
                  <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background text-sm font-bold transition-colors ${
                    isActive 
                      ? 'scale-110 bg-primary text-white shadow-lg shadow-primary/30' 
                      : isPast 
                      ? 'bg-primary text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isPast ? <span className="material-symbols-outlined text-[18px]">check</span> : index + 1}
                  </div>
                  <div className={`text-[10px] md:text-xs font-bold text-center ${
                    isActive ? 'text-primary' : isPast ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes Timeline */}
        <div className="mt-12 space-y-4">
          <h4 className="border-b border-border/50 pb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Lịch sử cập nhật</h4>
          <div className="space-y-4 pl-2">
            {[...project.progressNotes].reverse().map((note, idx) => (
              <div key={idx} className="relative border-l-2 border-border pl-6 pb-2 last:pb-0">
                <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                <div className="mb-1 text-[10px] font-mono text-muted-foreground">
                  {new Date(note.createdAt).toLocaleString('vi-VN')}
                </div>
                <div className={`mb-0.5 text-xs font-bold ${note.status === 'Hoàn tất' || note.status === 'Hỗ trợ và bảo trì' ? 'text-amber-600 dark:text-amber-500' : 'text-foreground'}`}>
                  [{note.status === 'Hoàn tất' || note.status === 'Hỗ trợ và bảo trì' ? 'HỖ TRỢ VÀ BẢO TRÌ' : note.status}]
                </div>
                <div className="prose prose-sm max-w-none text-sm text-muted-foreground dark:prose-invert" dangerouslySetInnerHTML={{ __html: getHtmlContent(note.note) }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final Note Card - Shows on top of others if completed */}
      {isCompleted && project.finalNote && (
        <div className="relative z-20 animate-fadeInUp rounded-[28px] border border-emerald-500/18 bg-emerald-500/8 p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-3xl text-emerald-500">task_alt</span>
            <h3 className="font-display text-xl font-bold text-emerald-700 dark:text-emerald-400">{t("customerPortal.service.summary")}</h3>
          </div>
          <div className="prose prose-sm max-w-none rounded-2xl bg-card/60 p-5 text-sm leading-relaxed text-emerald-800 dark:prose-invert dark:text-emerald-200/80" dangerouslySetInnerHTML={{ __html: getHtmlContent(project.finalNote) }} />
        </div>
      )}
    </div>
  );
}
