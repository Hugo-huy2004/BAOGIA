/**
 * HUGO WISHPAX STUDIO - Premium Interactive Script
 * Built with sparkles and custom web audio interactions
 */

// Global Configuration
const CONFIG = {
    zaloNumber: "0839909399", // So dien thoai Zalo nhan bao gia
    emailAddress: "hugowishpax@gmail.com", // Email nhan thong tin
    themeStorageKey: "hugowishpax-theme"
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Particle Bubble Canvas
    initBubbleCanvas();

    // 2. Initialize Dark Mode Toggle
    initDarkMode();

    // 3. Initialize Navigation & ScrollSpy
    initNavigation();

    // 4. Initialize Interactive Quotation Calculator
    initCalculator();

    // 5. Initialize Project Detail Dialogs
    initProjectModals();

    // 6. Initialize QR Code Dialog
    initQRModal();

    // 7. Initialize Avatar Rotator
    initAvatarRotator();

    // 8. Initialize Gamified Pricing Interactions (Eye-hiding, Decryption Key, Biometric Smile-Scan)
    initInteractivePackages();

    // 9. Initialize Interactive Tip Widget
    initTipWidget();

    // 10. Initialize Active Mobile Bottom Navigation Spy
    if (typeof initMobileNavHighlighter === "function") {
        initMobileNavHighlighter();
    }
});

/* ==========================================
   🔊 WEB AUDIO BUBBLE SYNTH (SOUND POP EFFECT)
   ========================================== */
function playPopSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Cute bubble sweep: sine wave sweeping quickly from mid to high frequency
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);

        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
        // Fallback for browsers blocking audio auto-play
    }
}

/* ==========================================
   🎈 CANVAS BUBBLE & SPARKLE ENGINE
   ========================================== */
function initBubbleCanvas() {
    const canvas = document.createElement("canvas");
    canvas.id = "bubble-canvas";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track resized window
    window.addEventListener("resize", () => {
        width = (canvas.width = window.innerWidth);
        height = (canvas.height = window.innerHeight);
    });

    const bubbles = [];
    const particles = [];
    const bubbleColors = [
        "rgba(167, 38, 131, 0.15)",  // Primary pink tint
        "rgba(0, 103, 129, 0.12)",   // Secondary cyan tint
        "rgba(133, 47, 202, 0.15)"    // Tertiary purple tint
    ];

    class Bubble {
        constructor(x, y, radius = null) {
            this.x = x || Math.random() * width;
            this.y = y || height + 50;
            this.radius = radius || Math.random() * 25 + 10;
            this.speedY = Math.random() * 0.8 + 0.3;
            this.speedX = Math.random() * 0.4 - 0.2;
            this.color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
            this.wobbleSpeed = Math.random() * 0.02 + 0.005;
            this.wobbleRange = Math.random() * 2 + 1;
            this.wobbleAngle = Math.random() * Math.PI * 2;
        }

        update() {
            this.y -= this.speedY;
            this.wobbleAngle += this.wobbleSpeed;
            this.x += Math.sin(this.wobbleAngle) * 0.3 + this.speedX;

            // Recycle bubble if it floats off-screen
            if (this.y < -50) {
                this.y = height + 50;
                this.x = Math.random() * width;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();

            // Highlight glow (Claymorphism glossy look)
            ctx.beginPath();
            ctx.arc(
                this.x - this.radius * 0.3,
                this.y - this.radius * 0.3,
                this.radius * 0.2,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.fill();
        }
    }

    class SparkleParticle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.radius = Math.random() * 3 + 1;
            this.vx = Math.random() * 4 - 2;
            this.vy = Math.random() * 4 - 2;
            this.alpha = 1;
            this.decay = Math.random() * 0.03 + 0.015;
            this.color = color.replace("0.1", "0.6").replace("0.2", "0.8");
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.05; // Gravity pull
            this.alpha -= this.decay;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    // Populate initial bubbles
    for (let i = 0; i < 30; i++) {
        bubbles.push(new Bubble());
    }

    // Hover detection for popping bubbles
    let mouse = { x: -999, y: -999 };
    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        // Pop checking
        for (let i = bubbles.length - 1; i >= 0; i--) {
            const b = bubbles[i];
            const dist = Math.hypot(mouse.x - b.x, mouse.y - b.y);
            if (dist < b.radius + 15) { // Pop offset
                // Pop trigger!
                playPopSound();
                createPopSparkles(b.x, b.y, b.color);
                bubbles.splice(i, 1);
                // Respawn bubble
                setTimeout(() => {
                    bubbles.push(new Bubble());
                }, Math.random() * 1000 + 500);
            }
        }
    });

    // Tap/Click to launch bubble group
    window.addEventListener("click", (e) => {
        // Avoid launching bubbles if clicking on interactive elements
        const target = e.target;
        if (target.tagName === "BUTTON" || target.tagName === "A" || target.closest("a") || target.closest("button") || target.closest(".clay-card")) {
            return;
        }
        for (let i = 0; i < 8; i++) {
            const size = Math.random() * 12 + 6;
            const b = new Bubble(e.clientX, e.clientY, size);
            b.speedY = Math.random() * 2 + 1; // Drifts upward faster
            b.speedX = Math.random() * 3 - 1.5;
            bubbles.push(b);
            // Auto clean custom bubbles later
            setTimeout(() => {
                const idx = bubbles.indexOf(b);
                if (idx > -1) bubbles.splice(idx, 1);
            }, 6000);
        }
    });

    function createPopSparkles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            particles.push(new SparkleParticle(x, y, color));
        }
    }

    // Engine loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Update & draw bubbles
        bubbles.forEach((b) => {
            b.update();
            b.draw();
        });

        // Update & draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw();
            if (p.alpha <= 0) {
                particles.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

/* ==========================================
   🌓 DARK MODE TOGGLER
   ========================================== */
function initDarkMode() {
    const html = document.documentElement;
    const desktopHeader = document.querySelector("header div.flex");

    // Create dark mode switch button dynamically in Header
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "theme-toggle";
    toggleBtn.className = "text-primary dark:text-primary-fixed p-3 rounded-full hover:bg-surface-container transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 border-transparent hover:border-outline-variant/30";
    toggleBtn.setAttribute("aria-label", "Toggle Dark Mode");
    toggleBtn.innerHTML = `<span class="material-symbols-outlined text-2xl" id="theme-toggle-icon">dark_mode</span>`;

    // Inject button before the "Hire Me!" desktop button
    const hireMeBtn = document.querySelector("header button.clay-btn-primary");
    if (hireMeBtn) {
        hireMeBtn.parentNode.insertBefore(toggleBtn, hireMeBtn);
    } else {
        // Fallback to top nav right side
        desktopHeader.appendChild(toggleBtn);
    }

    const iconSpan = document.getElementById("theme-toggle-icon");

    // Theme application function
    function applyTheme(isDark) {
        if (isDark) {
            html.classList.add("dark");
            iconSpan.textContent = "light_mode";
            iconSpan.style.color = "#dfb7ff"; // Golden/warm tint
            localStorage.setItem(CONFIG.themeStorageKey, "dark");
        } else {
            html.classList.remove("dark");
            iconSpan.textContent = "dark_mode";
            iconSpan.style.color = ""; // Original color
            localStorage.setItem(CONFIG.themeStorageKey, "light");
        }
    }

    // Read stored or system preference
    const storedTheme = localStorage.getItem(CONFIG.themeStorageKey);
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (storedTheme === "dark" || (!storedTheme && systemPrefersDark)) {
        applyTheme(true);
    } else {
        applyTheme(false);
    }

    // Click handler
    toggleBtn.addEventListener("click", () => {
        const currentIsDark = html.classList.contains("dark");
        applyTheme(!currentIsDark);
        playPopSound();
    });
}

/* ==========================================
   📍 NAVIGATION & SCROLLSPY (SMOOTH NAVIGATION)
   ========================================== */
function initNavigation() {
    // 1. Desktop Nav Update
    const desktopNav = document.querySelector("header nav");
    if (desktopNav) {
        desktopNav.innerHTML = `
            <a class="nav-item text-on-surface-variant font-medium hover:text-primary transition-colors px-4 py-1 hover:scale-105 duration-200 ease-out active-tab" href="#hero">Trang Chủ</a>
            <a class="nav-item text-on-surface-variant font-medium hover:text-primary transition-colors px-4 py-1 hover:scale-105 duration-200 ease-out" href="#projects">Dự Án</a>
            <a class="nav-item text-on-surface-variant font-medium hover:text-primary transition-colors px-4 py-1 hover:scale-105 duration-200 ease-out" href="#about">Về Tôi</a>
            <a class="nav-item text-on-surface-variant font-medium hover:text-primary transition-colors px-4 py-1 hover:scale-105 duration-200 ease-out" href="#services">Báo Giá</a>
            <a class="nav-item text-on-surface-variant font-medium hover:text-primary transition-colors px-4 py-1 hover:scale-105 duration-200 ease-out" href="#contact">Liên Hệ</a>
        `;
    }

    // Add CSS transition rules for active class in styling
    const styleTag = document.createElement("style");
    styleTag.textContent = `
        .nav-item {
            position: relative;
            transition: all 0.3s ease;
        }
        .nav-item.active-tab {
            color: #a72683 !important;
            font-weight: 700;
        }
        .nav-item.active-tab::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 16px;
            right: 16px;
            height: 3px;
            background-color: #a72683;
            border-radius: 99px;
            animation: bounceIn 0.3s ease;
        }
        html.dark .nav-item.active-tab {
            color: #ffaedc !important;
        }
        html.dark .nav-item.active-tab::after {
            background-color: #ffaedc;
        }
        @keyframes bounceIn {
            0% { transform: scaleX(0); }
            70% { transform: scaleX(1.1); }
            100% { transform: scaleX(1); }
        }
    `;
    document.head.appendChild(styleTag);

    // 2. Setup ID for Hero Section
    const heroSection = document.querySelector("main > section:first-child");
    if (heroSection) {
        heroSection.id = "hero";
    }

    // 3. Setup IDs & elements for Mobile Navigation
    const mobileNavLinks = document.querySelectorAll("nav.md\\:hidden a");
    if (mobileNavLinks.length >= 4) {
        mobileNavLinks[0].id = "mobile-nav-home";
        mobileNavLinks[0].setAttribute("href", "#hero");

        mobileNavLinks[1].id = "mobile-nav-projects";
        mobileNavLinks[1].setAttribute("href", "#projects");

        mobileNavLinks[2].id = "mobile-nav-about";
        mobileNavLinks[2].setAttribute("href", "#about");

        mobileNavLinks[3].id = "mobile-nav-contact";
        mobileNavLinks[3].setAttribute("href", "#contact");
    }

    // 4. Smooth Scrolling Handler for all nav links
    const allLinks = document.querySelectorAll("nav a, header a, footer a[href^='#']");
    allLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const targetId = link.getAttribute("href");
            if (targetId && targetId.startsWith("#")) {
                e.preventDefault();
                playPopSound();

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const offset = 90; // Header height spacer
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            }
        });
    });

    // 5. ScrollSpy Logic
    const sections = document.querySelectorAll("section[id], main > section:first-child");
    const navItems = document.querySelectorAll(".nav-item");
    const mobileItems = {
        "hero": document.getElementById("mobile-nav-home"),
        "projects": document.getElementById("mobile-nav-projects"),
        "about": document.getElementById("mobile-nav-about"),
        "contact": document.getElementById("mobile-nav-contact"),
        "services": document.getElementById("mobile-nav-home") // Map pricing to home/special action or highlight nearby
    };

    function updateActiveNav() {
        let currentSectionId = "hero";
        const scrollPosition = window.scrollY + 180; // trigger early offset

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.id || "hero";
            }
        });

        // Update desktop state
        navItems.forEach(item => {
            item.classList.remove("active-tab");
            if (item.getAttribute("href") === `#${currentSectionId}`) {
                item.classList.add("active-tab");
            }
        });

        // Update mobile bottom nav active classes
        Object.keys(mobileItems).forEach(key => {
            const btn = mobileItems[key];
            if (!btn) return;

            // Remove active styles, restore default inactive state
            btn.className = "flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 pb-2 transition-all duration-300";
            const icon = btn.querySelector("span.material-symbols-outlined");
            if (icon) {
                icon.style.fontVariationSettings = "'FILL' 0";
            }

            // Set active class if matching current section
            if (key === currentSectionId) {
                btn.className = "flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-6 py-2 scale-110 -translate-y-3 shadow-lg transition-all duration-300";
                if (icon) {
                    icon.style.fontVariationSettings = "'FILL' 1";
                }
            }
        });
    }

    // Scroll listener with throttle
    let scrollTimeout;
    window.addEventListener("scroll", () => {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                updateActiveNav();
                scrollTimeout = null;
            }, 60);
        }
    });

    // Run once on load
    updateActiveNav();
}

/* ==========================================
   🧮 DYNAMIC COST CALCULATOR (BÁO GIÁ MODAL)
   ========================================== */
