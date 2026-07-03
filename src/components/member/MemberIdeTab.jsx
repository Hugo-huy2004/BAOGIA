import React, { useMemo, useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { 
  FolderOpen, Folder, BookOpen, Database, Play, Plus, X, 
  Terminal, AlertTriangle, ArrowLeft, Save, Eye,
  Edit2, Trash2, ChevronDown, ChevronRight, FileCode, FileText, FileJson,
  Sparkles, CheckCircle, Award, RefreshCw, Smartphone, ListChecks, Globe
} from "lucide-react";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import { HugoConfirmNotice } from "../shared/HugoNotice";
import { getMemberSession } from "../../services/authSession";
import { useJoyStore } from "../../stores/joyStore";
import { TEMPLATES, INITIAL_WORKSPACE, TUTORIALS, WEB_COURSES, MOBILE_GUIDE_EXTRAS, THEORY_LIBRARY, QUIZ_POOL_1, QUIZ_POOL_2 } from "./ideData";
import FeatureGate from "./shared/FeatureGate";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Helper to resolve language from file extension
const getLanguageFromExt = (ext) => {
  switch (ext) {
    case "py": return "python";
    case "js": return "javascript";
    case "cs": return "csharp";
    case "cpp": case "c": return "cpp";
    case "html": return "html";
    case "css": return "css";
    case "php": return "php";
    case "md": return "markdown";
    case "json": return "json";
    default: return "plaintext";
  }
};

// Helper to render extension icon with semantic colors
const getFileIcon = (fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case "py":
      return <FileCode className="w-3.5 h-3.5 text-warning flex-shrink-0" />;
    case "cpp":
    case "c":
      return <FileCode className="w-3.5 h-3.5 text-info flex-shrink-0" />;
    case "cs":
      return <FileCode className="w-3.5 h-3.5 text-accent flex-shrink-0" />;
    case "php":
      return <FileCode className="w-3.5 h-3.5 text-accent flex-shrink-0" />;
    case "html":
      return <FileCode className="w-3.5 h-3.5 text-warning flex-shrink-0" />;
    case "css":
      return <FileCode className="w-3.5 h-3.5 text-info flex-shrink-0" />;
    case "js":
      return <FileCode className="w-3.5 h-3.5 text-warning flex-shrink-0" />;
    case "md":
      return <FileText className="w-3.5 h-3.5 text-success flex-shrink-0" />;
    case "json":
      return <FileJson className="w-3.5 h-3.5 text-warning flex-shrink-0" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
  }
};

