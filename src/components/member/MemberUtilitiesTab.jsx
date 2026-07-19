import React, { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useData } from "../../context/DataContext";
import { TabFallbackSkeleton } from "../ui/SkeletonLayouts";

const MemberUtilitiesDashboard = lazy(() => import("./MemberUtilitiesDashboard"));
const HugoHelpdeskTab = lazy(() => import("./HugoHelpdeskTab"));
const HugoHandleTab = lazy(() => import("./HugoHandleTab"));
const BanhocduongTab = lazy(() => import("./banhocduong/BanhocduongTab"));
const HugoCoderHub = lazy(() => import("./hugoCoder/HugoCoderHub"));
const HugoTeamTab = lazy(() => import("./HugoTeamTab"));
const MemberRadioTab = lazy(() => import("./MemberRadioTab"));
const HugoArcadeTab = lazy(() => import("./arcade/HugoArcadeTab"));
const MemberAuraTab = lazy(() => import("./MemberAuraTab"));
const MemberInfoVersionTab = lazy(() => import("./MemberInfoVersionTab"));
const DecoStudioTab = lazy(() => import("./DecoStudioTab"));
const BioPreviewTab = lazy(() => import("./BioPreviewTab"));
const HugoSkinTab = lazy(() => import("./HugoSkinTab"));

const UTILITY_METADATA = {
  bio: { icon: "badge", tint: "from-purple-500 to-pink-500", title: "Trang Bio" },
  ide: { icon: "code", tint: "from-blue-600 to-violet-600", title: "HugoCoder" },
  team: { icon: "groups", tint: "from-teal-400 to-emerald-500", title: "Hugo Team" },
  psychology: { icon: "psychology", tint: "from-cyan-400 to-emerald-500", title: "HugoPSY" },
  hugoskin: { icon: "face", tint: "from-indigo-500 to-purple-500", title: "HugoSkin" },
  radio: { icon: "radio", tint: "from-teal-400 to-emerald-500", title: "HugoRadio" },
  helpdesk: { icon: "support_agent", tint: "from-indigo-500 to-purple-500", title: "HugoHelpdesk" },
  handle: { icon: "handyman", tint: "from-rose-500 to-red-500", title: "HugoHandle" },
  arcade: { icon: "stadium", tint: "from-amber-500 to-rose-500", title: "HugoArcade" },
  aura: { icon: "blur_on", tint: "from-violet-600 to-fuchsia-600", title: "HugoAura" },
  deco: { icon: "chair", tint: "from-pink-500 to-purple-500", title: "Deco Studio" },
  info: { icon: "info", tint: "from-slate-600 to-stone-600", title: "Info & Version" },
  joy_wallet: { icon: "account_balance_wallet", tint: "from-orange-500 to-rose-500", title: "Ví JOY" },
  library: { icon: "store", tint: "from-blue-500 to-purple-500", title: "Hugo Library" }
};