function initCalculator() {
    // 1. Inject Calculator Modal Structure into Body
    const modalHtml = `
    <div id="calculator-modal" class="fixed inset-0 z-[100] flex items-center justify-center hidden bg-[#730058]/20 backdrop-blur-md transition-opacity duration-300 opacity-0">
        <div class="clay-card bg-[#fefafc] text-[#3b002c] max-w-5xl w-full mx-4 rounded-[2.5rem] border border-[#dabfcc] p-6 md:p-8 shadow-[0_20px_50px_rgba(167,38,131,0.12)] relative overflow-y-auto max-h-[92vh] scale-95 transition-all duration-300">
            <!-- Close Button -->
            <button id="close-calculator" class="absolute top-6 right-6 text-[#87717c] hover:text-[#a72683] transition-transform hover:scale-110 active:scale-95">
                <span class="material-symbols-outlined text-3xl">close</span>
            </button>

            <!-- Elegant Premium Header -->
            <div class="text-center mb-8">
                <span class="text-[9px] font-extrabold uppercase tracking-widest text-[#a72683]">Báo Giá Trực Tuyến</span>
                <h2 class="font-display-lg text-3xl text-[#3b002c] mt-1 mb-2 tracking-wide">Cấu Hợp Giá Thiết Kế Website</h2>
                <p class="text-[#54414b] text-xs max-w-md mx-auto">Tùy biến gói tính năng & dịch vụ hỗ trợ. Hệ thống tự động phân tích và kết xuất bảng dự chi chi tiết.</p>
                <div class="h-[1.5px] w-24 bg-gradient-to-r from-transparent via-[#a72683]/20 to-transparent mx-auto mt-4"></div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- Column 1: Config Form -->
                <div class="lg:col-span-7 space-y-6">
                    <!-- Base Tier Selector -->
                    <div>
                        <label class="block font-bold text-xs uppercase tracking-wider text-[#a72683] mb-2">Bước 1: Chọn Gói Cơ Bản</label>
                        
                        <!-- Gói Cá Nhân (Mini Tiers) -->
                        <div class="text-[9px] font-extrabold text-[#54414b] uppercase tracking-widest mb-2">Gói Cá Nhân (Mini Tiers)</div>
                        <div class="grid grid-cols-2 gap-3 mb-4">
                            <label class="relative flex flex-col items-center justify-center p-4 rounded-[2rem] border border-[#dabfcc]/30 bg-white/70 backdrop-blur-sm cursor-pointer hover:border-[#a72683]/50 hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 text-center select-none text-[#54414b] opacity-80 hover:opacity-100 md:p-5" id="label-tier-portfolio">
                                <input type="radio" name="calc-tier" value="portfolio" class="hidden">
                                <span class="material-symbols-outlined text-slate-400 text-xl mb-1.5">face</span>
                                <span class="font-bold text-xs block text-[#3b002c]">Cây dương xỉ cô đơn</span>
                                <span class="text-[11px] text-[#87717c] mt-0.5 font-semibold">800k</span>
                            </label>
                            
                            <label class="relative flex flex-col items-center justify-center p-4 rounded-[2rem] border border-[#dabfcc]/30 bg-white/70 backdrop-blur-sm cursor-pointer hover:border-[#a72683]/50 hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 text-center select-none text-[#54414b] opacity-80 hover:opacity-100 md:p-5" id="label-tier-single_page">
                                <input type="radio" name="calc-tier" value="single_page" class="hidden">
                                <span class="material-symbols-outlined text-slate-400 text-xl mb-1.5">article</span>
                                <span class="font-bold text-xs block text-[#3b002c]">Ghép mảnh</span>
                                <span class="text-[11px] text-[#87717c] mt-0.5 font-semibold">800k+</span>
                            </label>
                        </div>

                        <!-- Single Page Options (Hidden by default, shown when single_page tier is selected) -->
                        <div id="single-page-options-container" class="hidden bg-white/60 p-4 rounded-2xl border border-[#dabfcc]/30 space-y-2.5 mb-4">
                            <label class="block font-bold text-[9px] uppercase tracking-wider text-[#a72683] mb-1.5">Bước 1.2: Chọn Cấu Hình Trang Cần Thêm (Cộng dồn chi phí)</label>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <!-- Gioi thieu -->
                                <label class="flex items-center justify-between p-2.5 bg-white border border-[#dabfcc]/15 rounded-xl cursor-pointer hover:bg-[#a72683]/5 transition-all text-[#54414b]">
                                    <span class="flex items-center gap-2">
                                        <input type="checkbox" id="page-gioithieu" checked class="single-page-item rounded border-outline-variant text-[#a72683] focus:ring-[#a72683] h-4 w-4">
                                        <span class="font-semibold">Giới Thiệu</span>
                                    </span>
                                    <span class="font-bold text-[#a72683] text-[11px] font-mono">500k</span>
                                </label>
                                
                                <!-- Album anh -->
                                <label class="flex items-center justify-between p-2.5 bg-white border border-[#dabfcc]/15 rounded-xl cursor-pointer hover:bg-[#a72683]/5 transition-all text-[#54414b]">
                                    <span class="flex items-center gap-2">
                                        <input type="checkbox" id="page-album-anh" class="single-page-item rounded border-outline-variant text-[#a72683] focus:ring-[#a72683] h-4 w-4">
                                        <span class="font-semibold">Album Ảnh (&lt;30 ảnh)</span>
                                    </span>
                                    <span class="font-bold text-[#a72683] text-[11px] font-mono">650k</span>
                                </label>
                                
                                <!-- Album video -->
                                <label class="flex items-center justify-between p-2.5 bg-white border border-[#dabfcc]/15 rounded-xl cursor-pointer hover:bg-[#a72683]/5 transition-all text-[#54414b]">
                                    <span class="flex items-center gap-2">
                                        <input type="checkbox" id="page-album-video" class="single-page-item rounded border-outline-variant text-[#a72683] focus:ring-[#a72683] h-4 w-4">
                                        <span class="font-semibold">Album Video (&lt;10 video)</span>
                                    </span>
                                    <span class="font-bold text-[#a72683] text-[11px] font-mono">650k</span>
                                </label>
                                
                                <!-- Portfolio -->
                                <label class="flex items-center justify-between p-2.5 bg-white border border-[#dabfcc]/15 rounded-xl cursor-pointer hover:bg-[#a72683]/5 transition-all text-[#54414b]">
                                    <span class="flex items-center gap-2">
                                        <input type="checkbox" id="page-portfolio" class="single-page-item rounded border-outline-variant text-[#a72683] focus:ring-[#a72683] h-4 w-4">
                                        <span class="font-semibold">Portfolio Tích Hợp</span>
                                    </span>
                                    <span class="font-bold text-[#a72683] text-[11px] font-mono">500k</span>
                                </label>
                                
                                <!-- San pham -->
                                <label class="flex items-center justify-between p-2.5 bg-white border border-[#dabfcc]/15 rounded-xl cursor-pointer hover:bg-[#a72683]/5 transition-all text-[#54414b]">
                                    <span class="flex items-center gap-2">
                                        <input type="checkbox" id="page-sanpham" class="single-page-item rounded border-outline-variant text-[#a72683] focus:ring-[#a72683] h-4 w-4">
                                        <span class="font-semibold">Sản Phẩm (&lt;10 món)</span>
                                    </span>
                                    <span class="font-bold text-[#a72683] text-[11px] font-mono">780k</span>
                                </label>
                                
                                <!-- Bao gia -->
                                <label class="flex items-center justify-between p-2.5 bg-white border border-[#dabfcc]/15 rounded-xl cursor-pointer hover:bg-[#a72683]/5 transition-all text-[#54414b]">
                                    <span class="flex items-center gap-2">
                                        <input type="checkbox" id="page-baogia" class="single-page-item rounded border-outline-variant text-[#a72683] focus:ring-[#a72683] h-4 w-4">
                                        <span class="font-semibold">Trang Báo Giá / Pricing</span>
                                    </span>
                                    <span class="font-bold text-[#a72683] text-[11px] font-mono">450k</span>
                                </label>
                                
                                <!-- Lien he -->
                                <label class="flex items-center justify-between p-2.5 bg-white border border-[#dabfcc]/15 rounded-xl cursor-pointer hover:bg-[#a72683]/5 transition-all text-[#54414b]">
                                    <span class="flex items-center gap-2">
                                        <input type="checkbox" id="page-lienhe" class="single-page-item rounded border-outline-variant text-[#a72683] focus:ring-[#a72683] h-4 w-4">
                                        <span class="font-semibold">Liên Hệ & Bản Đồ</span>
                                    </span>
                                    <span class="font-bold text-[#a72683] text-[11px] font-mono">400k</span>
                                </label>
                            </div>
                            
                            <!-- Hoi & Dap (FAQ) with Tab Counter -->
                            <div class="p-2.5 bg-white rounded-xl border border-[#dabfcc]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#54414b]">
                                <span class="flex items-center gap-2">
                                    <input type="checkbox" id="page-faq" class="single-page-item rounded border-[#dabfcc] text-[#a72683] focus:ring-[#a72683] h-4 w-4">
                                    <span class="font-semibold flex flex-col">
                                        <span>Hỏi & Đáp (FAQ)</span>
                                        <span class="text-[10px] text-[#87717c] font-normal">&lt;6 tabs chuẩn, +50k/tab thêm</span>
                                    </span>
                                </span>
                                <div class="flex items-center gap-3">
                                    <span class="font-bold text-[#a72683] text-[11px] font-mono" id="faq-price-text">350k</span>
                                    <div class="flex items-center border border-[#dabfcc]/45 rounded-lg overflow-hidden bg-white">
                                        <button type="button" id="btn-faq-minus" class="px-2.5 py-0.5 hover:bg-[#a72683]/5 transition-all font-bold">-</button>
                                        <span id="faq-tab-count" class="px-3 font-bold">6</span>
                                        <button type="button" id="btn-faq-plus" class="px-2.5 py-0.5 hover:bg-[#a72683]/5 transition-all font-bold">+</button>
                                    </div>
                                    <span class="text-[10px] text-[#87717c]">tabs</span>
                                </div>
                            </div>
                        </div>

                        <!-- Gói Web Trọn Gói (Full Tiers) -->
                        <div class="text-[9px] font-extrabold text-[#54414b] uppercase tracking-widest mb-2">Gói Web Trọn Gói (Full Tiers)</div>
                        <div class="grid grid-cols-3 gap-3">
                            <label class="relative flex flex-col items-center justify-center p-4 rounded-[2rem] border border-[#dabfcc]/30 bg-white/70 backdrop-blur-sm cursor-pointer hover:border-[#a72683]/50 hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 text-center select-none text-[#54414b] opacity-80 hover:opacity-100 md:p-5" id="label-tier-basic">
                                <input type="radio" name="calc-tier" value="basic" checked class="hidden">
                                <span class="material-symbols-outlined text-slate-400 text-xl mb-1.5">icecream</span>
                                <span class="font-bold text-xs block text-[#3b002c]">Mơ trong hồ</span>
                                <span class="text-[11px] text-[#87717c] mt-0.5 font-semibold">3tr+</span>
                            </label>
                            
                            <label class="relative flex flex-col items-center justify-center p-4 rounded-[2rem] border border-[#dabfcc]/30 bg-white/70 backdrop-blur-sm cursor-pointer hover:border-[#a72683]/50 hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 text-center select-none text-[#54414b] opacity-80 hover:opacity-100 md:p-5" id="label-tier-plus">
                                <input type="radio" name="calc-tier" value="plus" class="hidden">
                                <span class="material-symbols-outlined text-slate-400 text-xl mb-1.5">cake</span>
                                <span class="font-bold text-xs block text-[#3b002c]">Mộng bay xa</span>
                                <span class="text-[11px] text-[#87717c] mt-0.5 font-semibold">6.5tr+</span>
                            </label>
                            
                            <label class="relative flex flex-col items-center justify-center p-4 rounded-[2rem] border border-[#dabfcc]/30 bg-white/70 backdrop-blur-sm cursor-pointer hover:border-[#a72683]/50 hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 text-center select-none text-[#54414b] opacity-80 hover:opacity-100 md:p-5" id="label-tier-premium">
                                <input type="radio" name="calc-tier" value="premium" class="hidden">
                                <span class="material-symbols-outlined text-slate-400 text-xl mb-1.5">diamond</span>
                                <span class="font-bold text-xs block text-[#3b002c]">Bay xa</span>
                                <span class="text-[11px] text-[#87717c] mt-0.5 font-semibold">14tr+</span>
                            </label>
                        </div>
                    </div>

                    <!-- Features Checklist -->
                    <div>
                        <label class="block font-bold text-xs uppercase tracking-wider text-primary dark:text-primary-fixed mb-2">Bước 2: Chọn Tính Năng Thêm</label>
                        <div class="space-y-2 max-h-[250px] overflow-y-auto pr-1" id="addon-list-container">
                            <!-- Responsive -->
                            <div id="wrapper-feat-responsive" class="flex items-center gap-3 p-2 bg-surface-container-lowest dark:bg-[#1d1726] rounded-xl border border-transparent transition-all">
                                <input type="checkbox" id="feat-responsive" checked disabled class="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0">
                                <div class="text-[11px] flex-1">
                                    <div class="font-bold text-on-surface dark:text-white flex items-center justify-between">
                                        <span>Responsive Mobile</span>
                                        <span class="text-[9px] text-secondary font-bold uppercase tracking-wider bg-secondary-container/20 px-2 py-0.5 rounded-full">Sẵn có</span>
                                    </div>
                                    <div class="text-on-surface-variant dark:text-slate-400 text-[10px]">Tối ưu hiển thị hoàn hảo trên điện thoại & máy tính bảng</div>
                                </div>
                            </div>
                            
                            <!-- Animations -->
                            <label id="wrapper-feat-animations" class="flex items-center gap-3 p-2 bg-surface-container-lowest dark:bg-[#1d1726] rounded-xl border border-transparent cursor-pointer hover:bg-surface-container/30 transition-all">
                                <input type="checkbox" id="feat-animations" class="addon-check rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0">
                                <div class="text-[11px] flex-1">
                                    <div class="font-bold text-on-surface dark:text-white flex items-center justify-between">
                                        <span>Hiệu ứng & Animations</span>
                                        <span class="text-[9px] text-primary font-bold" id="price-feat-animations">+500k</span>
                                    </div>
                                    <div class="text-on-surface-variant dark:text-slate-400 text-[10px]" id="desc-feat-animations">Chuyển động mượt mà, bong bóng tương tác cao cấp</div>
                                </div>
                            </label>
                            
                            <!-- Languages -->
                            <label id="wrapper-feat-languages" class="flex items-center gap-3 p-2 bg-surface-container-lowest dark:bg-[#1d1726] rounded-xl border border-transparent cursor-pointer hover:bg-surface-container/30 transition-all">
                                <input type="checkbox" id="feat-languages" class="addon-check rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0">
                                <div class="text-[11px] flex-1">
                                    <div class="font-bold text-on-surface dark:text-white flex items-center justify-between">
                                        <span>Đa Ngôn Ngữ Anh / Việt</span>
                                        <span class="text-[9px] text-primary font-bold" id="price-feat-languages">+1.5tr</span>
                                    </div>
                                    <div class="text-on-surface-variant dark:text-slate-400 text-[10px]" id="desc-feat-languages">Chuyển đổi ngôn ngữ Việt - Anh linh hoạt chuẩn quốc tế</div>
                                </div>
                            </label>
                            
                            <!-- E-Commerce -->
                            <label id="wrapper-feat-ecommerce" class="flex items-center gap-3 p-2 bg-surface-container-lowest dark:bg-[#1d1726] rounded-xl border border-transparent cursor-pointer hover:bg-surface-container/30 transition-all">
                                <input type="checkbox" id="feat-ecommerce" class="addon-check rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0">
                                <div class="text-[11px] flex-1">
                                    <div class="font-bold text-on-surface dark:text-white flex items-center justify-between">
                                        <span>Giỏ Hàng & Thanh Toán</span>
                                        <span class="text-[9px] text-primary font-bold" id="price-feat-ecommerce">+3.0tr</span>
                                    </div>
                                    <div class="text-on-surface-variant dark:text-slate-400 text-[10px]" id="desc-feat-ecommerce">Tích hợp cổng Momo, VNPAY, Bank QR tự động hóa</div>
                                </div>
                            </label>
                            
                            <!-- CMS -->
                            <label id="wrapper-feat-cms" class="flex items-center gap-3 p-2 bg-surface-container-lowest dark:bg-[#1d1726] rounded-xl border border-transparent cursor-pointer hover:bg-surface-container/30 transition-all">
                                <input type="checkbox" id="feat-cms" class="addon-check rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0">
                                <div class="text-[11px] flex-1">
                                    <div class="font-bold text-on-surface dark:text-white flex items-center justify-between">
                                        <span>Admin CMS / Quản Trị</span>
                                        <span class="text-[9px] text-primary font-bold" id="price-feat-cms">+4.0tr</span>
                                    </div>
                                    <div class="text-on-surface-variant dark:text-slate-400 text-[10px]" id="desc-feat-cms">Giao diện Admin tự viết bài, quản lý dự án không cần code</div>
                                </div>
                            </label>
                            
                            <!-- SEO -->
                            <label id="wrapper-feat-seo" class="flex items-center gap-3 p-2 bg-surface-container-lowest dark:bg-[#1d1726] rounded-xl border border-transparent cursor-pointer hover:bg-surface-container/30 transition-all">
                                <input type="checkbox" id="feat-seo" class="addon-check rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0">
                                <div class="text-[11px] flex-1">
                                    <div class="font-bold text-on-surface dark:text-white flex items-center justify-between">
                                        <span>Tối Ưu Chuẩn SEO & Analytics</span>
                                        <span class="text-[9px] text-primary font-bold" id="price-feat-seo">+800k</span>
                                    </div>
                                    <div class="text-on-surface-variant dark:text-slate-400 text-[10px]" id="desc-feat-seo">Khai báo Google, cài đặt Analytics đo lường chuyên nghiệp</div>
                                </div>
                            </label>
                            
                            <!-- Security -->
                            <label id="wrapper-feat-security" class="flex items-center gap-3 p-2 bg-surface-container-lowest dark:bg-[#1d1726] rounded-xl border border-transparent cursor-pointer hover:bg-surface-container/30 transition-all">
                                <input type="checkbox" id="feat-security" class="addon-check rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0">
                                <div class="text-[11px] flex-1">
                                    <div class="font-bold text-on-surface dark:text-white flex items-center justify-between">
                                        <span>Bảo Mật & Chống Sao Chép</span>
                                        <span class="text-[9px] text-primary font-bold" id="price-feat-security">+800k</span>
                                    </div>
                                    <div class="text-on-surface-variant dark:text-slate-400 text-[10px]" id="desc-feat-security">Khóa chuột phải, cấm lưu ảnh, ngăn sao chép chất xám và tài sản ảnh</div>
                                </div>
                            </label>
                            
                            <!-- Booking -->
                            <label id="wrapper-feat-booking" class="flex items-center gap-3 p-2 bg-surface-container-lowest dark:bg-[#1d1726] rounded-xl border border-transparent cursor-pointer hover:bg-surface-container/30 transition-all">
                                <input type="checkbox" id="feat-booking" class="addon-check rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0">
                                <div class="text-[11px] flex-1">
                                    <div class="font-bold text-on-surface dark:text-white flex items-center justify-between">
                                        <span>Đặt Lịch & Hẹn Giờ Online</span>
                                        <span class="text-[9px] text-primary font-bold" id="price-feat-booking">+1.2tr</span>
                                    </div>
                                    <div class="text-on-surface-variant dark:text-slate-400 text-[10px]" id="desc-feat-booking">Lịch chọn ngày giờ trực quan, tự động báo qua Telegram/Email</div>
                                </div>
                            </label>
                            
                            <!-- Gallery -->
                            <label id="wrapper-feat-gallery" class="flex items-center gap-3 p-2 bg-surface-container-lowest dark:bg-[#1d1726] rounded-xl border border-transparent cursor-pointer hover:bg-surface-container/30 transition-all">
                                <input type="checkbox" id="feat-gallery" class="addon-check rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0">
                                <div class="text-[11px] flex-1">
                                    <div class="font-bold text-on-surface dark:text-white flex items-center justify-between">
                                        <span>VIP Portal Bàn Giao Tài Nguyên</span>
                                        <span class="text-[9px] text-primary font-bold" id="price-feat-gallery">+2.0tr</span>
                                    </div>
                                    <div class="text-on-surface-variant dark:text-slate-400 text-[10px]" id="desc-feat-gallery">Client Dashboard riêng tư bàn giao tệp tin, hình ảnh & video chất lượng cao siêu mượt</div>
                                </div>
                            </label>
                            
                            
                            <!-- Build & Handover Setup -->
                            <label id="wrapper-feat-setup" class="flex items-center gap-3 p-2 bg-surface-container-lowest dark:bg-[#1d1726] rounded-xl border border-transparent cursor-pointer hover:bg-surface-container/30 transition-all sm:col-span-2">
                                <input type="checkbox" id="feat-setup" class="addon-check rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0">
                                <div class="text-[11px] flex-1">
                                    <div class="font-bold text-on-surface dark:text-white flex items-center justify-between">
                                        <span>Build & Bàn Giao Trọn Gói (Tên Miền & Hosting)</span>
                                        <span class="text-[9px] text-primary font-bold" id="price-feat-setup">+2.5tr</span>
                                    </div>
                                    <div class="text-on-surface-variant dark:text-slate-400 text-[10px]" id="desc-feat-setup">Cài đặt cấu hình tên miền (.com/.vn/.online/.studio...) & Hosting theo thỏa thuận hoàn tất</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Management Support Selection (Bước 3) -->
                    <div>
                        <label class="block font-bold text-xs uppercase tracking-wider text-primary dark:text-primary-fixed mb-2">Bước 3: Lựa Chọn Hỗ Trợ & Quản Lý</label>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <label class="relative flex flex-col items-center justify-center p-2 rounded-xl border border-outline-variant/30 dark:border-slate-700/50 bg-surface-container-low dark:bg-[#211a2a] cursor-pointer hover:border-secondary transition-all text-center select-none" id="label-support-none">
                                <input type="radio" name="calc-support" value="none" checked class="hidden">
                                <span class="font-bold text-[10px] block text-on-surface dark:text-white">Tự Quản Lý</span>
                                <span class="text-[9px] text-on-surface-variant dark:text-slate-400 mt-0.5">0đ</span>
                            </label>
                            
                            <label class="relative flex flex-col items-center justify-center p-2 rounded-xl border border-outline-variant/30 dark:border-slate-700/50 bg-surface-container-low dark:bg-[#211a2a] cursor-pointer hover:border-secondary transition-all text-center select-none" id="label-support-basic">
                                <input type="radio" name="calc-support" value="basic" class="hidden">
                                <span class="font-bold text-[10px] block text-on-surface dark:text-white">Basic (3 thg)</span>
                                <span class="text-[9px] text-on-surface-variant dark:text-slate-400 mt-0.5">500k</span>
                            </label>
                            
                            <label class="relative flex flex-col items-center justify-center p-2 rounded-xl border border-outline-variant/30 dark:border-slate-700/50 bg-surface-container-low dark:bg-[#211a2a] cursor-pointer hover:border-secondary transition-all text-center select-none" id="label-support-plus">
                                <input type="radio" name="calc-support" value="plus" class="hidden">
                                <span class="font-bold text-[10px] block text-on-surface dark:text-white">Plus (6 thg)</span>
                                <span class="text-[9px] text-on-surface-variant dark:text-slate-400 mt-0.5">850k</span>
                            </label>
                            
                            <label class="relative flex flex-col items-center justify-center p-2 rounded-xl border border-outline-variant/30 dark:border-slate-700/50 bg-surface-container-low dark:bg-[#211a2a] cursor-pointer hover:border-secondary transition-all text-center select-none" id="label-support-pre">
                                <input type="radio" name="calc-support" value="pre" class="hidden">
                                <span class="font-bold text-[10px] block text-on-surface dark:text-white">Pre+ (12 thg)</span>
                                <span class="text-[9px] text-on-surface-variant dark:text-slate-400 mt-0.5">1.500k</span>
                            </label>
                        </div>
                    </div>

                    <!-- Project Timeline Slider -->
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <label class="font-bold text-xs uppercase tracking-wider text-primary dark:text-primary-fixed" id="timeline-step-label">Bước 4: Thời Gian Dự Án</label>
                            <span class="text-xs font-bold text-secondary" id="timeline-text">Bình thường (6-8 ngày)</span>
                        </div>
                        <input type="range" id="timeline-slider" min="1" max="3" value="2" class="w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-secondary focus:outline-none">
                        <div class="flex justify-between text-[10px] text-on-surface-variant dark:text-slate-400 px-1 mt-1" id="timeline-ticks-labels">
                            <span>Thong thả (Giảm 3%)</span>
                            <span>Bình thường (Chuẩn)</span>
                            <span>Siu tốc (+20% giá)</span>
                        </div>
                    </div>

                    <!-- Step 5: Contact Info -->
                    <div class="mt-4">
                        <label class="block font-bold text-xs uppercase tracking-wider text-[#a72683] mb-2">Bước 5: Thông Tin Của Bạn</label>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-[2rem] border border-[#dabfcc]/20 shadow-[0_4px_12px_rgba(167,38,131,0.02)]">
                            <div>
                                <label class="block text-[10px] font-bold text-[#87717c] uppercase tracking-wider mb-1">Họ & Tên</label>
                                <input type="text" id="calc-client-name" placeholder="Ví dụ: Lê Gia Huy" class="w-full bg-[#fdf6f9] text-[#3b002c] placeholder-[#87717c]/50 text-xs px-4 py-2.5 rounded-full border border-[#dabfcc]/30 focus:border-[#a72683] focus:ring-1 focus:ring-[#a72683] outline-none transition-all">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-[#87717c] uppercase tracking-wider mb-1">Số Điện Thoại / Zalo</label>
                                <input type="tel" id="calc-client-phone" placeholder="Ví dụ: 0839909399" class="w-full bg-[#fdf6f9] text-[#3b002c] placeholder-[#87717c]/50 text-xs px-4 py-2.5 rounded-full border border-[#dabfcc]/30 focus:border-[#a72683] focus:ring-1 focus:ring-[#a72683] outline-none transition-all">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Column 2: Total Cost & Luxury Digital Invoice Ticket -->
                <div class="lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-[#fdf6f9] to-[#faf0f5] p-6 rounded-[2rem] border border-[#dabfcc] shadow-[0_10px_30px_rgba(167,38,131,0.04)] relative space-y-5">
                    <!-- Subtle romantic glowing elements -->
                    <div class="absolute -right-20 -top-20 w-44 h-44 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="absolute -left-20 -bottom-20 w-44 h-44 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div>
                        <!-- Invoice Header -->
                        <div class="flex justify-between items-center pb-3 border-b border-[#dabfcc]/40">
                            <div>
                                <span class="text-[9px] font-extrabold text-[#a72683] uppercase tracking-widest block">Bảng Chi Tiết</span>
                                <h3 class="text-xs font-bold text-[#3b002c] uppercase tracking-wider mt-0.5" id="calc-receipt-tier">Gói: Mơ trong hồ</h3>
                            </div>
                            <span class="material-symbols-outlined text-[#a72683] text-lg">receipt_long</span>
                        </div>
                        
                        <!-- Dynamic Items List Container -->
                        <div class="mt-4 space-y-3 overflow-y-auto max-h-[220px] pr-1 text-[11px] text-[#54414b]" id="calc-receipt-items">
                            <!-- Items list gets rendered here dynamically -->
                        </div>
                    </div>

                    <!-- Grand Total Summary Block -->
                    <div class="pt-5 border-t border-[#dabfcc]/40 space-y-4">
                        <div class="flex justify-between items-baseline">
                            <span class="text-[10px] font-extrabold text-[#54414b] uppercase tracking-widest">Tổng dự toán</span>
                            <div class="text-right flex items-baseline gap-1">
                                <span class="text-3xl font-extrabold text-[#a72683] tracking-tight font-mono" id="calc-total-price">0</span>
                                <span class="text-xs font-bold text-[#a72683]">VNĐ</span>
                            </div>
                        </div>
                        
                        <p class="text-[10px] text-[#87717c] leading-relaxed italic text-center">Báo giá mang tính chất dự toán chuẩn dựa trên tính năng được lựa chọn.</p>
                    </div>

                    <!-- Elegant Action buttons -->
                    <div class="space-y-2.5 pt-4 border-t border-[#dabfcc]/40">
                        <button id="send-zalo-quote" class="w-full flex items-center justify-center gap-2 bg-[#0068ff] hover:bg-[#0057e0] text-white text-xs font-extrabold py-3.5 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
                            <span class="material-symbols-outlined text-base">chat_bubble</span>
                            Trao Đổi & Nhận Báo Giá Zalo
                        </button>
                        <button id="send-email-quote" class="w-full flex items-center justify-center gap-2 bg-[#a72683] hover:bg-[#8d1d6e] text-white text-xs font-extrabold py-3.5 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
                            <span class="material-symbols-outlined text-base">mail</span>
                            Gửi Email Báo Giá Chi Tiết
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // 2. DOM Elements Cache
    const modal = document.getElementById("calculator-modal");
    const closeBtn = document.getElementById("close-calculator");
    const openBtns = document.querySelectorAll(
        "header button.clay-btn-primary, " + // "Hire Me!" button
        "main section#hero button:first-child, " + // "Bắt đầu" button
        "main section#services button.w-full" // "Chọn Gói" buttons (exclude preview and toggle buttons)
    );

    const priceEl = document.getElementById("calc-total-price");
    const tierRadios = document.getElementsByName("calc-tier");
    const addonChecks = document.querySelectorAll(".addon-check");
    const timelineSlider = document.getElementById("timeline-slider");
    const timelineText = document.getElementById("timeline-text");
    const sendZaloBtn = document.getElementById("send-zalo-quote");
    const sendEmailBtn = document.getElementById("send-email-quote");
    const clientNameInput = document.getElementById("calc-client-name");
    const clientPhoneInput = document.getElementById("calc-client-phone");

    // Single Page Configuration Cache
    const singlePageContainer = document.getElementById("single-page-options-container");
    const singlePageItems = document.querySelectorAll(".single-page-item");
    const faqTabCountEl = document.getElementById("faq-tab-count");
    const faqPriceTextEl = document.getElementById("faq-price-text");
    const btnFaqMinus = document.getElementById("btn-faq-minus");
    const btnFaqPlus = document.getElementById("btn-faq-plus");
    const supportRadios = document.getElementsByName("calc-support");

    // Modal Control Functions
    function openModal() {
        modal.classList.remove("hidden");
        // Reflow force
        modal.offsetHeight;
        modal.classList.remove("opacity-0");
        modal.classList.add("opacity-100");
        modal.querySelector(".clay-card").classList.remove("scale-95");
        modal.querySelector(".clay-card").classList.add("scale-100");

        // Update price calculation once open
        calculatePrice(true);
    }

    function closeModal() {
        modal.classList.remove("opacity-100");
        modal.classList.add("opacity-0");
        modal.querySelector(".clay-card").classList.remove("scale-100");
        modal.querySelector(".clay-card").classList.add("scale-95");

        setTimeout(() => {
            modal.classList.add("hidden");
        }, 300);
    }

    // Attach Toggle triggers
    openBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            playPopSound();

            // Detect if clicking inside a specific pricing tier, select it in modal
            const servicesSec = btn.closest("#services");
            if (servicesSec) {
                const cardEl = btn.closest(".bg-surface-container-low, .bg-primary-container");
                if (cardEl) {
                    const titleEl = cardEl.querySelector("h3, h4");
                    if (titleEl) {
                        const text = titleEl.textContent.trim().toLowerCase();
                        let val = "basic";
                        if (text.includes("portfolio") || text.includes("dấu ấn") || text.includes("dương xỉ")) val = "portfolio";
                        else if (text.includes("riêng lẻ") || text.includes("single") || text.includes("mảnh ghép") || text.includes("ghép mảnh")) val = "single_page";
                        else if (text.includes("plus") || text.includes("bứt phá") || text.includes("mộng bay")) val = "plus";
                        else if (text.includes("premium") || text.includes("vô cực") || text.includes("bay xa")) val = "premium";
                        else if (text.includes("basic") || text.includes("khởi nguyên") || text.includes("mơ trong")) val = "basic";

                        const radio = Array.from(tierRadios).find(r => r.value === val);
                        if (radio) radio.checked = true;
                    }
                }
            }
            openModal();
        });
    });

    closeBtn.addEventListener("click", () => {
        playPopSound();
        closeModal();
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            playPopSound();
            closeModal();
        }
    });

    // 3. Calculator Pricing Math
    let currentCalculatedPrice = 0;

    const PRICING = {
        tiers: {
            portfolio: 800000,
            single_page: 0, // Calculated dynamically
            basic: 3000000,
            plus: 6500000,
            premium: 14000000
        },
        addons: {
            animations: 500000,
            languages: 1500000,
            ecommerce: 3000000,
            cms: 4000000,
            seo: 800000,
            security: 800000,
            booking: 1200000,
            gallery: 2000000,
            setup: 2500000
        }
    };

    function applyTierActiveStyles(lbl, tier) {
        lbl.className = "relative flex flex-col items-center justify-center p-4 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 text-center select-none scale-105 md:p-5 z-10 font-bold";
        const icon = lbl.querySelector(".material-symbols-outlined");
        if (tier === "portfolio" || tier === "single_page") {
            lbl.classList.add("border-emerald-500", "bg-emerald-50/40", "shadow-[0_8px_24px_rgba(16,185,129,0.12)]", "text-emerald-900");
            if (icon) icon.className = "material-symbols-outlined text-emerald-600 text-2xl mb-1.5 animate-pulse";
        } else if (tier === "basic") {
            lbl.classList.add("border-pink-500", "bg-pink-50/40", "shadow-[0_8px_24px_rgba(236,72,153,0.12)]", "text-pink-900");
            if (icon) icon.className = "material-symbols-outlined text-pink-600 text-2xl mb-1.5 animate-pulse";
        } else if (tier === "plus") {
            lbl.classList.add("border-cyan-500", "bg-cyan-50/40", "shadow-[0_8px_24px_rgba(6,182,212,0.12)]", "text-cyan-900");
            if (icon) icon.className = "material-symbols-outlined text-cyan-600 text-2xl mb-1.5 animate-pulse";
        } else if (tier === "premium") {
            lbl.classList.add("border-[#a72683]", "bg-[#a72683]/5", "shadow-[0_8px_24px_rgba(167,38,131,0.12)]", "text-[#3b002c]");
            if (icon) icon.className = "material-symbols-outlined text-[#a72683] text-2xl mb-1.5 animate-pulse";
        }
    }

    function applyTierInactiveStyles(lbl, tier) {
        lbl.className = "relative flex flex-col items-center justify-center p-4 rounded-[2rem] border border-[#dabfcc]/35 bg-white/70 backdrop-blur-sm cursor-pointer hover:border-[#a72683]/50 hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 text-center select-none text-[#54414b] opacity-80 hover:opacity-100 md:p-5";
        const icon = lbl.querySelector(".material-symbols-outlined");
        if (icon) icon.className = "material-symbols-outlined text-slate-400 text-xl mb-1.5";
    }

    function calculatePrice(isInstant = false) {
        // Base Tier Price
        let selectedTier = "basic";
        for (const radio of tierRadios) {
            const lbl = document.getElementById(`label-tier-${radio.value}`);
            if (lbl) {
                if (radio.checked) {
                    selectedTier = radio.value;
                    applyTierActiveStyles(lbl, radio.value);
                } else {
                    applyTierInactiveStyles(lbl, radio.value);
                }
            }
        }

        let total = PRICING.tiers[selectedTier];

        // Handle Dynamic Single Page Options
        if (selectedTier === "single_page") {
            if (singlePageContainer) singlePageContainer.classList.remove("hidden");

            let subpagesTotal = 0;
            if (document.getElementById("page-gioithieu").checked) subpagesTotal += 500000;
            if (document.getElementById("page-album-anh").checked) subpagesTotal += 650000;
            if (document.getElementById("page-album-video").checked) subpagesTotal += 650000;
            if (document.getElementById("page-portfolio").checked) subpagesTotal += 500000;
            if (document.getElementById("page-sanpham").checked) subpagesTotal += 780000;
            if (document.getElementById("page-baogia").checked) subpagesTotal += 450000;
            if (document.getElementById("page-lienhe").checked) subpagesTotal += 400000;
            if (document.getElementById("page-faq").checked) {
                let faqCost = 350000;
                if (faqTabs > 6) faqCost += (faqTabs - 6) * 50000;
                subpagesTotal += faqCost;
            }
            total = subpagesTotal;
        } else {
            if (singlePageContainer) singlePageContainer.classList.add("hidden");
        }

        // Define Compatibility & Features Filter Engine
        const compatibility = {
            portfolio: {
                animations: { state: "optional", priceText: "+500k", cost: 500000 },
                languages: { state: "incompatible", priceText: "Không hỗ trợ", desc: "Không áp dụng cho gói Portfolio" },
                ecommerce: { state: "incompatible", priceText: "Không hỗ trợ", desc: "Không áp dụng cho gói Portfolio" },
                cms: { state: "incompatible", priceText: "Không hỗ trợ", desc: "Không áp dụng cho gói Portfolio" },
                seo: { state: "optional", priceText: "+800k", cost: 800000 },
                security: { state: "optional", priceText: "+800k", cost: 800000 },
                booking: { state: "optional", priceText: "+1.2tr", cost: 1200000 },
                gallery: { state: "incompatible", priceText: "Không hỗ trợ", desc: "Không áp dụng cho gói Portfolio" },
                setup: { state: "optional", priceText: "+2.5tr", cost: 2500000 }
            },
            single_page: {
                animations: { state: "optional", priceText: "+500k", cost: 500000 },
                languages: { state: "incompatible", priceText: "Không hỗ trợ", desc: "Không áp dụng cho trang dịch vụ đơn lẻ" },
                ecommerce: { state: "incompatible", priceText: "Không hỗ trợ", desc: "Không áp dụng cho trang dịch vụ đơn lẻ" },
                cms: { state: "incompatible", priceText: "Không hỗ trợ", desc: "Không áp dụng cho trang dịch vụ đơn lẻ" },
                seo: { state: "optional", priceText: "+800k", cost: 800000 },
                security: { state: "optional", priceText: "+800k", cost: 800000 },
                booking: { state: "optional", priceText: "+1.2tr", cost: 1200000 },
                gallery: { state: "incompatible", priceText: "Không hỗ trợ", desc: "Không áp dụng cho trang dịch vụ đơn lẻ" },
                setup: { state: "optional", priceText: "+2.5tr", cost: 2500000 }
            },
            basic: {
                animations: { state: "optional", priceText: "+500k", cost: 500000 },
                languages: { state: "optional", priceText: "+1.5tr", cost: 1500000 },
                ecommerce: { state: "incompatible", priceText: "Không hỗ trợ", desc: "Cổng thanh toán yêu cầu gói Premium" },
                cms: { state: "optional", priceText: "+4.0tr", cost: 4000000 },
                seo: { state: "optional", priceText: "+800k", cost: 800000 },
                security: { state: "optional", priceText: "+800k", cost: 800000 },
                booking: { state: "optional", priceText: "+1.2tr", cost: 1200000 },
                gallery: { state: "optional", priceText: "+2.0tr", cost: 2000000 },
                setup: { state: "optional", priceText: "+2.5tr", cost: 2500000 }
            },
            plus: {
                animations: { state: "included", priceText: "Đã bao gồm", cost: 0, desc: "Được tích hợp sẵn miễn phí trong gói Plus" },
                languages: { state: "optional", priceText: "+1.5tr", cost: 1500000 },
                ecommerce: { state: "incompatible", priceText: "Không hỗ trợ", desc: "Cổng thanh toán yêu cầu gói Premium" },
                cms: { state: "included", priceText: "Đã bao gồm", cost: 0, desc: "Được tích hợp sẵn miễn phí trong gói Plus" },
                seo: { state: "included", priceText: "Đã bao gồm", cost: 0, desc: "Được tích hợp sẵn miễn phí trong gói Plus" },
                security: { state: "optional", priceText: "+800k", cost: 800000 },
                booking: { state: "optional", priceText: "+1.2tr", cost: 1200000 },
                gallery: { state: "optional", priceText: "+2.0tr", cost: 2000000 },
                setup: { state: "optional", priceText: "+2.5tr", cost: 2500000 }
            },
            premium: {
                animations: { state: "included", priceText: "Đã bao gồm", cost: 0, desc: "Được tích hợp sẵn miễn phí trong gói Premium" },
                languages: { state: "included", priceText: "Đã bao gồm", cost: 0, desc: "Được tích hợp sẵn miễn phí trong gói Premium" },
                ecommerce: { state: "included", priceText: "Đã bao gồm", cost: 0, desc: "Được tích hợp sẵn miễn phí trong gói Premium" },
                cms: { state: "included", priceText: "Đã bao gồm", cost: 0, desc: "Được tích hợp sẵn miễn phí trong gói Premium" },
                seo: { state: "included", priceText: "Đã bao gồm", cost: 0, desc: "Được tích hợp sẵn miễn phí trong gói Premium" },
                security: { state: "included", priceText: "Đã bao gồm", cost: 0, desc: "Được tích hợp sẵn miễn phí trong gói Premium" },
                booking: { state: "included", priceText: "Đã bao gồm", cost: 0, desc: "Được tích hợp sẵn miễn phí trong gói Premium" },
                gallery: { state: "included", priceText: "Đã bao gồm", cost: 0, desc: "Được tích hợp sẵn miễn phí trong gói Premium" },
                setup: { state: "optional", priceText: "+2.5tr", cost: 2500000 }
            }
        };

        const tierRules = compatibility[selectedTier];

        // Apply compatibility filter to UI & count pricing
        Object.keys(tierRules).forEach(key => {
            const chk = document.getElementById(`feat-${key}`);
            const wrapper = document.getElementById(`wrapper-feat-${key}`);
            const priceSpan = document.getElementById(`price-feat-${key}`);
            const descDiv = document.getElementById(`desc-feat-${key}`);

            if (!chk || !wrapper) return;

            const rule = tierRules[key];

            // Standard reset state
            wrapper.className = "flex items-center gap-3 p-3 bg-white rounded-xl border border-[#dabfcc]/35 cursor-pointer hover:bg-[#a72683]/5 transition-all";
            chk.disabled = false;

            if (rule.state === "incompatible") {
                chk.checked = false;
                chk.disabled = true;
                wrapper.className = "flex items-center gap-3 p-3 bg-slate-100 opacity-40 rounded-xl border border-[#dabfcc]/20 cursor-not-allowed pointer-events-none";
                if (priceSpan) {
                    priceSpan.textContent = rule.priceText;
                    priceSpan.className = "text-[9px] text-slate-500 font-bold uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded-full shrink-0";
                }
                if (descDiv && rule.desc) {
                    descDiv.textContent = rule.desc;
                    descDiv.className = "text-slate-400 text-[10px]";
                }
            } else if (rule.state === "included") {
                chk.checked = true;
                chk.disabled = true;
                wrapper.className = "flex items-center gap-3 p-3 bg-[#a72683]/5 rounded-xl border border-[#a72683]/30 pointer-events-none";
                if (priceSpan) {
                    priceSpan.textContent = rule.priceText;
                    priceSpan.className = "text-[9px] text-[#a72683] font-bold uppercase tracking-wider bg-[#a72683]/10 px-2 py-0.5 rounded-full shrink-0";
                }
                if (descDiv && rule.desc) {
                    descDiv.textContent = rule.desc;
                    descDiv.className = "text-[#a72683]/80 text-[10px]";
                }
            } else {
                // Optional state
                if (priceSpan) {
                    priceSpan.textContent = rule.priceText;
                    priceSpan.className = "text-[9px] text-[#a72683] font-bold shrink-0";
                }

                // Restore default descriptions
                const defaultDescs = {
                    animations: "Chuyển động mượt mà, bong bóng tương tác cao cấp",
                    languages: "Chuyển đổi ngôn ngữ Việt - Anh linh hoạt chuẩn quốc tế",
                    ecommerce: "Tích hợp cổng Momo, VNPAY, Bank QR tự động hóa",
                    cms: "Giao diện Admin tự viết bài, quản lý dự án không cần code",
                    seo: "Khai báo Google, cài đặt Analytics đo lường chuyên nghiệp",
                    security: "Khóa chuột phải, cấm sao chép nội dung, chống tải hình ảnh để bảo vệ tuyệt đối chất xám và tài sản số",
                    booking: "Lịch chọn ngày giờ trực quan, tự động báo qua Telegram/Email",
                    gallery: "Client Dashboard riêng tư bàn giao tệp tin, hình ảnh & video chất lượng cao siêu mượt",
                    setup: "Cài đặt cấu hình tên miền (.com/.vn/.online/.studio...) & Hosting theo thỏa thuận hoàn tất"
                };
                if (descDiv) {
                    descDiv.textContent = defaultDescs[key];
                    descDiv.className = "text-[#54414b] text-[10px]";
                }

                if (chk.checked) {
                    total += rule.cost;
                    wrapper.className = "flex items-center gap-3 p-3 bg-[#a72683]/5 rounded-xl border border-[#a72683]/40 cursor-pointer shadow-[0_4px_12px_rgba(167,38,131,0.03)] transition-all";
                }
            }
        });

        // Base Support Price card style formatting and math addition
        let selectedSupport = "none";
        const supportPrices = { none: 0, basic: 500000, plus: 850000, pre: 1500000 };
        for (const radio of supportRadios) {
            const lbl = document.getElementById(`label-support-${radio.value}`);
            if (!lbl) continue;
            if (radio.checked) {
                selectedSupport = radio.value;
                lbl.className = "relative flex flex-col items-center justify-center p-3.5 rounded-xl border-2 border-[#a72683] bg-[#a72683]/5 cursor-pointer scale-105 shadow-[0_8px_20px_rgba(167,38,131,0.08)] transition-all text-center select-none text-[#3b002c] font-bold";
            } else {
                lbl.className = "relative flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#dabfcc]/30 bg-white cursor-pointer hover:border-[#a72683]/50 transition-all text-center select-none text-[#54414b] shadow-sm";
            }
        }
        total += supportPrices[selectedSupport];

        // Timeline Slider Adjustments depending on Tier scale
        const speedVal = parseInt(timelineSlider.value);
        let multiplier = 1.0;
        const isSmallTier = ["portfolio", "single_page", "basic"].includes(selectedTier);
        const ticksContainer = document.getElementById("timeline-ticks-labels");

        if (isSmallTier) {
            if (ticksContainer) {
                ticksContainer.innerHTML = `
                    <span>Thong thả (Giảm 3%)</span>
                    <span>Bình thường (Chuẩn)</span>
                    <span>Siu tốc (+20% giá)</span>
                `;
            }
            if (speedVal === 1) {
                multiplier = 0.97; // 3% Discount
                timelineText.textContent = "Thong thả (Giảm 3% - 8-14 ngày)";
                timelineText.className = "text-xs font-bold text-emerald-500";
            } else if (speedVal === 2) {
                multiplier = 1.0;
                timelineText.textContent = "Bình thường (Chuẩn - 6-8 ngày)";
                timelineText.className = "text-xs font-bold text-secondary";
            } else if (speedVal === 3) {
                multiplier = 1.20; // 20% Markup
                timelineText.textContent = "Siu tốc (Gia tốc +20% - 3-5 ngày)";
                timelineText.className = "text-xs font-bold text-rose-500 animate-pulse";
            }
        } else {
            if (ticksContainer) {
                ticksContainer.innerHTML = `
                    <span>Thong dong (Giảm 5%)</span>
                    <span>Tự Tại (Chuẩn)</span>
                    <span>Cưỡi Mây (+20% giá)</span>
                `;
            }
            if (speedVal === 1) {
                multiplier = 0.95; // 5% Discount
                timelineText.textContent = "Thong dong (Giảm 5% - 14-18 tuần)";
                timelineText.className = "text-xs font-bold text-emerald-500";
            } else if (speedVal === 2) {
                multiplier = 1.0;
                timelineText.textContent = "Tự Tại (Chuẩn - 8-14 tuần)";
                timelineText.className = "text-xs font-bold text-secondary";
            } else if (speedVal === 3) {
                multiplier = 1.20; // 20% Markup
                timelineText.textContent = "Cưỡi Mây (Gia tốc +20% - 5-8 tuần)";
                timelineText.className = "text-xs font-bold text-rose-500 animate-pulse";
            }
        }

        total = Math.round(total * multiplier);

        // Run Value Counting Animation
        if (isInstant) {
            priceEl.textContent = formatCurrency(total);
            currentCalculatedPrice = total;
        } else {
            animatePrice(currentCalculatedPrice, total, 400);
        }

        // Render dynamic live invoice receipt in UI
        const receiptTierEl = document.getElementById("calc-receipt-tier");
        const receiptItemsEl = document.getElementById("calc-receipt-items");
        if (receiptTierEl && receiptItemsEl) {
            let selectedTierText = selectedTier.toUpperCase();
            if (selectedTier === "portfolio") selectedTierText = "Cây dương xỉ cô đơn";
            else if (selectedTier === "single_page") selectedTierText = "Ghép mảnh";
            else if (selectedTier === "basic") selectedTierText = "Mơ trong hồ";
            else if (selectedTier === "plus") selectedTierText = "Mộng bay xa";
            else if (selectedTier === "premium") selectedTierText = "Bay xa";

            receiptTierEl.textContent = `Gói: ${selectedTierText}`;

            let receiptHtml = "";

            // 1. Base Cost
            const baseCost = PRICING.tiers[selectedTier];
            if (selectedTier === "single_page") {
                let pagesCount = 0;
                let pagesCost = 0;
                if (document.getElementById("page-gioithieu").checked) { pagesCount++; pagesCost += 500000; }
                if (document.getElementById("page-album-anh").checked) { pagesCount++; pagesCost += 650000; }
                if (document.getElementById("page-album-video").checked) { pagesCount++; pagesCost += 650000; }
                if (document.getElementById("page-portfolio").checked) { pagesCount++; pagesCost += 500000; }
                if (document.getElementById("page-sanpham").checked) { pagesCount++; pagesCost += 780000; }
                if (document.getElementById("page-baogia").checked) { pagesCount++; pagesCost += 450000; }
                if (document.getElementById("page-lienhe").checked) { pagesCount++; pagesCost += 400000; }
                if (document.getElementById("page-faq").checked) {
                    pagesCount++;
                    let faqCost = 350000;
                    if (faqTabs > 6) faqCost += (faqTabs - 6) * 50000;
                    pagesCost += faqCost;
                }
                receiptHtml += `
                    <div class="flex justify-between items-center border-b border-[#dabfcc]/40 pb-2 text-[#3b002c]">
                        <span class="font-bold">Trang dịch vụ đơn lẻ (${pagesCount} trang)</span>
                        <span class="font-bold text-[#a72683] font-mono">${formatCurrency(pagesCost)}đ</span>
                    </div>
                `;
            } else {
                receiptHtml += `
                    <div class="flex justify-between items-center border-b border-[#dabfcc]/40 pb-2 text-[#3b002c]">
                        <span class="font-bold">Giá trị gói gốc</span>
                        <span class="font-bold text-[#a72683] font-mono">${formatCurrency(baseCost)}đ</span>
                    </div>
                `;
            }

            // 2. Addons
            addonChecks.forEach(chk => {
                if (chk.checked) {
                    const addOnKey = chk.id.replace("feat-", "");
                    const rule = tierRules[addOnKey];
                    if (rule && rule.cost > 0) {
                        const title = chk.closest("label").querySelector(".font-bold > span").textContent;
                        receiptHtml += `
                            <div class="flex justify-between items-center text-[10px] text-[#54414b] mt-2">
                                <span>+ ${title}</span>
                                <span class="font-semibold text-[#a72683] font-mono">+${formatCurrency(rule.cost)}đ</span>
                            </div>
                        `;
                    }
                }
            });

            // 3. Support
            const supportNames = {
                none: "Tự Quản Lý",
                basic: "Hỗ trợ Basic (3 thg)",
                plus: "Hỗ trợ Plus (6 thg)",
                pre: "Hỗ trợ Pre+ (12 thg)"
            };
            if (selectedSupport !== "none") {
                receiptHtml += `
                    <div class="flex justify-between items-center text-[10px] text-[#54414b] mt-2">
                        <span>+ ${supportNames[selectedSupport]}</span>
                        <span class="font-semibold text-[#a72683] font-mono">+${formatCurrency(supportPrices[selectedSupport])}đ</span>
                    </div>
                `;
            }

            // 4. Timeline modifier markup
            if (speedVal === 1) {
                const discountPct = isSmallTier ? "3%" : "5%";
                receiptHtml += `
                    <div class="flex justify-between items-center text-[10px] text-emerald-600 font-bold mt-2">
                        <span>Tiến độ: Thong thong</span>
                        <span class="font-mono">Giảm -${discountPct}</span>
                    </div>
                `;
            } else if (speedVal === 3) {
                receiptHtml += `
                    <div class="flex justify-between items-center text-[10px] text-rose-600 font-bold mt-2">
                        <span>Tiến độ: Gia tốc (+20% giá)</span>
                        <span class="font-mono">Phụ thu +20%</span>
                    </div>
                `;
            }

            receiptItemsEl.innerHTML = receiptHtml;
        }
    }

    // Smooth counter animator
    function animatePrice(start, end, duration) {
        let startTime = null;

        function update(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            // Ease out quad formula
            const easedProgress = progress * (2 - progress);
            const value = Math.floor(start + (end - start) * easedProgress);

            priceEl.textContent = formatCurrency(value);
            currentCalculatedPrice = value;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                priceEl.textContent = formatCurrency(end);
                currentCalculatedPrice = end;
            }
        }
        requestAnimationFrame(update);
    }

    function formatCurrency(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Attach calculation change triggers
    tierRadios.forEach(r => r.addEventListener("change", () => {
        playPopSound();
        calculatePrice();
    }));
    addonChecks.forEach(c => c.addEventListener("change", () => {
        playPopSound();
        calculatePrice();
    }));
    timelineSlider.addEventListener("input", () => {
        calculatePrice();
    });

    // Dynamic Single Page Item calculation attachments
    singlePageItems.forEach(item => item.addEventListener("change", () => {
        playPopSound();
        calculatePrice();
    }));

    let faqTabs = 6;
    function updateFAQPrice() {
        if (!faqPriceTextEl) return;
        let price = 350000;
        if (faqTabs > 6) {
            price += (faqTabs - 6) * 50000;
        }
        faqPriceTextEl.textContent = `${Math.round(price / 1000)}k`;
    }

    if (btnFaqMinus) {
        btnFaqMinus.addEventListener("click", (e) => {
            e.preventDefault();
            if (faqTabs > 1) {
                faqTabs--;
                faqTabCountEl.textContent = faqTabs;
                playPopSound();
                updateFAQPrice();
                calculatePrice();
            }
        });
    }

    if (btnFaqPlus) {
        btnFaqPlus.addEventListener("click", (e) => {
            e.preventDefault();
            faqTabs++;
            faqTabCountEl.textContent = faqTabs;
            playPopSound();
            updateFAQPrice();
            calculatePrice();
        });
    }

    supportRadios.forEach(r => r.addEventListener("change", () => {
        playPopSound();
        calculatePrice();
    }));

    // 4. Quotation Message Generation
    function generateProposalText() {
        const name = clientNameInput.value.trim() || "Khách Hàng Ẩn Danh";
        const phone = clientPhoneInput.value.trim() || "Chưa cung cấp SĐT";

        let selectedTier = "BASIC";
        for (const radio of tierRadios) {
            if (radio.checked) selectedTier = radio.value.toUpperCase();
        }

        let selectedTierText = selectedTier;
        if (selectedTier === "PORTFOLIO") {
            selectedTierText = "CÂY DƯƠNG XỈ CÔ ĐƠN (Portfolio)";
        } else if (selectedTier === "BASIC") {
            selectedTierText = "MƠ TRONG HỒ (Basic)";
        } else if (selectedTier === "PLUS") {
            selectedTierText = "MỘNG BAY XA (Plus)";
        } else if (selectedTier === "PREMIUM") {
            selectedTierText = "BAY XA (Premium)";
        }
        if (selectedTier === "SINGLE_PAGE") {
            let pagesList = [];
            if (document.getElementById("page-gioithieu").checked) pagesList.push("Giới Thiệu (500k)");
            if (document.getElementById("page-album-anh").checked) pagesList.push("Album Ảnh (650k)");
            if (document.getElementById("page-album-video").checked) pagesList.push("Album Video (650k)");
            if (document.getElementById("page-portfolio").checked) pagesList.push("Portfolio Tích Hợp (500k)");
            if (document.getElementById("page-sanpham").checked) pagesList.push("Sản Phẩm (780k)");
            if (document.getElementById("page-baogia").checked) pagesList.push("Báo Giá (450k)");
            if (document.getElementById("page-lienhe").checked) pagesList.push("Liên Hệ & Bản Đồ (400k)");
            if (document.getElementById("page-faq").checked) {
                let faqCost = 350000;
                if (faqTabs > 6) faqCost += (faqTabs - 6) * 50000;
                pagesList.push(`Hỏi & Đáp FAQ (${faqTabs} tabs - ${Math.round(faqCost / 1000)}k)`);
            }
            selectedTierText = `TRANG RIÊNG LẺ (Danh sách trang: ${pagesList.length > 0 ? pagesList.join(", ") : "Chưa chọn trang"})`;
        }

        let addonsList = [];
        addonChecks.forEach(chk => {
            if (chk.checked) {
                const addOnTitle = chk.closest("label").querySelector(".font-bold").textContent;
                addonsList.push(`• ${addOnTitle}`);
            }
        });

        let supportText = "Tự Quản Lý (0đ)";
        for (const radio of supportRadios) {
            if (radio.checked) {
                if (radio.value === "basic") supportText = "Hỗ Trợ Basic - 3 tháng (500k)";
                else if (radio.value === "plus") supportText = "Hỗ Trợ Plus - 6 tháng (850k)";
                else if (radio.value === "pre") supportText = "Hỗ Trợ Pre+ - 12 tháng (1.500k)";
            }
        }

        const timeline = timelineText.textContent;
        const finalPrice = priceEl.textContent;

        return `Chào bạn, tôi là ${name}
Tôi có yêu cầu với gói: ${selectedTierText}

Nội dung yêu cầu:
${addonsList.length > 0 ? addonsList.join("\n") : "• Không có tính năng thêm"}
• Tiến độ: ${timeline}
• Quản lý: ${supportText}
• Tổng chi phí dự kiến: ${finalPrice} VNĐ

Liên hệ tôi qua: ${phone}`;
    }

    // 5. Contact Actions Dispatch
    sendZaloBtn.addEventListener("click", () => {
        playPopSound();
        const text = encodeURIComponent(generateProposalText());
        const url = `https://zalo.me/${CONFIG.zaloNumber}`;

        // Custom message copying notification
        alert("Báo giá chi tiết của bạn đã được sao chép vào bộ nhớ tạm! Bạn sẽ được chuyển sang Zalo của Dev.Architect để dán tin nhắn nhận tư vấn trực tiếp.");
        navigator.clipboard.writeText(generateProposalText()).then(() => {
            window.open(url, "_blank");
        }).catch(() => {
            window.open(url, "_blank");
        });
    });

    sendEmailBtn.addEventListener("click", () => {
        playPopSound();
        const subject = encodeURIComponent(`[HUGO WISHPAX STUDIO] Yêu Cầu Báo Giá Thiết Kế Website từ ${clientNameInput.value.trim() || "Khách Hàng"}`);
        const body = encodeURIComponent(generateProposalText());
        const mailtoUrl = `mailto:${CONFIG.emailAddress}?subject=${subject}&body=${body}`;
        window.open(mailtoUrl, "_blank");
    });
}

