import React from "react";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import { motion } from "framer-motion";
import { RenderColoredText } from "../HugoLogo";

const BRAND_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#A855F7"];

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

const getPatternStyle = (pattern, bgColor) => {
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

export default React.memo(function DefaultTheme({ bio, isPreview = false }) {
  const themeObj = bio.theme || {};
  const bgColor = themeObj.bgColor || "#000000";
  const accentColor = themeObj.accentColor || "#ffffff";

  const btnStyle = (color = accentColor) => {
    let radius = "16px";
    if (themeObj.btnRadius !== undefined) radius = `${themeObj.btnRadius}px`;

    let style = {
      backgroundColor: color,
      color: isColorDark(color) ? "#ffffff" : "#000000",
      borderRadius: radius,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    };
    
    if (themeObj.btnBorderWidth > 0) {
      style.border = `${themeObj.btnBorderWidth}px solid ${isColorDark(color) ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`;
    }
    
    if (themeObj.btnShadow > 0) {
      style.boxShadow = `0 ${themeObj.btnShadow}px ${themeObj.btnShadow * 2}px ${color}40`;
    }
    return style;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <main 
      className={`${isPreview ? 'h-full' : 'h-[100dvh]'} w-full overflow-y-scroll snap-y snap-mandatory relative text-white bg-black scroll-smooth scrollbar-hide`}
      style={{ 
        backgroundColor: bgColor,
        ...getPatternStyle(themeObj.pattern, bgColor)
      }}
    >
      {/* Global Fixed Background (Avatar Image) */}
      <div className={`${isPreview ? 'absolute' : 'fixed'} inset-0 z-0 pointer-events-none`}>
        {bio.avatarUrl && (
          <motion.img 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={optimizeCloudinaryUrl(bio.avatarUrl, 800)} 
            alt="Cover" 
            className="w-full h-full object-cover" 
          />
        )}
        <div 
          className="absolute inset-0"
          style={getPatternStyle(themeObj.pattern, bgColor)}
        />
      </div>

      {/* SLIDE 1: HERO COVER */}
      <section className={`${isPreview ? 'h-full' : 'h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-end pb-12 px-6`}>
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent pointer-events-none" />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-4 px-4"
        >
          <motion.div variants={itemVariants} className="space-y-1 w-full drop-shadow-lg">
            <h1 className="font-serif text-3xl sm:text-4xl uppercase tracking-[0.15em] leading-tight we-bare-bears">
              <RenderColoredText text={bio.displayName} />
            </h1>
            {bio.headline && (
              <h2 className="text-[11px] sm:text-xs tracking-[0.3em] font-light text-white/80 uppercase mt-3 we-bare-bears">
                {bio.headline}
              </h2>
            )}
          </motion.div>

          {/* Scroll Down Indicator */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
            className="pt-8"
          >
            <span className="material-symbols-outlined text-3xl text-white/70">keyboard_arrow_down</span>
          </motion.div>
        </motion.div>
      </section>

      {/* SLIDE 2: INFO (Thông tin) */}
      {(bio.bio || bio.height || bio.weight || bio.measurements || bio.birthday || bio.address || bio.hobbies || bio.phone) && (
        <section className={`${isPreview ? 'min-h-full' : 'min-h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20`}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-lg pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6"
          >
            <motion.div variants={itemVariants} className="w-12 h-1 bg-white/20 rounded-full mb-1" />
            
            <motion.div variants={itemVariants} className="space-y-1.5 text-center drop-shadow-md">
              <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-bold text-white/50">
                <span className="material-symbols-outlined text-[11px] sm:text-xs text-white/40">fingerprint</span>
                IDENTITY PROFILE
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-[0.1em] font-serif we-bare-bears hugo-studio-gradient">
                Về Bản Thân
              </h3>
            </motion.div>
            
            {bio.bio && (
              <motion.div variants={itemVariants} className="relative w-full p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner text-left space-y-2 hover:bg-white/10 transition-colors">
                <span className="absolute -top-3 -left-1 font-serif text-4xl text-white/20 select-none">“</span>
                <p className="text-xs sm:text-sm leading-relaxed text-white/90 font-serif tracking-wide italic pl-4 pr-2">
                  {bio.bio}
                </p>
                <span className="absolute -bottom-7 -right-1 font-serif text-4xl text-white/20 select-none">”</span>
              </motion.div>
            )}

            <div className="w-full space-y-4">
              {/* Info Banner */}
              {(bio.height || bio.weight || bio.measurements) && (
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2.5 w-full">
                  {bio.height && (
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-105">
                      <span className="material-symbols-outlined text-white/70 mb-1 text-base">height</span>
                      <span className="text-[7px] uppercase tracking-[0.15em] text-white/40 mb-0.5">Chiều cao</span>
                      <p className="text-[10px] sm:text-xs font-serif font-bold tracking-widest text-white/95">{bio.height}</p>
                    </div>
                  )}
                  {bio.weight && (
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-105">
                      <span className="material-symbols-outlined text-white/70 mb-1 text-base">monitor_weight</span>
                      <span className="text-[7px] uppercase tracking-[0.15em] text-white/40 mb-0.5">Cân nặng</span>
                      <p className="text-[10px] sm:text-xs font-serif font-bold tracking-widest text-white/95">{bio.weight}</p>
                    </div>
                  )}
                  {bio.measurements && (
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-105">
                      <span className="material-symbols-outlined text-white/70 mb-1 text-base">straighten</span>
                      <span className="text-[7px] uppercase tracking-[0.15em] text-white/40 mb-0.5">Số đo</span>
                      <p className="text-[10px] sm:text-xs font-serif font-bold tracking-widest text-white/95">{bio.measurements}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Other details */}
              {(bio.birthday || bio.address || bio.hobbies || bio.phone) && (
                <motion.div variants={itemVariants} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-[10px] sm:text-xs space-y-3 text-left">
                  {bio.phone && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <span className="material-symbols-outlined text-sm">call</span>
                        <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Booking</span>
                      </div>
                      <p className="font-semibold tracking-wide text-white/90">{bio.phone}</p>
                    </div>
                  )}
                  {bio.birthday && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <span className="material-symbols-outlined text-sm">cake</span>
                        <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Ngày sinh</span>
                      </div>
                      <p className="font-semibold tracking-wide text-white/90">{bio.birthday}</p>
                    </div>
                  )}
                  {bio.address && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <span className="material-symbols-outlined text-sm">distance</span>
                        <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Khu vực</span>
                      </div>
                      <p className="font-semibold tracking-wide text-white/90">{bio.address}</p>
                    </div>
                  )}
                  {bio.hobbies && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 text-white/40 mt-0.5">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                        <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Sở thích</span>
                      </div>
                      <p className="font-semibold tracking-wide text-white/90 text-right max-w-[65%] leading-relaxed">{bio.hobbies}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </section>
      )}

      {/* SLIDE 2B: ACADEMIC & CAREER */}
      {(bio.education || bio.skills || bio.jobTitle || bio.contactEmail) && (
        <section className={`${isPreview ? 'min-h-full' : 'min-h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20`}>
          <div className="absolute inset-0 bg-black/45 backdrop-blur-lg pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6"
          >
            <motion.div variants={itemVariants} className="w-12 h-1 bg-white/20 rounded-full mb-1" />
            
            <motion.div variants={itemVariants} className="space-y-1.5 text-center drop-shadow-md">
              <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-bold text-white/50">
                <span className="material-symbols-outlined text-[11px] sm:text-xs text-white/40">school</span>
                PORTFOLIO PROFILE
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-[0.1em] font-serif we-bare-bears hugo-studio-gradient">
                Học vấn & Sự nghiệp
              </h3>
            </motion.div>
            
            <motion.div variants={itemVariants} className="w-full space-y-4">
              <div className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-[10px] sm:text-xs space-y-3.5 text-left">
                {bio.jobTitle && (
                  <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-1.5 text-white/40 mt-0.5">
                      <span className="material-symbols-outlined text-sm">work</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Công việc</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90 text-right max-w-[65%]">{bio.jobTitle}</p>
                  </div>
                )}
                {bio.education && (
                  <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-1.5 text-white/40 mt-0.5">
                      <span className="material-symbols-outlined text-sm">history_edu</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Học vấn</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90 text-right max-w-[65%]">{bio.education}</p>
                  </div>
                )}
                {bio.skills && (
                  <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-1.5 text-white/40 mt-0.5">
                      <span className="material-symbols-outlined text-sm">psychology</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Kỹ năng</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90 text-right max-w-[65%]">{bio.skills}</p>
                  </div>
                )}
                {bio.contactEmail && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <span className="material-symbols-outlined text-sm">mail</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Email LH</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90 break-all text-right max-w-[65%]">{bio.contactEmail}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* SLIDE: PROJECTS & SERVICES */}
      {((bio.projects && bio.projects.length > 0) || (bio.services && bio.services.length > 0)) && (
        <section className={`${isPreview ? 'min-h-full' : 'min-h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20`}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-lg pointer-events-none" />
          
          <div className="relative z-20 w-full max-w-md mx-auto space-y-10">
            {/* PROJECTS */}
            {bio.projects && bio.projects.length > 0 && (
              <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                variants={containerVariants}
                className="space-y-6"
              >
                <div className="space-y-1.5 text-center drop-shadow-md">
                  <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-bold text-white/50">
                    <span className="material-symbols-outlined text-[11px] sm:text-xs text-white/40">folder_special</span>
                    PROJECT SHOWCASE
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-[0.1em] font-serif we-bare-bears hugo-studio-gradient">
                    Dự Án Nổi Bật
                  </h3>
                </div>

                <div className="grid gap-4">
                  {bio.projects.map((proj, idx) => (
                    <motion.div key={idx} variants={itemVariants} className="p-4 flex gap-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-all group">
                      {proj.imageUrl && (
                        <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-white/5 relative">
                          <img loading="lazy" src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="font-serif font-black text-white text-sm truncate tracking-wide">{proj.title}</h4>
                        <p className="text-white/60 text-[10px] mt-1 line-clamp-2 leading-relaxed">{proj.description}</p>
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[10px] font-bold text-white/40 uppercase tracking-wider group-hover:text-white transition-colors">
                            Xem chi tiết →
                          </a>
                        )}
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
                viewport={{ once: true, margin: "-50px" }}
                variants={containerVariants}
                className="space-y-6"
              >
                <div className="space-y-1.5 text-center drop-shadow-md">
                  <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-bold text-white/50">
                    <span className="material-symbols-outlined text-[11px] sm:text-xs text-white/40">sell</span>
                    OUR SERVICES
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-[0.1em] font-serif we-bare-bears hugo-studio-gradient">
                    Dịch Vụ Báo Giá
                  </h3>
                </div>

                <div className="grid gap-4">
                  {bio.services.map((srv, idx) => (
                    <motion.div key={idx} variants={itemVariants} className="p-4 flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:scale-[1.02] transition-all cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70">
                          <span className="material-symbols-outlined text-[18px]">{srv.icon || "design_services"}</span>
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-white text-xs tracking-wide">{srv.name}</h4>
                          <p className="text-white/50 text-[9px] font-medium uppercase tracking-wider mt-0.5">{srv.description}</p>
                          {srv.link && (
                            <a href={srv.link.startsWith("http") ? srv.link : `https://${srv.link}`} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[10px] font-bold text-white/60 hover:text-white underline">
                              Xem chi tiết →
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="font-serif font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg text-[10px] backdrop-blur-md border border-white/5 shadow-sm">
                          {srv.price}
                        </div>
                        {/* Explicitly do NOT render service images; only links are allowed for services */}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* SLIDE 3: LINKS & TABS */}
      <section className={`${isPreview ? 'min-h-full' : 'min-h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-lg pointer-events-none" />
        
        <div className="relative z-20 w-full max-w-md mx-auto space-y-8">
          <div className="space-y-1.5 text-center drop-shadow-md">
            <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-bold text-white/50">
              <span className="material-symbols-outlined text-[11px] sm:text-xs text-white/40">link</span>
              QUICK ACCESS
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-[0.1em] font-serif we-bare-bears hugo-studio-gradient">
              Liên Kết Nhanh
            </h3>
          </div>

          {/* Buttons List */}
          {bio.links && bio.links.length > 0 && (
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerVariants}
              className="space-y-3.5"
            >
              {bio.links.map((link, idx) => {
                const color = BRAND_COLORS[idx % BRAND_COLORS.length];
                return (
                  <motion.a
                    key={idx}
                    variants={itemVariants}
                    href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={btnStyle(color)}
                    className="block w-full py-4 px-6 text-center text-xs font-bold tracking-widest backdrop-blur-md relative overflow-hidden group"
                  >
                    <span className="relative z-10">{link.label}</span>
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.a>
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
                <motion.div key={idx} variants={itemVariants} className="w-full p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg text-left hover:bg-white/10 transition-colors">
                  <h4 className="font-serif font-black uppercase tracking-widest text-sm mb-3 text-white/90 drop-shadow-sm">{tab.title}</h4>
                  <div className="w-8 h-0.5 bg-white/20 mb-4" />
                  <p className="text-xs leading-relaxed whitespace-pre-wrap font-light text-white/80">{tab.content}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* SLIDE 4: HUGO STUDIO FOOTER */}
      <section className={`${isPreview ? 'h-full' : 'h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 bg-[#09090b] text-white`}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 max-w-sm w-full mx-auto space-y-6 text-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <h3 className="text-2xl font-black tracking-tight uppercase we-bare-bears hugo-studio-gradient drop-shadow-md">HUGO STUDIO</h3>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Professional Booking & Management</p>
          
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/" 
            className="inline-block px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white border border-white/20 rounded-full hover:bg-white/10 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            TẠO NGAY BIO
          </motion.a>
          
          <div className="pt-4 border-t border-white/10 mt-4 text-[9px] opacity-60">
            Sản phẩm được phát triển bởi Hugo Studio
          </div>
        </motion.div>
      </section>
    </main>
  );
});
