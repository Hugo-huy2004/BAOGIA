import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";

export default function MemberSignatureTab({ bio, publicLink, showToast, onBack }) {
  const { t } = useTranslation();
  const [signatureTemplate, setSignatureTemplate] = useState("luxury"); // luxury, modern, creative, business, minimal
  const [signatureColor, setSignatureColor] = useState("#d97706"); // Gold theme default
  const [showAvatar, setShowAvatar] = useState(true);
  const [includeQrCode, setIncludeQrCode] = useState(false);
  const [signatureDisclaimer, setSignatureDisclaimer] = useState("none"); // none, green, confidential

  const copySignatureToClipboard = async () => {
    const signatureEl = document.getElementById("email-signature-preview");
    if (!signatureEl) return;

    try {
      const htmlContent = signatureEl.innerHTML;
      const textContent = signatureEl.innerText;

      if (typeof window !== "undefined" && window.navigator?.clipboard && window.ClipboardItem) {
        const htmlBlob = new Blob([htmlContent], { type: "text/html" });
        const textBlob = new Blob([textContent], { type: "text/plain" });
        
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob
          })
        ]);
        
        if (showToast) {
          showToast(t("memberPortal.utilitiesPage.signature.toastCopySuccess"), "success");
        }
      } else {
        const range = document.createRange();
        range.selectNode(signatureEl);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("copy");
        selection.removeAllRanges();
        if (showToast) {
          showToast(t("memberPortal.utilitiesPage.signature.toastCopyFallback"), "success");
        }
      }
    } catch (err) {
      console.error("Clipboard API error:", err);
      if (showToast) {
        showToast(t("memberPortal.utilitiesPage.signature.toastCopyError"), "warning");
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-6">
      <SubUtilityHeader 
        title={t("memberPortal.utilitiesPage.signature.title")} 
        icon="signature" 
        colorClass="text-zinc-850 dark:text-zinc-200" 
        onBack={onBack}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        {/* Control Panel */}
        <div className="lg:col-span-5 space-y-6">
          <h4 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">tune</span>
            {t("memberPortal.utilitiesPage.signature.configTitle")}
          </h4>
          
          {/* Template Selection */}
          <div className="space-y-2.5">
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t("memberPortal.utilitiesPage.signature.selectTemplate")}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: "luxury", name: "Luxury Gold", icon: "workspace_premium" },
                { id: "modern", name: "Modern Accent", icon: "badge" },
                { id: "creative", name: "Creative Block", icon: "palette" },
                { id: "business", name: "Corporate Pro", icon: "domain" },
                { id: "minimal", name: "Minimalist", icon: "horizontal_rule" }
              ].map((tpl) => (
                <button 
                  key={tpl.id}
                  onClick={() => setSignatureTemplate(tpl.id)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all active:scale-95 ${
                    signatureTemplate === tpl.id 
                      ? "border-zinc-900 bg-zinc-50 text-zinc-900 dark:border-white dark:bg-zinc-800/50 dark:text-white font-extrabold shadow-sm" 
                      : "border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-300"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    signatureTemplate === tpl.id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-450"
                  }`}>
                    <span className="material-symbols-outlined text-base">{tpl.icon}</span>
                  </div>
                  <span className="text-[11px] tracking-tight">{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Selection */}
          <div className="space-y-2.5">
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t("memberPortal.utilitiesPage.signature.accentColor")}</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { hex: "#d97706", name: "Luxury Gold" },
                { hex: "#10b981", name: "Emerald Green" },
                { hex: "#2563eb", name: "Royal Blue" },
                { hex: "#7c3aed", name: "Deep Violet" },
                { hex: "#ef4444", name: "Crimson Red" },
                { hex: "#18181b", name: "Obsidian Black" }
              ].map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setSignatureColor(color.hex)}
                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                    signatureColor === color.hex ? "border-zinc-950 dark:border-white scale-110 shadow-md" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {signatureColor === color.hex && (
                    <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles (Smart features) */}
          <div className="space-y-4 pt-2 border-t border-zinc-150 dark:border-zinc-850">
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t("memberPortal.utilitiesPage.signature.quickSetup")}</label>
            
            {/* Toggle Avatar */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-650 dark:text-zinc-300">{t("memberPortal.utilitiesPage.signature.showAvatar")}</span>
              <button 
                onClick={() => setShowAvatar(!showAvatar)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                  showAvatar ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-800"
                }`}
              >
                <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                  showAvatar ? "translate-x-5" : "translate-x-0"
                } ${showAvatar ? "bg-white dark:bg-black" : "bg-white"}`} />
              </button>
            </div>

            {/* Toggle QR Code */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-650 dark:text-zinc-300">{t("memberPortal.utilitiesPage.signature.includeQr")}</span>
              <button 
                onClick={() => setIncludeQrCode(!includeQrCode)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                  includeQrCode ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-800"
                }`}
              >
                <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                  includeQrCode ? "translate-x-5" : "translate-x-0"
                } ${includeQrCode ? "bg-white dark:bg-black" : "bg-white"}`} />
              </button>
            </div>
          </div>

          {/* Disclaimer presets */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-150 dark:border-zinc-850">
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t("memberPortal.utilitiesPage.signature.disclaimerLabel")}</label>
            <select 
              value={signatureDisclaimer}
              onChange={(e) => setSignatureDisclaimer(e.target.value)}
              className="w-full p-3 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1a1824] text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-bold"
            >
              <option value="none">{t("memberPortal.utilitiesPage.signature.disclaimerNone")}</option>
              <option value="green">{t("memberPortal.utilitiesPage.signature.disclaimerGreen")}</option>
              <option value="confidential">{t("memberPortal.utilitiesPage.signature.disclaimerConfidential")}</option>
            </select>
          </div>

          {/* Copy & Apply buttons */}
          <div className="pt-2 space-y-3">
            <button
              onClick={copySignatureToClipboard}
              className="w-full py-3.5 rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span> {t("memberPortal.utilitiesPage.signature.copyBtn")}
            </button>
            
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-850 space-y-2">
              <div className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{t("memberPortal.utilitiesPage.signature.quickSetup")}</div>
              <div className="flex gap-2">
                <a 
                  href="https://mail.google.com/mail/u/0/#settings/general"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-[9.5px] uppercase tracking-wider text-center flex items-center justify-center gap-1 transition-all border border-zinc-200 dark:border-zinc-800"
                >
                  <span className="material-symbols-outlined text-xs">mail</span> {t("memberPortal.utilitiesPage.signature.setupGmail")}
                </a>
                <a 
                  href="https://outlook.live.com/mail/0/options/mail/layout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-[9.5px] uppercase tracking-wider text-center flex items-center justify-center gap-1 transition-all border border-zinc-200 dark:border-zinc-800"
                >
                  <span className="material-symbols-outlined text-xs">mail_lock</span> {t("memberPortal.utilitiesPage.signature.setupOutlook")}
                </a>
              </div>
            </div>

            <p className="text-[9.5px] text-zinc-450 dark:text-zinc-500 text-center leading-relaxed">
              {t("memberPortal.utilitiesPage.signature.instructionDesc")}
            </p>
          </div>
        </div>

        {/* Preview Box */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-6">
          <h4 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">visibility</span>
            {t("memberPortal.utilitiesPage.signature.previewTitle")}
          </h4>
          
          <div className="bg-[#f8f9fa] dark:bg-[#0f0e15] rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-md overflow-hidden">
            {/* Email Header Mockup */}
            <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/80 px-4 py-3 space-y-1.5 text-[10px] text-zinc-500">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="ml-2 font-mono text-[9.5px]">Compose Email</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-800/40">
                <span className="font-semibold w-8">To:</span>
                <span className="bg-zinc-250 dark:bg-zinc-850 px-2 py-0.5 rounded text-zinc-650 dark:text-zinc-300">partner@example.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold w-8">Subject:</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">Business Proposal</span>
              </div>
            </div>

            {/* Email Body & Signature Preview */}
            <div className="p-6 bg-white overflow-x-auto min-h-[220px] flex flex-col justify-between text-black">
              <div className="text-xs text-zinc-400 mb-8 italic">
                Here is the body of your email message. Below is your professional signature:
              </div>
              
              <div id="email-signature-preview" className="text-black font-sans text-left" style={{ fontFamily: 'Arial, sans-serif', width: '100%', maxWidth: '540px' }}>
              
              {/* MODERN ACCENT TEMPLATE */}
              {signatureTemplate === "modern" && (
                <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    <tr>
                      {showAvatar && (
                        <td style={{ verticalAlign: 'top', paddingRight: '16px', borderRight: `3px solid ${signatureColor}`, width: '64px' }}>
                          <img 
                            src={bio?.avatarUrl || "https://res.cloudinary.com/dku1mdfd9/image/upload/v1716300000/default-avatar.png"} 
                            alt="Avatar" 
                            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} 
                          />
                        </td>
                      )}
                      <td style={{ verticalAlign: 'middle', paddingLeft: showAvatar ? '16px' : '0px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827' }}>{bio?.displayName || "Tên thành viên"}</div>
                        <div style={{ fontSize: '11px', color: signatureColor, fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.5px' }}>{bio?.jobTitle || "Thành viên"}</div>
                        
                        <table cellPadding="0" cellSpacing="0" style={{ marginTop: '8px', fontSize: '11px', color: '#4b5563', borderCollapse: 'collapse' }}>
                          <tbody>
                            {bio?.phone && (
                              <tr>
                                <td style={{ paddingBottom: '2px' }}>
                                  <strong style={{ color: '#1f2937' }}>Phone:</strong> {bio.phone}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td style={{ paddingBottom: '2px' }}>
                                <strong style={{ color: '#1f2937' }}>Email:</strong> {bio?.contactEmail || bio?.email}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong style={{ color: '#1f2937' }}>Bio:</strong> <a href={publicLink} style={{ color: signatureColor, textDecoration: 'none', fontWeight: 'bold' }}>{publicLink.replace(/^https?:\/\//, '')}</a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>

                      {includeQrCode && (
                        <td style={{ verticalAlign: 'middle', paddingLeft: '20px', width: '70px' }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(publicLink)}`} 
                            alt="Bio QR" 
                            style={{ width: '60px', height: '60px', display: 'block', border: '1px solid #e5e7eb', padding: '2px', borderRadius: '4px' }} 
                          />
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              )}

              {/* LUXURY GOLD / ELEGANT BORDER TEMPLATE */}
              {signatureTemplate === "luxury" && (
                <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%', borderTop: `2px solid ${signatureColor}`, borderBottom: `2px solid ${signatureColor}`, padding: '16px 0' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '14px 0' }}>
                        <table cellPadding="0" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              {showAvatar && (
                                <td style={{ verticalAlign: 'middle', paddingRight: '18px', width: '68px' }}>
                                  <img 
                                    src={bio?.avatarUrl || "https://res.cloudinary.com/dku1mdfd9/image/upload/v1716300000/default-avatar.png"} 
                                    alt="Avatar" 
                                    style={{ width: '68px', height: '68px', borderRadius: '4px', objectFit: 'cover', display: 'block', border: `1px solid ${signatureColor}` }} 
                                  />
                                </td>
                              )}
                              <td style={{ verticalAlign: 'middle' }}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', fontFamily: 'Georgia, serif', letterSpacing: '0.5px' }}>{bio?.displayName || "Tên thành viên"}</div>
                                <div style={{ fontSize: '10px', color: signatureColor, fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '1px', fontFamily: 'Georgia, serif' }}>{bio?.jobTitle || "Thành viên"}</div>
                                
                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280', lineHeight: '1.4' }}>
                                  {bio?.phone && <span><span style={{ color: signatureColor }}>T:</span> {bio.phone} &bull; </span>}
                                  <span><span style={{ color: signatureColor }}>E:</span> {bio?.contactEmail || bio?.email}</span>
                                  <br />
                                  <span style={{ color: signatureColor }}>W:</span> <a href={publicLink} style={{ color: '#111827', textDecoration: 'none', fontWeight: 'bold' }}>{publicLink.replace(/^https?:\/\//, '')}</a>
                                </div>
                              </td>

                              {includeQrCode && (
                                <td style={{ verticalAlign: 'middle', paddingLeft: '20px', width: '70px' }}>
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(publicLink)}`} 
                                    alt="Bio QR" 
                                    style={{ width: '60px', height: '60px', display: 'block', border: `1px solid ${signatureColor}`, padding: '2px' }} 
                                  />
                                </td>
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* CREATIVE BLOCK TEMPLATE */}
              {signatureTemplate === "creative" && (
                <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    <tr>
                      <td>
                        <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              {showAvatar && (
                                <td style={{ verticalAlign: 'top', paddingRight: '14px', width: '56px' }}>
                                  <img 
                                    src={bio?.avatarUrl || "https://res.cloudinary.com/dku1mdfd9/image/upload/v1716300000/default-avatar.png"} 
                                    alt="Avatar" 
                                    style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', display: 'block' }} 
                                  />
                                </td>
                              )}
                              <td style={{ verticalAlign: 'top' }}>
                                <div style={{ display: 'inline-block', backgroundColor: signatureColor, color: '#ffffff', padding: '3px 8px', fontSize: '13px', fontWeight: 'bold', borderRadius: '4px' }}>
                                  {bio?.displayName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: 'bold', marginTop: '4px' }}>{bio?.jobTitle || "Thành viên"}</div>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <div style={{ borderTop: '1px dashed #d1d5db', marginTop: '12px', paddingTop: '8px', fontSize: '11px', color: '#4b5563', lineHeight: '1.5' }}>
                          {bio?.phone && <div><span style={{ color: signatureColor, fontWeight: 'bold' }}>Mobile:</span> {bio.phone}</div>}
                          <div><span style={{ color: signatureColor, fontWeight: 'bold' }}>Email:</span> {bio?.contactEmail || bio?.email}</div>
                          <div><span style={{ color: signatureColor, fontWeight: 'bold' }}>Bio Page:</span> <a href={publicLink} style={{ color: signatureColor, textDecoration: 'underline' }}>{publicLink}</a></div>
                        </div>
                      </td>

                      {includeQrCode && (
                        <td style={{ verticalAlign: 'bottom', paddingLeft: '20px', width: '70px' }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(publicLink)}`} 
                            alt="Bio QR" 
                            style={{ width: '60px', height: '60px', display: 'block', border: '1px solid #e5e7eb', padding: '2px', borderRadius: '8px' }} 
                          />
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              )}

              {/* CORPORATE COLUMN TEMPLATE */}
              {signatureTemplate === "business" && (
                <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%', borderLeft: `4px solid ${signatureColor}`, paddingLeft: '14px' }}>
                  <tbody>
                    <tr>
                      <td style={{ paddingLeft: '14px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{bio?.displayName}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{bio?.jobTitle || "Thành viên"}</div>
                        
                        <div style={{ width: '80px', height: '1px', backgroundColor: '#e5e7eb', margin: '8px 0' }} />
                        
                        <table cellPadding="0" cellSpacing="0" style={{ fontSize: '11px', color: '#4b5563', borderCollapse: 'collapse' }}>
                          <tbody>
                            {bio?.phone && (
                              <tr>
                                <td style={{ paddingRight: '8px', color: signatureColor, fontWeight: 'bold' }}>P:</td>
                                <td>{bio.phone}</td>
                              </tr>
                            )}
                            <tr>
                              <td style={{ paddingRight: '8px', color: signatureColor, fontWeight: 'bold' }}>E:</td>
                              <td>{bio?.contactEmail || bio?.email}</td>
                            </tr>
                            <tr>
                              <td style={{ paddingRight: '8px', color: signatureColor, fontWeight: 'bold' }}>W:</td>
                              <td><a href={publicLink} style={{ color: '#111827', textDecoration: 'none', fontWeight: 'bold' }}>{publicLink.replace(/^https?:\/\//, '')}</a></td>
                            </tr>
                          </tbody>
                        </table>
                      </td>

                      {includeQrCode && (
                        <td style={{ verticalAlign: 'middle', paddingLeft: '20px', width: '70px' }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(publicLink)}`} 
                            alt="Bio QR" 
                            style={{ width: '60px', height: '60px', display: 'block', border: '1px solid #e5e7eb', padding: '2px' }} 
                          />
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              )}

              {/* MINIMALIST TEMPLATE */}
              {signatureTemplate === "minimal" && (
                <div style={{ borderTop: `1px solid #e5e7eb`, paddingTop: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>
                    {bio?.displayName} <span style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: '11px' }}>| {bio?.jobTitle || "Thành viên"}</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#6b7280', marginTop: '4px', lineHeight: '1.4' }}>
                    {bio?.phone && <span><strong>M:</strong> {bio.phone} &bull; </span>}
                    <span><strong>E:</strong> {bio?.contactEmail || bio?.email}</span>
                    <br />
                    <strong>Bio Link:</strong> <a href={publicLink} style={{ color: signatureColor, textDecoration: 'none', fontWeight: 'bold' }}>{publicLink}</a>
                  </div>
                  {includeQrCode && (
                    <div style={{ marginTop: '8px' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent(publicLink)}`} 
                        alt="Bio QR" 
                        style={{ width: '50px', height: '50px', display: 'block', border: '1px solid #e5e7eb', padding: '1px' }} 
                      />
                    </div>
                  )}
                </div>
              )}

              {/* DISCLAIMERS */}
              {signatureDisclaimer === "green" && (
                <div style={{ fontSize: '9px', color: '#10b981', marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '8px', lineHeight: '1.3', fontFamily: 'Arial, sans-serif' }}>
                  <strong>Please consider the environment before printing this email.</strong> Go green, keep it on screen!
                </div>
              )}
              {signatureDisclaimer === "confidential" && (
                <div style={{ fontSize: '8.5px', color: '#9ca3af', marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '8px', lineHeight: '1.3', textAlign: 'justify', fontFamily: 'Arial, sans-serif' }}>
                  <strong>CONFIDENTIALITY NOTICE:</strong> This email message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential and privileged information. Any unauthorized review, use, disclosure or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply email and destroy all copies of the original message.
                </div>
              )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