/* ==========================================
   🖼️ PROJECT DETAILS MODAL DIALOGS
   ========================================== */
function initProjectModals() {
    const projectsData = {
        "minhoi": {
            title: "HUGO WISHPAX STUDIO",
            subtitle: "Phóng Sự Cưới Nghệ Thuật",
            desc: "Website portfolio chuyên nghiệp dành cho studio chụp ảnh phóng sự cưới nghệ thuật HUGO WISHPAX STUDIO. Thiết kế mang đậm phong cách tạp chí nghệ thuật cao cấp (Luxury Editorial Design) với bố cục bất đối xứng tinh tế, tương phản cao, tối ưu hiển thị trên các thiết bị di động, chuẩn SEO và tích hợp các lớp chống tải/quét dữ liệu hình ảnh trái phép.",
            tech: ["HTML5", "Vite", "Tailwind CSS", "Premium Editorial", "SEO", "Image Shield"],
            timeline: "3 - 4 Tuần",
            baseTier: "Plus (5tr+)"
        },
        "mern_portfolio": {
            title: "Personal IT Portfolio",
            subtitle: "Trang Phát Triển Cá Nhân MERN",
            desc: "Dự án portfolio và lưu trữ thông tin cá nhân ứng dụng mô hình Full-Stack MERN (MongoDB, Express, React, Node.js). Hệ thống tích hợp đầy đủ công cụ theo dõi năng lực học tập, quản lý kho dự án, bộ đếm tương tác trực quan cùng hệ thống Admin CMS cho phép cấu hình và chỉnh sửa dữ liệu thời gian thực.",
            tech: ["MongoDB", "Express", "React", "Node.js", "Tailwind CSS", "JWT Auth"],
            timeline: "4 - 6 Tháng",
            baseTier: "Plus (5tr+)"
        },
        "hr_system": {
            title: "HR Management System",
            subtitle: "Hệ thống quản lý nhân sự giáo phận",
            desc: "Hệ thống chuyên nghiệp hỗ trợ số hóa hồ sơ nhân lực, theo dõi công việc nội bộ và điều phối nhóm. Tích hợp tính năng phân quyền chặt chẽ, xuất báo cáo nhân sự tự động, tạo thẻ căn cước số hóa nội bộ và đồng bộ dữ liệu bảo mật cao phục vụ cho TNTT Giáo phận Mỹ Tho.",
            tech: ["Node.js", "Express", "MongoDB", "Tailwind CSS", "JWT Auth", "Auto ID Card"],
            timeline: "6 - 8 Tuần",
            baseTier: "Premium (14tr+)"
        }
    };

    // Inject Dialog structure
    const dialogHtml = `
    <div id="project-detail-modal" class="fixed inset-0 z-[100] flex items-center justify-center hidden bg-[#120f18]/60 backdrop-blur-md transition-opacity duration-300 opacity-0">
        <div class="clay-card dark:bg-[#1a1422] max-w-xl w-full mx-4 rounded-[2rem] p-6 shadow-2xl relative scale-95 transition-all duration-300">
            <!-- Close Button -->
            <button id="close-project-modal" class="absolute top-5 right-5 text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-transform hover:scale-110 active:scale-95">
                <span class="material-symbols-outlined text-3xl">close</span>
            </button>

            <!-- Card Banner Icon -->
            <div id="project-modal-icon-container" class="w-16 h-16 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
                <span class="material-symbols-outlined text-4xl" id="project-modal-icon">photo_camera</span>
            </div>

            <!-- Titles -->
            <h3 class="font-headline-lg text-2xl text-on-surface dark:text-white" id="project-modal-title">HUGO WISHPAX STUDIO</h3>
            <p class="text-xs font-bold text-primary dark:text-primary-fixed uppercase tracking-wider mb-4" id="project-modal-subtitle">Phóng Sự Cưới Nghệ Thuật</p>

            <!-- Description -->
            <p class="text-xs md:text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed mb-6" id="project-modal-desc">
                Description goes here...
            </p>

            <!-- Info Pills Row -->
            <div class="grid grid-cols-2 gap-4 mb-6 bg-surface-container/40 dark:bg-[#1d1726]/80 p-3 rounded-2xl border border-outline-variant/10">
                <div>
                    <span class="text-[10px] text-on-surface-variant dark:text-slate-400 block font-bold uppercase tracking-widest">Thời gian thực hiện</span>
                    <span class="text-xs font-bold text-on-surface dark:text-white" id="project-modal-time">3-4 Tuần</span>
                </div>
                <div>
                    <span class="text-[10px] text-on-surface-variant dark:text-slate-400 block font-bold uppercase tracking-widest">Gói phù hợp nhất</span>
                    <span class="text-xs font-bold text-primary dark:text-primary-fixed" id="project-modal-tier">Plus</span>
                </div>
            </div>

            <!-- Tech Tags -->
            <div class="mb-6">
                <span class="text-[10px] text-on-surface-variant dark:text-slate-400 block font-bold uppercase tracking-widest mb-2">Công nghệ sử dụng</span>
                <div class="flex flex-wrap gap-1.5" id="project-modal-techs">
                    <!-- Tech tags go here -->
                </div>
            </div>

            <!-- Footer Action -->
            <button id="project-request-quote" class="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-3 rounded-full hover:scale-105 active:scale-95 transition-all clay-btn-primary shadow-md">
                <span class="material-symbols-outlined">calculate</span>
                Báo Giá Làm Website Tương Tự
            </button>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML("beforeend", dialogHtml);

    const modal = document.getElementById("project-detail-modal");
    const closeBtn = document.getElementById("close-project-modal");
    const iconContainer = document.getElementById("project-modal-icon-container");
    const modalIcon = document.getElementById("project-modal-icon");
    const modalTitle = document.getElementById("project-modal-title");
    const modalSubtitle = document.getElementById("project-modal-subtitle");
    const modalDesc = document.getElementById("project-modal-desc");
    const modalTime = document.getElementById("project-modal-time");
    const modalTier = document.getElementById("project-modal-tier");
    const modalTechs = document.getElementById("project-modal-techs");
    const requestBtn = document.getElementById("project-request-quote");

    function openProjectModal(key) {
        const data = projectsData[key];
        if (!data) return;

        // Set content
        modalTitle.textContent = data.title;
        modalSubtitle.textContent = data.subtitle;
        modalDesc.textContent = data.desc;
        modalTime.textContent = data.timeline;
        modalTier.textContent = data.baseTier;

        // Reset icon styling based on key
        let colorClass = "";
        let iconName = "";
        if (key === "minhoi") {
            colorClass = "bg-secondary-container text-on-secondary-container";
            iconName = "photo_camera";
        } else if (key === "mern_portfolio") {
            colorClass = "bg-tertiary-container text-on-tertiary-container";
            iconName = "developer_mode";
        } else {
            colorClass = "bg-primary-container text-on-primary-container";
            iconName = "groups";
        }
        iconContainer.className = `w-16 h-16 rounded-3xl flex items-center justify-center mb-5 shadow-inner ${colorClass}`;
        modalIcon.textContent = iconName;

        // Render tech tags
        modalTechs.innerHTML = "";
        data.tech.forEach(t => {
            const tag = document.createElement("span");
            tag.className = "bg-surface-container-highest dark:bg-[#251f2e] text-on-surface-variant dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-outline-variant/20 dark:border-slate-800";
            tag.textContent = t;
            modalTechs.appendChild(tag);
        });

        // Store active key for quote button mapping
        requestBtn.setAttribute("data-project-key", key);

        // Open animation
        modal.classList.remove("hidden");
        modal.offsetHeight; // reflow
        modal.classList.remove("opacity-0");
        modal.classList.add("opacity-100");
        modal.querySelector(".clay-card").classList.remove("scale-95");
        modal.querySelector(".clay-card").classList.add("scale-100");
    }

    function closeProjectModal() {
        modal.classList.remove("opacity-100");
        modal.classList.add("opacity-0");
        modal.querySelector(".clay-card").classList.remove("scale-100");
        modal.querySelector(".clay-card").classList.add("scale-95");

        setTimeout(() => {
            modal.classList.add("hidden");
        }, 300);
    }

    // Hook click triggers on index.html project cards
    const cards = document.querySelectorAll("#projects > div > div");
    if (cards.length >= 3) {
        cards[0].style.cursor = "pointer";
        cards[0].addEventListener("click", (e) => {
            if (e.target.closest("a") || e.target.closest("button")) return;
            playPopSound();
            openProjectModal("minhoi");
        });

        cards[1].style.cursor = "pointer";
        cards[1].addEventListener("click", (e) => {
            if (e.target.closest("a") || e.target.closest("button")) return;
            playPopSound();
            openProjectModal("mern_portfolio");
        });

        cards[2].style.cursor = "pointer";
        cards[2].addEventListener("click", (e) => {
            if (e.target.closest("a") || e.target.closest("button")) return;
            playPopSound();
            openProjectModal("hr_system");
        });
    }

    closeBtn.addEventListener("click", () => {
        playPopSound();
        closeProjectModal();
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            playPopSound();
            closeProjectModal();
        }
    });

    // Custom Quote Request redirection
    requestBtn.addEventListener("click", () => {
        const key = requestBtn.getAttribute("data-project-key");
        closeProjectModal();

        // Open calculator modal and preset selections
        setTimeout(() => {
            const calcModal = document.getElementById("calculator-modal");
            if (calcModal) {
                // Determine tier radio value to select
                let tierValue = "plus";
                if (key === "hr_system") tierValue = "premium";

                const radio = calcModal.querySelector(`input[name="calc-tier"][value="${tierValue}"]`);
                if (radio) radio.checked = true;

                // Preset checkboxes
                const animsCheck = document.getElementById("feat-animations");
                const seoCheck = document.getElementById("feat-seo");
                const ecomCheck = document.getElementById("feat-ecommerce");
                const cmsCheck = document.getElementById("feat-cms");

                // Clear previous checkboxes first
                calcModal.querySelectorAll(".addon-check").forEach(c => c.checked = false);

                if (key === "minhoi") {
                    if (animsCheck) animsCheck.checked = true;
                    if (seoCheck) seoCheck.checked = true;
                } else if (key === "mern_portfolio") {
                    if (cmsCheck) cmsCheck.checked = true;
                    if (animsCheck) animsCheck.checked = true;
                } else if (key === "hr_system") {
                    if (cmsCheck) cmsCheck.checked = true;
                    if (seoCheck) seoCheck.checked = true;
                }

                // Trigger open
                const triggerBtn = document.querySelector("header flex button#theme-toggle");
                // Open modal by clicking "Báo Giá Ngay" button
                const openCalculatorBtn = document.querySelector("header button.clay-btn-primary");
                if (openCalculatorBtn) openCalculatorBtn.click();
            }
        }, 400);
    });
}

/* ==========================================
   💳 BANKING QR EXPANDER MODAL
   ========================================== */
function initQRModal() {
    // Dialog structure

    // Dialog structure
    const qrModalHtml = `
    <div id="qr-detail-modal" class="fixed inset-0 z-[100] flex items-center justify-center hidden bg-[#120f18]/60 backdrop-blur-md transition-opacity duration-300 opacity-0">
        <div class="clay-card dark:bg-[#1a1422] max-w-sm w-full mx-4 rounded-[2rem] p-6 shadow-2xl relative text-center scale-95 transition-all duration-300">
            <!-- Close Button -->
            <button id="close-qr-modal" class="absolute top-5 right-5 text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-transform hover:scale-110 active:scale-95">
                <span class="material-symbols-outlined text-3xl">close</span>
            </button>

            <!-- QR Header -->
            <h3 class="font-headline-lg text-xl text-primary dark:text-primary-fixed mb-1 mt-2">Quét Mã Kết Nối Zalo</h3>
            <p class="text-xs text-on-surface-variant dark:text-slate-400 mb-6">Mở camera trên Zalo để quét mã và trò chuyện trực tiếp</p>

            <!-- Visual QR code -->
            <div class="inline-block bg-white p-4 rounded-3xl shadow-md border-2 border-primary-container mb-6">
                <div class="w-48 h-48 bg-white flex items-center justify-center relative overflow-hidden">
                    <div class="absolute inset-1 border-4 border-slate-900 rounded-xl flex flex-wrap content-start p-2 gap-1 bg-white">
                        <div class="w-9 h-9 bg-slate-900 rounded-sm"></div>
                        <div class="w-5 h-5 bg-slate-900 rounded-sm"></div>
                        <div class="w-7 h-7 bg-slate-900 rounded-sm"></div>
                        <div class="w-full h-2.5 bg-slate-900 rounded-sm mt-2"></div>
                        <div class="w-12 h-12 bg-primary rounded-sm absolute bottom-4 right-4"></div>
                        <div class="w-8 h-8 bg-slate-900 rounded-sm absolute top-4 right-4"></div>
                        <div class="w-8 h-8 bg-slate-900 rounded-sm absolute bottom-4 left-4"></div>
                        
                        <!-- Core brand branding bubble -->
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div class="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-full shadow-md flex items-center justify-center border-2 border-white scale-110 animate-bounce">
                                <span class="material-symbols-outlined text-lg">waving_hand</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contacts Info list -->
            <div class="space-y-3 text-left bg-surface-container/60 dark:bg-[#1d1726]/80 p-4 rounded-2xl border border-outline-variant/10 text-xs">
                <div class="flex items-center gap-2 text-on-surface dark:text-white">
                    <span class="material-symbols-outlined text-secondary text-sm">chat_bubble</span>
                    <span class="font-bold">Số điện thoại Zalo:</span>
                    <span class="ml-auto font-bold">${CONFIG.zaloNumber}</span>
                </div>
                <div class="flex items-center gap-2 text-on-surface dark:text-white">
                    <span class="material-symbols-outlined text-primary text-sm">mail</span>
                    <span class="font-bold">Email hỗ trợ:</span>
                    <span class="ml-auto text-on-surface-variant dark:text-slate-400 font-bold">${CONFIG.emailAddress}</span>
                </div>
            </div>
            
            <a href="https://zalo.me/${CONFIG.zaloNumber}" target="_blank" class="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-bold py-3.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md mt-6 clay-btn-secondary">
                <span class="material-symbols-outlined">launch</span>
                Nhấn Trò Chuyện Ngay
            </a>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML("beforeend", qrModalHtml);

    const modal = document.getElementById("qr-detail-modal");
    const closeBtn = document.getElementById("close-qr-modal");

    function openQRModal() {
        modal.classList.remove("hidden");
        modal.offsetHeight; // reflow
        modal.classList.remove("opacity-0");
        modal.classList.add("opacity-100");
        modal.querySelector(".clay-card").classList.remove("scale-95");
        modal.querySelector(".clay-card").classList.add("scale-100");
    }

    function closeQRModal() {
        modal.classList.remove("opacity-100");
        modal.classList.add("opacity-0");
        modal.querySelector(".clay-card").classList.remove("scale-100");
        modal.querySelector(".clay-card").classList.add("scale-95");

        setTimeout(() => {
            modal.classList.add("hidden");
        }, 300);
    }



    closeBtn.addEventListener("click", () => {
        playPopSound();
        closeQRModal();
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            playPopSound();
            closeQRModal();
        }
    });

    // Also support connecting contact buttons directly
    const emailContactBtn = document.querySelector("main section#contact button:first-of-type");
    const apptContactBtn = document.querySelector("main section#contact button:last-of-type");

    if (emailContactBtn) {
        emailContactBtn.addEventListener("click", (e) => {
            e.preventDefault();
            playPopSound();
            window.open(`https://zalo.me/${CONFIG.zaloNumber}`, "_blank");
        });
    }

    if (apptContactBtn) {
        apptContactBtn.addEventListener("click", (e) => {
            e.preventDefault();
            playPopSound();
            window.open(`https://zalo.me/${CONFIG.zaloNumber}`, "_blank");
        });
    }
}

