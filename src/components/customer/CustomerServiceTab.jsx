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
      <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-1">Dự án đang thực hiện</h2>
          <div className="text-lg font-black text-slate-850 dark:text-white font-display">{project.servicePackage}</div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <span className="material-symbols-outlined text-2xl">support_agent</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Người xử lý / Quản lý dự án</div>
            <div className="font-bold text-slate-850 dark:text-white mt-0.5">{project.handlerName || 'Đang cập nhật'}</div>
            {project.handlerPhone && (
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">call</span>
                {project.handlerPhone}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
        <h3 className="font-bold text-slate-850 dark:text-white mb-8 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-500">route</span>
          Tiến Trình Dự Án
        </h3>

        <div className="relative">
          {/* Track */}
          <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
          {/* Active Track */}
          <div 
            className="absolute top-5 left-0 h-1 bg-indigo-500 rounded-full transition-all duration-1000"
            style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
          />

          <div className="relative flex justify-between">
            {STATUS_STEPS.map((step, index) => {
              const isPast = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center gap-3 w-20">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white dark:border-[#12111a] transition-colors relative z-10 ${
                    isActive 
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-110' 
                      : isPast 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {isPast ? <span className="material-symbols-outlined text-[18px]">check</span> : index + 1}
                  </div>
                  <div className={`text-[10px] md:text-xs font-bold text-center ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : isPast ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'
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
          <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2">Lịch sử cập nhật</h4>
          <div className="space-y-4 pl-2">
            {[...project.progressNotes].reverse().map((note, idx) => (
              <div key={idx} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 pb-2 last:pb-0">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-400" />
                <div className="text-[10px] text-slate-400 font-mono mb-1">
                  {new Date(note.createdAt).toLocaleString('vi-VN')}
                </div>
                <div className={`text-xs font-bold mb-0.5 ${note.status === 'Hoàn tất' || note.status === 'Hỗ trợ và bảo trì' ? 'text-amber-600 dark:text-amber-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  [{note.status === 'Hoàn tất' || note.status === 'Hỗ trợ và bảo trì' ? 'HỖ TRỢ VÀ BẢO TRÌ' : note.status}]
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: getHtmlContent(note.note) }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final Note Card - Shows on top of others if completed */}
      {isCompleted && project.finalNote && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-6 md:p-8 border border-emerald-200 dark:border-emerald-800/50 shadow-sm relative z-20 animate-fadeInUp">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-3xl text-emerald-500">task_alt</span>
            <h3 className="font-display text-xl font-bold text-emerald-700 dark:text-emerald-400">{t("customerPortal.service.summary")}</h3>
          </div>
          <div className="text-sm text-emerald-800 dark:text-emerald-200/80 leading-relaxed bg-white/50 dark:bg-black/20 p-5 rounded-xl prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: getHtmlContent(project.finalNote) }} />
        </div>
      )}
    </div>
  );
}