const renderMobileIllustration = (type) => {
  const nodeClass = "rounded-lg border border-border bg-background px-3 py-2 text-[11px] font-black text-foreground shadow-sm";

  if (type === "htmlTree") {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border bg-white dark:bg-zinc-900 p-4">
        <div className="absolute left-9 top-14 bottom-8 w-px bg-primary/25" />
        <div className="space-y-2">
          <div className={`${nodeClass} w-max animate-[hugoCodeGlow_2.4s_ease-in-out_infinite]`}>&lt;article&gt;</div>
          <div className="ml-8 grid grid-cols-2 gap-2">
            {["img", "h2", "p", "button"].map((tag, index) => (
              <div key={tag} className={`${nodeClass} text-center animate-[hugoCodeFloat_2.8s_ease-in-out_infinite]`} style={{ animationDelay: `${index * 0.15}s` }}>
                &lt;{tag}&gt;
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "boxModel") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4">
        <div className="rounded-lg bg-amber-100 dark:bg-amber-500/15 p-4 text-center text-[10px] font-black text-amber-700 dark:text-amber-300 animate-[hugoCodeGlow_2.6s_ease-in-out_infinite]">
          margin
          <div className="mt-2 rounded-lg bg-sky-100 dark:bg-sky-500/15 p-4 text-sky-700 dark:text-sky-300">
            border
            <div className="mt-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 p-4 text-emerald-700 dark:text-emerald-300">
              padding
              <div className="mt-2 rounded-lg bg-white dark:bg-zinc-950 border border-border p-3 text-foreground">content</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "eventFlow") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center">
          {["Click", "Listener", "UI đổi"].map((label, index) => (
            <React.Fragment key={label}>
              <div className={`${nodeClass} animate-[hugoCodeFloat_2.4s_ease-in-out_infinite]`} style={{ animationDelay: `${index * 0.2}s` }}>{label}</div>
              {index < 2 && <div className="h-0.5 w-5 bg-primary animate-[hugoCodeSlide_1.4s_ease-in-out_infinite]" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (type === "apiFlow") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className={nodeClass}>Browser</div>
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/2 bg-primary animate-[hugoCodeSlide_1.2s_ease-in-out_infinite]" />
          </div>
          <div className={nodeClass}>API</div>
        </div>
        <div className="text-[11px] text-muted-foreground font-semibold">{"request -> JSON response -> render UI"}</div>
      </div>
    );
  }

  if (type === "sqlPipeline") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4">
        <div className="flex gap-2 overflow-hidden">
          {["FROM", "WHERE", "ORDER", "LIMIT"].map((step, index) => (
            <div key={step} className="min-w-16 flex-1 rounded-lg border border-primary/20 bg-primary/10 px-2 py-3 text-center text-[10px] font-black text-primary animate-[hugoCodeFloat_2.8s_ease-in-out_infinite]" style={{ animationDelay: `${index * 0.18}s` }}>
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

const getMobileVisualSet = (type) => {
  const sets = {
    htmlTree: {
      title: "Bộ tranh HTML",
      panels: [
        { label: "Khung trang", title: "Article là hộp nội dung", caption: "Một vùng có ý nghĩa riêng, dễ đọc và dễ tái sử dụng.", tone: "sky" },
        { label: "Nội dung", title: "Heading dẫn mắt", caption: "Tên sản phẩm nên là tiêu đề để người đọc lướt nhanh.", tone: "emerald" },
        { label: "Hành động", title: "Button thật", caption: "Hành động bấm cần dùng button để truy cập tốt hơn.", tone: "violet" }
      ],
      modes: [
        { id: "story", label: "Truyện", body: "Hãy tưởng tượng HTML là bản phác thảo kiến trúc: tường, cửa, biển tên và lối đi phải rõ trước khi sơn màu." },
        { id: "diagram", label: "Sơ đồ", body: "Cây DOM đi từ article xuống img, h2, p, button. CSS và JS đều bám vào cây này để làm việc." },
        { id: "memory", label: "Ghi nhớ", body: "Đọc HTML từ ngoài vào trong: container -> nội dung -> hành động." }
      ]
    },
    boxModel: {
      title: "Bộ tranh CSS",
      panels: [
        { label: "Khoảng thở", title: "Padding", caption: "Đẩy nội dung xa viền để card dễ đọc.", tone: "amber" },
        { label: "Ranh giới", title: "Border", caption: "Tạo biên nhận diện giữa card và nền.", tone: "sky" },
        { label: "Nhịp bố cục", title: "Margin", caption: "Tạo khoảng cách giữa card và phần tử xung quanh.", tone: "rose" }
      ],
      modes: [
        { id: "story", label: "Truyện", body: "CSS giống người dàn trang: quyết định khoảng cách, độ nổi, điểm nhấn và cảm giác khi chạm." },
        { id: "diagram", label: "Sơ đồ", body: "Box Model là 4 lớp. Nếu card quá to, hãy hỏi: do content, padding, border hay margin?" },
        { id: "memory", label: "Ghi nhớ", body: "Layout trước, màu sắc sau. Khoảng cách nhất quán làm UI chuyên nghiệp hơn." }
      ]
    },
    eventFlow: {
      title: "Bộ tranh Javascript",
      panels: [
        { label: "Tín hiệu", title: "User click", caption: "Người dùng tạo event từ một hành động nhỏ.", tone: "emerald" },
        { label: "Bộ nghe", title: "Listener", caption: "Code chờ đúng sự kiện để chạy logic.", tone: "violet" },
        { label: "Phản hồi", title: "UI state", caption: "Giao diện đổi chữ, màu, số lượng hoặc trạng thái.", tone: "sky" }
      ],
      modes: [
        { id: "story", label: "Truyện", body: "Javascript là nhân viên trực quầy: nghe người dùng gọi, kiểm tra yêu cầu, rồi cập nhật màn hình." },
        { id: "diagram", label: "Sơ đồ", body: "Event đi vào listener, listener chạy function, function đổi DOM hoặc state." },
        { id: "memory", label: "Ghi nhớ", body: "Query đúng phần tử trước, kiểm tra null, rồi mới gắn event." }
      ]
    },
    apiFlow: {
      title: "Bộ tranh API",
      panels: [
        { label: "Hỏi", title: "Request", caption: "Frontend gửi URL, method và thông tin cần thiết.", tone: "sky" },
        { label: "Xử lý", title: "Server", caption: "Backend kiểm tra, đọc dữ liệu và tạo response.", tone: "amber" },
        { label: "Hiển thị", title: "Render", caption: "JSON được chuyển thành nội dung người dùng thấy.", tone: "emerald" }
      ],
      modes: [
        { id: "story", label: "Truyện", body: "API giống quầy thư viện: bạn đưa mã sách, thủ thư tìm dữ liệu, rồi trả đúng thông tin." },
        { id: "diagram", label: "Sơ đồ", body: "Loading -> request -> parse JSON -> success hoặc error. Đó là khung UI tối thiểu." },
        { id: "memory", label: "Ghi nhớ", body: "Luôn thiết kế trạng thái lỗi; mạng không bao giờ chắc chắn 100%." }
      ]
    },
    sqlPipeline: {
      title: "Bộ tranh SQL",
      panels: [
        { label: "Nguồn", title: "FROM", caption: "Chọn bảng dữ liệu cần đọc.", tone: "violet" },
        { label: "Lọc", title: "WHERE", caption: "Giảm dữ liệu về đúng điều kiện.", tone: "rose" },
        { label: "Gọn", title: "LIMIT", caption: "Trả vừa đủ để giao diện chạy nhanh.", tone: "emerald" }
      ],
      modes: [
        { id: "story", label: "Truyện", body: "SQL giống đặt câu hỏi với kho hàng: lấy từ kệ nào, lọc món nào, xếp ra sao, lấy bao nhiêu." },
        { id: "diagram", label: "Sơ đồ", body: "FROM tạo nguồn, WHERE lọc dòng, ORDER BY sắp xếp, LIMIT chốt số lượng." },
        { id: "memory", label: "Ghi nhớ", body: "Đừng update/delete nếu chưa có WHERE rõ ràng." }
      ]
    }
  };

  return sets[type] || sets.htmlTree;
};

const renderVisualArtwork = (panel, index) => {
  const toneMap = {
    sky: "from-sky-50 via-card to-white dark:from-sky-500/15 dark:via-zinc-950 dark:to-zinc-900 border-sky-200 dark:border-sky-500/25 text-sky-700 dark:text-sky-300",
    emerald: "from-emerald-50 via-card to-white dark:from-emerald-500/15 dark:via-zinc-950 dark:to-zinc-900 border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-300",
    violet: "from-violet-50 via-card to-white dark:from-violet-500/15 dark:via-zinc-950 dark:to-zinc-900 border-violet-200 dark:border-violet-500/25 text-violet-700 dark:text-violet-300",
    amber: "from-amber-50 via-card to-white dark:from-amber-500/15 dark:via-zinc-950 dark:to-zinc-900 border-amber-200 dark:border-amber-500/25 text-amber-700 dark:text-amber-300",
    rose: "from-rose-50 via-card to-white dark:from-rose-500/15 dark:via-zinc-950 dark:to-zinc-900 border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300"
  };
  const tone = toneMap[panel.tone] || toneMap.sky;
  const artKey = `${panel.label} ${panel.title}`.toLowerCase();
  const labelClass = "rounded-md border border-current/20 bg-white/85 dark:bg-zinc-950/75 px-2 py-1 text-[8px] font-black uppercase shadow-sm backdrop-blur";
  const surfaceClass = "bg-white/85 dark:bg-zinc-950/70 border border-current/20 shadow-sm";
  const softSurfaceClass = "bg-white/60 dark:bg-white/10 border border-current/15";

  const renderArt = () => {
    if (artKey.includes("article") || artKey.includes("khung")) {
      return (
        <>
          <div className={`absolute inset-x-5 top-5 h-28 rounded-xl ${surfaceClass} animate-[hugoCodeGlow_2.4s_ease-in-out_infinite]`} />
          <div className="absolute left-9 top-9 right-9 h-5 rounded-md bg-current/15" />
          <div className={`absolute left-9 top-20 w-24 h-8 rounded-lg ${softSurfaceClass}`} />
          <div className={`absolute right-9 top-[68px] w-14 h-14 rounded-lg ${softSurfaceClass}`} />
          <div className="absolute left-9 right-9 bottom-7 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((item) => <span key={item} className="h-2 rounded-full bg-current/25" />)}
          </div>
          <span className={`absolute left-7 top-6 ${labelClass}`}>article</span>
          <span className={`absolute right-7 bottom-5 ${labelClass}`}>container</span>
        </>
      );
    }

    if (artKey.includes("heading") || artKey.includes("nội dung")) {
      return (
        <>
          <div className={`absolute left-5 right-5 top-5 h-10 rounded-xl ${surfaceClass}`} />
          <div className="absolute left-9 top-9 w-24 h-4 rounded bg-current/35 animate-[hugoCodePulse_2s_ease-in-out_infinite]" />
          <div className={`absolute left-5 right-5 top-20 h-20 rounded-xl ${softSurfaceClass}`} />
          <div className="absolute left-9 top-26 right-14 h-3 rounded bg-current/20" />
          <div className="absolute left-9 top-34 right-9 h-3 rounded bg-current/15" />
          <div className="absolute left-9 bottom-5 flex gap-2">
            <span className="w-12 h-3 rounded-full bg-current/20" />
            <span className="w-16 h-3 rounded-full bg-current/15" />
          </div>
          <span className={`absolute right-7 top-7 ${labelClass}`}>h2</span>
          <span className={`absolute left-7 bottom-5 ${labelClass}`}>paragraph</span>
        </>
      );
    }

    if (artKey.includes("button") || artKey.includes("hành động")) {
      return (
        <>
          <div className="absolute left-1/2 top-6 w-24 h-24 -translate-x-1/2 rounded-full border-[10px] border-current/15 animate-[hugoCodePulse_2.2s_ease-in-out_infinite]" />
          <div className="absolute left-1/2 top-14 w-10 h-10 -translate-x-1/2 rounded-full bg-current/25" />
          <div className="absolute left-9 right-9 bottom-7 h-[52px] rounded-xl bg-current text-white dark:text-zinc-950 flex items-center justify-center text-xs font-black shadow-lg animate-[hugoCodeFloat_2.4s_ease-in-out_infinite]">
            BUTTON
          </div>
          <div className="absolute left-14 right-14 bottom-5 h-px bg-current/35" />
          <span className={`absolute left-7 top-7 ${labelClass}`}>tap event</span>
          <span className={`absolute right-7 bottom-5 ${labelClass}`}>action</span>
        </>
      );
    }

    if (artKey.includes("padding")) {
      return (
        <>
          <div className="absolute inset-5 rounded-xl bg-current/10 border-2 border-dashed border-current/35 p-6">
            <div className={`w-full h-full rounded-lg ${surfaceClass}`} />
          </div>
          <div className="absolute left-9 right-9 top-9 h-2 rounded bg-current/40 animate-[hugoCodePulse_2s_ease-in-out_infinite]" />
          <div className="absolute left-9 right-9 bottom-9 h-2 rounded bg-current/25" />
          <span className={`absolute left-7 top-6 ${labelClass}`}>padding 20px</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>content</span>
        </>
      );
    }

    if (artKey.includes("border")) {
      return (
        <>
          <div className={`absolute inset-7 rounded-xl border-4 border-current/70 bg-white/50 dark:bg-white/10 animate-[hugoCodeGlow_2.3s_ease-in-out_infinite]`} />
          <div className="absolute left-12 right-12 top-15 h-5 rounded bg-current/20" />
          <div className="absolute left-12 right-20 top-24 h-3 rounded bg-current/15" />
          <div className="absolute inset-x-12 bottom-8 h-8 rounded-lg bg-current/10 border border-current/20" />
          <span className={`absolute right-7 top-7 ${labelClass}`}>1px solid</span>
          <span className={`absolute left-7 bottom-6 ${labelClass}`}>edge</span>
        </>
      );
    }

    if (artKey.includes("margin")) {
      return (
        <>
          <div className="absolute inset-3 rounded-xl border border-dashed border-current/45 bg-current/5" />
          <div className={`absolute inset-10 rounded-lg ${surfaceClass} animate-[hugoCodeFloat_2.8s_ease-in-out_infinite]`} />
          <div className="absolute left-4 top-1/2 w-7 h-1 rounded bg-current/45" />
          <div className="absolute right-4 top-1/2 w-7 h-1 rounded bg-current/45" />
          <div className="absolute left-1/2 top-4 h-7 w-1 -translate-x-1/2 rounded bg-current/35" />
          <span className={`absolute left-7 top-6 ${labelClass}`}>outside</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>margin</span>
        </>
      );
    }

    if (artKey.includes("click") || artKey.includes("tín hiệu")) {
      return (
        <>
          <div className="absolute left-8 top-8 w-24 h-24 rounded-full bg-current/10 border border-current/25 animate-[hugoCodePulse_1.6s_ease-in-out_infinite]" />
          <div className={`absolute left-16 top-[68px] w-16 h-[52px] rounded-lg ${surfaceClass} rotate-12`} />
          <div className="absolute left-[88px] top-[88px] w-5 h-5 rounded-full bg-current/45" />
          <div className="absolute right-7 top-12 w-16 h-px bg-current/35" />
          <div className="absolute right-8 bottom-8 h-3 w-24 rounded bg-current/25" />
          <span className={`absolute left-7 top-6 ${labelClass}`}>click</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>signal</span>
        </>
      );
    }

    if (artKey.includes("listener") || artKey.includes("bộ nghe")) {
      return (
        <>
          <div className="absolute left-6 top-6 bottom-6 w-[72px] rounded-xl bg-zinc-950 text-emerald-300 p-3 text-[9px] font-mono leading-4 shadow-lg">btn<br/>.<br/>addEvent</div>
          <div className={`absolute right-6 top-7 bottom-7 w-24 rounded-xl ${surfaceClass}`} />
          <div className="absolute left-[120px] right-11 top-12 h-2 rounded bg-current/25 animate-[hugoCodeSlide_1.5s_ease-in-out_infinite]" />
          <div className="absolute left-[120px] right-14 top-[88px] h-2 rounded bg-current/20" />
          <div className="absolute left-[120px] right-[72px] top-32 h-2 rounded bg-current/15" />
          <span className={`absolute left-7 bottom-6 ${labelClass}`}>listener</span>
          <span className={`absolute right-8 top-9 ${labelClass}`}>handler</span>
        </>
      );
    }

    if (artKey.includes("state") || artKey.includes("phản hồi")) {
      return (
        <>
          <div className={`absolute left-6 right-6 top-5 h-24 rounded-xl ${surfaceClass}`} />
          <div className="absolute left-10 top-10 w-12 h-12 rounded-lg bg-current/15" />
          <div className="absolute left-28 right-10 top-12 h-4 rounded bg-current/30 animate-[hugoCodePulse_1.8s_ease-in-out_infinite]" />
          <div className="absolute left-28 right-20 top-[88px] h-3 rounded bg-current/20" />
          <div className="absolute right-10 bottom-5 w-12 h-8 rounded-lg bg-current/30" />
          <span className={`absolute left-7 bottom-6 ${labelClass}`}>state changed</span>
        </>
      );
    }

    if (artKey.includes("request") || artKey.includes("hỏi")) {
      return (
        <>
          <div className={`absolute left-5 top-14 w-[88px] h-[60px] rounded-lg ${surfaceClass}`} />
          <div className="absolute left-8 top-[76px] right-[192px] h-2 rounded bg-current/25" />
          <div className="absolute left-[116px] right-14 top-20 h-2 rounded bg-current/35 animate-[hugoCodeSlide_1.3s_ease-in-out_infinite]" />
          <div className="absolute right-5 top-14 w-16 h-[60px] rounded-lg bg-current/15 border border-current/25" />
          <span className={`absolute left-7 top-7 ${labelClass}`}>GET /users</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>endpoint</span>
        </>
      );
    }

    if (artKey.includes("server") || artKey.includes("xử lý")) {
      return (
        <>
          <div className="absolute left-1/2 top-5 w-[104px] h-[120px] -translate-x-1/2 rounded-xl bg-zinc-950 text-current p-3 space-y-2 shadow-xl">
            {[0, 1, 2].map((row) => <div key={row} className="h-3 rounded bg-current/50 animate-[hugoCodePulse_2s_ease-in-out_infinite]" style={{ animationDelay: `${row * 0.2}s` }} />)}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <span className="h-5 rounded bg-current/25" />
              <span className="h-5 rounded bg-current/15" />
            </div>
          </div>
          <div className="absolute left-8 top-12 w-8 h-8 rounded-full bg-current/15" />
          <div className="absolute right-8 bottom-8 w-8 h-8 rounded-full bg-current/15" />
          <span className={`absolute left-7 bottom-6 ${labelClass}`}>validate</span>
          <span className={`absolute right-7 top-7 ${labelClass}`}>logic</span>
        </>
      );
    }

    if (artKey.includes("render") || artKey.includes("hiển thị")) {
      return (
        <>
          <div className={`absolute inset-x-6 top-5 h-28 rounded-xl ${surfaceClass}`} />
          <div className="absolute left-10 top-10 w-10 h-10 rounded-lg bg-current/20" />
          <div className="absolute left-[104px] right-10 top-12 h-3 rounded bg-current/25" />
          <div className="absolute left-[104px] right-20 top-20 h-3 rounded bg-current/15" />
          <div className="absolute left-10 right-10 bottom-7 h-7 rounded-lg bg-current/15 border border-current/20" />
          <span className={`absolute right-7 top-7 ${labelClass}`}>{"JSON -> UI"}</span>
        </>
      );
    }

    if (artKey.includes("from") || artKey.includes("nguồn")) {
      return (
        <>
          <div className={`absolute inset-x-8 top-6 bottom-6 rounded-xl ${surfaceClass} overflow-hidden`}>
            {[0, 1, 2, 3].map((row) => <div key={row} className="h-7 border-b border-current/15 flex gap-2 px-3 items-center"><span className="w-8 h-2 rounded bg-current/25" /><span className="flex-1 h-2 rounded bg-current/15" /></div>)}
          </div>
          <span className={`absolute left-7 top-7 ${labelClass}`}>products table</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>rows</span>
        </>
      );
    }

    if (artKey.includes("where") || artKey.includes("lọc")) {
      return (
        <>
          <div className={`absolute left-7 right-7 top-6 h-28 rounded-xl ${surfaceClass}`} />
          <div className="absolute left-12 right-12 top-12 h-4 rounded bg-current/15" />
          <div className="absolute left-12 right-20 top-20 h-4 rounded bg-current/40 animate-[hugoCodePulse_1.7s_ease-in-out_infinite]" />
          <div className="absolute left-12 right-28 top-28 h-4 rounded bg-current/15" />
          <div className="absolute right-11 top-[76px] w-7 h-7 rounded-full border-2 border-current/55" />
          <span className={`absolute left-7 top-7 ${labelClass}`}>price &gt; 1000</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>filter</span>
        </>
      );
    }

    if (artKey.includes("limit") || artKey.includes("gọn")) {
      return (
        <>
          {[0, 1, 2].map((row) => (
            <div key={row} className={`absolute left-8 right-8 h-8 rounded-lg ${surfaceClass} animate-[hugoCodeFloat_2.6s_ease-in-out_infinite]`} style={{ top: `${24 + row * 36}px`, animationDelay: `${row * 0.15}s` }}>
              <span className="absolute left-3 top-3 w-10 h-2 rounded bg-current/25" />
              <span className="absolute left-18 right-3 top-3 h-2 rounded bg-current/15" />
            </div>
          ))}
          <div className="absolute right-8 bottom-5 rounded-md bg-current/25 px-3 py-1 text-[10px] font-black">LIMIT 3</div>
          <span className={`absolute left-7 top-7 ${labelClass}`}>output</span>
        </>
      );
    }

    return (
      <>
        <div className="absolute inset-x-4 top-4 h-7 rounded-md bg-white/80 dark:bg-white/10 border border-white/70 dark:border-white/10 animate-[hugoCodePulse_2s_ease-in-out_infinite]" />
        <div className="absolute left-4 right-16 top-16 h-12 rounded-lg bg-white/70 dark:bg-white/10 border border-white/70 dark:border-white/10" />
        <div className="absolute right-4 top-16 w-10 h-12 rounded-lg bg-current opacity-20 animate-[hugoCodeFloat_2.4s_ease-in-out_infinite]" style={{ animationDelay: `${index * 0.15}s` }} />
      </>
    );
  };

  return (
    <div key={`${panel.label}-${panel.title}`} className={`shrink-0 w-[74vw] max-w-[300px] overflow-hidden rounded-lg border bg-gradient-to-br ${tone}`}>
      <div
        className="h-44 p-4 relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          backgroundPosition: "-1px -1px",
          opacity: 1
        }}
      >
        <div className="absolute inset-0 bg-white/70 dark:bg-zinc-950/80" />
        <div className="absolute left-4 top-4 text-[9px] font-black uppercase opacity-50">{String(index + 1).padStart(2, "0")}</div>
        {renderArt()}
      </div>
      <div className="border-t border-current/15 bg-white/75 dark:bg-zinc-950/40 p-3">
        <span className="text-[10px] font-black uppercase opacity-80">{panel.label}</span>
        <h4 className="text-sm font-black text-foreground mt-0.5">{panel.title}</h4>
        <p className="text-xs leading-5 text-muted-foreground mt-1">{panel.caption}</p>
      </div>
    </div>
  );
};

const renderStudyModePanel = (visualSet, activeMode) => {
  const mode = visualSet.modes.find(item => item.id === activeMode) || visualSet.modes[0];
  const modeIndex = visualSet.modes.findIndex(item => item.id === mode.id);

  const renderArtwork = (modeId) => {
    if (modeId === "story") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-zinc-950">
          <div className="relative w-16 h-14 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 rounded shadow-lg animate-[hugoCodeFloat_3s_ease-in-out_infinite]">
            <div className="absolute left-3 top-3 w-8 h-1.5 rounded-full bg-indigo-500/50" />
            <div className="absolute left-3 top-6 w-10 h-1.5 rounded-full bg-indigo-500/30" />
            <div className="absolute left-3 top-9 w-6 h-1.5 rounded-full bg-indigo-500/30" />
            
            {/* Book spine */}
            <div className="absolute -left-1.5 top-0 bottom-0 w-3 bg-indigo-500 rounded-l" />
            
            {/* Floating particles */}
            <div className="absolute -right-4 -top-3 w-3 h-3 rounded-full bg-amber-400/80 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute -left-2 -bottom-2 w-2 h-2 rounded-full bg-sky-400/80 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </div>
        </div>
      );
    }
    if (modeId === "diagram") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-zinc-950">
          <div className="relative w-32 h-20">
            {/* Top Node */}
            <div className="absolute left-1/2 top-1 -translate-x-1/2 w-12 h-5 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center animate-[hugoCodeGlow_2s_ease-in-out_infinite]">
              <div className="w-5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            
            {/* Lines */}
            <div className="absolute left-1/2 top-6 w-px h-4 bg-emerald-500/50" />
            <div className="absolute left-[30%] top-[26px] w-[40%] h-px bg-emerald-500/50" />
            <div className="absolute left-[30%] top-[26px] w-px h-4 bg-emerald-500/50" />
            <div className="absolute right-[30%] top-[26px] w-px h-4 bg-emerald-500/50" />
            
            {/* Bottom Nodes */}
            <div className="absolute left-[10%] top-11 w-12 h-5 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center animate-[hugoCodeFloat_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }}>
              <div className="w-5 h-1.5 rounded-full bg-emerald-400/70" />
            </div>
            <div className="absolute right-[10%] top-11 w-12 h-5 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center animate-[hugoCodeFloat_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }}>
              <div className="w-5 h-1.5 rounded-full bg-emerald-400/70" />
            </div>
          </div>
        </div>
      );
    }
    if (modeId === "memory") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-zinc-950">
          <div className="relative w-24 h-16" style={{ perspective: '1000px' }}>
            {/* Back card */}
            <div className="absolute inset-0 rotate-6 translate-x-2 translate-y-1 bg-white dark:bg-zinc-800 border border-rose-200 dark:border-rose-800 rounded-lg shadow-sm" />
            {/* Front card */}
            <div className="absolute inset-0 bg-white dark:bg-zinc-900 border-2 border-rose-400 dark:border-rose-600 rounded-lg shadow-lg flex flex-col items-center justify-center animate-[hugoCodePulse_2.5s_ease-in-out_infinite]">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mb-1.5 border border-rose-200 dark:border-rose-800">
                <span className="material-symbols-outlined text-rose-500 text-[14px]">psychology</span>
              </div>
              <div className="w-12 h-1.5 rounded-full bg-rose-500/40" />
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback skeleton
    return (
      <>
        <div className="absolute left-3 top-3 bottom-3 w-12 rounded-md bg-primary/10 border border-primary/20 animate-[hugoCodeFloat_2.8s_ease-in-out_infinite]" />
        <div className="absolute left-20 right-3 top-4 h-3 rounded bg-muted" />
        <div className="absolute left-20 right-8 top-9 h-3 rounded bg-muted" />
        <div className="absolute left-20 right-16 top-14 h-3 rounded bg-muted" />
        <div className="absolute bottom-3 left-20 h-6 w-24 rounded-md bg-primary/15 border border-primary/20 animate-[hugoCodePulse_2s_ease-in-out_infinite]" style={{ animationDelay: `${modeIndex * 0.15}s` }} />
      </>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-background p-4 overflow-hidden">
      <div className="h-28 rounded-lg border border-border bg-white dark:bg-zinc-950 relative overflow-hidden">
        {renderArtwork(mode.id)}
      </div>
      <h4 className="mt-4 text-sm font-black text-foreground flex items-center gap-2">
        {mode.id === "story" && <span className="material-symbols-outlined text-indigo-500 text-[18px]">menu_book</span>}
        {mode.id === "diagram" && <span className="material-symbols-outlined text-emerald-500 text-[18px]">account_tree</span>}
        {mode.id === "memory" && <span className="material-symbols-outlined text-rose-500 text-[18px]">psychology</span>}
        {mode.label}
      </h4>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{mode.body}</p>
    </div>
  );
};

export default function MemberIdeTab({ onBack, bio, onBioUpdate }) {
  const [isDesktop, setIsDesktop] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState("explorer"); // explorer, learn, db

  const [activeCourseId, setActiveCourseId] = useState(null);
  const [mobileStudyMode, setMobileStudyMode] = useState("story");
  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("student_ide_progress") || "[]");
    } catch (_) {
      return [];
    }
  });
  const [verificationStatus, setVerificationStatus] = useState(null); // null, 'success', 'failed'
  const [timeLeft, setTimeLeft] = useState(0);

  // Interactive Practice states
  const [htmlBlocks, setHtmlBlocks] = useState([]);
  const [themeBg, setThemeBg] = useState("#ffffff");
  const [themeText, setThemeText] = useState("#000000");
  const [clickCount, setClickCount] = useState(0);
  const [sqlBlocks, setSqlBlocks] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState({}); // { key: val }
  const [blankAnswers, setBlankAnswers] = useState({ blank1: "", blank2: "" });
  const [interactivePassed, setInteractivePassed] = useState(false);
  const [miniQuizAnswers, setMiniQuizAnswers] = useState({});
  const [miniQuizPassed, setMiniQuizPassed] = useState(false);
  
  // Screenshot Upload states
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanScore, setScanScore] = useState(0);
  
  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({}); // { questionIndex: optionIndex }
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    const targetCourseId = activeCourseId || WEB_COURSES[0].id;
    setVerificationStatus(null);
    
    // Reset states
    setThemeBg("#ffffff");
    setThemeText("#000000");
    setClickCount(0);
    setMatchedPairs({});
    setBlankAnswers({ blank1: "", blank2: "" });
    setScreenshotFile(null);
    setIsScanning(false);
    setScanProgress(0);
    setScanScore(0);
    setQuizCurrentIndex(0);
    setQuizAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
    setInteractivePassed(false);
    setMiniQuizPassed(false);
    setMiniQuizAnswers({});

    const course = WEB_COURSES.find(c => c.id === targetCourseId);
    if (!course) return;

    if (course.practiceType === "drag_drop_html") {
      const shuffled = [...course.dragBlocks].sort(() => Math.random() - 0.5);
      setHtmlBlocks(shuffled);
    } else if (course.practiceType === "drag_drop_sql") {
      const shuffled = [...course.dragBlocks].sort(() => Math.random() - 0.5);
      setSqlBlocks(shuffled);
    } else if (course.practiceType === "quiz") {
      const pool = course.id === "lesson4" ? QUIZ_POOL_1 : QUIZ_POOL_2;
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, course.quizSize);
      setQuizQuestions(shuffled);
    }
  }, [activeCourseId]);

  useEffect(() => {
    const targetCourseId = activeCourseId || WEB_COURSES[0].id;
    const isCompleted = completedLessons.includes(targetCourseId);
    if (isCompleted) {
      setTimeLeft(0);
      return;
    }

    const key = `student_ide_start_${targetCourseId}`;
    let startTime = Number(localStorage.getItem(key));
    if (!startTime) {
      startTime = Date.now();
      localStorage.setItem(key, String(startTime));
    }

    const checkTime = () => {
      const elapsed = Date.now() - startTime;
      const totalTime = 10 * 60 * 1000; // 10 minutes
      const remaining = Math.max(0, totalTime - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [activeCourseId, completedLessons]);



  const handleVerifyLesson = async (course) => {
    if (timeLeft > 0) {
      toast.error(`Bạn cần tìm hiểu bài học tối thiểu 10 phút. Còn lại: ${Math.floor(timeLeft / 60)} phút ${timeLeft % 60} giây.`);
      return;
    }

    const fileObj = workspaceFiles.find(f => f.path === course.file);
    if (!fileObj) {
      toast.error(`Vui lòng nạp bài học để tạo file ${course.file} trước!`);
      return;
    }
    
    const isCorrect = course.verify(fileObj.content);
    if (isCorrect) {
      setVerificationStatus("success");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      const session = getMemberSession();
      if (session?.email) {
        if (!completedLessons.includes(course.id)) {
          try {
            const apiBase = import.meta.env.VITE_API_URL || '/api';
            const r = await fetch(`${apiBase}/joy/award-learning`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: session.email, lessonId: course.id })
            });
            const resData = await r.json().catch(() => ({}));
            if (!r.ok) {
              throw new Error(resData.error || `API award-learning failed with status ${r.status}`);
            }
            if (resData.success && !resData.alreadyCompleted) {
              const awardAmount = course.id === 'lesson10' ? 450 : 100;
              toast.success(`Tuyệt vời! Bạn được thưởng +${awardAmount} JOY!`);
              useJoyStore.getState().fetchBalance(session.email);
            } else {
              toast.success("Chính xác! Bài học đã được xác minh hoàn thành.");
            }
          } catch (e) {
            console.error("Error awarding joy for learning:", e);
            toast.error(e.message || "Không thể ghi nhận phần thưởng JOY, vui lòng thử lại.");
          }
        } else {
          toast.success("Chính xác! Bài học đã được xác minh hoàn thành.");
        }
      } else {
        toast.success("Chính xác! Đăng nhập để nhận thưởng JOY.");
      }
      
      if (!completedLessons.includes(course.id)) {
        const nextCompleted = [...completedLessons, course.id];
        setCompletedLessons(nextCompleted);
        localStorage.setItem("student_ide_progress", JSON.stringify(nextCompleted));
      }
    } else {
      setVerificationStatus("failed");
      toast.error("Mã nguồn chưa chính xác, hãy kiểm tra lại yêu cầu đề bài!");
    }
  };

  // File System state
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [folders, setFolders] = useState([
    "src",
    "src/oop",
    "src/database",
    "src/web"
  ]);
  const [expandedFolders, setExpandedFolders] = useState({
    "src": true,
    "src/oop": true,
    "src/database": false,
    "src/web": false
  });

  // Editor Tabs state
  const [openTabs, setOpenTabs] = useState(["README.md"]);
  const [activeTabPath, setActiveTabPath] = useState("README.md");

  // Local File System Picker handle
  const [dirHandle, setDirHandle] = useState(null);

  // Preview state
  const [previewMode, setPreviewMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saveStatus, setSaveStatus] = useState("Đã lưu tất cả");
  const [mobileRunKey, setMobileRunKey] = useState(0);

  // Inline inputs state (New File, New Folder, Rename)
  // { type: 'new_file' | 'new_folder' | 'rename', parentPath?: string, targetPath?: string, oldName?: string, value: string }
  const [inlineAction, setInlineAction] = useState(null);
  const inputRef = useRef(null);

  const activeFile = useMemo(
    () => workspaceFiles.find(f => f.path === activeTabPath) || null,
    [workspaceFiles, activeTabPath]
  );

  const workspaceTree = useMemo(
    () => buildTree(workspaceFiles, folders),
    [workspaceFiles, folders]
  );

  const mobileCourse = useMemo(
    () => WEB_COURSES.find(c => c.id === activeCourseId) || WEB_COURSES[0],
    [activeCourseId]
  );

  const mobileExtra = useMemo(
    () => MOBILE_GUIDE_EXTRAS[mobileCourse?.id] || {},
    [mobileCourse?.id]
  );

  const mobileVisualSet = useMemo(
    () => getMobileVisualSet(mobileExtra.visualType),
    [mobileExtra.visualType]
  );

  const mobileDemoCode = useMemo(
    () => mobileExtra.demoCode || mobileCourse?.starterCode || "",
    [mobileExtra.demoCode, mobileCourse?.starterCode]
  );

  const mobileCompletedCount = useMemo(
    () => completedLessons.filter(id => WEB_COURSES.some(course => course.id === id)).length,
    [completedLessons]
  );

  const mobileProgress = useMemo(
    () => Math.round((mobileCompletedCount / WEB_COURSES.length) * 100),
    [mobileCompletedCount]
  );

  const canPreviewMobileCourse = mobileCourse?.lang === "html";

  // Track desktop size
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync editor theme with web theme
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Update HTML Live Preview
  useEffect(() => {
    if (activeFile && activeFile.language === "html" && previewMode) {
      const blob = new Blob([activeFile.content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [activeFile?.content, previewMode, activeFile?.language]);
  // Load workspace from localStorage on mount (for virtual files)
  useEffect(() => {
    const savedWorkspace = localStorage.getItem("student_ide_workspace");
    const savedFolders = localStorage.getItem("student_ide_folders");
    if (savedWorkspace) {
      try {
        const parsed = JSON.parse(savedWorkspace);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter(f => f && typeof f.path === "string" && typeof f.name === "string")
            .map(f => ({
              path: f.path,
              name: f.name,
              content: typeof f.content === "string" ? f.content : "",
              language: typeof f.language === "string" ? f.language : "plaintext",
              handle: null
            }));
          
          if (cleaned.length > 0) {
            setWorkspaceFiles(cleaned);
            if (savedFolders) {
              try {
                const parsedFolders = JSON.parse(savedFolders);
                if (Array.isArray(parsedFolders)) {
                  setFolders(parsedFolders.filter(f => typeof f === "string"));
                }
              } catch (_) {}
            }
            
            const readme = cleaned.find(f => f.name.toLowerCase() === "readme.md");
            const defaultTab = readme ? readme.path : cleaned[0].path;
            setOpenTabs([defaultTab]);
            setActiveTabPath(defaultTab);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load saved workspace", e);
      }
    }
    
    // Fallback if load fails or has no valid files
    setWorkspaceFiles(INITIAL_WORKSPACE);
    setOpenTabs(["README.md"]);
    setActiveTabPath("README.md");
  }, []);

  // Save virtual workspace to localStorage (debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (dirHandle) return;
      const serializableFiles = workspaceFiles.map(({ handle, ...rest }) => rest);
      localStorage.setItem("student_ide_workspace", JSON.stringify(serializableFiles));
      localStorage.setItem("student_ide_folders", JSON.stringify(folders));
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [workspaceFiles, folders, dirHandle]);

  // Auto-save active local file to physical disk (debounced)
  useEffect(() => {
    if (!activeFile || !activeFile.handle) return;

    setSaveStatus("Đang lưu...");
    const delayDebounceFn = setTimeout(async () => {
      try {
        const writable = await activeFile.handle.createWritable();
        await writable.write(activeFile.content);
        await writable.close();
        setSaveStatus("Đã lưu vào đĩa");
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("Lỗi tự động lưu");
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [activeFile?.content, activeFile?.handle]);

  // Save status for virtual files
  useEffect(() => {
    if (!activeFile || activeFile.handle) return;

    setSaveStatus("Đang lưu (ảo)...");
    const delayDebounceFn = setTimeout(() => {
      setSaveStatus("Đã lưu (localStorage)");
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [activeFile?.content, activeFile?.handle]);

  // Focus and Selection logic for inline actions
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (inlineAction && inlineAction.type === "rename") {
        const name = inlineAction.oldName;
        const lastDot = name.lastIndexOf(".");
        if (lastDot > 0) {
          // Select name without extension
          inputRef.current.setSelectionRange(0, lastDot);
        } else {
          inputRef.current.select();
        }
      } else {
        inputRef.current.select();
      }
    }
  }, [inlineAction]);

  // Folder toggle handler
  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Get parent folder of the active file
  const getActiveFolder = () => {
    if (!activeTabPath) return "";
    const parts = activeTabPath.split("/");
    if (parts.length <= 1) return "";
    return parts.slice(0, -1).join("/");
  };

  // Recursive Directory Reader for Local Workspace
  const refreshLocalDirectory = async () => {
    if (!dirHandle) return;
    try {
      const loadedFiles = [];
      const loadedFolders = [];
      
      const readDirectory = async (directoryHandle, relativePath = "") => {
        for await (const entry of directoryHandle.values()) {
          const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
          
          if (entry.kind === "file") {
            const file = await entry.getFile();
            const ext = file.name.split(".").pop().toLowerCase();
            const supportedExts = ["c", "cpp", "cs", "py", "html", "css", "js", "php", "txt", "md", "json"];
            
            if (supportedExts.includes(ext)) {
              const content = await file.text();
              loadedFiles.push({
                path: entryPath,
                name: file.name,
                content: content,
                language: getLanguageFromExt(ext),
                handle: entry
              });
            }
          } else if (entry.kind === "directory") {
            loadedFolders.push(entryPath);
            await readDirectory(entry, entryPath);
          }
        }
      };

      await readDirectory(dirHandle);
      setWorkspaceFiles(loadedFiles);
      setFolders(loadedFolders);
      
      // Clean up openTabs for missing files
      setOpenTabs(prev => {
        const filtered = prev.filter(t => loadedFiles.some(f => f.path === t));
        if (activeTabPath && !loadedFiles.some(f => f.path === activeTabPath)) {
          if (filtered.length > 0) {
            setActiveTabPath(filtered[0]);
          } else {
            setActiveTabPath(null);
          }
        }
        return filtered;
      });
    } catch (err) {
      console.error("Failed to refresh local directory:", err);
    }
  };

  const getDirHandleByPath = async (rootHandle, path) => {
    const parts = path.split("/");
    if (parts.length <= 1) return rootHandle;
    
    let current = rootHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i], { create: true });
    }
    return current;
  };

  // Physical disk operations
  const localCreateFile = async (fullPath) => {
    if (!dirHandle) return;
    try {
      const parentDir = await getDirHandleByPath(dirHandle, fullPath);
      const name = fullPath.split("/").pop();
      const newFileHandle = await parentDir.getFileHandle(name, { create: true });
      
      const writable = await newFileHandle.createWritable();
      await writable.write("");
      await writable.close();
      
      await refreshLocalDirectory();
      
      setOpenTabs(prev => !prev.includes(fullPath) ? [...prev, fullPath] : prev);
      setActiveTabPath(fullPath);
      toast.success(`Đã tạo file: ${fullPath}`);
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tạo file: " + e.message);
    }
  };

  const localCreateFolder = async (fullPath) => {
    if (!dirHandle) return;
    try {
      const parentDir = await getDirHandleByPath(dirHandle, fullPath);
      const name = fullPath.split("/").pop();
      await parentDir.getDirectoryHandle(name, { create: true });
      
      await refreshLocalDirectory();
      setExpandedFolders(prev => ({ ...prev, [fullPath]: true }));
      toast.success(`Đã tạo thư mục: ${fullPath}`);
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tạo thư mục: " + e.message);
    }
  };

  const localDeleteEntry = async (fullPath, type) => {
    if (!dirHandle) return;
    try {
      const parentDir = await getDirHandleByPath(dirHandle, fullPath);
      const name = fullPath.split("/").pop();
      await parentDir.removeEntry(name, { recursive: true });
      
      // Clean up openTabs
      setOpenTabs(prev => prev.filter(t => t !== fullPath && !t.startsWith(`${fullPath}/`)));
      if (activeTabPath === fullPath || (activeTabPath && activeTabPath.startsWith(`${fullPath}/`))) {
        setActiveTabPath(null);
      }
      
      await refreshLocalDirectory();
      toast.success(`Đã xóa: ${fullPath}`);
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi xóa: " + e.message);
    }
  };

  const localRenameEntry = async (oldFullPath, newFullPath) => {
    if (!dirHandle) return;
    try {
      const parentDir = await getDirHandleByPath(dirHandle, oldFullPath);
      const oldName = oldFullPath.split("/").pop();
      const newName = newFullPath.split("/").pop();
      
      let entryHandle;
      try {
        entryHandle = await parentDir.getFileHandle(oldName);
      } catch (_) {
        entryHandle = await parentDir.getDirectoryHandle(oldName);
      }
      
      if (entryHandle.move) {
        await entryHandle.move(newName);
      } else {
        if (entryHandle.kind === "file") {
          const file = await entryHandle.getFile();
          const text = await file.text();
          const newFileHandle = await parentDir.getFileHandle(newName, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(text);
          await writable.close();
          await parentDir.removeEntry(oldName);
        } else {
          throw new Error("Trình duyệt không hỗ trợ đổi tên thư mục.");
        }
      }
      
      // Update tabs
      setOpenTabs(prev => prev.map(t => {
        if (t === oldFullPath) return newFullPath;
        if (t.startsWith(`${oldFullPath}/`)) return t.replace(oldFullPath, newFullPath);
        return t;
      }));
      if (activeTabPath === oldFullPath) {
        setActiveTabPath(newFullPath);
      } else if (activeTabPath && activeTabPath.startsWith(`${oldFullPath}/`)) {
        setActiveTabPath(activeTabPath.replace(oldFullPath, newFullPath));
      }
      
      await refreshLocalDirectory();
      toast.success(`Đã đổi tên thành: ${newFullPath}`);
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi đổi tên: " + e.message);
    }
  };

  // Open Local Folder Picker
  const handleOpenFolder = async () => {
    try {
      if (!window.showDirectoryPicker) {
        toast.error("Trình duyệt không hỗ trợ File System Access API. Dùng chế độ lưu ảo thay thế.");
        return;
      }
      
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
      
      const loadedFiles = [];
      const loadedFolders = [];
      
      const readDirectory = async (directoryHandle, relativePath = "") => {
        for await (const entry of directoryHandle.values()) {
          const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
          
          if (entry.kind === "file") {
            const file = await entry.getFile();
            const ext = file.name.split(".").pop().toLowerCase();
            const supportedExts = ["c", "cpp", "cs", "py", "html", "css", "js", "php", "txt", "md", "json"];
            
            if (supportedExts.includes(ext)) {
              const content = await file.text();
              loadedFiles.push({
                path: entryPath,
                name: file.name,
                content: content,
                language: getLanguageFromExt(ext),
                handle: entry
              });
            }
          } else if (entry.kind === "directory") {
            loadedFolders.push(entryPath);
            await readDirectory(entry, entryPath);
          }
        }
      };

      await readDirectory(handle);

      if (loadedFiles.length > 0) {
        setWorkspaceFiles(loadedFiles);
        setFolders(loadedFolders);
        
        // Open the first loaded file or README
        const readme = loadedFiles.find(f => f.name.toLowerCase() === "readme.md");
        const defaultTab = readme ? readme.path : loadedFiles[0].path;
        setOpenTabs([defaultTab]);
        setActiveTabPath(defaultTab);
        
        toast.success(`Đã tải ${loadedFiles.length} file từ thư mục cục bộ!`);
      } else {
        toast.error("Không tìm thấy file code được hỗ trợ trong thư mục này.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
        if (err.message.includes("sensitive") || err.message.includes("system") || err.name === "SecurityError") {
          toast.error("Lỗi bảo mật: Vui lòng chọn một thư mục con (ví dụ: tạo thư mục 'Dự án' trên Desktop). Trình duyệt không cho phép chọn trực tiếp Desktop gốc.");
        } else {
          toast.error("Lỗi khi mở thư mục: " + err.message);
        }
      }
    }
  };

  // Open file in Editor Tab
  const handleOpenFile = (path) => {
    if (!openTabs.includes(path)) {
      setOpenTabs([...openTabs, path]);
    }
    setActiveTabPath(path);
  };

  // Close editor tab (keeps file in workspace)
  const handleCloseTab = (path, e) => {
    if (e) e.stopPropagation();
    const updated = openTabs.filter(t => t !== path);
    setOpenTabs(updated);
    
    if (activeTabPath === path) {
      if (updated.length > 0) {
        const closedIdx = openTabs.indexOf(path);
        const nextIdx = Math.min(closedIdx, updated.length - 1);
        setActiveTabPath(updated[nextIdx]);
      } else {
        setActiveTabPath(null);
      }
    }
  };

  // Manual save trigger
  const handleSaveFile = async () => {
    if (!activeFile) return;

    if (activeFile.handle) {
      try {
        const writable = await activeFile.handle.createWritable();
        await writable.write(activeFile.content);
        await writable.close();
        toast.success(`Đã lưu "${activeFile.name}" thành công vào máy tính!`);
      } catch (err) {
        console.error(err);
        toast.error("Lỗi lưu file: " + err.message);
      }
    } else {
      // Download fallback
      const blob = new Blob([activeFile.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeFile.name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã tải xuống file "${activeFile.name}"!`);
    }
  };

  // Delete workspace file / folder
  const handleDeleteEntry = (targetPath, type) => {
    toast((t) => (
      <HugoConfirmNotice
        type="error"
        title="Xác nhận xóa"
        message={<>Bạn có chắc chắn muốn xóa {type === "folder" ? "thư mục" : "file"} "{targetPath.split('/').pop()}" không? Hành động này không thể hoàn tác.</>}
        onCancel={() => toast.dismiss(t.id)}
        onConfirm={async () => {
          toast.dismiss(t.id);
          if (dirHandle) {
            await localDeleteEntry(targetPath, type);
          } else {
            if (type === "file") {
              setWorkspaceFiles(prev => prev.filter(f => f.path !== targetPath));
              setOpenTabs(prev => prev.filter(t => t !== targetPath));
              if (activeTabPath === targetPath) {
                setActiveTabPath(prev => {
                  const nextTabs = openTabs.filter(t => t !== targetPath);
                  return nextTabs.length > 0 ? nextTabs[0] : null;
                });
              }
              toast.success(`Đã xóa file ảo: ${targetPath}`);
            } else {
              setFolders(prev => prev.filter(d => d !== targetPath && !d.startsWith(`${targetPath}/`)));
              setWorkspaceFiles(prev => prev.filter(f => !f.path.startsWith(`${targetPath}/`)));
              setOpenTabs(prev => prev.filter(t => !t.startsWith(`${targetPath}/`)));
              if (activeTabPath && activeTabPath.startsWith(`${targetPath}/`)) {
                setActiveTabPath(null);
              }
              toast.success(`Đã xóa thư mục ảo: ${targetPath}`);
            }
          }
        }}
      />
    ), {
      duration: 10000,
      position: 'top-center',
      style: { padding: 0, background: 'transparent', boxShadow: 'none' }
    });
  };

  // Inline action key down handler (Enter, Escape)
  const handleInlineInputKeyDown = (e, action) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeInlineAction(action);
    } else if (e.key === "Escape") {
      setInlineAction(null);
    }
  };

  // Inline action blur handler
  const handleInlineInputBlur = (action) => {
    if (action.value && action.value.trim() !== "") {
      executeInlineAction(action);
    } else {
      setInlineAction(null);
    }
  };

  // Execute inline file/folder action
  const executeInlineAction = async (action) => {
    const name = action.value.trim();
    if (!name) {
      setInlineAction(null);
      return;
    }
    
    setInlineAction(null);

    if (action.type === "new_file") {
      const fullPath = action.parentPath ? `${action.parentPath}/${name}` : name;
      if (dirHandle) {
        await localCreateFile(fullPath);
      } else {
        if (workspaceFiles.some(f => f.path.toLowerCase() === fullPath.toLowerCase())) {
          toast.error("File đã tồn tại!");
          return;
        }
        const ext = name.split(".").pop().toLowerCase();
        const newFile = {
          path: fullPath,
          name: name,
          content: TEMPLATES[ext] || "",
          language: getLanguageFromExt(ext)
        };
        setWorkspaceFiles(prev => [...prev, newFile]);
        setOpenTabs(prev => [...prev, fullPath]);
        setActiveTabPath(fullPath);
        toast.success(`Đã tạo file ảo: ${fullPath}`);
      }
    } else if (action.type === "new_folder") {
      const fullPath = action.parentPath ? `${action.parentPath}/${name}` : name;
      if (dirHandle) {
        await localCreateFolder(fullPath);
      } else {
        if (folders.includes(fullPath)) {
          toast.error("Thư mục đã tồn tại!");
          return;
        }
        setFolders(prev => [...prev, fullPath]);
        setExpandedFolders(prev => ({ ...prev, [fullPath]: true }));
        toast.success(`Đã tạo thư mục ảo: ${fullPath}`);
      }
    } else if (action.type === "rename") {
      if (name === action.oldName) return;
      
      const parts = action.targetPath.split("/");
      parts[parts.length - 1] = name;
      const newFullPath = parts.join("/");
      
      if (dirHandle) {
        await localRenameEntry(action.targetPath, newFullPath);
      } else {
        const isFolder = folders.includes(action.targetPath);
        if (isFolder) {
          if (folders.includes(newFullPath)) {
            toast.error("Thư mục đã tồn tại!");
            return;
          }
          setFolders(prev => prev.map(d => {
            if (d === action.targetPath) return newFullPath;
            if (d.startsWith(`${action.targetPath}/`)) {
              return d.replace(action.targetPath, newFullPath);
            }
            return d;
          }));
          setWorkspaceFiles(prev => prev.map(f => {
            if (f.path.startsWith(`${action.targetPath}/`)) {
              return {
                ...f,
                path: f.path.replace(action.targetPath, newFullPath)
              };
            }
            return f;
          }));
          setOpenTabs(prev => prev.map(t => {
            if (t.startsWith(`${action.targetPath}/`)) {
              return t.replace(action.targetPath, newFullPath);
            }
            return t;
          }));
          if (activeTabPath && activeTabPath.startsWith(`${action.targetPath}/`)) {
            setActiveTabPath(activeTabPath.replace(action.targetPath, newFullPath));
          }
          toast.success(`Đã đổi tên thư mục ảo thành: ${newFullPath}`);
        } else {
          if (workspaceFiles.some(f => f.path.toLowerCase() === newFullPath.toLowerCase())) {
            toast.error("File đã tồn tại!");
            return;
          }
          setWorkspaceFiles(prev => prev.map(f => {
            if (f.path === action.targetPath) {
              return {
                ...f,
                path: newFullPath,
                name: name
              };
            }
            return f;
          }));
          setOpenTabs(prev => prev.map(t => t === action.targetPath ? newFullPath : t));
          if (activeTabPath === action.targetPath) {
            setActiveTabPath(newFullPath);
          }
          toast.success(`Đã đổi tên file ảo thành: ${newFullPath}`);
        }
      }
    }
  };

  // Open sample tutorial template
  const openTemplate = (langKey) => {
    const pathMap = {
      c: "src/oop/Vehicle.c",
      cpp: "src/oop/Shape.cpp",
      csharp: "src/oop/BankAccount.cs",
      python: "src/oop/Animal.py",
      html: "src/web/index.html",
      php: "src/database/DBConnection.php"
    };

    const targetPath = pathMap[langKey];
    
    // Check if template tab is already open
    if (openTabs.includes(targetPath)) {
      setActiveTabPath(targetPath);
      toast.success(`Đã mở bài học ${langKey.toUpperCase()}`);
      return;
    }

    // Check if file exists in workspace
    const exists = workspaceFiles.some(f => f.path === targetPath);
    if (!exists) {
      const ext = targetPath.split(".").pop().toLowerCase();
      const newFile = {
        path: targetPath,
        name: targetPath.split("/").pop(),
        content: TEMPLATES[langKey],
        language: getLanguageFromExt(ext)
      };
      setWorkspaceFiles(prev => [...prev, newFile]);
    }

    setOpenTabs(prev => [...prev, targetPath]);
    setActiveTabPath(targetPath);
    toast.success(`Đã nạp bài học & code mẫu ${langKey.toUpperCase()}`);
  };

  // Build recursive structure for tree display
  function buildTree(files, folderPaths) {
    const root = { name: "Root", path: "", type: "folder", children: [] };
    
    if (Array.isArray(folderPaths)) {
      folderPaths.forEach(fPath => {
        if (!fPath || typeof fPath !== "string") return;
        const parts = fPath.split("/");
        let current = root;
        let curPath = "";
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part) continue;
          curPath = curPath ? `${curPath}/${part}` : part;
          let child = current.children.find(c => c.path === curPath && c.type === "folder");
          if (!child) {
            child = { name: part, path: curPath, type: "folder", children: [] };
            current.children.push(child);
          }
          current = child;
        }
      });
    }

    if (Array.isArray(files)) {
      files.forEach(file => {
        if (!file || !file.path || typeof file.path !== "string") return;
        const parts = file.path.split("/");
        let current = root;
        let curPath = "";
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!part) continue;
          curPath = curPath ? `${curPath}/${part}` : part;
          let child = current.children.find(c => c.path === curPath && c.type === "folder");
          if (!child) {
            child = { name: part, path: curPath, type: "folder", children: [] };
            current.children.push(child);
          }
          current = child;
        }
        const fileName = parts[parts.length - 1];
        if (fileName && !current.children.some(c => c.path === file.path && c.type === "file")) {
          current.children.push({
            name: fileName,
            path: file.path,
            type: "file",
            file: file
          });
        }
      });
    }

    return root;
  }

  // Recursive Tree Rendering function
  const renderTree = (node, level = 0) => {
    if (!node) return null;
    const sortedChildren = [...(node.children || [])].sort((a, b) => {
      if (!a || !b) return 0;
      const aType = a.type || "file";
      const bType = b.type || "file";
      if (aType !== bType) {
        return aType === "folder" ? -1 : 1;
      }
      const aName = a.name || "";
      const bName = b.name || "";
      return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
    });
    return (
      <div key={node.path || "root"} className="space-y-0.5">
        {node.path && (
          <div
            style={{ paddingLeft: `${level * 12 + 4}px` }}
            className={`group flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors ${
              node.type === "folder"
                ? "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                : activeTabPath === node.path
                ? "bg-primary/20 text-primary border-l-2 border-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
            onClick={() => {
              if (node.type === "folder") {
                toggleFolder(node.path);
              } else {
                handleOpenFile(node.path);
              }
            }}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {node.type === "folder" ? (
                <>
                  <span className="text-muted-foreground w-3 flex items-center justify-center">
                    {expandedFolders[node.path] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </span>
                  {expandedFolders[node.path] ? (
                    <FolderOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-3" />
                  {getFileIcon(node.name)}
                </>
              )}

              {/* Name string or inline rename input */}
              {inlineAction && inlineAction.type === "rename" && inlineAction.targetPath === node.path ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={inlineAction.value}
                  onChange={(e) => setInlineAction({ ...inlineAction, value: e.target.value })}
                  onKeyDown={(e) => handleInlineInputKeyDown(e, inlineAction)}
                  onBlur={() => handleInlineInputBlur(inlineAction)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-muted text-foreground border border-primary rounded px-1 py-0.5 text-[11px] outline-none w-full font-mono"
                />
              ) : (
                <span className="truncate select-none text-[11.5px] font-medium">{node.name}</span>
              )}
            </div>

            {/* Hover Operations */}
            {(!inlineAction || inlineAction.targetPath !== node.path) && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                {node.type === "folder" && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!expandedFolders[node.path]) {
                          setExpandedFolders(prev => ({ ...prev, [node.path]: true }));
                        }
                        setInlineAction({ type: "new_file", parentPath: node.path, value: "" });
                      }}
                      className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-white"
                      title="New File..."
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!expandedFolders[node.path]) {
                          setExpandedFolders(prev => ({ ...prev, [node.path]: true }));
                        }
                        setInlineAction({ type: "new_folder", parentPath: node.path, value: "" });
                      }}
                      className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-white"
                      title="New Folder..."
                    >
                      <Folder className="w-3 h-3" />
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInlineAction({ type: "rename", targetPath: node.path, oldName: node.name, value: node.name });
                  }}
                  className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-white"
                  title="Rename"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEntry(node.path, node.type);
                  }}
                  className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Folder Children rendering */}
        {(node.path === "" || (node.type === "folder" && expandedFolders[node.path])) && (
          <div className="space-y-0.5">
            {/* Render new creation input at the top of the children list if child target matches this parent path */}
            {inlineAction && (inlineAction.type === "new_file" || inlineAction.type === "new_folder") && inlineAction.parentPath === node.path && (
              <div
                style={{ paddingLeft: `${(level + (node.path === "" ? 0 : 1)) * 12 + 4}px` }}
                className="flex items-center gap-1.5 py-1 px-2 hover:bg-muted/50 rounded"
              >
                <span className="w-3" />
                {inlineAction.type === "new_folder" ? (
                  <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={inlineAction.value}
                  placeholder={inlineAction.type === "new_folder" ? "New folder..." : "New file..."}
                  onChange={(e) => setInlineAction({ ...inlineAction, value: e.target.value })}
                  onKeyDown={(e) => handleInlineInputKeyDown(e, inlineAction)}
                  onBlur={() => handleInlineInputBlur(inlineAction)}
                  className="bg-muted text-foreground border border-primary rounded px-1 py-0.5 text-[11px] outline-none w-full font-mono"
                />
              </div>
            )}

            {sortedChildren.map(child => renderTree(child, node.path === "" ? level : level + 1))}
          </div>
        )}
      </div>
    );
  };


  const moveBlock = (index, direction, type) => {
    const blocks = type === "html" ? [...htmlBlocks] : [...sqlBlocks];
    const setBlocks = type === "html" ? setHtmlBlocks : setSqlBlocks;
    if (direction === "up" && index > 0) {
      [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
    } else if (direction === "down" && index < blocks.length - 1) {
      [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
    }
    setBlocks(blocks);
  };

  const handlePairMatch = (side, item) => {
    if (side === "left") {
      setMatchedPairs(prev => ({ ...prev, activeLeft: item }));
    } else if (side === "right" && matchedPairs.activeLeft) {
      const leftItem = matchedPairs.activeLeft;
      const course = WEB_COURSES.find(c => c.id === activeCourseId);
      if (course && course.matchPairs) {
        const correctPair = course.matchPairs.find(p => p.key === leftItem);
        if (correctPair && correctPair.val === item) {
          setMatchedPairs(prev => {
            const next = { ...prev };
            next[leftItem] = item;
            delete next.activeLeft;
            return next;
          });
          toast.success("Nối chính xác!", { id: "pair-toast" });
        } else {
          toast.error("Nối chưa chính xác, hãy chọn lại!", { id: "pair-toast" });
          setMatchedPairs(prev => {
            const next = { ...prev };
            delete next.activeLeft;
            return next;
          });
        }
      }
    }
  };

  const handleScreenshotSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshotFile(URL.createObjectURL(file));
      setIsScanning(true);
      setScanProgress(0);
      setScanScore(0);
      
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            const finalScore = Math.floor(Math.random() * 21) + 75; // 75 to 95
            setScanScore(finalScore);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
  };

  const verifyInteractivePractice = async () => {
    if (timeLeft > 0) {
      toast.error(`Bạn cần tìm hiểu bài học tối thiểu 10 phút. Còn lại: ${Math.floor(timeLeft / 60)} phút ${timeLeft % 60} giây.`);
      return;
    }

    const course = WEB_COURSES.find(c => c.id === activeCourseId) || WEB_COURSES[0];
    let isCorrect = false;

    if (course.practiceType === "drag_drop_html") {
      const currentOrder = htmlBlocks.map(b => b.id);
      isCorrect = JSON.stringify(currentOrder) === JSON.stringify(course.correctOrder);
    } else if (course.practiceType === "theme_match") {
      isCorrect = themeBg.toLowerCase() === course.requiredBg.toLowerCase() && 
                  themeText.toLowerCase() === course.requiredText.toLowerCase();
    } else if (course.practiceType === "js_button") {
      isCorrect = clickCount >= 3;
    } else if (course.practiceType === "drag_drop_sql") {
      const currentOrder = sqlBlocks.map(b => b.id);
      isCorrect = JSON.stringify(currentOrder) === JSON.stringify(course.correctOrder);
    } else if (course.practiceType === "php_match") {
      const totalPairs = course.matchPairs.length;
      const matchedKeys = Object.keys(matchedPairs).filter(k => k !== "activeLeft");
      isCorrect = matchedKeys.length === totalPairs;
    } else if (course.practiceType === "fill_blank") {
      isCorrect = blankAnswers.blank1.trim().toLowerCase() === course.correctBlanks.blank1.toLowerCase() &&
                  blankAnswers.blank2.trim().toLowerCase() === course.correctBlanks.blank2.toLowerCase();
    } else if (course.practiceType === "screenshot_upload") {
      isCorrect = screenshotFile && !isScanning && scanScore >= 60;
    } else if (course.practiceType === "quiz") {
      let correct = 0;
      quizQuestions.forEach((q, idx) => {
        if (quizAnswers[idx] === q.a) correct++;
      });
      const score = Math.round((correct / quizQuestions.length) * 100);
      setQuizScore(score);
      setQuizCompleted(true);
      isCorrect = score >= 60;
    }

    if (isCorrect) {
      if (course.miniQuiz && !interactivePassed) {
        setInteractivePassed(true);
        toast.success("Thực hành thành công! Hãy hoàn thành 3 câu trắc nghiệm để qua bài.");
        return;
      }
      await handleRewardMobileLesson(course);
    } else {
      setVerificationStatus("failed");
      if (course.practiceType === "quiz") {
        toast.error(`Bài thi chưa đạt yêu cầu! Điểm của bạn: ${Math.round((quizQuestions.filter((q, idx) => quizAnswers[idx] === q.a).length / quizQuestions.length) * 100)}% (Yêu cầu >60%)`);
      } else {
        toast.error("Yêu cầu thực hành chưa chính xác, hãy xem lại đề bài!");
      }
    }
  };

  const handleRewardMobileLesson = async (course) => {
    setVerificationStatus("success");
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    
    const session = getMemberSession();
    if (session?.email) {
      if (!completedLessons.includes(course.id)) {
        try {
          const apiBase = import.meta.env.VITE_API_URL || '/api';
          const r = await fetch(`${apiBase}/joy/award-learning`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.email, lessonId: course.id })
          });
          const resData = await r.json().catch(() => ({}));
          if (!r.ok) {
            throw new Error(resData.error || `API award-learning failed with status ${r.status}`);
          }
          if (resData.success && !resData.alreadyCompleted) {
            const awardAmount = course.id === 'lesson10' ? 450 : 100;
            toast.success(`Chúc mừng! Bạn vượt qua bài học và nhận +${awardAmount} JOY!`);
            useJoyStore.getState().fetchBalance(session.email);
          } else {
            toast.success("Chính xác! Bạn đã hoàn thành bài học.");
          }
        } catch (e) {
          console.error("Error awarding joy:", e);
          toast.error(e.message || "Lỗi lưu phần thưởng, vui lòng thử lại.");
        }
      } else {
        toast.success("Chính xác! Bạn đã hoàn thành bài học.");
      }
    } else {
      toast.success("Chính xác! Hãy đăng nhập để nhận thưởng JOY.");
    }

    if (!completedLessons.includes(course.id)) {
      const nextCompleted = [...completedLessons, course.id];
      setCompletedLessons(nextCompleted);
      localStorage.setItem("student_ide_progress", JSON.stringify(nextCompleted));
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
    setQuizCurrentIndex(0);
    setVerificationStatus(null);
    const course = WEB_COURSES.find(c => c.id === activeCourseId);
    if (course) {
      const pool = course.id === "lesson4" ? QUIZ_POOL_1 : QUIZ_POOL_2;
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, course.quizSize);
      setQuizQuestions(shuffled);
    }
    toast.success("Đã đổi đề thi mới! Hãy làm lại bài thi.");
  };

  const renderInteractivePractice = (course) => {
    const isCompleted = completedLessons.includes(course.id);
    
    if (course.miniQuiz && interactivePassed && !isCompleted) {
      const handleSubmitMiniQuiz = () => {
        const allCorrect = course.miniQuiz.every((q, i) => miniQuizAnswers[i] === q.a);
        if (allCorrect) {
          setMiniQuizPassed(true);
          handleRewardMobileLesson(course);
        } else {
          toast.error("Một số câu chưa đúng, hãy kiểm tra lại nhé!");
        }
      };

      return (
        <div className="space-y-6">
          <div className="bg-success/10 border border-success/20 p-3 rounded-xl text-center">
            <p className="text-xs font-bold text-success">Thực hành hoàn tất! Trả lời đúng 3 câu dưới đây để qua bài.</p>
          </div>
          
          <div className="space-y-6">
            {course.miniQuiz.map((q, qIdx) => (
              <div key={qIdx} className="space-y-3">
                <p className="text-xs font-black text-foreground leading-relaxed">
                  <span className="text-primary mr-1">{qIdx + 1}.</span> {q.q}
                </p>
                <div className="space-y-2 pl-2">
                  {q.o.map((opt, oIdx) => {
                    const isSelected = miniQuizAnswers[qIdx] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => setMiniQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all active:scale-[0.98] ${
                          isSelected
                            ? "bg-primary border-primary text-white shadow-sm font-bold"
                            : "bg-background border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitMiniQuiz}
            disabled={Object.keys(miniQuizAnswers).length < course.miniQuiz.length}
            className="w-full py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none mt-4"
          >
            Nộp bài kiểm tra
          </button>
        </div>
      );
    }
    
    if (isCompleted) {
      return (
        <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-success animate-bounce">verified</span>
          <p className="text-sm font-black text-success uppercase tracking-wider">Bài học đã hoàn thành!</p>
          <p className="text-xs text-muted-foreground">Bạn đã vượt qua các thử thách của bài học này và nhận phần thưởng JOY.</p>
        </div>
      );
    }

    if (course.practiceType === "drag_drop_html" || course.practiceType === "drag_drop_sql") {
      const blocks = course.practiceType === "drag_drop_html" ? htmlBlocks : sqlBlocks;
      const type = course.practiceType === "drag_drop_html" ? "html" : "sql";
      return (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Nhấp vào nút di chuyển để sắp xếp các khối lệnh sau theo đúng thứ tự logic:</p>
          <div className="space-y-2.5">
            {blocks.map((block, idx) => (
              <div key={block.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 border border-border p-3 rounded-xl text-xs font-mono select-none">
                <span className="text-primary font-bold">{block.text}</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => moveBlock(idx, "up", type)}
                    disabled={idx === 0}
                    className="w-8 h-8 bg-white dark:bg-zinc-900 hover:bg-muted border border-border rounded-lg flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none text-xs font-bold active:scale-90 transition-all shadow-sm"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveBlock(idx, "down", type)}
                    disabled={idx === blocks.length - 1}
                    className="w-8 h-8 bg-white dark:bg-zinc-900 hover:bg-muted border border-border rounded-lg flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none text-xs font-bold active:scale-90 transition-all shadow-sm"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={verifyInteractivePractice}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md mt-2"
          >
            Kiểm tra thứ tự
          </button>
        </div>
      );
    }

    if (course.practiceType === "theme_match") {
      const bgColors = [
        { name: "Đỏ", hex: "#ff3b30" },
        { name: "Xanh Dương", hex: "#0056b3" },
        { name: "Xanh Lá", hex: "#34c759" }
      ];
      const textColors = [
        { name: "Trắng", hex: "#ffffff" },
        { name: "Đen", hex: "#000000" },
        { name: "Vàng", hex: "#facc15" }
      ];
      return (
        <div className="space-y-4">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-xs text-primary font-bold">Yêu cầu giao diện:</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">{course.themePrompt}</p>
          </div>

          <div 
            className="border border-border p-5 rounded-xl text-center space-y-1 transition-all"
            style={{ backgroundColor: themeBg, color: themeText }}
          >
            <h4 className="text-sm font-black uppercase">Card Sản Phẩm</h4>
            <p className="text-[10px] opacity-75">Ví dụ hiển thị trực quan</p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-1.5">Màu nền:</p>
              <div className="flex gap-2">
                {bgColors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setThemeBg(color.hex)}
                    className={`flex-1 py-1.5 px-2 text-[10px] font-bold border rounded-lg transition-all active:scale-95 ${
                      themeBg === color.hex ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-1.5">Màu chữ:</p>
              <div className="flex gap-2">
                {textColors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setThemeText(color.hex)}
                    className={`flex-1 py-1.5 px-2 text-[10px] font-bold border rounded-lg transition-all active:scale-95 ${
                      themeText === color.hex ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={verifyInteractivePractice}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md mt-2"
          >
            Xác nhận màu sắc
          </button>
        </div>
      );
    }

    if (course.practiceType === "js_button") {
      return (
        <div className="space-y-4 text-center">
          <p className="text-xs text-muted-foreground text-left">Hãy hoàn thành sự kiện click bằng cách nhấp đủ 3 lần:</p>
          
          <div className="py-6 bg-zinc-50 dark:bg-zinc-950 border border-border rounded-xl space-y-3">
            <button
              onClick={() => setClickCount(prev => Math.min(prev + 1, 3))}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-wider active:scale-90 transition-all shadow-md shadow-emerald-500/10"
            >
              Nhấp chuột (Click)
            </button>
            <p className="text-xs font-bold text-muted-foreground">Bộ đếm số lần: {clickCount} / 3</p>
          </div>

          <button
            onClick={verifyInteractivePractice}
            disabled={clickCount < 3}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none"
          >
            {clickCount >= 3 ? "Nộp bài thực hành" : "Hãy nhấn đủ 3 lần"}
          </button>
        </div>
      );
    }

    if (course.practiceType === "php_match") {
      const keys = ["$ (Đô-la)", "echo", "PDO", ". (Dấu chấm)"];
      const scrambledVals = ["In dữ liệu ra HTML", "Kết nối Cơ sở dữ liệu", "Khai báo biến", "Ghép hai chuỗi ký tự"];
      return (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Bấm chọn 1 từ khóa ở bên trái, sau đó bấm chọn đúng định nghĩa ở bên phải:</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Từ khóa</p>
              {keys.map((k) => {
                const isMatched = matchedPairs[k] !== undefined;
                const isActive = matchedPairs.activeLeft === k;
                return (
                  <button
                    key={k}
                    onClick={() => !isMatched && handlePairMatch("left", k)}
                    disabled={isMatched}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono transition-all active:scale-95 ${
                      isMatched
                        ? "bg-success/15 border-success/30 text-success line-through"
                        : isActive
                          ? "bg-primary border-primary text-white"
                          : "bg-background border-border text-foreground"
                    }`}
                  >
                    {k}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Định nghĩa</p>
              {scrambledVals.map((v) => {
                const isMatched = Object.values(matchedPairs).includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => !isMatched && handlePairMatch("right", v)}
                    disabled={isMatched || !matchedPairs.activeLeft}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all active:scale-95 ${
                      isMatched
                        ? "bg-success/15 border-success/30 text-success"
                        : "bg-background border-border text-foreground hover:bg-muted/50 disabled:opacity-50"
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={verifyInteractivePractice}
            disabled={Object.keys(matchedPairs).filter(k => k !== "activeLeft").length < 4}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none mt-2"
          >
            Hoàn thành nối cặp
          </button>
        </div>
      );
    }

    if (course.practiceType === "fill_blank") {
      return (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Điền đoạn code PHP thích hợp vào các ô trống bên dưới:</p>
          
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono text-xs space-y-4 leading-6">
            <div>{`<h1><?php`}</div>
            <div className="flex items-center flex-wrap gap-2 pl-4">
              <input
                type="text"
                placeholder="[blank1]"
                value={blankAnswers.blank1}
                onChange={(e) => setBlankAnswers(prev => ({ ...prev, blank1: e.target.value }))}
                className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-center text-primary font-bold outline-none focus:border-primary"
              />
              <span>"Xin chào"</span>
              <input
                type="text"
                placeholder="[blank2]"
                value={blankAnswers.blank2}
                onChange={(e) => setBlankAnswers(prev => ({ ...prev, blank2: e.target.value }))}
                className="w-12 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-center text-primary font-bold outline-none focus:border-primary"
              />
              <span>$name; ?&gt; &lt;/h1&gt;</span>
            </div>
          </div>

          <button
            onClick={verifyInteractivePractice}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
          >
            Nộp kết quả điền code
          </button>
        </div>
      );
    }

    if (course.practiceType === "screenshot_upload") {
      return (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Viết code trên IDE Máy tính (Desktop). Sau khi chạy thành công kết quả ra trình duyệt, bạn chụp ảnh màn hình và tải lên đây để AI của hệ thống quét và chấm điểm.
          </p>

          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-zinc-50 dark:bg-zinc-950/20 relative overflow-hidden flex flex-col items-center justify-center min-h-36">
            {screenshotFile ? (
              <div className="space-y-3 w-full">
                <img src={screenshotFile} alt="Preview" className="max-h-32 object-contain mx-auto rounded border border-border shadow-sm" />
                {!isScanning && (
                  <p className="text-[10px] font-bold text-success">Đã tải ảnh lên thành công!</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <span className="material-symbols-outlined text-4xl text-muted-foreground animate-pulse">add_photo_alternate</span>
                <p className="text-xs font-bold text-muted-foreground">Chọn hoặc kéo ảnh chụp màn hình vào đây</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            )}

            {isScanning && (
              <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center p-4 space-y-2.5 z-10">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-muted border-t-primary animate-spin" />
                  <span className="text-[9px] font-black">{scanProgress}%</span>
                </div>
                <div>
                  <p className="text-xs font-black animate-pulse">Hệ thống AI đang quét ảnh...</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Xác minh cấu trúc HTML/CSS và console log.</p>
                </div>
              </div>
            )}
          </div>

          {screenshotFile && !isScanning && scanScore > 0 && (
            <div className="bg-success/10 border border-success/20 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-success uppercase">Chấm điểm tự động hoàn tất</span>
                <span className="text-sm font-black text-success">{scanScore}/100</span>
              </div>
              <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                Độ hiểu bài đạt {scanScore}%. AI nhận dạng cấu trúc thẻ đầy đủ, style khoảng cách đẹp mắt, các sự kiện click hoạt động đúng yêu cầu.
              </p>
            </div>
          )}

          <button
            onClick={verifyInteractivePractice}
            disabled={!screenshotFile || isScanning}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none mt-2"
          >
            {screenshotFile && !isScanning ? "Nộp bài quét AI" : "Vui lòng chọn ảnh chụp màn hình"}
          </button>
        </div>
      );
    }

    if (course.practiceType === "quiz") {
      if (quizQuestions.length === 0) {
        return <div className="text-xs text-muted-foreground text-center py-5">Đang nạp bộ câu hỏi trắc nghiệm...</div>;
      }

      if (quizCompleted) {
        const passed = quizScore >= 60;
        return (
          <div className="space-y-4 text-center">
            <span className={`material-symbols-outlined text-5xl ${passed ? "text-success animate-bounce" : "text-destructive"}`}>
              {passed ? "emoji_events" : "gpp_bad"}
            </span>
            <div>
              <h4 className="text-sm font-black uppercase">Kết quả kiểm tra: {quizScore}%</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {passed 
                  ? "Tuyệt vời! Bạn đã vượt qua bài kiểm tra thành công." 
                  : "Rất tiếc, điểm số chưa đạt yêu cầu tối thiểu (60%)."}
              </p>
            </div>
            
            {passed ? (
              <button
                onClick={verifyInteractivePractice}
                className="w-full py-2.5 bg-success text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
              >
                Nhận thưởng JOY & Hoàn thành
              </button>
            ) : (
              <button
                onClick={handleRetakeQuiz}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
              >
                Đổi đề thi khác & Làm lại
              </button>
            )}
          </div>
        );
      }

      const currentQ = quizQuestions[quizCurrentIndex];
      const isLast = quizCurrentIndex === quizQuestions.length - 1;

      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-black uppercase">
            <span>Câu hỏi {quizCurrentIndex + 1} / {quizQuestions.length}</span>
            <span>Đã chọn: {Object.keys(quizAnswers).length} câu</span>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-border rounded-xl">
            <p className="text-xs font-bold text-foreground leading-relaxed">{currentQ.q}</p>
          </div>

          <div className="space-y-2">
            {currentQ.o.map((opt, oIdx) => {
              const isSelected = quizAnswers[quizCurrentIndex] === oIdx;
              return (
                <button
                  key={opt}
                  onClick={() => setQuizAnswers(prev => ({ ...prev, [quizCurrentIndex]: oIdx }))}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all active:scale-[0.98] ${
                    isSelected
                      ? "bg-primary border-primary text-white shadow-sm"
                      : "bg-background border-border text-foreground hover:bg-muted/50"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              onClick={() => setQuizCurrentIndex(prev => Math.max(prev - 1, 0))}
              disabled={quizCurrentIndex === 0}
              className="flex-1 py-2 bg-background hover:bg-muted border border-border text-muted-foreground rounded-xl text-xs font-black uppercase active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              Câu trước
            </button>
            
            {isLast ? (
              <button
                onClick={verifyInteractivePractice}
                disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none"
              >
                Nộp bài thi
              </button>
            ) : (
              <button
                onClick={() => setQuizCurrentIndex(prev => Math.min(prev + 1, quizQuestions.length - 1))}
                className="flex-1 py-2 bg-background hover:bg-muted border border-border text-foreground rounded-xl text-xs font-black uppercase active:scale-95 transition-all"
              >
                Câu tiếp
              </button>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const currentMobileCourseIndex = WEB_COURSES.findIndex(c => c.id === mobileCourse?.id);
  
  const handlePrevMobileLesson = () => {
    if (currentMobileCourseIndex > 0) {
      setActiveCourseId(WEB_COURSES[currentMobileCourseIndex - 1].id);
      setMobileStudyMode("story");
      setVerificationStatus(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextMobileLesson = () => {
    if (currentMobileCourseIndex < WEB_COURSES.length - 1) {
      const nextCourse = WEB_COURSES[currentMobileCourseIndex + 1];
      const isCurrentCompleted = completedLessons.includes(mobileCourse?.id);
      
      if (!isCurrentCompleted) {
        toast.error("Vui lòng hoàn thành bài học hiện tại để mở khóa bài tiếp theo!");
        return;
      }
      
      setActiveCourseId(nextCourse.id);
      setMobileStudyMode("story");
      setVerificationStatus(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Mobile PWA reads like a guidebook, while desktop keeps the full IDE.
  if (!isDesktop) {
    return (
      <FeatureGate
        bio={bio}
        featureKey="hugoCoder"
        priceJoy={150}
        icon="terminal"
        title="Trao đổi JOY để mở khóa HugoCoder"
        description="Đọc sách hướng dẫn, xem demo chạy code và học lập trình ngay trên điện thoại."
        onBioUpdate={onBioUpdate}
        onBack={onBack}
        className="max-w-lg mx-auto mt-10"
      >
        <div className="fixed inset-0 z-50 bg-[#f8fafc] dark:bg-[#09090b] text-foreground overflow-y-auto">
          <style>{`
            @keyframes hugoCodeFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
            @keyframes hugoCodeGlow {
              0%, 100% { box-shadow: 0 0 0 rgba(79, 70, 229, 0); }
              50% { box-shadow: 0 16px 35px rgba(79, 70, 229, 0.16); }
            }
            @keyframes hugoCodeSlide {
              0% { transform: translateX(-85%); opacity: .35; }
              50% { opacity: 1; }
              100% { transform: translateX(115%); opacity: .35; }
            }
            @keyframes hugoCodePulse {
              0%, 100% { transform: scaleX(.92); opacity: .55; }
              50% { transform: scaleX(1); opacity: 1; }
            }
          `}</style>
          <header className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onBack}
                className="w-9 h-9 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground active:scale-95 transition-all"
                aria-label="Quay lại"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase text-primary">HugoCoder Mobile</p>
                <h2 className="text-sm font-black truncate">Sách hướng dẫn lập trình</h2>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${mobileProgress}%` }} />
            </div>
          </header>

          <main className="px-4 py-5 pb-24 space-y-5">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-muted-foreground">Mục lục bài học</h3>
                <span className="text-[10px] font-bold text-primary">{mobileCompletedCount}/{WEB_COURSES.length} hoàn thành</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {WEB_COURSES.map((course, index) => {
                  const isActive = mobileCourse?.id === course.id;
                  const isCompleted = completedLessons.includes(course.id);
                  const isLocked = index > 0 && !completedLessons.includes(WEB_COURSES[index - 1].id);
                  return (
                    <button
                      key={course.id}
                      onClick={() => {
                        if (isLocked) {
                          toast.error("Vui lòng hoàn thành bài học trước để mở khóa bài này!");
                          return;
                        }
                        setActiveCourseId(course.id);
                        setMobileStudyMode("story");
                        setVerificationStatus(null);
                      }}
                      className={`shrink-0 w-[78vw] max-w-[320px] text-left p-4 rounded-lg border transition-all active:scale-[0.98] ${
                        isLocked
                          ? "bg-zinc-100 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-650 opacity-60 cursor-not-allowed"
                          : isActive
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                            : "bg-white dark:bg-zinc-900 border-border text-foreground"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`text-[10px] font-black uppercase ${isActive ? "text-white/70" : "text-muted-foreground"}`}>Bài {index + 1}</span>
                        {isCompleted ? (
                          <CheckCircle className={`w-4 h-4 ${isActive ? "text-white" : "text-success"}`} />
                        ) : isLocked ? (
                          <span className={`material-symbols-outlined text-xs ${isActive ? "text-white/70" : "text-muted-foreground"}`}>lock</span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-black leading-snug">{course.title.replace(/^\d+\.\s*/, "")}</p>
                      <p className={`mt-2 text-[11px] font-semibold ${isActive ? "text-white/75" : "text-muted-foreground"}`}>{course.file}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black leading-tight">{mobileCourse.title}</h3>
              </div>
              <article className="px-4 py-4 text-muted-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-base font-black text-foreground mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="text-sm leading-7 mb-3" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-black text-foreground" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-zinc-950 text-zinc-100 border border-zinc-800 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-4" {...props} />,
                    code: ({node, inline, ...props}) => inline
                      ? <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-primary font-mono" {...props} />
                      : <code className="font-mono text-xs" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-sm leading-7" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-sm leading-7" {...props} />,
                    li: ({node, ...props}) => <li {...props} />
                  }}
                >
                  {mobileCourse.theory}
                </ReactMarkdown>
              </article>
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-primary">Đa dạng cách học</span>
                  <h3 className="text-sm font-black">{mobileVisualSet.title}</h3>
                </div>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {mobileVisualSet.modes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setMobileStudyMode(mode.id)}
                    className={`h-9 rounded-lg border text-[11px] font-black transition-all active:scale-95 ${
                      mobileStudyMode === mode.id
                        ? "bg-primary text-white border-primary"
                        : "bg-background text-muted-foreground border-border"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              {renderStudyModePanel(mobileVisualSet, mobileStudyMode)}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-muted-foreground">Hình minh họa sống động</h3>
                <span className="text-[10px] font-bold text-primary">{mobileVisualSet.panels.length} tranh</span>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {mobileVisualSet.panels.map((panel, index) => renderVisualArtwork(panel, index))}
              </div>
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black">Mô hình tư duy</h3>
              </div>
              {renderMobileIllustration(mobileExtra.visualType)}
              <p className="text-sm leading-7 text-muted-foreground">{mobileExtra.mentalModel}</p>
              <div className="grid grid-cols-1 gap-2">
                {(mobileExtra.keyIdeas || []).map((idea, index) => (
                  <div key={idea} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                    <span className="mt-0.5 w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center text-[10px] font-black">{index + 1}</span>
                    <p className="text-sm leading-6 text-muted-foreground">{idea}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-black">Đào sâu kiến thức</h3>
              {(mobileExtra.deepDive || []).map((item) => (
                <div key={item.title} className="rounded-lg border border-border bg-background p-3">
                  <h4 className="text-xs font-black text-foreground">{item.title}</h4>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black">Checklist hiểu bài</h3>
              </div>
              <ul className="space-y-3">
                {mobileCourse.tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                    <span className="mt-0.5 w-5 h-5 rounded-md border border-primary/30 bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2.5">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <h3 className="text-sm font-black">Thực hành tương tác</h3>
              </div>
              {timeLeft > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined text-[14px] animate-spin">history</span>
                  <span>Bạn cần tìm hiểu thêm: {Math.floor(timeLeft / 60)} phút {timeLeft % 60} giây để có thể kiểm tra.</span>
                </div>
              )}
              {verificationStatus === "success" ? (
                <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-center space-y-2">
                  <span className="material-symbols-outlined text-4xl text-success animate-bounce">verified</span>
                  <p className="text-sm font-black text-success uppercase tracking-wider">Hoàn thành xuất sắc!</p>
                  <p className="text-xs text-muted-foreground font-sans">Bạn đã vượt qua các thử thách của bài học này và nhận phần thưởng JOY.</p>
                </div>
              ) : (
                renderInteractivePractice(mobileCourse)
              )}
            </section>

            <section className="grid grid-cols-1 gap-3">
              <div className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-black">Lỗi hay gặp</h3>
                <ul className="space-y-2">
                  {(mobileExtra.commonMistakes || []).map((mistake) => (
                    <li key={mistake} className="text-sm leading-6 text-muted-foreground border-l-2 border-warning pl-3">{mistake}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-black">Tự hỏi nhanh</h3>
                <ul className="space-y-2">
                  {(mobileExtra.quiz || []).map((question) => (
                    <li key={question} className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm leading-6 text-primary font-semibold">{question}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden text-zinc-100">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-emerald-400">Chạy thử để xem</p>
                  <h3 className="text-sm font-black truncate">{mobileCourse.file}</h3>
                </div>
                <button
                  onClick={() => setMobileRunKey(Date.now())}
                  className="shrink-0 h-9 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  Chạy
                </button>
              </div>
              <pre className="max-h-56 overflow-auto p-4 text-[11px] leading-5 font-mono text-zinc-300 whitespace-pre-wrap">
                {mobileDemoCode}
              </pre>
              {canPreviewMobileCourse ? (
                <div className="bg-white border-t border-zinc-800">
                  <iframe
                    key={`${mobileCourse.id}-${mobileRunKey}`}
                    title="Mobile code demo"
                    srcDoc={mobileDemoCode}
                    className="w-full h-72 border-0 bg-white"
                    sandbox="allow-scripts allow-modals"
                  />
                </div>
              ) : (
                <div className="border-t border-zinc-800 p-4 text-xs leading-6 text-zinc-400">
                  Bài này là dạng truy vấn hoặc backend nên điện thoại sẽ hiển thị code mẫu và hướng dẫn chạy. Khi mở trên desktop, HugoCoder sẽ chuyển về IDE đầy đủ.
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-black">Thư viện lý thuyết</h3>
              <div className="grid grid-cols-1 gap-3">
                {THEORY_LIBRARY.map((item) => (
                  <details key={item.title} className="group border border-border rounded-lg p-3 bg-background">
                    <summary className="cursor-pointer list-none flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-primary">{item.level}</span>
                        <h4 className="text-sm font-black text-foreground">{item.title}</h4>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform mt-1" />
                    </summary>
                    <p className="text-sm leading-6 text-muted-foreground mt-3">{item.summary}</p>
                    <ul className="mt-3 space-y-1.5">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="text-xs leading-5 text-muted-foreground flex items-start gap-2">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-black">Nguồn kiến thức nhanh</h3>
              <div className="space-y-3">
                {TUTORIALS.map((tutorial) => (
                  <details key={tutorial.lang} className="group border border-border rounded-lg p-3 bg-background">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                      <span className="font-black text-sm">{tutorial.lang}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                    </summary>
                    <p className="text-sm leading-6 text-muted-foreground mt-3">{tutorial.intro}</p>
                    <div className="mt-3 space-y-3">
                      {tutorial.sections.map((section) => (
                        <div key={section.title} className="border-t border-border pt-3">
                          <h4 className="text-xs font-black text-foreground">{section.title}</h4>
                          <p className="text-xs leading-6 text-muted-foreground mt-1 whitespace-pre-line">{section.content}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Mobile Navigation Buttons */}
            <section className="flex items-center gap-3 pt-4 border-t border-border pb-6">
              <button
                onClick={handlePrevMobileLesson}
                disabled={currentMobileCourseIndex === 0}
                className="flex-1 py-3 bg-background hover:bg-muted border border-border text-foreground rounded-xl text-xs font-black uppercase active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Bài trước
              </button>
              
              <button
                onClick={handleNextMobileLesson}
                disabled={currentMobileCourseIndex === WEB_COURSES.length - 1}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                Tiếp theo
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </section>
          </main>
        </div>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate
      bio={bio}
      featureKey="hugoCoder"
      priceJoy={150}
      icon="terminal"
      title="Trao đổi JOY để mở khóa HugoCoder"
      description="Soạn code, học bài tương tác và nhận JOY khi hoàn thành bài học."
      onBioUpdate={onBioUpdate}
      onBack={onBack}
      className="max-w-lg mx-auto mt-10"
    >
    <div className="flex flex-col bg-background h-screen w-screen text-foreground relative overflow-hidden">
      {/* Top IDE Header Control Bar */}
      <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 font-bold uppercase hover:text-white transition-colors border-r border-border pr-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span>STUDENT WORKSPACE</span>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {activeFile && (
            <button 
              onClick={handleSaveFile}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-bold px-3 py-1.5 rounded transition-all shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {activeFile.handle ? "Lưu Trực Tiếp (Disk)" : "Tải Về Máy (Local)"}
            </button>
          )}

          <button 
            onClick={handleOpenFolder}
            className="flex items-center gap-1.5 bg-muted hover:bg-muted-foreground text-foreground font-bold px-3 py-1.5 rounded transition-all border border-border"
            title="Đồng bộ trực tiếp với thư mục trên máy tính của bạn thông qua File System API"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Mở Thư Mục Cục Bộ
          </button>
        </div>
      </div>

      {/* Main IDE Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side Icon Navigation Menu */}
        <div className="w-14 bg-card border-r border-border flex flex-col items-center py-4 justify-between">
          <div className="flex flex-col items-center gap-5 w-full">
            <button 
              onClick={() => setActiveSidebarTab("explorer")}
              className={`p-2.5 rounded-lg transition-all ${activeSidebarTab === "explorer" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              title="Quản lý File"
            >
              <Folder className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveSidebarTab("learn")}
              className={`p-2.5 rounded-lg transition-all ${activeSidebarTab === "learn" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              title="Khóa học & Code mẫu"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveSidebarTab("db")}
              className={`p-2.5 rounded-lg transition-all ${activeSidebarTab === "db" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              title="PHP & phpMyAdmin localhost"
            >
              <Database className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-4 text-[9px] text-muted-foreground font-mono">
            <span>v1.1</span>
          </div>
        </div>

        {/* Sidebar Tab Panels */}
        <div className="w-64 bg-card border-r border-border flex flex-col text-xs">
          
          {/* TAB 1: File Explorer */}
          {activeSidebarTab === "explorer" && (
            <div className="p-4 flex-1 flex flex-col overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Thư mục dự án</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => {
                      const parent = getActiveFolder();
                      if (parent) setExpandedFolders(prev => ({ ...prev, [parent]: true }));
                      setInlineAction({ type: "new_file", parentPath: parent, value: "" });
                    }}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
                    title="New File..."
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      const parent = getActiveFolder();
                      if (parent) setExpandedFolders(prev => ({ ...prev, [parent]: true }));
                      setInlineAction({ type: "new_folder", parentPath: parent, value: "" });
                    }}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white transition-colors"
                    title="New Folder..."
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recursive File Tree */}
              <div className="space-y-0.5 font-mono text-[11px] select-none">
                {renderTree(workspaceTree)}
              </div>

              {dirHandle && (
                <div className="bg-success/5 border border-success/25 p-3 rounded-lg text-success text-[10px] space-y-1">
                  <p className="font-bold flex items-center gap-1"><FolderOpen className="w-4 h-4" /> Thư mục: {dirHandle.name}</p>
                  <p className="text-muted-foreground leading-normal">Đồng bộ trực tiếp. Mọi chỉnh sửa được tự động lưu trực tiếp xuống file vật lý khi bạn dừng gõ 1 giây.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Tutorials & Learning */}
          {activeSidebarTab === "learn" && (
            <div className="p-4 flex-1 flex flex-col overflow-y-auto space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Bài học tương tác
                </span>
                {activeCourseId && (
                  <button
                    onClick={() => {
                      setActiveCourseId(null);
                      setVerificationStatus(null);
                    }}
                    className="text-[10px] text-primary hover:text-primary/80 font-bold transition-all"
                  >
                    Quay lại
                  </button>
                )}
              </div>

              {activeCourseId ? (() => {
                const course = WEB_COURSES.find(c => c.id === activeCourseId);
                const isCompleted = completedLessons.includes(course.id);
                return (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-foreground leading-tight">{course.title}</h4>
                    </div>

                    <div className="bg-muted/30 border border-border rounded-xl p-3 text-muted-foreground font-sans overflow-hidden">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-foreground block mb-2 border-b border-border pb-1">Lý thuyết & Hướng dẫn:</span>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold text-foreground mt-3 mb-1" {...props} />,
                          p: ({node, ...props}) => <p className="text-[10.5px] leading-relaxed mb-2" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
                          pre: ({node, ...props}) => <pre className="block bg-card border border-border p-2.5 rounded-lg text-[10px] text-primary font-mono overflow-x-auto mb-3 w-full" {...props} />,
                          code: ({node, inline, ...props}) => inline 
                            ? <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-primary font-mono" {...props} />
                            : <code className="font-mono text-[10px]" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1 text-[10.5px]" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-[10.5px]" {...props} />,
                          li: ({node, ...props}) => <li {...props} />
                        }}
                      >
                        {course.theory}
                      </ReactMarkdown>
                    </div>

                    <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2.5">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">Thực hành (Steps):</span>
                      <ul className="space-y-2">
                        {course.tasks.map((task, i) => (
                          <li key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground font-medium leading-relaxed">
                            <span className="material-symbols-outlined text-[13px] text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 0" }}>check_box_outline_blank</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        onClick={() => {
                          const exists = workspaceFiles.some(f => f.path === course.file);
                          if (!exists) {
                            const newFile = {
                              path: course.file,
                              name: course.file.split("/").pop(),
                              content: course.starterCode,
                              language: getLanguageFromExt(course.file.split(".").pop().toLowerCase())
                            };
                            setWorkspaceFiles(prev => [...prev, newFile]);
                          } else {
                            setWorkspaceFiles(prev => prev.map(f => f.path === course.file ? { ...f, content: course.starterCode } : f));
                          }
                          if (!openTabs.includes(course.file)) {
                            setOpenTabs(prev => [...prev, course.file]);
                          }
                          setActiveTabPath(course.file);
                          toast.success(`Đã nạp file bài học: ${course.file}`);
                        }}
                        className="w-full py-2 bg-muted hover:bg-accent text-foreground rounded-xl border border-border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Nạp lại Starter Code
                      </button>

                      <button
                        onClick={() => handleVerifyLesson(course)}
                        className={`w-full py-2.5 text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 ${
                          isCompleted
                            ? "bg-success hover:bg-success/90 text-white"
                            : "bg-primary hover:bg-primary/90 text-white"
                        }`}
                      >
                        {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                        {isCompleted ? "Bài học đã hoàn thành" : "Kiểm tra bài học"}
                      </button>
                    </div>

                    {verificationStatus === "success" && (
                      <div className="bg-success/10 border border-success/20 p-3 rounded-xl text-[10.5px] text-success leading-relaxed font-sans">
                        🎉 <strong>Tuyệt vời!</strong> Bạn đã hoàn thành xuất sắc các yêu cầu của bài học. Hãy chuyển qua bài học tiếp theo nhé!
                      </div>
                    )}
                    {verificationStatus === "failed" && (
                      <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-[10.5px] text-destructive leading-relaxed font-sans">
                        ❌ <strong>Chưa chính xác!</strong> Mã nguồn trong editor chưa đáp ứng đủ yêu cầu bài học. Hãy đọc lại hướng dẫn và thử lại.
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="space-y-3.5">
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-sans">
                    Hoàn thành các bài học thực chiến để nắm vững nền tảng Web Development và nhận thưởng **+100 JOY** (bài cuối **+450 JOY**):
                  </p>
                  <div className="space-y-3">
                    {WEB_COURSES.map((course, index) => {
                      const isCompleted = completedLessons.includes(course.id);
                      const isLocked = index > 0 && !completedLessons.includes(WEB_COURSES[index - 1].id);
                      return (
                        <div
                          key={course.id}
                          className={`border rounded-xl p-3 space-y-2 transition-all cursor-pointer group ${
                            isLocked
                              ? "bg-zinc-100/50 dark:bg-zinc-900/20 border-zinc-200/50 dark:border-zinc-800/30 opacity-50 cursor-not-allowed"
                              : "bg-muted/30 border-border hover:border-primary/40"
                          }`}
                          onClick={() => {
                            if (isLocked) {
                              toast.error("Vui lòng hoàn thành bài học trước để mở khóa bài này!");
                              return;
                            }
                            setActiveCourseId(course.id);
                            setVerificationStatus(null);
                            const exists = workspaceFiles.some(f => f.path === course.file);
                            if (!exists) {
                              const newFile = {
                                path: course.file,
                                name: course.file.split("/").pop(),
                                content: course.starterCode,
                                language: getLanguageFromExt(course.file.split(".").pop().toLowerCase())
                              };
                              setWorkspaceFiles(prev => [...prev, newFile]);
                            }
                            if (!openTabs.includes(course.file)) {
                              setOpenTabs(prev => [...prev, course.file]);
                            }
                            setActiveTabPath(course.file);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-xs font-sans">{course.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                              isLocked
                                ? "bg-zinc-150 text-zinc-400 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-650 dark:border-zinc-800"
                                : isCompleted
                                  ? "bg-success/10 text-success border-success/20"
                                  : course.id === "lesson10"
                                    ? "bg-primary/10 text-primary border-primary/20 animate-pulse"
                                    : "bg-primary/10 text-primary border-primary/20"
                            }`}>
                              {isLocked ? "Đã khóa" : isCompleted ? "Hoàn thành" : course.id === "lesson10" ? "+450 JOY" : "+100 JOY"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-muted-foreground group-hover:text-primary uppercase tracking-widest pt-1">
                            <span>{isLocked ? "Chưa mở khóa" : "Vào bài học"}</span>
                            <span className="material-symbols-outlined text-[9px] transform group-hover:translate-x-0.5 transition-transform">arrow_forward_ios</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: phpMyAdmin Local Database Setup */}
          {activeSidebarTab === "db" && (
            <div className="p-4 flex-1 flex flex-col overflow-y-auto space-y-4 font-sans">
              <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">PHP & phpMyAdmin Local</span>
              <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                Để chạy PHP và quản lý cơ sở dữ liệu qua phpMyAdmin 100% trên máy tính cá nhân (localhost), 
                sử dụng Docker Compose là phương án tối ưu, siêu nhẹ và bảo mật nhất.
              </p>

              <div className="space-y-3">
                <div className="bg-muted/30 border border-border p-2.5 rounded-lg space-y-1">
                  <p className="font-bold text-[10px] text-foreground">Bước 1: Cài đặt Docker Desktop</p>
                  <p className="text-[9.5px] text-muted-foreground">Tải Docker Desktop từ trang chủ docker.com và cài lên máy tính.</p>
                </div>

                <div className="bg-muted/30 border border-border p-2.5 rounded-lg space-y-2">
                  <p className="font-bold text-[10px] text-foreground">Bước 2: Tạo file docker-compose.yml</p>
                  <p className="text-[9.5px] text-muted-foreground">Tạo file docker-compose.yml cùng thư mục với dự án PHP trên máy của bạn với nội dung sau:</p>
                  <pre className="text-[8.5px] font-mono bg-background p-2 rounded text-muted-foreground overflow-x-auto select-all max-h-32">
{`version: '3.8'
services:
  web:
    image: php:8.2-apache
    ports:
      - "8000:80"
    volumes:
      - ./src:/var/www/html
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3306:3306"
  phpmyadmin:
    image: phpmyadmin:latest
    ports:
      - "8080:80"
    environment:
      PMA_HOST: db`}
                  </pre>
                </div>

                <div className="bg-muted/30 border border-border p-2.5 rounded-lg space-y-1">
                  <p className="font-bold text-[10px] text-foreground">Bước 3: Khởi động hệ thống</p>
                  <p className="text-[9.5px] text-muted-foreground">Chạy terminal tại thư mục chứa file và gõ lệnh:</p>
                  <code className="block bg-background p-1.5 text-[9px] font-mono text-primary rounded">docker-compose up -d</code>
                </div>

                <div className="bg-muted/30 border border-border p-2.5 rounded-lg space-y-1">
                  <p className="font-bold text-[10px] text-foreground">Bước 4: Truy cập phpMyAdmin</p>
                  <p className="text-[9.5px] text-muted-foreground">
                    Mở trình duyệt truy cập:
                    <a href="http://localhost:8080" target="_blank" rel="noreferrer" className="block text-primary font-bold mt-1">http://localhost:8080</a>
                    Tài khoản: root / Mật khẩu: root. Toàn bộ cơ sở dữ liệu được host cục bộ nên cực kỳ an toàn.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Editor Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">

          <div className="flex items-center bg-card border-b border-border px-2 overflow-x-auto gap-0.5 select-none scrollbar-hide">
            {openTabs.map((path) => {
              if (!path || typeof path !== "string") return null;
              const fileObj = workspaceFiles.find(f => f && f.path === path);
              const name = fileObj ? fileObj.name : path.split("/").pop();
              const isActive = path === activeTabPath;

              return (
                <div 
                  key={path}
                  onClick={() => setActiveTabPath(path)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold border-t-2 cursor-pointer transition-all ${
                    isActive 
                      ? "bg-background border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{name}</span>
                  <button
                    onClick={(e) => handleCloseTab(path, e)}
                    className="hover:text-destructive p-0.5 rounded transition-all ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Monaco Editor or Live Preview */}
          <div className="flex-1 relative flex flex-col min-h-0">
            {previewMode && activeFile?.language === "html" ? (
              <div className="flex-1 flex flex-col bg-white h-full">
                <div className="bg-muted border-b border-border px-4 py-1.5 flex items-center justify-between text-xs text-foreground">
                  <span className="font-bold flex items-center gap-1"><Globe className="w-4 h-4" /> Web Frame Live Preview</span>
                  <button 
                    onClick={() => setPreviewMode(false)}
                    className="flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" /> Trở lại Editor
                  </button>
                </div>
                <iframe 
                  src={previewUrl}
                  title="Web Live Preview"
                  className="w-full flex-1 border-0 bg-white"
                  sandbox="allow-scripts allow-modals"
                />
              </div>
            ) : (
              <div className="w-full h-full">
                {activeFile ? (
                  <Editor
                    height="100%"
                    language={activeFile.language}
                    theme={isDarkTheme ? "vs-dark" : "light"}
                    value={activeFile.content}
                    onChange={(val) => {
                      setWorkspaceFiles(prev => prev.map(f => {
                        if (f.path === activeTabPath) {
                          return { ...f, content: val || "" };
                        }
                        return f;
                      }));
                    }}
                    options={{
                      fontSize: 13,
                      fontFamily: "Fira Code, Source Code Pro, Consolas, monospace",
                      minimap: { enabled: false },
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      tabSize: 4,
                      suggestOnTriggerCharacters: true
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 font-sans">
                    <AlertTriangle className="w-8 h-8 text-primary/45" />
                    <p className="text-xs">Không có file nào đang mở. Hãy mở một file từ File Explorer hoặc nạp bài học.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Execution Panel / Output Panel */}
          <div className="bg-card border-t border-border px-5 py-4 min-h-[140px] max-h-[160px] flex flex-col font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-border text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5" /> Bảng Hướng dẫn Chạy & Thực thi
                <span className="mx-2 text-foreground">|</span>
                <span className={`font-mono text-[9px] ${saveStatus.includes("Lỗi") ? "text-destructive" : (saveStatus.includes("Đang") ? "text-warning" : "text-success")}`}>
                  ● {saveStatus}
                </span>
              </span>
              {activeFile?.language === "html" && (
                <button 
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] transition-all font-bold font-sans"
                >
                  <Play className="w-3 h-3" /> {previewMode ? "Dừng Xem" : "Xem Live Preview"}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pt-3 font-mono text-[11px] leading-relaxed text-muted-foreground space-y-1">
              {activeFile?.language === "html" && (
                <p className="text-muted-foreground">File dạng Web (HTML/CSS/JS). Bạn bấm vào nút **Xem Live Preview** phía trên bên phải để trực quan hóa giao diện ngay lập trình duyệt!</p>
              )}
              {activeFile?.language === "python" && (
                <>
                  <p className="text-muted-foreground">Đối với Python, bạn mở Terminal trên máy tính (local) của bạn tại thư mục chứa file đã tải về và gõ lệnh chạy:</p>
                  <code className="block bg-background p-2 text-success rounded mt-1 border border-border">python3 {activeFile.name}</code>
                </>
              )}
              {activeFile?.language === "c" && (
                <>
                  <p className="text-muted-foreground">Đối với ngôn ngữ C, hãy cài đặt compiler GCC. Biên dịch và thực thi bằng lệnh Terminal:</p>
                  <code className="block bg-background p-2 text-success rounded mt-1 border border-border">gcc {activeFile.name} -o output && ./output</code>
                </>
              )}
              {activeFile?.language === "cpp" && (
                <>
                  <p className="text-muted-foreground">Đối với C++, biên dịch bằng trình biên dịch g++:</p>
                  <code className="block bg-background p-2 text-success rounded mt-1 border border-border">g++ {activeFile.name} -o output && ./output</code>
                </>
              )}
              {activeFile?.language === "csharp" && (
                <>
                  <p className="text-muted-foreground">Đối với C#, hãy cài đặt .NET SDK trên máy. Tạo project Console mới và chạy:</p>
                  <code className="block bg-background p-2 text-success rounded mt-1 border border-border">dotnet run</code>
                </>
              )}
              {activeFile?.language === "php" && (
                <>
                  <p className="text-muted-foreground">Đối với PHP, bạn có thể chạy server PHP tích hợp cục bộ để test nhanh mà không cần Apache:</p>
                  <code className="block bg-background p-2 text-success rounded mt-1 border border-border">php -S localhost:8000</code>
                  <p className="text-[10px] text-muted-foreground mt-1">Truy cập http://localhost:8000 trên máy tính của bạn để xem kết quả.</p>
                </>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
    </FeatureGate>
  );
}