/* ==========================================
   🎭 HERO AVATAR ROTATING ROTATOR (POP-UP INTERACTION)
   ========================================== */
function initAvatarRotator() {
    const avatarEl = document.getElementById("hero-avatar");
    if (!avatarEl) return;

    const images = [
        "image/avt1.png",
        "image/avt2.png",
        "image/avt3.png",
        "image/avt4.png"
    ];
    let currentIndex = 0;

    // Cache preloaded images to prevent network flash on change
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    setInterval(() => {
        // Pop-out transition: Shrink down and fade out
        avatarEl.classList.add("scale-75", "opacity-0", "rotate-6");

        setTimeout(() => {
            // Cycle image source
            currentIndex = (currentIndex + 1) % images.length;
            avatarEl.src = images[currentIndex];

            // Pop-in bounce transition: Scale back up with an overshoot pop effect
            avatarEl.classList.remove("scale-75", "opacity-0", "rotate-6");
            avatarEl.classList.add("scale-105");

            setTimeout(() => {
                avatarEl.classList.remove("scale-105");
            }, 250);
        }, 400); // Wait for transition duration-500 pop-out to complete
    }, 5000); // Shift every 5 seconds
}

/* ==========================================================================
   🎮 BƯỚC 5: HỆ THỐNG QUẢN LÝ DỊCH VỤ GAMIFIED & INTERACTIVE PREVIEWS
   ========================================================================== */

