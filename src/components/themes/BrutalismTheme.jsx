import React from "react";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import { motion } from "framer-motion";
import HugoLogo from "../HugoLogo";

const BRUTAL_COLORS = ["#FF3333", "#00E676", "#2979FF", "#D500F9", "#FFEA00"];

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

const getBrutalPatternStyle = (pattern, bgColor) => {
  const isDark = isColorDark(bgColor);
  const lineColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  
  if (pattern === "dots") {
    return {
      backgroundImage: `radial-gradient(${lineColor} 2px, transparent 2px)`,
      backgroundSize: "24px 24px"
    };
  }
  if (pattern === "grid") {
    return {
      backgroundImage: `linear-gradient(${lineColor} 2px, transparent 2px), linear-gradient(90deg, ${lineColor} 2px, transparent 2px)`,
      backgroundSize: "32px 32px"
    };
  }
  return {};
};

export default React.memo(function BrutalismTheme({ bio, isPreview = false }) {
  const themeObj = bio.theme || {};
  const bgColor = themeObj.bgColor || "#000000";
  const accentColor = themeObj.accentColor || "#ffffff";
  const effectiveBgColor = (bgColor === "#000000" || !themeObj.bgColor) ? "#facc15" : bgColor;
  const isDark = isColorDark(effectiveBgColor);

  const brutalCardStyle = {
    backgroundColor: isDark ? "#121212" : "#ffffff",
    color: isDark ? "#ffffff" : "#000000",
    border: `3px solid ${isDark ? "#ffffff" : "#000000"}`,
    boxShadow: `5px 5px 0px 0px ${isDark ? "#ffffff" : "#000000"}`,
    borderRadius: "0px"
  };

  const brutalBtnStyle = (color = accentColor) => ({
    backgroundColor: color,
    color: isColorDark(color) ? "#ffffff" : "#000000",
    border: `3px solid ${isDark ? "#ffffff" : "#000000"}`,
    boxShadow: `4px 4px 0px 0px ${isDark ? "#ffffff" : "#000000"}`,
    borderRadius: "0px",
    fontWeight: "900",
    transition: "all 0.1s ease"
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { scale: 0.8, opacity: 0, rotate: -2 },
    show: { scale: 1, opacity: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 10 } }
  };

  return (
    <main 
      className={`${isPreview ? 'h-full' : 'h-[100dvh]'} w-full overflow-y-scroll snap-y snap-mandatory relative text-white bg-black scroll-smooth scrollbar-hide`}
      style={{ 
        backgroundColor: effectiveBgColor,
        ...getBrutalPatternStyle(themeObj.pattern, effectiveBgColor)
      }}
    >
      {/* Global Fixed Background (Avatar Image) */}
      <div className={`${isPreview ? 'absolute' : 'fixed'} inset-0 z-0 pointer-events-none`}>
        {bio.avatarUrl && (
          <img loading="lazy" src={optimizeCloudinaryUrl(bio.avatarUrl, 800)} alt="Cover" className="w-full h-full object-cover opacity-85" />
        )}
        <div 
          className="absolute inset-0"
          style={getBrutalPatternStyle(themeObj.pattern, effectiveBgColor)}
        />
      </div>

      {/* SLIDE 1: HERO COVER */}
      <section className={`${isPreview ? 'h-full' : 'h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6`}>
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-20 w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-6"
        >
          {bio.avatarUrl ? (
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.05, rotate: 2 }}
              style={{
                border: `3px solid ${isDark ? "#ffffff" : "#000000"}`,
                boxShadow: `5px 5px 0px 0px ${isDark ? "#ffffff" : "#000000"}`
              }}
              className="w-32 h-32 overflow-hidden rotate-2 transform transition-transform duration-300"
            >
              <img loading="lazy" src={optimizeCloudinaryUrl(bio.avatarUrl, 300)} alt="Avatar" className="w-full h-full object-cover" />
            </motion.div>
          ) : (
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.05, rotate: 2 }}
              style={{
                border: `3px solid ${isDark ? "#ffffff" : "#000000"}`,
                boxShadow: `5px 5px 0px 0px ${isDark ? "#ffffff" : "#000000"}`
              }}
              className="w-32 h-32 rotate-2 bg-zinc-200 flex items-center justify-center"
            >
              <HugoLogo className="text-lg sm:text-xl" />
            </motion.div>
          )}

          <motion.div variants={itemVariants} style={brutalCardStyle} className="p-6 w-full -rotate-1 transform">
            <h1 className="font-mono text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none">
              {bio.displayName}
            </h1>
            {bio.headline && (
              <div className="mt-3 px-3 py-1 bg-black text-white dark:bg-white dark:text-black inline-block text-[10px] font-mono font-bold uppercase tracking-wider border-2 border-black dark:border-white">
                {bio.headline}
              </div>
            )}
          </motion.div>

          {/* Scroll Down Indicator */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.6 }}
            className="pt-4 text-white/70"
          >
            <span className="material-symbols-outlined text-3xl">keyboard_arrow_down</span>
          </motion.div>
        </motion.div>
      </section>

      {/* SLIDE 2: INFO (Thông tin) */}
      {(bio.bio || bio.height || bio.weight || bio.measurements || bio.birthday || bio.address || bio.hobbies || bio.phone) && (
        <section className={`${isPreview ? 'min-h-full' : 'min-h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20`}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-md pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6"
          >
            <motion.div variants={itemVariants} className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black text-xs font-mono font-black uppercase border-3 border-black dark:border-white tracking-widest shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
              VỀ BẢN THÂN
            </motion.div>
            
            {bio.bio && (
              <motion.div variants={itemVariants} style={brutalCardStyle} className="p-5 w-full text-left font-mono">
                <p className="text-xs sm:text-sm leading-relaxed">
                  {bio.bio}
                </p>
              </motion.div>
            )}

            <div className="w-full space-y-4">
              {/* Info Banner */}
              {(bio.height || bio.weight || bio.measurements) && (
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 w-full">
                  {bio.height && (
                    <div style={brutalCardStyle} className="p-3 flex flex-col items-center justify-center hover:bg-black hover:text-white transition-colors cursor-default">
                      <span className="text-[7px] uppercase tracking-wider font-bold opacity-60">Chiều cao</span>
                      <p className="text-xs font-black mt-1">{bio.height}</p>
                    </div>
                  )}
                  {bio.weight && (
                    <div style={brutalCardStyle} className="p-3 flex flex-col items-center justify-center hover:bg-black hover:text-white transition-colors cursor-default">
                      <span className="text-[7px] uppercase tracking-wider font-bold opacity-60">Cân nặng</span>
                      <p className="text-xs font-black mt-1">{bio.weight}</p>
                    </div>
                  )}
                  {bio.measurements && (
                    <div style={brutalCardStyle} className="p-3 flex flex-col items-center justify-center hover:bg-black hover:text-white transition-colors cursor-default">
                      <span className="text-[7px] uppercase tracking-wider font-bold opacity-60">Số đo</span>
                      <p className="text-xs font-black mt-1 truncate w-full text-center">{bio.measurements}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Other details */}
              {(bio.birthday || bio.address || bio.hobbies || bio.phone) && (
                <motion.div variants={itemVariants} style={brutalCardStyle} className="p-4 text-[10px] sm:text-xs space-y-3.5 text-left font-mono">
                  {bio.phone && (
                    <div className="flex items-center justify-between border-b border-black/20 dark:border-white/20 pb-2">
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Booking</span>
                      <p className="font-bold opacity-90">{bio.phone}</p>
                    </div>
                  )}
                  {bio.birthday && (
                    <div className="flex items-center justify-between border-b border-black/20 dark:border-white/20 pb-2">
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Ngày sinh</span>
                      <p className="font-bold opacity-90">{bio.birthday}</p>
                    </div>
                  )}
                  {bio.address && (
                    <div className="flex items-center justify-between border-b border-black/20 dark:border-white/20 pb-2">
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Khu vực</span>
                      <p className="font-bold opacity-90">{bio.address}</p>
                    </div>
                  )}
                  {bio.hobbies && (
                    <div className="flex items-start justify-between">
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70 mt-0.5">Sở thích</span>
                      <p className="font-bold opacity-90 text-right max-w-[65%] leading-relaxed">{bio.hobbies}</p>
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
          <div className="absolute inset-0 bg-black/35 backdrop-blur-md pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6"
          >
            <motion.div variants={itemVariants} className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black text-xs font-mono font-black uppercase border-3 border-black dark:border-white tracking-widest shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
              HỌC VẤN & SỰ NGHIỆP
            </motion.div>
            
            <motion.div variants={itemVariants} style={brutalCardStyle} className="p-4 w-full text-[10px] sm:text-xs space-y-3 text-left font-mono hover:-translate-y-1 hover:translate-x-1 hover:shadow-[1px_1px_0px_0px_#000] dark:hover:shadow-[1px_1px_0px_0px_#fff] transition-all duration-200">
              {bio.jobTitle && (
                <div className="flex items-start justify-between border-b border-black/20 dark:border-white/20 pb-2.5">
                  <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Công việc</span>
                  <p className="font-semibold opacity-90 text-right max-w-[65%]">{bio.jobTitle}</p>
                </div>
              )}
              {bio.education && (
                <div className="flex items-start justify-between border-b border-black/20 dark:border-white/20 pb-2.5">
                  <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Học vấn</span>
                  <p className="font-semibold opacity-90 text-right max-w-[65%]">{bio.education}</p>
                </div>
              )}
              {bio.skills && (
                <div className="flex items-start justify-between border-b border-black/20 dark:border-white/20 pb-2.5">
                  <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Kỹ năng</span>
                  <p className="font-semibold opacity-90 text-right max-w-[65%]">{bio.skills}</p>
                </div>
              )}
              {bio.contactEmail && (
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Email LH</span>
                  <p className="font-semibold opacity-90 break-all text-right max-w-[65%]">{bio.contactEmail}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* SLIDE: PROJECTS & SERVICES */}
      {((bio.projects && bio.projects.length > 0) || (bio.services && bio.services.length > 0)) && (
        <section className={`${isPreview ? 'min-h-full' : 'min-h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20`}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-none" />
          
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
                <div className="text-center">
                  <span className="px-4 py-1.5 bg-white text-black text-xs font-mono font-black uppercase border-3 border-black tracking-widest shadow-[3px_3px_0px_0px_#000]">
                    DỰ ÁN
                  </span>
                </div>
                <div className="grid gap-4">
                  {bio.projects.map((proj, idx) => (
                    <motion.div key={idx} variants={itemVariants} style={brutalCardStyle} className="p-4 flex gap-4 bg-white text-black hover:bg-black hover:text-white group transition-colors duration-300">
                      {proj.imageUrl && (
                        <div className="w-20 h-20 shrink-0 border-2 border-current bg-zinc-200">
                          <img loading="lazy" src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="font-mono font-black text-sm uppercase truncate">{proj.title}</h4>
                        <p className="font-mono text-[10px] mt-1 line-clamp-2 opacity-80">{proj.description}</p>
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider underline">
                            Truy cập →
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
                <div className="text-center">
                  <span className="px-4 py-1.5 bg-[#FFEA00] text-black text-xs font-mono font-black uppercase border-3 border-black tracking-widest shadow-[3px_3px_0px_0px_#000]">
                    DỊCH VỤ
                  </span>
                </div>
                <div className="grid gap-4">
                  {bio.services.map((srv, idx) => (
                    <motion.div key={idx} variants={itemVariants} style={brutalCardStyle} className="p-4 flex items-center justify-between bg-white text-black hover:-translate-y-1 transition-transform">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-black">{srv.icon || "sell"}</span>
                        <div>
                          <h4 className="font-mono font-black text-xs uppercase">{srv.name}</h4>
                          <p className="font-mono text-[9px] font-bold opacity-70 uppercase">{srv.description}</p>
                          {srv.link && (
                            <a href={srv.link.startsWith("http") ? srv.link : `https://${srv.link}`} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[10px] font-bold underline">
                              Truy cập dịch vụ →
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="font-mono font-black text-white bg-black px-2 py-1 border-2 border-black text-[10px]">
                          {srv.price}
                        </div>
                        {/* Services do not support image uploads — only links are shown */}
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
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-none" />
        
        <div className="relative z-20 w-full max-w-md mx-auto space-y-8">
          <div className="text-center">
            <span className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black text-xs font-mono font-black uppercase border-3 border-black dark:border-white tracking-widest shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
              LIÊN KẾT
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
                const color = BRUTAL_COLORS[idx % BRUTAL_COLORS.length];
                
                return (
                  <motion.a
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, x: -4, y: -4, boxShadow: `8px 8px 0px 0px ${isDark ? "#ffffff" : "#000000"}` }}
                    whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: `2px 2px 0px 0px ${isDark ? "#ffffff" : "#000000"}` }}
                    href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={brutalBtnStyle(color)}
                    className="block w-full py-4 px-6 text-center text-xs font-mono uppercase tracking-widest"
                  >
                    {link.label}
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
              className="mt-12 space-y-6"
            >
              {bio.tabs.map((tab, idx) => (
                <motion.div key={idx} variants={itemVariants} style={brutalCardStyle} className="p-5 font-mono">
                  <h4 className="font-black uppercase tracking-widest text-sm mb-3 border-b-3 border-current pb-2">{tab.title}</h4>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap font-bold opacity-90">{tab.content}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* SLIDE 4: HUGO STUDIO FOOTER */}
      <section className={`${isPreview ? 'h-full' : 'h-[100dvh]'} w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 bg-black text-white`}>
        <motion.div 
          initial={{ opacity: 0, rotate: -5, scale: 0.8 }}
          whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
          viewport={{ once: true }}
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            border: "4px solid #ffffff",
            borderRadius: "0px"
          }} 
          className="p-8 max-w-sm w-full mx-auto space-y-6 text-center font-mono hover:invert transition-all duration-300"
        >
          <h3 className="text-3xl font-black tracking-tight uppercase">HUGO STUDIO</h3>
          <p className="text-[10px] font-bold uppercase tracking-wider">Professional Booking</p>
          
          <a 
            href="/" 
            style={brutalBtnStyle("#000000")} 
            className="inline-block px-8 py-3.5 text-xs text-white border-3 border-black !shadow-[4px_4px_0px_0px_#FF3333]"
          >
            TẠO NGAY BIO
          </a>
          
          <div className="pt-4 border-t-3 border-black mt-4 text-[9px] font-bold uppercase">
            Phát triển bởi Hugo Studio
          </div>
        </motion.div>
      </section>
    </main>
  );
}
);
