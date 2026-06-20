import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";

export default function MemberSignatureTab({ bio, publicLink, showToast, onBack }) {
  const { t } = useTranslation();
  
  // States
  const [signatureTemplate, setSignatureTemplate] = useState("luxury"); // luxury, modern, creative, business, minimal
  const [signatureColor, setSignatureColor] = useState("#d97706"); // Gold theme default
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
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
        
        if (showToast) showToast(t("utilities.signature.copiedText"), "success");
      } else {
        const range = document.createRange();
        range.selectNode(signatureEl);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("copy");
        selection.removeAllRanges();
        if (showToast) showToast(t("utilities.signature.copiedText"), "success");
      }
    } catch (err) {
      if (showToast) showToast(t("utilities.signature.copiedError"), "warning");
    }
  };

  const downloadSignatureHTML = () => {
    const signatureEl = document.getElementById("email-signature-preview");
    if (!signatureEl) return;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>\n${signatureEl.innerHTML}\n</body></html>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `signature_${bio?.slug || "email"}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) showToast(t("utilities.signature.downloadSuccess"), "success");
  };

  // Helper to extract social links
  const getSocialLinks = () => {
    if (!bio?.links || !Array.isArray(bio.links)) return [];
    
    const mapping = {
      "facebook.com": "facebook",
      "linkedin.com": "linkedin",
      "github.com": "github",
      "twitter.com": "twitter",
      "x.com": "twitter",
      "instagram.com": "instagram",
      "youtube.com": "youtube",
      "tiktok.com": "tiktok"
    };

    return bio.links
      .map(link => {
        let platform = null;
        let url = link.url || "";
        for (const [domain, name] of Object.entries(mapping)) {
          if (url.toLowerCase().includes(domain)) {
            platform = name;
            break;
          }
        }
        return platform ? { platform, url } : null;
      })
      .filter(Boolean)
      .slice(0, 5); // Max 5 icons
  };

  const socialLinks = getSocialLinks();

  const SocialIcons = () => {
    if (socialLinks.length === 0) return null;
    return (
      <div style={{ marginTop: '12px' }}>
        {socialLinks.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', marginRight: '8px', display: 'inline-block' }}>
            <img 
              src={`https://api.iconify.design/simple-icons/${s.platform}.svg?color=${encodeURIComponent(signatureColor)}`} 
              alt={s.platform} 
              style={{ width: '20px', height: '20px', display: 'block', border: 'none' }} 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#12111a] rounded-[2rem] p-6 lg:p-8 border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-8">
      <SubUtilityHeader 
        title={t("utilities.signature.title")} 
        icon="signature" 
        colorClass="text-zinc-800 dark:text-zinc-200" 
        onBack={onBack}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LEFT: Control Panel */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5 mb-4">
                <span className="material-symbols-outlined text-sm">palette</span>
                {t("utilities.signature.designLayout")}
              </h4>
              
              {/* Template Selection */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { id: "luxury", name: t("utilities.signature.templates.luxury"), icon: "workspace_premium" },
                  { id: "modern", name: t("utilities.signature.templates.modern"), icon: "badge" },
                  { id: "business", name: t("utilities.signature.templates.business"), icon: "domain" },
                  { id: "minimal", name: t("utilities.signature.templates.minimal"), icon: "horizontal_rule" }
                ].map((tpl) => (
                  <button 
                    key={tpl.id}
                    onClick={() => setSignatureTemplate(tpl.id)}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-2 transition-all active:scale-95 ${
                      signatureTemplate === tpl.id 
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black font-extrabold shadow-md" 
                        : "border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{tpl.icon}</span>
                    <span className="text-[10px] tracking-wide uppercase">{tpl.name}</span>
                  </button>
                ))}
              </div>
 
              {/* Accent Color Selection */}
              <div className="flex gap-2.5 flex-wrap">
                {[
                  { hex: "#d97706", name: t("utilities.signature.colors.gold") },
                  { hex: "#10b981", name: t("utilities.signature.colors.green") },
                  { hex: "#2563eb", name: t("utilities.signature.colors.blue") },
                  { hex: "#7c3aed", name: t("utilities.signature.colors.violet") },
                  { hex: "#ef4444", name: t("utilities.signature.colors.red") },
                  { hex: "#18181b", name: t("utilities.signature.colors.black") },
                  { hex: "#0891b2", name: t("utilities.signature.colors.cyan") }
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setSignatureColor(color.hex)}
                    className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                      signatureColor === color.hex ? "border-zinc-950 dark:border-white scale-110 shadow-lg" : "border-transparent hover:scale-110"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {signatureColor === color.hex && (
                      <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Typography Selection */}
            <div>
               <h4 className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-sm">font_download</span>
                {t("utilities.signature.fields.font")}
              </h4>
              <select 
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-3.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1a1824] text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500/30"
              >
                <option value="Arial, sans-serif">{t("utilities.signature.fonts.arial")}</option>
                <option value="Georgia, serif">{t("utilities.signature.fonts.georgia")}</option>
                <option value="Tahoma, sans-serif">{t("utilities.signature.fonts.tahoma")}</option>
                <option value="Verdana, sans-serif">{t("utilities.signature.fonts.verdana")}</option>
                <option value="'Times New Roman', Times, serif">{t("utilities.signature.fonts.times")}</option>
              </select>
            </div>
 
            {/* Smart Toggles */}
            <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between p-3 rounded-md bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/50">
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                   <span className="material-symbols-outlined text-[16px] text-zinc-400">account_circle</span>
                   {t("utilities.signature.fields.showAvatar")}
                </span>
                <button 
                  onClick={() => setShowAvatar(!showAvatar)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                    showAvatar ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                    showAvatar ? "translate-x-5" : "translate-x-0"
                  } ${showAvatar ? "bg-white dark:bg-black" : "bg-white"}`} />
                </button>
              </div>
 
              <div className="flex items-center justify-between p-3 rounded-md bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/50">
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                   <span className="material-symbols-outlined text-[16px] text-zinc-400">qr_code_2</span>
                   {t("utilities.signature.fields.includeQr")}
                </span>
                <button 
                  onClick={() => setIncludeQrCode(!includeQrCode)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                    includeQrCode ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                    includeQrCode ? "translate-x-5" : "translate-x-0"
                  } ${includeQrCode ? "bg-white dark:bg-black" : "bg-white"}`} />
                </button>
              </div>
            </div>
 
            {/* Disclaimer */}
            <div className="pt-2">
              <label className="block text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider mb-2">
                {t("utilities.signature.fields.disclaimer")}
              </label>
              <select 
                value={signatureDisclaimer}
                onChange={(e) => setSignatureDisclaimer(e.target.value)}
                className="w-full p-3.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1a1824] text-[11px] font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500/30"
              >
                <option value="none">{t("utilities.signature.disclaimers.none")}</option>
                <option value="green">{t("utilities.signature.disclaimers.green")}</option>
                <option value="confidential">{t("utilities.signature.disclaimers.confidential")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="lg:col-span-7 flex flex-col h-full space-y-6">
          <h4 className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">visibility</span>
            {t("utilities.signature.previewTitle")}
          </h4>
          
          <div className="flex-1 bg-zinc-50 dark:bg-[#0f0e15] rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 shadow-inner overflow-hidden flex flex-col">
            {/* Email Header Mockup */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/80 px-5 py-3 space-y-2 text-[11px] text-zinc-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 font-mono text-[10px] tracking-wider text-zinc-400">New Message</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/40">
                <span className="font-semibold w-8 text-zinc-400">To:</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-300 font-medium">partner@example.com</span>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <span className="font-semibold w-8 text-zinc-400">Subj:</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-bold">{t("utilities.signature.emailSubject")}</span>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-8 bg-white overflow-x-auto flex-1 flex flex-col text-black">
              <div className="text-[13px] text-zinc-400 mb-12 font-medium">
                {t("utilities.signature.emailDear")}<br/><br/>
                {t("utilities.signature.emailBody")}<br/><br/>
                {t("utilities.signature.emailRegards")}
              </div>
              
              {/* === THE SIGNATURE ITSELF === */}
              <div id="email-signature-preview" className="text-black text-left" style={{ fontFamily, width: '100%', maxWidth: '580px' }}>
              
              {/* 1. LUXURY GOLD TEMPLATE */}
              {signatureTemplate === "luxury" && (
                <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%', borderTop: `2px solid ${signatureColor}`, borderBottom: `2px solid ${signatureColor}`, padding: '16px 0' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '20px 0' }}>
                        <table cellPadding="0" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              {showAvatar && (
                                <td style={{ verticalAlign: 'middle', paddingRight: '20px', width: '74px' }}>
                                  <img 
                                    src={bio?.avatarUrl || "https://res.cloudinary.com/dku1mdfd9/image/upload/v1716300000/default-avatar.png"} 
                                    alt="Avatar" 
                                    style={{ width: '74px', height: '74px', borderRadius: '6px', objectFit: 'cover', display: 'block', border: `1px solid ${signatureColor}` }} 
                                  />
                                </td>
                              )}
                              <td style={{ verticalAlign: 'middle' }}>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', letterSpacing: '0.5px' }}>{bio?.displayName || t("utilities.signature.fallbackName")}</div>
                                <div style={{ fontSize: '11px', color: signatureColor, fontWeight: 'bold', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '1px' }}>{bio?.jobTitle || t("utilities.signature.fallbackTitle")}</div>
                                
                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
                                  {bio?.phone && <span><span style={{ color: signatureColor, fontWeight: 'bold' }}>T:</span> {bio.phone} &bull; </span>}
                                  <span><span style={{ color: signatureColor, fontWeight: 'bold' }}>E:</span> {bio?.contactEmail || bio?.email}</span>
                                  <br />
                                  <span style={{ color: signatureColor, fontWeight: 'bold' }}>W:</span> <a href={publicLink} style={{ color: '#111827', textDecoration: 'none', fontWeight: 'bold' }}>{publicLink.replace(/^https?:\/\//, '')}</a>
                                </div>
                                <SocialIcons />
                              </td>

                              {includeQrCode && (
                                <td style={{ verticalAlign: 'middle', paddingLeft: '24px', width: '76px' }}>
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(publicLink)}&color=${signatureColor.replace('#','')}`} 
                                    alt="Bio QR" 
                                    style={{ width: '70px', height: '70px', display: 'block', border: `1px solid ${signatureColor}`, padding: '3px' }} 
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

              {/* 2. MODERN ACCENT TEMPLATE */}
              {signatureTemplate === "modern" && (
                <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    <tr>
                      {showAvatar && (
                        <td style={{ verticalAlign: 'top', paddingRight: '20px', borderRight: `3px solid ${signatureColor}`, width: '80px' }}>
                          <img 
                            src={bio?.avatarUrl || "https://res.cloudinary.com/dku1mdfd9/image/upload/v1716300000/default-avatar.png"} 
                            alt="Avatar" 
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} 
                          />
                        </td>
                      )}
                      <td style={{ verticalAlign: 'middle', paddingLeft: showAvatar ? '20px' : '0px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{bio?.displayName || t("utilities.signature.fallbackName")}</div>
                        <div style={{ fontSize: '11px', color: signatureColor, fontWeight: 'bold', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>{bio?.jobTitle || t("utilities.signature.fallbackTitle")}</div>
                        
                        <table cellPadding="0" cellSpacing="0" style={{ marginTop: '10px', fontSize: '12px', color: '#4b5563', borderCollapse: 'collapse', lineHeight: '1.5' }}>
                          <tbody>
                            {bio?.phone && (
                              <tr>
                                <td><strong style={{ color: '#1f2937' }}>Phone:</strong> {bio.phone}</td>
                              </tr>
                            )}
                            <tr>
                              <td><strong style={{ color: '#1f2937' }}>Email:</strong> {bio?.contactEmail || bio?.email}</td>
                            </tr>
                            <tr>
                              <td>
                                <strong style={{ color: '#1f2937' }}>Web:</strong> <a href={publicLink} style={{ color: signatureColor, textDecoration: 'none', fontWeight: 'bold' }}>{publicLink.replace(/^https?:\/\//, '')}</a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <SocialIcons />
                      </td>

                      {includeQrCode && (
                        <td style={{ verticalAlign: 'middle', paddingLeft: '24px', width: '76px' }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(publicLink)}`} 
                            alt="Bio QR" 
                            style={{ width: '70px', height: '70px', display: 'block', borderRadius: '8px' }} 
                          />
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              )}

              {/* 3. CORPORATE PRO TEMPLATE */}
              {signatureTemplate === "business" && (
                <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%', borderLeft: `4px solid ${signatureColor}`, paddingLeft: '16px' }}>
                  <tbody>
                    <tr>
                      <td style={{ paddingLeft: '16px' }}>
                        <div style={{ fontSize: '17px', fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: '1px' }}>{bio?.displayName || t("utilities.signature.fallbackName")}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontWeight: 'bold' }}>{bio?.jobTitle || t("utilities.signature.fallbackTitle")}</div>
                        
                        <div style={{ width: '60px', height: '2px', backgroundColor: signatureColor, margin: '12px 0' }} />
                        
                        <table cellPadding="0" cellSpacing="0" style={{ fontSize: '12px', color: '#4b5563', borderCollapse: 'collapse', lineHeight: '1.5' }}>
                          <tbody>
                            {bio?.phone && (
                              <tr>
                                <td style={{ paddingRight: '12px', color: signatureColor, fontWeight: 'bold' }}>P:</td>
                                <td>{bio.phone}</td>
                              </tr>
                            )}
                            <tr>
                              <td style={{ paddingRight: '12px', color: signatureColor, fontWeight: 'bold' }}>E:</td>
                              <td>{bio?.contactEmail || bio?.email}</td>
                            </tr>
                            <tr>
                              <td style={{ paddingRight: '12px', color: signatureColor, fontWeight: 'bold' }}>W:</td>
                              <td><a href={publicLink} style={{ color: '#111827', textDecoration: 'none', fontWeight: 'bold' }}>{publicLink.replace(/^https?:\/\//, '')}</a></td>
                            </tr>
                          </tbody>
                        </table>
                        <SocialIcons />
                      </td>

                      {includeQrCode && (
                        <td style={{ verticalAlign: 'middle', paddingLeft: '24px', width: '76px' }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(publicLink)}`} 
                            alt="Bio QR" 
                            style={{ width: '70px', height: '70px', display: 'block', border: '1px solid #e5e7eb', padding: '3px' }} 
                          />
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              )}

              {/* 4. MINIMALIST TEMPLATE */}
              {signatureTemplate === "minimal" && (
                <div style={{ borderTop: `1px solid #e5e7eb`, paddingTop: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                    {bio?.displayName || t("utilities.signature.fallbackName")} <span style={{ color: signatureColor, fontWeight: 'bold', fontSize: '12px' }}>| {bio?.jobTitle || t("utilities.signature.fallbackTitle")}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px', lineHeight: '1.6' }}>
                    {bio?.phone && <span><strong>M:</strong> {bio.phone} &bull; </span>}
                    <span><strong>E:</strong> {bio?.contactEmail || bio?.email}</span>
                    <br />
                    <strong>W:</strong> <a href={publicLink} style={{ color: '#111827', textDecoration: 'none', fontWeight: 'bold' }}>{publicLink}</a>
                  </div>
                  <SocialIcons />
                  {includeQrCode && (
                    <div style={{ marginTop: '12px' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(publicLink)}`} 
                        alt="Bio QR" 
                        style={{ width: '60px', height: '60px', display: 'block', border: '1px solid #e5e7eb', padding: '2px' }} 
                      />
                    </div>
                  )}
                </div>
              )}

              {/* DISCLAIMERS */}
              {signatureDisclaimer === "green" && (
                <div style={{ fontSize: '9px', color: '#10b981', marginTop: '20px', borderTop: '1px solid #f3f4f6', paddingTop: '10px', lineHeight: '1.4' }}>
                  <strong style={{ color: '#047857' }}>Please consider the environment before printing this email.</strong> Go green, keep it on screen!
                </div>
              )}
              {signatureDisclaimer === "confidential" && (
                <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '20px', borderTop: '1px solid #f3f4f6', paddingTop: '10px', lineHeight: '1.4', textAlign: 'justify' }}>
                  <strong style={{ color: '#6b7280' }}>CONFIDENTIALITY NOTICE:</strong> This email message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential and privileged information. Any unauthorized review, use, disclosure or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply email and destroy all copies of the original message.
                </div>
              )}

              </div>
              {/* === END SIGNATURE === */}
            </div>
          </div>

          {/* Action Buttons Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <button
              onClick={copySignatureToClipboard}
              className="py-4 rounded-md bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-black text-[11px] uppercase tracking-widest shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">content_copy</span> 
              {t("utilities.signature.copyBtn")}
            </button>
            <button
              onClick={downloadSignatureHTML}
              className="py-4 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-black text-[11px] uppercase tracking-widest shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">html</span> 
              {t("utilities.signature.downloadHtmlBtn")}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