let plusDecrypted = false;
let premiumUnlocked = false;
let scrambleInterval = null;
let activeVideoTrack = null;

function initInteractivePackages() {
    // 1. Basic Package (Mơ trong hồ) - Eye hiding
    const btnToggleBasic = document.getElementById("btn-toggle-basic-price");
    const basicPriceText = document.getElementById("basic-price-text");
    const eyeIconBasic = document.getElementById("eye-icon-basic");
    const btnSelectBasic = document.getElementById("btn-select-basic");

    if (btnToggleBasic && basicPriceText && eyeIconBasic) {
        let visible = false;
        btnToggleBasic.addEventListener("click", (e) => {
            e.stopPropagation();
            playPopSound();
            visible = !visible;
            if (visible) {
                basicPriceText.textContent = "3.000.000đ+";
                eyeIconBasic.textContent = "visibility";
                basicPriceText.classList.add("text-[#0fceff]", "animate-pulse");
                if (btnSelectBasic) {
                    btnSelectBasic.classList.remove("hidden");
                }
            } else {
                basicPriceText.textContent = "******đ";
                eyeIconBasic.textContent = "visibility_off";
                basicPriceText.classList.remove("text-[#0fceff]", "animate-pulse");
                if (btnSelectBasic) {
                    btnSelectBasic.classList.add("hidden");
                }
            }
        });
    }

    // 2. Plus Package (Mộng bay xa) - Scramble Glitch & Drag-Drop Key
    const plusTitle = document.getElementById("plus-card-title");
    const plusPrice = document.getElementById("plus-card-price");
    const dragKey = document.getElementById("plus-drag-key");
    const dropTarget = document.getElementById("plus-drop-target");

    if (plusTitle && plusPrice) {
        // Start scrambling interval
        const chars = "XYZ0123456789$#@%&*!ABCDEF";
        scrambleInterval = setInterval(() => {
            if (!plusDecrypted) {
                // Scramble price
                let scrambledPrice = "";
                for (let i = 0; i < 7; i++) {
                    scrambledPrice += chars[Math.floor(Math.random() * chars.length)];
                }
                plusPrice.textContent = scrambledPrice + "đ";

                // Scramble title occasionally
                if (Math.random() > 0.7) {
                    let scrambledTitle = "";
                    const targetLen = plusTitle.getAttribute("data-real").length;
                    for (let i = 0; i < targetLen; i++) {
                        scrambledTitle += chars[Math.floor(Math.random() * chars.length)];
                    }
                    plusTitle.textContent = scrambledTitle;
                }
            }
        }, 180);
    }

    // Setup HTML5 drag events
    if (dragKey && dropTarget) {
        dragKey.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", "dream-key");
            dragKey.classList.add("opacity-50", "scale-95");
        });

        dragKey.addEventListener("dragend", () => {
            dragKey.classList.remove("opacity-50", "scale-95");
        });

        dropTarget.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropTarget.classList.add("bg-primary/20", "border-solid", "scale-102");
        });

        dropTarget.addEventListener("dragleave", () => {
            dropTarget.classList.remove("bg-primary/20", "border-solid", "scale-102");
        });

        dropTarget.addEventListener("drop", (e) => {
            e.preventDefault();
            dropTarget.classList.remove("bg-primary/20", "border-solid", "scale-102");
            const data = e.dataTransfer.getData("text/plain");
            if (data === "dream-key") {
                decryptPlusPackage();
            }
        });

        // Add backup click listener for easy mobile touch-to-unlock
        dragKey.addEventListener("click", (e) => {
            e.stopPropagation();
            decryptPlusPackage();
        });
    }

    // 3. Premium Package (Đỉnh cao / Bay xa) - Biometric Face Scan Click Hook
    const btnActivateScan = document.getElementById("btn-activate-biometrics");
    if (btnActivateScan) {
        btnActivateScan.addEventListener("click", (e) => {
            e.stopPropagation();
            playPopSound();
            openFaceScan();
        });
    }
}

