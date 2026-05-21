import React from "react";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import { motion } from "framer-motion";
import HugoLogo from "../HugoLogo";

const FLAT_COLORS = ["#FF4B4B", "#3b82f6", "#10b981", "#ff5f00", "#8b5cf6"];

const isColorDark = (color) => {
  if (!color) return false;
  const c = color.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128;
};

const getFlatPatternStyle = (pattern, bgColor) => {
  if (pattern === "dots") {
    return {
      backgroundImage: `radial-gradient(${isColorDark(bgColor) ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"} 2px, transparent 2px)`,
      backgroundSize: "24px 24px"
    };
  }
  if (pattern === "grid") {
    return {
      backgroundImage: `linear-gradient(${isColorDark(bgColor) ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} 2px, transparent 2px), linear-gradient(90deg, ${isColorDark(bgColor) ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} 2px, transparent 2px)`,
      backgroundSize: "32px 32px"
    };
  }
  return {};
};

export default React.memo(function FlatTheme({ bio, isPreview = false }) {
  const themeObj = bio.theme || {};
  const flatBgColor = (themeObj.bgColor === "#000000" || !themeObj.bgColor) ? "#f1f5f9" : themeObj.bgColor;
  const accentColor = themeObj.accentColor || "#ffffff";

  const flatBtnStyle = (color = accentColor) => ({
    backgroundColor: color,
    color: isColorDark(color) ? "#ffffff" : "#111111",
    border: "none",
    boxShadow: "none",
    borderRadius: "12px",
    fontWeight: "700",
    transition: "transform 0.1s ease"
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", bounce: 0.4 } }
  };

  return (
    <main 
      className={`${isPreview ? 'h-full' : 'h-[100dvh]'} w-full overflow-y-scroll snap-y snap-mandatory relative text-black scroll-smooth scrollbar-hide`}
      style={{ backgroundColor: flatBgColor }}
    >
      {/* Global Fixed Background (Avatar Image) */}
      <div className={`${isPreview ? 'absolute' : 'fixed'} inset-0 z-0 pointer-events-none`}>
        {bio.avatarUrl && (
          <motion.img 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ duration: 1.5 }}
            src={optimizeCloudinaryUrl(bio.avatarUrl, 800)} 
            alt="Cover" 
            className="w-full h-full object-cover" 
          />
        )}
      </div>

      {/* SLIDE 1: HERO COVER */}
      <section 
        style={{ 
          backgroundColor: flatBgColor,
          ...getFlatPatternStyle(themeObj.pattern, flatBgColor)
        }}
        className={`${isPreview ? 'h-full' : 'h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 shrink-0 transition-colors duration-500`}
      >
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6"
        >
          {/* Overlapping Background Banner Collage for avatar */}
          <motion.div variants={itemVariants} className="relative w-36 h-36 flex items-center justify-center group">
            <div className="absolute w-32 h-32 bg-[#00f0ff] rounded-2xl rotate-6 transform border-2 border-black group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute w-32 h-32 bg-[#ff007f] rounded-2xl -rotate-6 transform border-2 border-black group-hover:-rotate-12 transition-transform duration-300" />
            <div className="absolute w-32 h-32 bg-[#ffff00] rounded-2xl rotate-12 transform border-2 border-black group-hover:rotate-0 transition-transform duration-300" />
            
            {bio.avatarUrl ? (
              <div className="relative w-28 h-28 overflow-hidden rounded-full border-3 border-black z-10 bg-white">
                <img loading="lazy" src={optimizeCloudinaryUrl(bio.avatarUrl, 300)} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="relative w-28 h-28 rounded-full border-3 border-black z-10 bg-zinc-200 flex items-center justify-center">
                <HugoLogo className="text-sm" />
              </div>
            )
          }
          </motion.div>

          {/* Overlapping Banners for Name & Headline */}
          <motion.div variants={itemVariants} className="relative w-full py-4 flex flex-col items-center">
            <div className="relative bg-[#ffff00] text-black border-2.5 border-black px-6 py-3 rounded-xl rotate-[-2deg] z-10 shadow-none hover:rotate-0 transition-transform duration-300">
              <h1 className="font-serif text-2xl sm:text-3xl uppercase tracking-wider leading-none font-black we-bare-bears">
                {bio.displayName}
              </h1>
            </div>

            {bio.headline && (
              <div className="relative bg-[#00f0ff] text-black border-2 border-black px-4 py-1.5 rounded-lg rotate-[3deg] -mt-2.5 z-20 shadow-none font-bold uppercase text-[10px] tracking-wider font-mono hover:rotate-0 transition-transform duration-300">
                {bio.headline}
              </div>
            )}
          </motion.div>

          {/* Slide Indicator arrow */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ repeat: Infinity, repeatType: "mirror", duration: 1 }}
            className="pt-2 text-slate-850 dark:text-white"
          >
            <span className="material-symbols-outlined text-lg">keyboard_double_arrow_down</span>
          </motion.div>
        </motion.div>
      </section>

      {/* SLIDE 2: ACADEMIC & CAREER */}
      {(bio.education || bio.skills || bio.jobTitle || bio.contactEmail) && (
        <section 
          style={{ 
            backgroundColor: "#00f0ff",
            ...getFlatPatternStyle(themeObj.pattern, "#00f0ff")
          }}
          className={`${isPreview ? 'min-h-full' : 'min-h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 shrink-0 transition-colors duration-500`}
        >
          <div className="absolute inset-0 bg-black/5 pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center space-y-6"
          >
            <div className="px-4 py-1.5 bg-[#ffff00] text-black text-xs font-black uppercase tracking-widest rounded-lg border-2 border-black rotate-[-1deg]">
              HỌC VẤN & SỰ NGHIỆP
            </div>
            
            <div className="relative w-full group">
              <div className="absolute inset-0 bg-[#ff007f] rounded-3xl -rotate-1.5 translate-x-[-2px] translate-y-[2px] border-2.5 border-black pointer-events-none group-hover:-rotate-3 transition-transform duration-300" />
              
              <div 
                style={{
                  backgroundColor: "#ffffff",
                  color: "#111111",
                  border: "2.5px solid #000000",
                  borderRadius: "18px"
                }}
                className="relative z-10 p-6 w-full text-xs space-y-3.5 text-left font-bold"
              >
                {bio.jobTitle && (
                  <div className="flex items-start justify-between border-b border-black/10 pb-2.5">
                    <span className="uppercase tracking-widest text-[9px] font-bold opacity-60">Công việc</span>
                    <p className="font-bold text-right max-w-[65%] leading-tight break-words">{bio.jobTitle}</p>
                  </div>
                )}
                {bio.education && (
                  <div className="flex items-start justify-between border-b border-black/10 pb-2.5">
                    <span className="uppercase tracking-widest text-[9px] font-bold opacity-60">Học vấn</span>
                    <p className="font-bold text-right max-w-[65%] leading-tight break-words">{bio.education}</p>
                  </div>
                )}
                {bio.skills && (
                  <div className="flex items-start justify-between border-b border-black/10 pb-2.5">
                    <span className="uppercase tracking-widest text-[9px] font-bold opacity-60">Kỹ năng</span>
                    <p className="font-bold text-right max-w-[65%] leading-tight break-words">{bio.skills}</p>
                  </div>
                )}
                {bio.contactEmail && (
                  <div className="flex items-start justify-between">
                    <span className="uppercase tracking-widest text-[9px] font-bold opacity-60">Email LH</span>
                    <p className="font-bold break-all text-right max-w-[65%]">{bio.contactEmail}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* SLIDE: PROJECTS & SERVICES */}
      {((bio.projects && bio.projects.length > 0) || (bio.services && bio.services.length > 0)) && (
        <section 
          style={{ 
            backgroundColor: "#ff007f",
            ...getFlatPatternStyle(themeObj.pattern, "#ff007f")
          }}
          className={`${isPreview ? 'min-h-full' : 'min-h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20 shrink-0 transition-colors duration-500`}
        >
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          
          <div className="relative z-20 w-full max-w-md mx-auto space-y-10">
            {/* PROJECTS */}
            {bio.projects && bio.projects.length > 0 && (
              <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={containerVariants}
                className="space-y-6"
              >
                <div className="text-center">
                  <span className="px-4 py-1.5 bg-[#ffff00] text-black text-xs font-black uppercase tracking-widest rounded-lg border-2 border-black rotate-[2deg]">
                    DỰ ÁN NỔI BẬT
                  </span>
                </div>
                <div className="grid gap-4">
                  {bio.projects.map((proj, idx) => (
                    <motion.div key={idx} variants={itemVariants} className="relative w-full group">
                      <div className="absolute inset-0 bg-black rounded-xl translate-x-2 translate-y-2 border border-black pointer-events-none" />
                      <div className="relative z-10 bg-white border-2 border-black rounded-xl p-4 flex gap-4 transition-transform transform group-hover:-translate-y-1">
                        {proj.imageUrl && (
                          <div className="w-20 h-20 shrink-0 border-2 border-black rounded-lg overflow-hidden bg-zinc-100">
                            <img loading="lazy" src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="font-black text-black text-sm truncate">{proj.title}</h4>
                          <p className="text-zinc-600 text-[10px] mt-1 line-clamp-2">{proj.description}</p>
                          {proj.link && (
                            <a href={proj.link} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[10px] font-bold text-[#3b82f6] hover:underline uppercase tracking-wider">
                              Xem chi tiết →
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SERVICES */}
            {bio.services && bio.services.length > 0 && (
              <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={containerVariants}
                className="space-y-6"
              >
                <div className="text-center">
                  <span className="px-4 py-1.5 bg-[#00f0ff] text-black text-xs font-black uppercase tracking-widest rounded-lg border-2 border-black rotate-[-2deg]">
                    DỊCH VỤ CUNG CẤP
                  </span>
                </div>
                <div className="grid gap-4">
                  {bio.services.map((srv, idx) => (
                    <motion.div key={idx} variants={itemVariants} className="relative w-full group">
                      <div className="absolute inset-0 bg-black rounded-xl translate-x-1.5 translate-y-1.5 border border-black pointer-events-none" />
                      <div className="relative z-10 bg-[#ffff00] border-2 border-black rounded-xl p-4 flex items-center justify-between transition-transform transform group-hover:-translate-y-1">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-black">{srv.icon || "design_services"}</span>
                          <div>
                            <h4 className="font-black text-black text-xs">{srv.name}</h4>
                            <p className="text-black/70 text-[9px] font-bold uppercase">{srv.description}</p>
                            {srv.link && (
                              <a href={srv.link.startsWith("http") ? srv.link : `https://${srv.link}`} target="_blank" rel="noreferrer" className="block mt-2 text-[10px] font-bold text-[#3b82f6] underline">
                                Xem chi tiết →
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="font-black text-black bg-white px-2 py-1 border-2 border-black rounded-md text-[10px]">
                            {srv.price}
                          </div>
                          {/* Services: images are not allowed; only links will be shown */}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* SLIDE: LINKS & TABS */}
      <section 
        style={{ 
          backgroundColor: "#ffff00",
          ...getFlatPatternStyle(themeObj.pattern, "#ffff00")
        }}
        className={`${isPreview ? 'min-h-full' : 'min-h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20 shrink-0 transition-colors duration-500`}
      >
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        
        <div className="relative z-20 w-full max-w-md mx-auto space-y-6">
          <div className="text-center mb-8">
            <span className="px-4 py-1.5 bg-[#ff007f] text-white text-xs font-black uppercase tracking-widest rounded-lg border-2 border-black rotate-[1deg]">
              LIÊN KẾT & THÔNG TIN
            </span>
          </div>

          {/* Buttons List */}
          {bio.links && bio.links.length > 0 && (
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerVariants}
              className="space-y-4"
            >
              {bio.links.map((link, idx) => {
                const color = FLAT_COLORS[idx % FLAT_COLORS.length];
                const rotation = idx % 2 === 0 ? "rotate-1" : "-rotate-1";
                
                return (
                  <motion.div key={idx} variants={itemVariants} className="relative w-full">
                    {/* Background overlapping black/dark layer for flat effect */}
                    <div className="absolute inset-0 bg-black rounded-xl translate-x-1.5 translate-y-1.5 border border-black pointer-events-none" />
                    
                    <a
                      href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={flatBtnStyle(color)}
                      className={`relative z-10 block w-full py-4 px-6 text-center text-xs font-black uppercase tracking-widest border-2 border-black transform transition-transform hover:-translate-y-1 ${rotation}`}
                    >
                      {link.label}
                    </a>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Tabs Content */}
          {bio.tabs && bio.tabs.length > 0 && (
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={containerVariants}
              className="mt-12 space-y-4"
            >
              {bio.tabs.map((tab, idx) => (
                <motion.div key={idx} variants={itemVariants} className="relative w-full">
                  <div className="absolute inset-0 bg-[#00f0ff] rounded-2xl translate-x-[-3px] translate-y-[3px] border-2 border-black pointer-events-none" />
                  <div className="relative z-10 bg-white border-2 border-black rounded-2xl p-5 text-black">
                    <h4 className="font-black uppercase tracking-widest text-sm mb-3 border-b-2 border-black/10 pb-2">{tab.title}</h4>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">{tab.content}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* SLIDE: HUGO STUDIO FOOTER */}
      <section className={`${isPreview ? 'h-full' : 'h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 shrink-0 bg-[#09090b] text-white`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{
            backgroundColor: "#1c1c1e",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px"
          }} className="p-8 max-w-sm w-full mx-auto space-y-6 text-center font-mono"
        >
          <h3 className="text-2xl font-black tracking-tight uppercase we-bare-bears">HUGO STUDIO</h3>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Professional Booking & Management</p>
          
          <a 
            href="/" 
            style={flatBtnStyle("#ffffff")} 
            className="inline-block px-8 py-3.5 text-xs text-black border-2 border-black hover:bg-zinc-200 transition-colors"
          >
            TẠO NGAY BIO
          </a>
          
          <div className="pt-4 border-t border-white/10 mt-4 text-[9px] opacity-60">
            Sản phẩm được phát triển bởi Hugo Studio
          </div>
        </motion.div>
      </section>
    </main>
  );
});
