import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import ToggleSwitch from "../common/ToggleSwitch";
import JoyCoinBadge from "../shared/JoyCoinBadge";
import PersonalInfoSubTab from "./PersonalInfoSubTab";
import DesignSubTab from "./DesignSubTab";
import LinksSubTab from "./LinksSubTab";
import AchievementsSubTab from "./AchievementsSubTab";

// A compact icon + label for vertical menu
function MenuItem({ id, icon, label, active, onClick }){
  return (
    <button
      onClick={() => onClick(id)}
      aria-current={active ? "true" : "false"}
      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/3 transition-colors ${active ? 'bg-gradient-to-r from-primary to-violet-500 text-white shadow-md' : 'text-zinc-300'}`}
    >
      <span className="w-9 h-9 rounded-lg bg-white/6 grid place-items-center text-sm">
        <span className="material-symbols-outlined">{icon}</span>
      </span>
      <div className="min-w-0">
        <div className="font-black text-sm truncate">{label}</div>
      </div>
    </button>
  );
}

export default function MemberSettingsTabNew(props){
  const { t } = useTranslation();
  const {
    memberSession, showToast, handleLogout, bio, formData, setFormData,
    handleFieldChange, publicLink, saving, isDragOver, setIsDragOver, processFile,
    avatarInputRef, handleAvatarChange, handleRemoveAvatar, handleSave, isGuestMode,
    newLinkLabel, setNewLinkLabel, newLinkUrl, setNewLinkUrl, handleLinkInputKeyDown,
    addSocialLink, removeSocialLink, bioTextareaRef
  } = props;

  const [active, setActive] = useState('profile');

  useEffect(() => {
    // keep focus and state tidy when switching
    document.title = 'Cài đặt — Hugo Studio';
  }, []);

  const renderActive = () => {
    if (active === 'profile') return (
      <PersonalInfoSubTab
        formData={formData}
        handleFieldChange={handleFieldChange}
        saving={saving}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        processFile={processFile}
        avatarInputRef={avatarInputRef}
        handleAvatarChange={handleAvatarChange}
        handleRemoveAvatar={handleRemoveAvatar}
        memberSession={memberSession}
        bio={bio}
        t={t}
      />
    );
    if (active === 'design') return (
      <DesignSubTab formData={formData} setFormData={setFormData} bio={bio} onBioUpdate={setFormData} showToast={showToast} t={t} />
    );
    if (active === 'links') return (
      <LinksSubTab
        formData={formData}
        newLinkLabel={newLinkLabel}
        setNewLinkLabel={setNewLinkLabel}
        newLinkUrl={newLinkUrl}
        setNewLinkUrl={setNewLinkUrl}
        handleLinkInputKeyDown={handleLinkInputKeyDown}
        addSocialLink={addSocialLink}
        removeSocialLink={removeSocialLink}
        handleFieldChange={handleFieldChange}
        bioTextareaRef={bioTextareaRef}
        t={t}
      />
    );
    if (active === 'achievements') return (
      <AchievementsSubTab formData={formData} setFormData={setFormData} handleSave={handleSave} showToast={showToast} isGuestMode={isGuestMode} bio={bio} t={t} />
    );
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* Left column: profile / quick actions */}
      <aside className="md:col-span-4 bg-gradient-to-b from-white/3 to-transparent rounded-2xl p-4 border border-white/6 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md border border-white/10">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-black text-3xl">{(formData.displayName||'?')[0]?.toUpperCase()}</div>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-black text-lg leading-tight text-white">{formData.displayName || 'Người dùng'}</h3>
            <p className="text-sm text-zinc-300">{formData.headline || 'Chưa có mô tả'}</p>
          </div>

          <div className="w-full mt-2 flex gap-2">
            <button onClick={() => setActive('profile')} className="flex-1 px-3 py-2 rounded-xl bg-white/6 text-white font-semibold">Chỉnh sửa</button>
            <button onClick={() => handleSave()} disabled={saving} className="px-3 py-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 text-white font-black">{saving? 'Đang lưu...' : 'Lưu'}</button>
          </div>

          <div className="w-full mt-3 bg-white/3 rounded-xl p-3 border border-white/6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-300">Số dư JOY</div>
                <div className="font-black text-lg">{/* placeholder, integrate with joyStore if needed */}1,250 JOY</div>
              </div>
              <div>
                <JoyCoinBadge />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="px-2 py-2 rounded-lg bg-white/6">Nạp</button>
              <button className="px-2 py-2 rounded-lg bg-gradient-to-r from-warning to-destructive text-white">Trao đổi</button>
            </div>
          </div>

          <div className="w-full mt-3 text-left">
            <div className="text-xs text-zinc-400 font-semibold">Quick Settings</div>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm">Âm thông báo</div>
                <ToggleSwitch checked={true} onChange={()=>{}} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Hiện widget quyên góp</div>
                <ToggleSwitch checked={false} onChange={()=>{}} />
              </div>
            </div>
          </div>

          <div className="w-full mt-4 flex gap-2">
            <button onClick={() => handleLogout?.()} className="flex-1 px-3 py-2 rounded-xl border border-white/8 text-sm">Đăng xuất</button>
            <button onClick={() => navigator.clipboard?.writeText(publicLink || '')} className="px-3 py-2 rounded-xl bg-white/6 text-sm">Sao chép link</button>
          </div>
        </div>
      </aside>

      {/* Right column: menu + content */}
      <section className="md:col-span-8 bg-[#071026]/70 rounded-2xl p-4 border border-white/6 shadow-lg">
        <div className="grid grid-cols-3 gap-3">
          <nav className="col-span-1">
            <div className="space-y-2">
              <MenuItem id="profile" icon="person" label="Thông tin" active={active==='profile'} onClick={setActive} />
              <MenuItem id="design" icon="palette" label="Giao diện" active={active==='design'} onClick={setActive} />
              <MenuItem id="links" icon="link" label="Liên kết" active={active==='links'} onClick={setActive} />
              <MenuItem id="achievements" icon="military_tech" label="Thành tích" active={active==='achievements'} onClick={setActive} />
            </div>
          </nav>

          <div className="col-span-2 pl-3">
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.22 }}>
              {renderActive()}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