// 🔏 MATRIX DECRYPTION EFFECT FOR PLUS CARD
function decryptPlusPackage() {
    if (plusDecrypted) return;
    plusDecrypted = true;

    // Stop scrambling loop
    if (scrambleInterval) clearInterval(scrambleInterval);

    // Play beautiful magical sparkle sound
    playSparkleSound();

    const plusTitle = document.getElementById("plus-card-title");
    const plusPrice = document.getElementById("plus-card-price");
    const scrambleWrapper = document.getElementById("plus-scramble-wrapper");
    const realContent = document.getElementById("plus-real-content");
    const actionPlaceholder = document.getElementById("plus-action-btn-placeholder");

    // Matrix hacker fade reveal on elements
    if (plusTitle && plusPrice) {
        let ticks = 0;
        const targetTitle = plusTitle.getAttribute("data-real");
        const targetPrice = plusPrice.getAttribute("data-real");
        const chars = "0123456789$#@%&*!";

        const revealInterval = setInterval(() => {
            ticks++;
            let partialTitle = "";
            let partialPrice = "";

            for (let i = 0; i < targetTitle.length; i++) {
                if (i < ticks) {
                    partialTitle += targetTitle[i];
                } else {
                    partialTitle += chars[Math.floor(Math.random() * chars.length)];
                }
            }

            for (let i = 0; i < targetPrice.length; i++) {
                if (i < ticks) {
                    partialPrice += targetPrice[i];
                } else {
                    partialPrice += chars[Math.floor(Math.random() * chars.length)];
                }
            }

            plusTitle.textContent = partialTitle;
            plusPrice.textContent = partialPrice;

            if (ticks >= Math.max(targetTitle.length, targetPrice.length)) {
                clearInterval(revealInterval);
                plusTitle.textContent = targetTitle;
                plusPrice.textContent = targetPrice;
                plusPrice.classList.add("text-[#ffaedc]", "scale-105", "transition-all");

                // Show real details with fade animation
                if (scrambleWrapper && realContent && actionPlaceholder) {
                    scrambleWrapper.classList.add("opacity-0", "h-0", "overflow-hidden", "pointer-events-none", "mt-0", "mb-0");
                    setTimeout(() => {
                        scrambleWrapper.remove();
                        realContent.classList.remove("hidden");
                        realContent.classList.add("animate-fadeIn");

                        // Replace locked button with clickable active select package button
                        actionPlaceholder.innerHTML = `
                            <button class="w-full bg-primary text-on-primary font-bold py-3 rounded-full hover:bg-surface-tint transition-colors clay-btn-primary shadow-md" onclick="selectTierDirectly('plus')">
                                Chọn Gói Mộng bay xa
                            </button>
                        `;

                        // Trigger dynamic confetti burst
                        triggerConfettiBurst();
                    }, 300);
                }
            }
        }, 80);
    }
}

// 🔊 MAGICAL SPARKLE SFX
function playSparkleSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // Fast triple beep arpeggio
        const playBeep = (freq, delay, dur) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
            gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + dur);
        };

        playBeep(523.25, 0, 0.15); // C5
        playBeep(659.25, 0.08, 0.15); // E5
        playBeep(783.99, 0.16, 0.25); // G5
    } catch (e) { }
}

// Biometrics and python scanning functionality removed per request


// 🌈 DIGITAL CONFETTI SIMULATOR BURST (PURE HTML5 CANVAS OVERLAY)
function triggerConfettiBurst(isPremium = false) {
    const canvas = document.createElement("canvas");
    canvas.className = "fixed inset-0 pointer-events-none z-50 w-full h-full";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const colors = isPremium
        ? ["#f1daff", "#c989ff", "#ffaedc", "#ffd700", "#e5c158"]
        : ["#b9eaff", "#ffaedc", "#a72683", "#0fceff", "#ffe082"];

    for (let i = 0; i < 90; i++) {
        particles.push({
            x: width / 2,
            y: height / 2 - 100,
            radius: Math.random() * 5 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 16,
            vy: (Math.random() - 0.7) * 16 - 4,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 8 - 4
        });
    }

    let frame = 0;
    function animateConfetti() {
        ctx.clearRect(0, 0, width, height);
        frame++;

        let active = false;
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.35; // Gravity
            p.vx *= 0.98; // Friction
            p.rotation += p.rotationSpeed;

            if (p.y < height) {
                active = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;

                // Draw decorative little diamond stars or squares
                ctx.beginPath();
                ctx.moveTo(-p.radius, 0);
                ctx.lineTo(0, -p.radius * 1.5);
                ctx.lineTo(p.radius, 0);
                ctx.lineTo(0, p.radius * 1.5);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }
        });

        if (active && frame < 180) {
            requestAnimationFrame(animateConfetti);
        } else {
            canvas.remove();
        }
    }

    animateConfetti();
}