export default function MemberUtilitiesTab({ bio, publicLink, showToast, setFormData, handleSave, renderAccountForm, selectedUtility, onSelectUtility, psychologySubTab, onSelectPsychologySubTab, defaultPsychologyPresetTest, sleepAutoDetect, onBioUpdate, ideLessonId }) {
  const { t } = useTranslation();
  const { data } = useData();
  const [splashApp, setSplashApp] = useState(null);

  useEffect(() => {
    if (selectedUtility) {
      setSplashApp(selectedUtility);
      const timer = setTimeout(() => {
        setSplashApp(null);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [selectedUtility]);

  useEffect(() => {
    if (selectedUtility && data?.systemSettings?.blockUtilities && window.location.hostname === "hugowishpax.studio") {
      const isBlocked = typeof data.systemSettings.blockUtilities === "boolean" 
        ? data.systemSettings.blockUtilities 
        : data.systemSettings.blockUtilities === selectedUtility;

      if (isBlocked) {
        if (showToast) {
          showToast("Hugo... đang được hệ thống tiến hành nâng cấp lên phiên bản mới nhất, hẹn gặp bạn sau 24 tiếng", "info");
        }
        onSelectUtility(null);
      }
    }
  }, [data?.systemSettings?.blockUtilities, selectedUtility, onSelectUtility, showToast]);

  const fallback = <TabFallbackSkeleton />;

  const isFullscreenLikeUtility = selectedUtility === "psychology" || selectedUtility === "ide" || selectedUtility === "arcade" || selectedUtility === "deco";

  return (
    <div className={isFullscreenLikeUtility ? "h-full min-h-0 overflow-hidden" : "space-y-6 animate-fadeIn"}>
      <Suspense fallback={fallback}>
      {/* Utility Selector Dashboard */}
      {selectedUtility === null && (
        <MemberUtilitiesDashboard bio={bio} onBioUpdate={onBioUpdate} setSelectedUtility={onSelectUtility} showToast={showToast} />
      )}

      {/* HugoHelpdesk — QR/NFC + Email Signature merged */}
      {selectedUtility === "helpdesk" && (
        <HugoHelpdeskTab
          bio={bio}
          publicLink={publicLink}
          showToast={showToast}
          onBack={() => onSelectUtility(null)}
        />
      )}

      {/* HugoHandle — Secret Link + File Tools merged */}
      {selectedUtility === "handle" && (
        <HugoHandleTab
          bio={bio}
          publicLink={publicLink}
          showToast={showToast}
          onBack={() => onSelectUtility(null)}
          setFormData={setFormData}
          handleSave={handleSave}
        />
      )}

      {/* Psychology Advisor Tool - HugoPSY */}
      {selectedUtility === "psychology" && (
        <BanhocduongTab
          onBack={() => onSelectUtility(null)}
          activeSubTab={psychologySubTab}
          onSubTabChange={onSelectPsychologySubTab}
          defaultPresetTest={defaultPsychologyPresetTest}
          bio={bio}
          showToast={showToast}
          setFormData={setFormData}
          handleSave={handleSave}
          sleepAutoDetect={sleepAutoDetect}
        />
      )}

      {/* Web IDE Tool */}
      {selectedUtility === "ide" && (
        <HugoCoderHub onBack={() => onSelectUtility(null)} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} urlLessonId={ideLessonId} />
      )}

      {/* Hugo Team — Recruitment */}
      {selectedUtility === "team" && (
        <HugoTeamTab onBack={() => onSelectUtility(null)} />
      )}

      {/* HugoRadio */}
      {selectedUtility === "radio" && (
        <MemberRadioTab onBack={() => onSelectUtility(null)} showToast={showToast} bio={bio} onBioUpdate={onBioUpdate} />
      )}

      {/* HugoArcade */}
      {selectedUtility === "arcade" && (
        <HugoArcadeTab onBack={() => onSelectUtility(null)} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
      )}

      {/* HugoAura Focus */}
      {selectedUtility === "aura" && (
        <MemberAuraTab onBack={() => onSelectUtility(null)} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
      )}

      {/* Info & Version */}
      {selectedUtility === "info" && (
        <MemberInfoVersionTab onBack={() => onSelectUtility(null)} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
      )}

      {/* Deco Studio */}
      {selectedUtility === "deco" && (
        <DecoStudioTab onBack={() => onSelectUtility(null)} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
      )}

      {/* Trang Bio — public bio preview (edit via Settings) */}
      {selectedUtility === "bio" && (
        <BioPreviewTab onBack={() => onSelectUtility(null)} bio={bio} publicLink={publicLink} showToast={showToast} renderAccountForm={renderAccountForm} />
      )}

      {/* HugoSkin */}
      {selectedUtility === "hugoskin" && (
        <div className="space-y-4">
          <button
            onClick={() => onSelectUtility(null)}
            className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition"
          >
            ← Quay lại tiện ích
          </button>
          <HugoSkinTab />
        </div>
      )}
      </Suspense>

      {/* 🚀 PREMIUM SPLASH LAUNCH SCREEN */}
      {splashApp && UTILITY_METADATA[splashApp] && (
        <div className="fixed inset-0 bg-[#0b0f19] z-[999] flex flex-col items-center justify-center animate-fadeIn select-none pointer-events-none">
          <div className="relative flex flex-col items-center gap-6">
            {/* Animated pulsing ripple ring */}
            <div className="absolute w-28 h-28 rounded-[28px] bg-gradient-to-br from-primary/10 to-violet-500/10 animate-ping opacity-60" />
            
            {/* App Icon Container */}
            <div className={`w-24 h-24 rounded-[24px] bg-gradient-to-br ${UTILITY_METADATA[splashApp].tint} flex items-center justify-center shadow-xl shadow-primary/10 scale-100 animate-scaleUp`}>
              <span className="material-symbols-outlined text-white text-[42px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                {UTILITY_METADATA[splashApp].icon}
              </span>
            </div>
            
            <div className="text-center space-y-1 animate-slideUp">
              <h3 className="text-base font-black uppercase tracking-widest text-foreground">
                {UTILITY_METADATA[splashApp].title}
              </h3>
              <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                Đang khởi tạo tài nguyên...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

