import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { 
  FolderOpen, Folder, BookOpen, Database, Play, Plus, X, 
  Terminal, AlertTriangle, Monitor, ArrowLeft, Save, Eye,
  Edit2, Trash2, ChevronDown, ChevronRight, FileCode, FileText, FileJson,
  Sparkles, CheckCircle, Award, RefreshCw
} from "lucide-react";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import { getMemberSession } from "../../services/authSession";
import { useJoyStore } from "../../stores/joyStore";
import { TEMPLATES, INITIAL_WORKSPACE, TUTORIALS } from "./ideData";
import FeatureGate from "./shared/FeatureGate";

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
      return <FileText className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />;
  }
};

export default function MemberIdeTab({ onBack, bio, onBioUpdate }) {
  const [isDesktop, setIsDesktop] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState("explorer"); // explorer, learn, db

  const [activeCourseId, setActiveCourseId] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("student_ide_progress") || "[]");
    } catch (_) {
      return [];
    }
  });
  const [verificationStatus, setVerificationStatus] = useState(null); // null, 'success', 'failed'

  const COURSES = [
    {
      id: "python_oop",
      title: "Python OOP Basics",
      description: "Học cách tạo lớp và kế thừa trong Python. Hãy kế thừa lớp Dog để tạo một chú chó GoldenRetriever có tiếng sủa đặc trưng.",
      file: "src/oop/Animal.py",
      lang: "python",
      tasks: [
        "Tạo lớp GoldenRetriever kế thừa từ Dog.",
        "Định nghĩa phương thức bark(self) trả về chuỗi 'Gâu Gâu Vàng!'."
      ],
      starterCode: `class Animal:
    def __init__(self, name):
        self.name = name
    def eat(self):
        print(f"{self.name} đang ăn...")

class Dog(Animal):
    def bark(self):
        return "Gâu Gâu!"

# TODO: Viết class GoldenRetriever kế thừa từ Dog ở đây
# và override phương thức bark() để trả về "Gâu Gâu Vàng!"
`,
      verify: (code) => {
        const classRegex = /class\s+GoldenRetriever\s*\(\s*Dog\s*\)\s*:/;
        const methodRegex = /def\s+bark\s*\(\s*self\s*\)\s*:/;
        const returnRegex = /return\s+["']Gâu Gâu Vàng!["']/;
        return classRegex.test(code) && methodRegex.test(code) && returnRegex.test(code);
      }
    },
    {
      id: "js_functions",
      title: "JavaScript Functions",
      description: "Viết hàm tính toán phần thưởng JOY dựa trên hệ số nhân. Hãy hoàn thành hàm calculateJoyReward(multiplier) để trả về 10 * multiplier.",
      file: "src/web/app.js",
      lang: "javascript",
      tasks: [
        "Khai báo hàm calculateJoyReward(multiplier) dùng từ khóa function hoặc hằng số arrow function.",
        "Hàm phải trả về giá trị biểu thức multiplier nhân với 10 (hoặc 10 * multiplier)."
      ],
      starterCode: `// Viết mã nguồn Javascript ở đây
// TODO: Định nghĩa hàm calculateJoyReward(multiplier) trả về 10 * multiplier
`,
      verify: (code) => {
        const funcRegex = /(function\s+calculateJoyReward\s*\(\s*multiplier\s*\)|const\s+calculateJoyReward\s*=\s*(function\s*\(\s*multiplier\s*\)|\(\s*multiplier\s*\)\s*=>))/;
        const returnRegex = /return\s+.*multiplier.*10|return\s+10\s*\*\s*multiplier/;
        return funcRegex.test(code) && returnRegex.test(code);
      }
    },
    {
      id: "cpp_polymorphism",
      title: "C++ Polymorphism",
      description: "Tìm hiểu tính đa hình bằng cách tạo class con Square kế thừa từ Shape và ghi đè phương thức draw để in dòng chữ 'Vẽ hình Vuông (Square)' ra màn hình.",
      file: "src/oop/Shape.cpp",
      lang: "cpp",
      tasks: [
        "Khai báo class Square kế thừa kế thừa public từ Shape.",
        "Ghi đè phương thức draw() với từ khóa override.",
        "Trong hàm draw(), in 'Vẽ hình Vuông (Square)' ra std::cout."
      ],
      starterCode: `#include <iostream>
#include <vector>
using namespace std;

class Shape {
public:
    virtual void draw() = 0;
    virtual ~Shape() {}
};

// TODO: Tạo class Square kế thừa từ Shape và override hàm draw() để in "Vẽ hình Vuông (Square)" ra std::cout
`,
      verify: (code) => {
        const classRegex = /class\s+Square\s*:\s*public\s+Shape/;
        const methodRegex = /void\s+draw\s*\(\s*\)\s*override/;
        const coutRegex = /cout\s*<<\s*["']Vẽ hình Vuông \(Square\)["']/;
        return classRegex.test(code) && methodRegex.test(code) && coutRegex.test(code);
      }
    }
  ];

  const handleVerifyLesson = async (course) => {
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
            if (r.ok) {
              const resData = await r.json();
              if (resData.success && !resData.alreadyCompleted) {
                toast.success("Tuyệt vời! Bạn được thưởng +30 JOY!", { icon: "🎉" });
                useJoyStore.getState().fetchBalance(session.email);
              } else {
                toast.success("Chính xác! Bài học đã được xác minh hoàn thành.");
              }
            }
          } catch (e) {
            console.error("Error awarding joy for learning:", e);
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
      toast.error("Mã nguồn chưa chính xác, hãy kiểm tra lại yêu cầu đề bài!", { icon: "❌" });
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

  // Inline inputs state (New File, New Folder, Rename)
  // { type: 'new_file' | 'new_folder' | 'rename', parentPath?: string, targetPath?: string, oldName?: string, value: string }
  const [inlineAction, setInlineAction] = useState(null);
  const inputRef = useRef(null);

  const activeFile = workspaceFiles.find(f => f.path === activeTabPath) || null;

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
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-destructive text-lg mt-0.5 animate-pulse">warning</span>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">Xác Nhận Xóa</h4>
            <p className="text-[10.5px] font-semibold text-slate-500 dark:text-zinc-450 mt-0.5 leading-relaxed whitespace-normal">
              Bạn có chắc chắn muốn xóa {type === "folder" ? "thư mục" : "file"} <span className="font-mono font-bold text-destructive">"{targetPath.split('/').pop()}"</span> không? Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-800/80 pt-2.5">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            Bỏ qua
          </button>
          <button 
            onClick={async () => {
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
                  toast.success(`Đã xóa file ảo: ${targetPath}`, {
                    style: {
                      background: 'hsl(var(--card))',
                      color: 'hsl(var(--card-foreground))',
                      borderRadius: '12px',
                      border: '1px solid hsl(var(--border))',
                    }
                  });
                } else {
                  setFolders(prev => prev.filter(d => d !== targetPath && !d.startsWith(`${targetPath}/`)));
                  setWorkspaceFiles(prev => prev.filter(f => !f.path.startsWith(`${targetPath}/`)));
                  setOpenTabs(prev => prev.filter(t => !t.startsWith(`${targetPath}/`)));
                  if (activeTabPath && activeTabPath.startsWith(`${targetPath}/`)) {
                    setActiveTabPath(null);
                  }
                  toast.success(`Đã xóa thư mục ảo: ${targetPath}`, {
                    style: {
                      background: 'hsl(var(--card))',
                      color: 'hsl(var(--card-foreground))',
                      borderRadius: '12px',
                      border: '1px solid hsl(var(--border))',
                    }
                  });
                }
              }
            }}
            className="px-3 py-1.5 bg-destructive hover:bg-destructive/90 active:scale-95 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all"
          >
            Xác nhận
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center',
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
        borderRadius: '16px',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)',
        maxWidth: '350px',
        padding: '12px'
      }
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
  const buildTree = (files, folderPaths) => {
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
  };

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
                ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                : activeTabPath === node.path
                ? "bg-primary/20 text-primary border-l-2 border-primary font-semibold"
                : "text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900/60"
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
                  <span className="text-zinc-500 w-3 flex items-center justify-center">
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
                  className="bg-zinc-900 text-zinc-100 border border-primary rounded px-1 py-0.5 text-[11px] outline-none w-full font-mono"
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
                      className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
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
                      className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
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
                  className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                  title="Rename"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEntry(node.path, node.type);
                  }}
                  className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-destructive"
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
                className="flex items-center gap-1.5 py-1 px-2 hover:bg-zinc-850/40 rounded"
              >
                <span className="w-3" />
                {inlineAction.type === "new_folder" ? (
                  <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={inlineAction.value}
                  placeholder={inlineAction.type === "new_folder" ? "New folder..." : "New file..."}
                  onChange={(e) => setInlineAction({ ...inlineAction, value: e.target.value })}
                  onKeyDown={(e) => handleInlineInputKeyDown(e, inlineAction)}
                  onBlur={() => handleInlineInputBlur(inlineAction)}
                  className="bg-zinc-900 text-zinc-100 border border-primary rounded px-1 py-0.5 text-[11px] outline-none w-full font-mono"
                />
              </div>
            )}

            {sortedChildren.map(child => renderTree(child, node.path === "" ? level : level + 1))}
          </div>
        )}
      </div>
    );
  };

  const workspaceTree = buildTree(workspaceFiles, folders);

  // Desktop check view
  if (!isDesktop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center space-y-6 bg-white dark:bg-background rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="w-16 h-16 rounded-full bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center text-destructive">
          <Monitor className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="text-base font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">Yêu cầu thiết bị màn hình lớn</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Tiện ích **Web-based IDE (Dev)** yêu cầu mở trên máy tính (Desktop/Laptop/Tablet ngang) 
            để có đủ không gian soạn thảo code và sử dụng quyền đồng bộ dữ liệu file cục bộ từ trình duyệt.
          </p>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Quay Lại Dashboard
        </button>
      </div>
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
    <div className="flex flex-col bg-zinc-950 h-screen w-screen text-zinc-300 relative overflow-hidden">
      {/* Top IDE Header Control Bar */}
      <div className="bg-card border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 font-bold uppercase hover:text-white transition-colors border-r border-zinc-700 pr-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex items-center gap-1.5 font-mono text-zinc-500">
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
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-350 font-bold px-3 py-1.5 rounded transition-all border border-zinc-700"
            title="Đồng bộ trực tiếp với thư mục trên máy tính của bạn thông qua File System API"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Mở Thư Mục Cục Bộ
          </button>
        </div>
      </div>

      {/* Main IDE Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side Icon Navigation Menu */}
        <div className="w-14 bg-card border-r border-zinc-800 flex flex-col items-center py-4 justify-between">
          <div className="flex flex-col items-center gap-5 w-full">
            <button 
              onClick={() => setActiveSidebarTab("explorer")}
              className={`p-2.5 rounded-lg transition-all ${activeSidebarTab === "explorer" ? "bg-primary/10 text-primary border border-primary/20" : "text-zinc-500 hover:text-zinc-200"}`}
              title="Quản lý File"
            >
              <Folder className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveSidebarTab("learn")}
              className={`p-2.5 rounded-lg transition-all ${activeSidebarTab === "learn" ? "bg-primary/10 text-primary border border-primary/20" : "text-zinc-500 hover:text-zinc-200"}`}
              title="Khóa học & Code mẫu"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveSidebarTab("db")}
              className={`p-2.5 rounded-lg transition-all ${activeSidebarTab === "db" ? "bg-primary/10 text-primary border border-primary/20" : "text-zinc-500 hover:text-zinc-200"}`}
              title="PHP & phpMyAdmin localhost"
            >
              <Database className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-4 text-[9px] text-zinc-650 font-mono">
            <span>v1.1</span>
          </div>
        </div>

        {/* Sidebar Tab Panels */}
        <div className="w-64 bg-card border-r border-zinc-800 flex flex-col text-xs">
          
          {/* TAB 1: File Explorer */}
          {activeSidebarTab === "explorer" && (
            <div className="p-4 flex-1 flex flex-col overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-1">
                <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Thư mục dự án</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => {
                      const parent = getActiveFolder();
                      if (parent) setExpandedFolders(prev => ({ ...prev, [parent]: true }));
                      setInlineAction({ type: "new_file", parentPath: parent, value: "" });
                    }}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
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
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
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
                  <p className="font-bold flex items-center gap-1">📂 Thư mục: {dirHandle.name}</p>
                  <p className="text-zinc-500 leading-normal">Đồng bộ trực tiếp. Mọi chỉnh sửa được tự động lưu trực tiếp xuống file vật lý khi bạn dừng gõ 1 giây.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Tutorials & Learning */}
          {activeSidebarTab === "learn" && (
            <div className="p-4 flex-1 flex flex-col overflow-y-auto space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-1">
                <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
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
                const course = COURSES.find(c => c.id === activeCourseId);
                const isCompleted = completedLessons.includes(course.id);
                return (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-zinc-250 leading-tight">{course.title}</h4>
                      <p className="text-[10px] text-zinc-500 leading-normal">{course.description}</p>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-zinc-400 block mb-1">Nhiệm vụ cần đạt:</span>
                      <ul className="space-y-2">
                        {course.tasks.map((task, i) => (
                          <li key={i} className="flex items-start gap-2 text-[10px] text-zinc-400 font-medium leading-relaxed">
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
                          toast.success(`Đã nạp file bài học: ${course.file}`, { icon: "📝" });
                        }}
                        className="w-full py-2 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-350 rounded-xl border border-zinc-800 text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98"
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
                        ❌ <strong>Chưa chính xác!</strong> Mã nguồn trong editor chưa đáp ứng đủ yêu cầu bài học. Hãy rà soát lại và thử lại.
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="space-y-3.5">
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                    Hoàn thành bài học để rèn luyện tư duy lập trình hướng đối tượng và nhận thưởng **+30 JOY** cho mỗi bài học:
                  </p>
                  <div className="space-y-3">
                    {COURSES.map((course) => {
                      const isCompleted = completedLessons.includes(course.id);
                      return (
                        <div
                          key={course.id}
                          className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 space-y-2 hover:border-primary/40 transition-all cursor-pointer group"
                          onClick={() => {
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
                            <span className="font-bold text-zinc-200 text-xs font-sans">{course.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                              isCompleted
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-primary/10 text-primary border-primary/20"
                            }`}>
                              {isCompleted ? "Hoàn thành" : "+30 JOY"}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-normal line-clamp-2 font-sans">
                            {course.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-zinc-650 group-hover:text-primary uppercase tracking-widest pt-1">
                            <span>Vào bài học</span>
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
              <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">PHP & phpMyAdmin Local</span>
              <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                Để chạy PHP và quản lý cơ sở dữ liệu qua phpMyAdmin 100% trên máy tính cá nhân (localhost), 
                sử dụng Docker Compose là phương án tối ưu, siêu nhẹ và bảo mật nhất.
              </p>

              <div className="space-y-3">
                <div className="bg-zinc-900/40 border border-zinc-800 p-2.5 rounded-lg space-y-1">
                  <p className="font-bold text-[10px] text-zinc-300">Bước 1: Cài đặt Docker Desktop</p>
                  <p className="text-[9.5px] text-zinc-500">Tải Docker Desktop từ trang chủ docker.com và cài lên máy tính.</p>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 p-2.5 rounded-lg space-y-2">
                  <p className="font-bold text-[10px] text-zinc-300">Bước 2: Tạo file docker-compose.yml</p>
                  <p className="text-[9.5px] text-zinc-500">Tạo file docker-compose.yml cùng thư mục với dự án PHP trên máy của bạn với nội dung sau:</p>
                  <pre className="text-[8.5px] font-mono bg-zinc-950 p-2 rounded text-zinc-400 overflow-x-auto select-all max-h-32">
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

                <div className="bg-zinc-900/40 border border-zinc-800 p-2.5 rounded-lg space-y-1">
                  <p className="font-bold text-[10px] text-zinc-300">Bước 3: Khởi động hệ thống</p>
                  <p className="text-[9.5px] text-zinc-500">Chạy terminal tại thư mục chứa file và gõ lệnh:</p>
                  <code className="block bg-zinc-950 p-1.5 text-[9px] font-mono text-primary rounded">docker-compose up -d</code>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 p-2.5 rounded-lg space-y-1">
                  <p className="font-bold text-[10px] text-zinc-300">Bước 4: Truy cập phpMyAdmin</p>
                  <p className="text-[9.5px] text-zinc-500">
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

          <div className="flex items-center bg-card border-b border-zinc-800/80 px-2 overflow-x-auto gap-0.5 select-none scrollbar-hide">
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
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-background/50"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-zinc-500" />
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
                <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-1.5 flex items-center justify-between text-xs text-zinc-700">
                  <span className="font-bold flex items-center gap-1">🌐 Web Frame Live Preview</span>
                  <button 
                    onClick={() => setPreviewMode(false)}
                    className="flex items-center gap-1 hover:text-zinc-950 font-semibold"
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
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2 font-sans">
                    <AlertTriangle className="w-8 h-8 text-primary/45" />
                    <p className="text-xs">Không có file nào đang mở. Hãy mở một file từ File Explorer hoặc nạp bài học.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Execution Panel / Output Panel */}
          <div className="bg-card border-t border-zinc-850 px-5 py-4 min-h-[140px] max-h-[160px] flex flex-col font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5" /> Bảng Hướng dẫn Chạy & Thực thi
                <span className="mx-2 text-zinc-700">|</span>
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

            <div className="flex-1 overflow-y-auto pt-3 font-mono text-[11px] leading-relaxed text-zinc-400 space-y-1">
              {activeFile?.language === "html" && (
                <p className="text-zinc-500">File dạng Web (HTML/CSS/JS). Bạn bấm vào nút **Xem Live Preview** phía trên bên phải để trực quan hóa giao diện ngay lập trình duyệt!</p>
              )}
              {activeFile?.language === "python" && (
                <>
                  <p className="text-zinc-500">Đối với Python, bạn mở Terminal trên máy tính (local) của bạn tại thư mục chứa file đã tải về và gõ lệnh chạy:</p>
                  <code className="block bg-zinc-950 p-2 text-success rounded mt-1 border border-zinc-800">python3 {activeFile.name}</code>
                </>
              )}
              {activeFile?.language === "c" && (
                <>
                  <p className="text-zinc-500">Đối với ngôn ngữ C, hãy cài đặt compiler GCC. Biên dịch và thực thi bằng lệnh Terminal:</p>
                  <code className="block bg-zinc-950 p-2 text-success rounded mt-1 border border-zinc-800">gcc {activeFile.name} -o output && ./output</code>
                </>
              )}
              {activeFile?.language === "cpp" && (
                <>
                  <p className="text-zinc-500">Đối với C++, biên dịch bằng trình biên dịch g++:</p>
                  <code className="block bg-zinc-950 p-2 text-success rounded mt-1 border border-zinc-800">g++ {activeFile.name} -o output && ./output</code>
                </>
              )}
              {activeFile?.language === "csharp" && (
                <>
                  <p className="text-zinc-500">Đối với C#, hãy cài đặt .NET SDK trên máy. Tạo project Console mới và chạy:</p>
                  <code className="block bg-zinc-950 p-2 text-success rounded mt-1 border border-zinc-800">dotnet run</code>
                </>
              )}
              {activeFile?.language === "php" && (
                <>
                  <p className="text-zinc-500">Đối với PHP, bạn có thể chạy server PHP tích hợp cục bộ để test nhanh mà không cần Apache:</p>
                  <code className="block bg-zinc-950 p-2 text-success rounded mt-1 border border-zinc-800">php -S localhost:8000</code>
                  <p className="text-[10px] text-zinc-650 mt-1">Truy cập http://localhost:8000 trên máy tính của bạn để xem kết quả.</p>
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