// 📦 MACBOOK DEVICE PREVIEW INTERACTIVE CSS CANVAS RENDERER
function openDemoMockup(packageKey) {
    const modal = document.getElementById("demo-modal");
    const title = document.getElementById("demo-title");
    const subtitle = document.getElementById("demo-subtitle");
    const urlText = document.getElementById("demo-browser-url");
    const canvas = document.getElementById("demo-canvas");
    const specSheet = document.getElementById("demo-spec-sheet");

    if (!modal || !canvas || !specSheet) return;
    playPopSound();

    // Clear canvas and specSheet
    canvas.innerHTML = "";
    specSheet.innerHTML = "";

    // Slide mockup modal open
    modal.classList.remove("opacity-0", "pointer-events-none");
    modal.firstElementChild.classList.remove("scale-95");
    modal.firstElementChild.classList.add("scale-100");

    // Render package mockups dynamically using inline-CSS custom responsive HTML structures
    if (packageKey === "basic") {
        title.textContent = "Mẫu Demo: Mơ trong hồ (Basic)";
        subtitle.textContent = "Giao diện Rosé Romance - Ngọt ngào, thanh lịch";
        urlText.textContent = "https://banggia.hugowishpax.studio/goi-basic-preview";

        // Render detailed design specification sheet on the left sidebar
        specSheet.innerHTML = `
            <div class="space-y-5 animate-fadeIn text-slate-800 dark:text-slate-200">
                <div class="flex items-center gap-2">
                    <span class="text-[9px] bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-extrabold px-3 py-1 rounded-full border border-rose-200/50">EDITORIAL BOUTIQUE</span>
                    <span class="text-[9px] text-slate-400 font-mono">v1.4.2</span>
                </div>
                
                <div>
                    <h4 class="font-serif text-base font-extrabold text-slate-800 dark:text-white leading-tight">Giao Diện: Rosé Romance</h4>
                    <p class="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Ngọt ngào, tối giản, thanh lịch</p>
                </div>
                
                <div class="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider font-mono">🎯 Ý NGHĨA THIẾT KẾ:</span>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1 font-light">
                            Tối ưu hóa khả năng truyền tải câu chuyện tình yêu mộc mạc và chân thành. Phù hợp làm thiệp cưới online cao cấp hoặc trang giới thiệu dịch vụ nhẹ nhàng, giúp khách hàng cảm nhận được chất thơ độc quyền.
                        </p>
                    </div>
                    
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider font-mono">🌟 ĐIỂM CỘNG VISUAL:</span>
                        <ul class="text-[11px] text-slate-600 dark:text-slate-300 space-y-2 mt-2 font-sans">
                            <li class="flex items-start gap-2">
                                <span class="text-rose-500 font-bold">✓</span>
                                <span>Khung lưới Polaroid ngẫu hứng lưu trữ khoảnh khắc tự nhiên.</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-rose-500 font-bold">✓</span>
                                <span>Phối màu Pastel Rose Gold lãng mạn, thanh tao, ấm áp.</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-rose-500 font-bold">✓</span>
                                <span>Tốc độ tải trang siêu tốc dưới 0.8 giây, cực êm trên di động.</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-3.5 text-[10px] text-rose-800 dark:text-rose-300 leading-relaxed">
                        💡 <strong>Tương tác thực tế:</strong> Bạn có thể rê chuột hoặc nhấp trực tiếp vào các bức ảnh Polaroid trên màn hình MacBook bên phải để xem phản hồi chuyển động!
                    </div>
                </div>
                
                <button class="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-97 shadow-rose-500/10" onclick="closeDemoMockup(); selectTierDirectly('basic');">
                    CHỌN GÓI MƠ TRONG HỒ
                </button>
            </div>
        `;

        canvas.innerHTML = `
            <div class="w-full min-h-[440px] bg-[#fffaf9] text-slate-800 font-sans p-8 flex flex-col justify-between select-none animate-fadeIn relative">
                <!-- Top delicate background gradient glow -->
                <div class="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#ffeef2] to-transparent pointer-events-none"></div>

                <!-- Nav -->
                <div class="flex justify-between items-center border-b border-[#ffd9e2] pb-4 mb-6 z-10">
                    <span class="font-extrabold text-sm text-rose-700 tracking-wider font-serif">Rosé Romance</span>
                    <div class="flex gap-4 text-[10px] text-slate-500 font-semibold">
                        <span class="hover:text-rose-600 cursor-pointer transition-colors">Philosophy</span>
                        <span class="hover:text-rose-600 cursor-pointer transition-colors">Collections</span>
                        <span class="hover:text-rose-600 cursor-pointer transition-colors">Contact</span>
                    </div>
                </div>
                
                <!-- Hero content -->
                <div class="text-center space-y-4 my-auto max-w-lg mx-auto z-10">
                    <span class="text-[9px] bg-rose-100/80 text-rose-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-rose-200">Boutique Editorial</span>
                    <h2 class="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight tracking-tight font-serif">Celebrate Your Love <br/><span class="italic text-rose-600 font-light">As A Work of Art.</span></h2>
                    <p class="text-[10px] text-slate-500 leading-relaxed font-light">Ghi lại những khoảnh khắc lãng mạn, ngọt ngào và ngập tràn cảm xúc tự nhiên bằng chất thơ nhiếp ảnh độc quyền.</p>
                    <div class="flex justify-center gap-3 pt-2">
                        <button class="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold py-2.5 px-6 rounded-full shadow-md hover:scale-103 active:scale-97 transition-all">EXPLORE GALLERIES</button>
                        <button class="border border-rose-300/60 hover:bg-rose-50/50 text-[9px] font-bold py-2.5 px-6 rounded-full transition-all text-rose-700">OUR PRICING</button>
                    </div>
                </div>
                
                <!-- Exquisite Polaroid Gallery Grid -->
                <div class="grid grid-cols-3 gap-4 mt-8 border-t border-[#ffd9e2] pt-6 z-10">
                    <!-- Polaroid 1 -->
                    <div class="bg-white rounded-md p-2 shadow-md border border-[#ffd9e2]/30 hover:scale-105 -rotate-2 hover:rotate-0 transition-all duration-300 cursor-pointer">
                        <div class="w-full h-20 bg-rose-50 rounded-sm overflow-hidden">
                            <img src="image/avt1.png" class="w-full h-full object-cover">
                        </div>
                        <h4 class="text-[8px] font-bold text-center text-[#8a7256] mt-2 font-serif italic">"Nắng Ban Mai"</h4>
                    </div>
                    <!-- Polaroid 2 -->
                    <div class="bg-white rounded-md p-2 shadow-md border border-[#ffd9e2]/30 hover:scale-105 rotate-1 hover:rotate-0 transition-all duration-300 cursor-pointer">
                        <div class="w-full h-20 bg-rose-50 rounded-sm overflow-hidden">
                            <img src="image/avt2.png" class="w-full h-full object-cover">
                        </div>
                        <h4 class="text-[8px] font-bold text-center text-[#8a7256] mt-2 font-serif italic">"Khúc Giao Mùa"</h4>
                    </div>
                    <!-- Polaroid 3 -->
                    <div class="bg-white rounded-md p-2 shadow-md border border-[#ffd9e2]/30 hover:scale-105 rotate-3 hover:rotate-0 transition-all duration-300 cursor-pointer">
                        <div class="w-full h-20 bg-rose-50 rounded-sm overflow-hidden">
                            <img src="image/avt4.png" class="w-full h-full object-cover">
                        </div>
                        <h4 class="text-[8px] font-bold text-center text-[#8a7256] mt-2 font-serif italic">"Mộng Bình Yên"</h4>
                    </div>
                </div>
            </div>
        `;
    } else if (packageKey === "plus") {
        title.textContent = "Mẫu Demo: Mộng bay xa (Plus)";
        subtitle.textContent = "Giao diện Editorial Lookbook - Đẳng cấp, nghệ thuật";
        urlText.textContent = "https://banggia.hugowishpax.studio/mong-bay-xa-preview";

        // Render detailed design specification sheet on the left sidebar
        specSheet.innerHTML = `
            <div class="space-y-5 animate-fadeIn text-slate-800 dark:text-slate-200">
                <div class="flex items-center gap-2">
                    <span class="text-[9px] bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-extrabold px-3 py-1 rounded-full border border-amber-200/50 font-mono">LUXURY EDITORIAL</span>
                    <span class="text-[9px] text-slate-400 font-mono">v2.0.1</span>
                </div>
                
                <div>
                    <h4 class="font-serif text-base font-extrabold text-slate-800 dark:text-white leading-tight">Giao Diện: Asymmetric</h4>
                    <p class="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Sang trọng, phá cách, đậm chất điện ảnh</p>
                </div>
                
                <div class="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider font-mono">🎯 Ý NGHĨA THIẾT KẾ:</span>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1 font-light">
                            Được thiết kế riêng cho các thương hiệu hình ảnh thời trang cưới cao cấp. Bảng giá được khoác lên vẻ đẹp một cuốn lookbook thời thượng, khơi gợi khát khao từ những khách hàng duy mỹ.
                        </p>
                    </div>
                    
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider font-mono">🌟 ĐIỂM CỘNG VISUAL:</span>
                        <ul class="text-[11px] text-slate-600 dark:text-slate-300 space-y-2 mt-2 font-sans">
                            <li class="flex items-start gap-2">
                                <span class="text-amber-500 font-bold">✓</span>
                                <span>Bố cục phi đối xứng Asymmetric Grid thời thượng, thu hút.</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-amber-500 font-bold">✓</span>
                                <span>Hiệu ứng ảnh đen trắng sang màu cực nghệ thuật khi lướt chuột.</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-amber-500 font-bold">✓</span>
                                <span>Tone tối huyền bí giúp nổi bật mọi chi tiết ảnh cưới đắt giá.</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-3.5 text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed">
                        💡 <strong>Tương tác thực tế:</strong> Di chuột hoặc chạm nhẹ vào bức ảnh lookbook bên phải để xem màu sắc chuyển mình vô cùng mượt mà và độc đáo!
                    </div>
                </div>
                
                <button class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-97 shadow-amber-500/10" onclick="closeDemoMockup(); selectTierDirectly('plus');">
                    CHỌN GÓI MỘNG BAY XA
                </button>
            </div>
        `;

        canvas.innerHTML = `
            <div class="w-full min-h-[440px] bg-[#0c0a0d] text-[#f2efe9] font-sans p-8 flex flex-col justify-between select-none animate-fadeIn relative">
                <!-- Luxury ambient golden radial glow background -->
                <div class="absolute bottom-0 right-0 w-44 h-44 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.08)_0%,transparent_70%)] pointer-events-none"></div>

                <!-- Nav -->
                <div class="flex justify-between items-center border-b border-white/10 pb-4 mb-4 z-10">
                    <span class="font-bold text-xs tracking-[0.2em] text-amber-500 uppercase font-serif">AURÉLIEN STUDIO</span>
                    <div class="flex gap-4 text-[8px] uppercase tracking-[0.15em] text-stone-400 font-bold">
                        <span class="hover:text-amber-400 cursor-pointer transition-colors">Works</span>
                        <span class="hover:text-amber-400 cursor-pointer transition-colors">Editorial</span>
                        <span class="hover:text-amber-400 cursor-pointer transition-colors">Philosophy</span>
                    </div>
                </div>
                
                <!-- Main asymmetric split layout -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-6 items-center my-auto z-10">
                    <div class="md:col-span-3 space-y-4 text-left">
                        <span class="text-[8px] text-amber-500 border border-amber-500/30 px-2 py-0.5 uppercase tracking-[0.2em] font-bold">COUTURE PORTFOLIO</span>
                        <h3 class="text-xl md:text-2xl font-light tracking-wide text-white leading-tight font-serif">The Sublime Art of <br/><span class="font-bold text-amber-400 italic">Romantic Shadows</span></h3>
                        <p class="text-[10px] text-stone-400 leading-relaxed font-light pr-4">
                            Đột phá cấu trúc hình ảnh cổ điển bằng những góc máy phá cách, giàu chất điện ảnh và tôn vinh cá tính độc bản của cặp đôi.
                        </p>
                        <button class="bg-transparent border border-amber-500/40 hover:border-amber-400 text-amber-400 hover:text-white hover:bg-amber-500/10 text-[8px] uppercase tracking-[0.2em] font-bold py-2.5 px-5 transition-all duration-300">EXPLORE CAMPAIGN</button>
                    </div>
                    <div class="md:col-span-2">
                        <!-- Ultra realistic framed image mockup -->
                        <div class="w-full h-40 bg-stone-900 rounded-2xl border border-white/10 overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.5)] group cursor-pointer relative">
                            <img src="image/avt1.png" class="w-full h-full object-cover grayscale opacity-80 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div class="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[8px]">
                                <span class="font-mono text-stone-400 uppercase tracking-widest">© PARIS CAPTURE</span>
                                <span class="bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">NEW EXPORT</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Asymmetric footer -->
                <div class="flex justify-between items-center border-t border-white/10 pt-4 text-[8px] text-stone-500 mt-6 z-10">
                    <span>© 2026 Aurélien Creative Co. All rights reserved.</span>
                    <div class="flex gap-3 text-stone-400 font-bold uppercase tracking-widest">
                        <span class="hover:text-amber-400 cursor-pointer">INSTAGRAM</span>
                        <span class="hover:text-amber-400 cursor-pointer">FACEBOOK</span>
                    </div>
                </div>
            </div>
        `;
    } else if (packageKey === "premium") {
        title.textContent = "Mẫu Demo: Bay xa (Premium)";
        subtitle.textContent = "Cổng thông tin Client Hub - Đẳng cấp, siêu mượt";
        urlText.textContent = "https://banggia.hugowishpax.studio/client-portal";

        // Render detailed design specification sheet on the left sidebar
        specSheet.innerHTML = `
            <div class="space-y-5 animate-fadeIn text-slate-800 dark:text-slate-200">
                <div class="flex items-center gap-2">
                    <span class="text-[9px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-extrabold px-3 py-1 rounded-full border border-blue-200/50 font-mono">INTERACTIVE CLIENT PORTAL</span>
                    <span class="text-[9px] text-slate-400 font-mono">v3.1.0</span>
                </div>
                
                <div>
                    <h4 class="font-serif text-base font-extrabold text-slate-800 dark:text-white leading-tight">Giao Diện: Client Hub Dashboard</h4>
                    <p class="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Đẳng cấp tối thượng, tiện ích, bảo mật</p>
                </div>
                
                <div class="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider font-mono">🎯 Ý NGHĨA THIẾT KẾ:</span>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1 font-light">
                            Thiết lập chuẩn mực mới về uy tín và độ chuyên nghiệp trong chăm sóc khách hàng VIP. Thay vì gửi link Drive lộn xộn, khách hàng sẽ có một cổng portal bảo mật riêng để duyệt ảnh & video 4K chất lượng cao.
                        </p>
                    </div>
                    
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider font-mono">🌟 ĐIỂM CỘNG VISUAL:</span>
                        <ul class="text-[11px] text-slate-600 dark:text-slate-300 space-y-2 mt-2 font-sans">
                            <li class="flex items-start gap-2">
                                <span class="text-blue-500 font-bold">✓</span>
                                <span>Thống kê file đã bàn giao & biểu đồ tiến độ thời gian thực.</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-blue-500 font-bold">✓</span>
                                <span>Tích hợp trình phát video cinematic 4K ngay trên trình duyệt.</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-blue-500 font-bold">✓</span>
                                <span>Hệ thống nút bấm tải tệp album nén tương tác cực kỳ độc đáo.</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-3.5 text-[10px] text-blue-800 dark:text-blue-300 leading-relaxed">
                        💡 <strong>Tương tác thực tế:</strong> Hãy click nút màu xanh lam <strong>"TẢI TRỌN BỘ ALBUM (.ZIP)"</strong> trên bảng điều khiển bên phải để trải nghiệm âm thanh và pháo hoa ăn mừng!
                    </div>
                </div>
                
                <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-97 shadow-blue-500/10" onclick="closeDemoMockup(); selectTierDirectly('premium');">
                    CHỌN GÓI BAY XA (PREMIUM)
                </button>
            </div>
        `;

        canvas.innerHTML = `
            <div class="w-full min-h-[440px] bg-[#070b13] text-slate-100 font-mono p-6 flex select-none animate-fadeIn text-[10px] relative">
                <!-- Glowing ambient background lights -->
                <div class="absolute top-0 right-0 w-36 h-36 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)] pointer-events-none"></div>

                <!-- Sidebar dashboard -->
                <div class="w-1/4 border-r border-slate-800/80 pr-4 flex flex-col justify-between shrink-0 z-10">
                    <div class="space-y-4">
                        <div class="font-extrabold text-blue-400 uppercase tracking-widest text-xs flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                            CLIENT PORTAL
                        </div>
                        <ul class="space-y-2 text-slate-400">
                            <li class="text-white bg-blue-600/20 border border-blue-500/30 px-2.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5"><span class="material-symbols-outlined text-xs">dashboard</span> Dashboard</li>
                            <li class="hover:text-white px-2.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 hover:bg-slate-800/40 transition-colors"><span class="material-symbols-outlined text-xs">photo_library</span> Photos</li>
                            <li class="hover:text-white px-2.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 hover:bg-slate-800/40 transition-colors"><span class="material-symbols-outlined text-xs">videocam</span> Cinematic</li>
                            <li class="hover:text-white px-2.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 hover:bg-slate-800/40 transition-colors"><span class="material-symbols-outlined text-xs">payments</span> Billings</li>
                        </ul>
                    </div>
                    <div class="text-slate-500 text-[8px] leading-relaxed border-t border-slate-800/80 pt-3">
                        🔒 SSL Secured<br/>
                        IP: 192.168.1.92<br/>
                        Region: Hanoi, VN
                    </div>
                </div>
                
                <!-- Main Canvas content -->
                <div class="flex-1 pl-6 flex flex-col justify-between z-10">
                    <div class="space-y-4">
                        <div class="flex justify-between items-center border-b border-slate-800/80 pb-3">
                            <h3 class="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><span class="material-symbols-outlined text-blue-400 text-sm">favorite</span> PROJECT: HUGO & WISHPAX</h3>
                            <span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold">COMPLETED 85%</span>
                        </div>
                        
                        <!-- Analytical grid cards -->
                        <div class="grid grid-cols-2 gap-3.5">
                            <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 hover:border-blue-500/30 transition-colors">
                                <span class="text-slate-400 text-[8px] block uppercase tracking-wider">TOTAL UPLOADED FILES:</span>
                                <div class="text-base font-bold text-white">1,482 Files</div>
                                <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div class="bg-blue-500 h-full rounded-full animate-[progressSweep_3s_ease-out_infinite]" style="width: 85%"></div>
                                </div>
                            </div>
                            <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 hover:border-blue-500/30 transition-colors">
                                <span class="text-slate-400 text-[8px] block uppercase tracking-wider">VIDEO EXPORT:</span>
                                <div class="text-base font-bold text-blue-400">4K UltraHD</div>
                                <div class="text-[8px] text-slate-500 leading-tight">Optimized HEVC encoding active</div>
                            </div>
                        </div>
                        
                        <!-- Video preview placeholder simulation -->
                        <div class="w-full h-24 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-inner hover:border-blue-500/30 transition-all duration-300">
                            <img src="image/avt2.png" class="w-full h-full object-cover opacity-35 absolute inset-0 group-hover:scale-103 transition-transform duration-500">
                            <div class="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                            <div class="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/60 flex items-center justify-center z-10 transition-transform group-hover:scale-110 shadow-lg">
                                <span class="material-symbols-outlined text-blue-400 text-base">play_arrow</span>
                            </div>
                            <div class="absolute bottom-2.5 right-2.5 text-white bg-black/75 px-2 py-0.5 rounded-md text-[7px] font-bold">PREVIEW TEASER: 02:40</div>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center border-t border-slate-800/80 pt-3">
                        <span class="text-[8px] text-slate-500">Click download to trigger interactive test!</span>
                        <button class="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-2 px-4 rounded-xl text-[9px] transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/10" onclick="event.stopPropagation(); triggerConfettiBurst(true); playCyberSuccessSound();">
                            <span class="material-symbols-outlined text-xs">download</span> TẢI TRỌN BỘ ALBUM (.ZIP)
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else if (packageKey === "portfolio") {
        title.textContent = "Mẫu Demo: Cây dương xỉ cô đơn (Bio)";
        subtitle.textContent = "Giao diện Fern Studio - Tối giản, tinh tế";
        urlText.textContent = "https://banggia.hugowishpax.studio/goi-fern-preview";

        // Render detailed design specification sheet on the left sidebar
        specSheet.innerHTML = `
            <div class="space-y-5 animate-fadeIn text-slate-800 dark:text-slate-200">
                <div class="flex items-center gap-2">
                    <span class="text-[9px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 font-extrabold px-3 py-1 rounded-full border border-emerald-200/50 font-mono">BIO LINK HUB</span>
                    <span class="text-[9px] text-slate-400 font-mono">v1.2.0</span>
                </div>
                
                <div>
                    <h4 class="font-serif text-base font-extrabold text-slate-800 dark:text-white leading-tight">Giao Diện: Fern Studio</h4>
                    <p class="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Tối giản tinh tế, đậm tính nghệ sĩ</p>
                </div>
                
                <div class="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider font-mono">🎯 Ý NGHĨA THIẾT KẾ:</span>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1 font-light">
                            Giải pháp hoàn hảo làm trang thông tin nghệ sĩ (Bio Link) giới thiệu bản thân cho các nhiếp ảnh gia tự do, stylist hoặc makeup artist chuyên nghiệp. Giúp đối tác nhanh chóng kết nối xã hội và hiểu cái "tôi" duy mỹ của bạn.
                        </p>
                    </div>
                    
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider font-mono">🌟 ĐIỂM CỘNG VISUAL:</span>
                        <ul class="text-[11px] text-slate-600 dark:text-slate-300 space-y-2 mt-2 font-sans">
                            <li class="flex items-start gap-2">
                                <span class="text-emerald-500 font-bold">✓</span>
                                <span>Tông màu xanh Sage Green xô thơm dịu mát, gần gũi thiên nhiên.</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-emerald-500 font-bold">✓</span>
                                <span>Hiệu ứng xoay avatar góc 3 độ khơi gợi nét nghệ thuật tinh nghịch.</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-emerald-500 font-bold">✓</span>
                                <span>Hệ thống capsule liên kết bóng bẩy tối ưu hóa chuyển đổi liên hệ.</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-3.5 text-[10px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                        💡 <strong>Tương tác thực tế:</strong> Rê chuột hoặc chạm nhẹ vào các nút capsule liên kết bên phải để cảm nhận sự mượt mà tinh tế trong chuyển đổi visual!
                    </div>
                </div>
                
                <button class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-97 shadow-emerald-500/10" onclick="closeDemoMockup(); selectTierDirectly('portfolio');">
                    CHỌN GÓI CÂY DƯƠNG XỈ
                </button>
            </div>
        `;

        canvas.innerHTML = `
            <div class="w-full min-h-[440px] bg-[#fdfcfa] text-[#2b3e34] font-sans p-8 flex flex-col justify-between select-none animate-fadeIn relative">
                <!-- Decorative elements -->
                <div class="absolute top-0 right-0 w-24 h-24 bg-[#e8f0eb] rounded-full filter blur-xl opacity-60"></div>
                <div class="absolute bottom-0 left-0 w-28 h-28 bg-[#f5efe4] rounded-full filter blur-xl opacity-60"></div>

                <!-- Nav -->
                <div class="flex justify-between items-center border-b border-[#ebdcc5] pb-4 mb-6 z-10">
                    <span class="font-extrabold text-xs tracking-widest text-[#2b3e34] uppercase font-serif">ISOBEL REED</span>
                    <div class="flex items-center gap-1">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        <span class="text-[9px] font-bold text-emerald-800 uppercase tracking-widest">Available for Booking</span>
                    </div>
                </div>
                
                <!-- Main bio content -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-6 items-center my-auto z-10">
                    <div class="md:col-span-2 text-center">
                        <div class="w-28 h-28 rounded-full border-4 border-[#2b3e34]/10 p-1 mx-auto relative group cursor-pointer transition-transform duration-500 hover:scale-105">
                            <div class="w-full h-full rounded-full overflow-hidden border-2 border-[#2b3e34]">
                                <img src="image/avt3.png" class="w-full h-full object-cover">
                            </div>
                            <span class="absolute bottom-0 right-2 bg-[#2b3e34] text-[#fdfcfa] p-1.5 rounded-full text-[9px] shadow-md flex items-center justify-center border border-[#fdfcfa]">📷</span>
                        </div>
                        <h4 class="font-serif text-sm font-bold text-[#2b3e34] mt-3">Isobel Vance Reed</h4>
                        <p class="text-[9px] uppercase tracking-widest text-[#8a7256] font-bold">Creative Visual Artist</p>
                    </div>
                    <div class="md:col-span-3 space-y-4 text-left">
                        <h3 class="text-xl font-bold leading-tight font-serif text-[#2b3e34]">Capturing the quiet elegance of fleeting moments.</h3>
                        <p class="text-[10px] text-[#2b3e34]/80 leading-relaxed font-light">
                            Nhiếp ảnh gia chuyên tìm kiếm vẻ đẹp sâu thẳm của sự tĩnh lặng, tái hiện tình yêu bằng lăng kính duy mỹ và đầy chất thơ cổ điển.
                        </p>
                        
                        <!-- Premium interactive button list -->
                        <div class="space-y-2">
                            <a href="#" onclick="event.preventDefault();" class="flex items-center justify-between p-3 rounded-2xl bg-[#eef3f0] hover:bg-[#e4ece7] border border-[#2b3e34]/5 text-[10px] font-bold text-[#2b3e34] transition-all duration-300 transform hover:scale-[1.02]">
                                <span class="flex items-center gap-2"><span class="material-symbols-outlined text-sm text-[#8a7256]">photo_library</span> LATEST WEDDING JOURNAL</span>
                                <span class="material-symbols-outlined text-xs">arrow_forward</span>
                            </a>
                            <a href="#" onclick="event.preventDefault();" class="flex items-center justify-between p-3 rounded-2xl bg-[#f8f5ef] hover:bg-[#ebdcc5]/40 border border-[#2b3e34]/5 text-[10px] font-bold text-[#2b3e34] transition-all duration-300 transform hover:scale-[1.02]">
                                <span class="flex items-center gap-2"><span class="material-symbols-outlined text-sm text-[#8a7256]">mail</span> DISCUSS YOUR STORY</span>
                                <span class="material-symbols-outlined text-xs">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Footer quote -->
                <div class="text-center border-t border-[#ebdcc5] pt-4 text-[9px] text-[#2b3e34]/50 font-serif italic max-w-xs mx-auto mt-6">
                    "Authenticity is the soul of storytelling."
                </div>
            </div>
        `;
    } else if (packageKey === "single_page") {
        title.textContent = "Mẫu Demo: Ghép mảnh (Trang Riêng)";
        subtitle.textContent = "Thiết kế Trang Độc Lập - Tùy biến linh hoạt";
        urlText.textContent = "https://banggia.hugowishpax.studio/goi-singlepage-preview";

        // Render detailed design specification sheet on the left sidebar
        specSheet.innerHTML = `
            <div class="space-y-5 animate-fadeIn text-slate-800 dark:text-slate-200">
                <div class="flex items-center gap-2">
                    <span class="text-[9px] bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 font-extrabold px-3 py-1 rounded-full border border-purple-200/50 font-mono">MODULAR SECTION</span>
                    <span class="text-[9px] text-slate-400 font-mono">v1.0.5</span>
                </div>
                
                <div>
                    <h4 class="font-serif text-base font-extrabold text-slate-800 dark:text-white leading-tight">Giao Diện: Ghép Mảnh Tự Do</h4>
                    <p class="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Tính năng linh hoạt, tùy biến theo nhu cầu</p>
                </div>
                
                <div class="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider font-mono">🎯 Ý NGHĨA THIẾT KẾ:</span>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1 font-light">
                            Giải quyết hiệu quả các nhu cầu thông tin phụ trợ của thương hiệu. Rất phù hợp để xây dựng kho câu hỏi đáp thường gặp (FAQ), bảng giá phụ thu minh bạch, hoặc biểu mẫu nhận thông tin.
                        </p>
                    </div>
                    
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider font-mono">🌟 ĐIỂM CỘNG VISUAL:</span>
                        <ul class="text-[11px] text-slate-600 dark:text-slate-300 space-y-2 mt-2 font-sans">
                            <li class="flex items-start gap-2">
                                <span class="text-purple-500 font-bold">✓</span>
                                <span>Tab Switcher: Chuyển nội dung mượt mà không tải lại trang.</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-purple-500 font-bold">✓</span>
                                <span>Hệ thống FAQ đóng mở thông minh tiết kiệm diện tích.</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-purple-500 font-bold">✓</span>
                                <span>Đồng bộ 100% nhận diện thương hiệu của site chính.</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-3.5 text-[10px] text-purple-800 dark:text-purple-300 leading-relaxed">
                        💡 <strong>Tương tác thực tế:</strong> Nhấp chuột trực tiếp vào tab <strong>"Trang FAQ"</strong> hoặc <strong>"Trang Báo Giá"</strong> bên phải để trải nghiệm cấu trúc mượt mà!
                    </div>
                </div>
                
                <button class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-97 shadow-purple-500/10" onclick="closeDemoMockup(); selectTierDirectly('single_page');">
                    CHỌN GÓI GHÉP MẢNH
                </button>
            </div>
        `;

        canvas.innerHTML = `
            <div class="w-full min-h-[440px] bg-[#faf8ff] text-slate-800 font-sans p-6 flex flex-col justify-between select-none animate-fadeIn">
                <!-- Nav tabs switcher simulation -->
                <div class="flex justify-between items-center border-b border-purple-100 pb-3 mb-6">
                    <span class="font-extrabold text-sm text-purple-700 tracking-wider font-serif">Boutique Features</span>
                    <!-- Real Clickable tabs inside simulation mockup canvas! -->
                    <div class="flex gap-1.5 bg-purple-100/60 p-0.5 rounded-full text-[9px] font-bold text-slate-500 shadow-inner">
                        <button id="tab-mock-faq" class="bg-white text-purple-700 px-3 py-1 rounded-full shadow-sm" onclick="event.stopPropagation(); switchMockupTab('faq')">Trang FAQ</button>
                        <button id="tab-mock-pricing" class="px-3 py-1 rounded-full" onclick="event.stopPropagation(); switchMockupTab('pricing')">Trang Báo Giá</button>
                    </div>
                </div>
                
                <!-- Live Tab contents rendering dynamic panels inside simulated frame -->
                <div class="flex-1 flex flex-col justify-center max-w-md mx-auto w-full my-auto" id="mock-tab-panel">
                    <!-- FAQ default simulation panel -->
                    <div class="space-y-4 animate-fadeIn" id="panel-mock-faq">
                        <h4 class="text-center font-bold text-sm text-slate-800 tracking-tight">Hỏi đáp thường gặp (FAQ)</h4>
                        <div class="space-y-2">
                            <div class="bg-white border border-purple-100 rounded-xl p-3 flex justify-between items-center cursor-pointer shadow-sm hover:scale-[1.01] transition-transform">
                                <span class="text-[10px] font-bold text-slate-700">Studio có giao file gốc chụp không?</span>
                                <span class="material-symbols-outlined text-purple-500 text-sm">keyboard_arrow_down</span>
                            </div>
                            <div class="bg-white border border-purple-100 rounded-xl p-3 shadow-sm hover:scale-[1.01] transition-transform">
                                <div class="flex justify-between items-center pb-2 border-b border-slate-100 cursor-pointer">
                                    <span class="text-[10px] font-bold text-slate-700">Thời gian trả ảnh hoàn thiện là bao lâu?</span>
                                    <span class="material-symbols-outlined text-purple-500 text-sm rotate-180">keyboard_arrow_down</span>
                                </div>
                                <p class="text-[9px] text-slate-500 mt-2 leading-relaxed">
                                    Thông thường từ 14-18 ngày đối với các gói cơ bản, và có thể nhanh hơn từ 3-5 ngày nếu quý khách lựa chọn chế độ hỏa tốc siêu tốc!
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Pricing simulation panel (hidden by default) -->
                    <div class="space-y-4 animate-fadeIn hidden" id="panel-mock-pricing">
                        <h4 class="text-center font-bold text-sm text-slate-800 tracking-tight">Biểu phí phụ thu dịch vụ</h4>
                        <div class="space-y-2 font-mono text-[9px]">
                            <div class="bg-white border border-purple-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                                <span class="text-slate-600">Phụ thu di chuyển ngoại thành (>30km):</span>
                                <span class="font-bold text-purple-700">1.200.000đ</span>
                            </div>
                            <div class="bg-white border border-purple-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                                <span class="text-slate-600">Thuê phục trang thiết kế thiết kế riêng:</span>
                                <span class="font-bold text-purple-700">2.500.000đ/bộ</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Bottom text -->
                <div class="text-center text-[8px] text-purple-400 mt-5 uppercase tracking-widest font-semibold">
                    [ Giao diện đồng bộ CSS 100% với site chính ]
                </div>
            </div>
        `;
    }
}

// 🔀 SWITCH TAB DYNAMICALLY INSIDE PREVIEW FRAME WORKSHOP
function switchMockupTab(tabKey) {
    const btnFaq = document.getElementById("tab-mock-faq");
    const btnPricing = document.getElementById("tab-mock-pricing");
    const panelFaq = document.getElementById("panel-mock-faq");
    const panelPricing = document.getElementById("panel-mock-pricing");

    if (!btnFaq || !btnPricing || !panelFaq || !panelPricing) return;

    playPopSound();

    if (tabKey === "faq") {
        btnFaq.className = "bg-white text-purple-700 px-3 py-1 rounded-full shadow-sm";
        btnPricing.className = "px-3 py-1 rounded-full";
        panelFaq.classList.remove("hidden");
        panelPricing.classList.add("hidden");
    } else {
        btnPricing.className = "bg-white text-purple-700 px-3 py-1 rounded-full shadow-sm";
        btnFaq.className = "px-3 py-1 rounded-full";
        panelPricing.classList.remove("hidden");
        panelFaq.classList.add("hidden");
    }
}

function closeDemoMockup() {
    const modal = document.getElementById("demo-modal");
    if (modal) {
        modal.classList.add("opacity-0", "pointer-events-none");
        modal.firstElementChild.classList.remove("scale-100");
        modal.firstElementChild.classList.add("scale-95");
    }
}

// 💳 SELECTION UTILITY FOR REDIRECTING UNLOCKED BUTTON TO CALCULATOR TIER SELECTION
function selectTierDirectly(tierValue) {
    playPopSound();

    // 1. Open the calculator modal by clicking the header action button
    const openCalculatorBtn = document.querySelector("header button.clay-btn-primary") ||
        document.querySelector("header button.btn-primary") ||
        document.querySelector(".clay-btn-primary");
    if (openCalculatorBtn) {
        openCalculatorBtn.click();
    }

    // 2. Select the correct radio option in step 1 of the calculator and style it
    setTimeout(() => {
        const radio = document.querySelector(`input[name="calc-tier"][value="${tierValue}"]`);
        if (radio) {
            radio.checked = true;
            // Dispatch a change event so the calculator logic automatically runs calculations
            radio.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }, 150);
}

// ☕ BONUS WIDGET: Tip & Coffee VietQR Generator
function initTipWidget() {
    const tipButtons = document.querySelectorAll(".tip-amount-btn");
    const qrImg = document.getElementById("tip-qr-img");
    const qrLoading = document.getElementById("tip-qr-loading");

    if (!qrImg || tipButtons.length === 0) return;

    tipButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            playPopSound();

            // Remove active style from all buttons
            tipButtons.forEach(b => {
                b.classList.remove("border-primary", "bg-primary/10", "text-primary");
                b.classList.add("border-outline-variant/30", "bg-surface-container-lowest", "text-on-surface", "dark:text-slate-200");
            });

            // Add active style to clicked button
            btn.classList.remove("border-outline-variant/30", "bg-surface-container-lowest", "text-on-surface", "dark:text-slate-200");
            btn.classList.add("border-primary", "bg-primary/10", "text-primary");

            const amount = btn.getAttribute("data-amount");

            // Show loading spinner
            if (qrLoading) qrLoading.classList.remove("opacity-0", "pointer-events-none");

            // Update image source
            const newSrc = `https://img.vietqr.io/image/MB-827052004-compact.png?amount=${amount}&addInfo=Tang%20ca%20phe%20DevArchitect&accountName=LE%20GIA%20HUY`;

            // Fast loading handler to hide spinner
            const tempImg = new Image();
            tempImg.src = newSrc;
            tempImg.onload = () => {
                qrImg.src = newSrc;
                if (qrLoading) qrLoading.classList.add("opacity-0", "pointer-events-none");
            };
            tempImg.onerror = () => {
                qrImg.src = newSrc;
                if (qrLoading) qrLoading.classList.add("opacity-0", "pointer-events-none");
            };
        });
    });
}

// 📱 MOBILE RESPONSIVE TIER SWITCHERS
window.switchMobileTier = function(tier, index) {
    if (typeof playPopSound === "function") playPopSound();

    // 1. Move sliding active pill
    const pill = document.getElementById("mobile-tier-pill");
    if (pill) {
        pill.style.left = `calc(${index * 33.33}% + ${index === 0 ? 4 : index === 1 ? 2 : 0}px)`;
    }

    // 2. Toggle active text colors on buttons
    const btns = ["basic", "plus", "premium"];
    btns.forEach((b, idx) => {
        const btn = document.getElementById(`mobile-btn-${b}`);
        if (btn) {
            if (idx === index) {
                btn.classList.remove("text-[#54414b]", "dark:text-slate-300");
                btn.classList.add("text-white");
            } else {
                btn.classList.remove("text-white");
                btn.classList.add("text-[#54414b]", "dark:text-slate-300");
            }
        }
    });

    // 3. Toggle card display active states
    btns.forEach(b => {
        const cards = document.querySelectorAll(`.mobile-card-${b}`);
        cards.forEach(card => {
            if (b === tier) {
                card.classList.add("mobile-card-active");
            } else {
                card.classList.remove("mobile-card-active");
            }
        });
    });
};

window.switchMobileMini = function(tier, index) {
    if (typeof playPopSound === "function") playPopSound();

    // 1. Move sliding active pill
    const pill = document.getElementById("mobile-mini-pill");
    if (pill) {
        pill.style.left = `calc(${index * 50}% + ${index === 0 ? 4 : 0}px)`;
    }

    // 2. Toggle active text colors on buttons
    const btns = ["portfolio", "single_page"];
    btns.forEach((b, idx) => {
        const btn = document.getElementById(`mobile-btn-${b}`);
        if (btn) {
            if (idx === index) {
                btn.classList.remove("text-[#54414b]", "dark:text-slate-300");
                btn.classList.add("text-white");
            } else {
                btn.classList.remove("text-white");
                btn.classList.add("text-[#54414b]", "dark:text-slate-300");
            }
        }
    });

    // 3. Toggle card display active states
    btns.forEach(b => {
        const cards = document.querySelectorAll(`.mobile-card-${b}`);
        cards.forEach(card => {
            if (b === tier) {
                card.classList.add("mobile-card-active");
            } else {
                card.classList.remove("mobile-card-active");
            }
        });
    });
};

// 📱 ACTIVE MOBILE BOTTOM NAV ON SCROLL & CLICK
window.initMobileNavHighlighter = function() {
    const sections = ["hero", "projects", "about", "contact"];
    const navLinks = document.querySelectorAll("nav.md\\:hidden a");
    
    if (navLinks.length === 0) return;
    
    // Add click active effects with sound pop!
    navLinks.forEach((link, idx) => {
        link.addEventListener("click", (e) => {
            if (typeof playPopSound === "function") playPopSound();
            setActiveMobileNavLink(idx);
        });
    });

    const observerOptions = {
        root: null,
        rootMargin: "-25% 0px -55% 0px",
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("id");
                let idx = sections.indexOf(id);
                // Map 'about' to idx 2 (which is the third link: Về Tôi / about)
                if (idx !== -1) {
                    setActiveMobileNavLink(idx);
                }
            }
        });
    }, observerOptions);

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });

    function setActiveMobileNavLink(activeIndex) {
        navLinks.forEach((link, idx) => {
            if (idx === activeIndex) {
                // Set active class list (bubble button)
                link.className = "flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-6 py-2 scale-110 -translate-y-2 shadow-lg transition-all duration-300";
                const icon = link.querySelector(".material-symbols-outlined");
                if (icon) icon.style.fontVariationSettings = "'FILL' 1, 'wght' 400";
            } else {
                // Set idle class list
                link.className = "flex flex-col items-center justify-center text-on-surface-variant dark:text-slate-400 opacity-70 hover:opacity-100 pb-2 transition-all duration-300";
                const icon = link.querySelector(".material-symbols-outlined");
                if (icon) icon.style.fontVariationSettings = "'FILL' 0, 'wght' 400";
            }
        });
    }
};

