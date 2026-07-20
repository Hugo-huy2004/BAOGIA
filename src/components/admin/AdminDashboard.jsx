import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getAiUrl } from "../../services/api";

const VITE_API = import.meta.env.VITE_API_URL || "/api";

async function apiPost(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include"
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || r.statusText);
  }
  return r.json();
}

async function apiPatch(url, body) {
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include"
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || r.statusText);
  }
  return r.json();
}

async function apiFetch(url) {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(r.statusText);
  return r.json();
}

async function apiDelete(url, body) {
  const r = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || r.statusText);
  }
  return r.json();
}

export function SosOverlay({ alerts }) {
  if (!alerts || alerts.length === 0) return null;
  const latest = alerts[0];
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-extrabold pointer-events-auto shadow-lg animate-sos-flash">
        <span className="material-symbols-outlined animate-pulse">emergency</span>
        SOS — {latest.displayName} vừa gửi tín hiệu cần giúp đỡ khẩn cấp ({alerts.length} cảnh báo chưa xử lý)
        {latest.phone && (
          <a href={`tel:${latest.phone}`} className="underline font-black">Gọi ngay {latest.phone}</a>
        )}
      </div>
    </div>
  );
}

const COMMAND_TEMPLATES = [
  "/clear",
  "/help",
  "/stats",
  "/users",
  "/bot",
  "/clean-logs",
  "/create-joy-voucher",
  "/create-payment",
  "/lock",
  "/unlock",
  "cộng 1000 joy",
  "nạp 1000 joy",
  "gửi gói VIP 30 ngày",
  "gửi tin nhắn Chào Mừng ngày mới đến tất cả",
  "xóa tài khoản"
];

export default function AdminDashboard({ stats, bookings, crisisAlerts = [], onResolveCrisisAlert }) {
  const { t } = useTranslation();
  const [focusedUser, setFocusedUser] = useState(null);
  const [inputVal, setInputVal] = useState("");
  const [prediction, setPrediction] = useState("");
  const [pendingCommand, setPendingCommand] = useState(null);
  const [history, setHistory] = useState([
    { type: "info", text: "============================================================" },
    { type: "info", text: "          HUGO STUDIO ADMIN INTERACTIVE TERMINAL v2.6       " },
    { type: "info", text: "          Giao diện điều khiển trung tâm tuyệt mật          " },
    { type: "info", text: "          Gõ /help để hiển thị danh sách các lệnh hỗ trợ    " },
    { type: "info", text: "============================================================" }
  ]);
  const [cmdHistory, setCmdHistory] = useState([]);
  const [cmdHistoryIndex, setCmdHistoryIndex] = useState(-1);
  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll terminal to bottom on new output
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Auto focus input on mount and terminal click
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const addLog = (text, type = "output", component = null) => {
    setHistory((prev) => [...prev, { type, text, component }]);
  };

  // Keyboard navigation for command history (up/down arrow keys)
  const handleKeyDown = (e) => {
    if ((e.key === "Tab" || e.key === "ArrowRight") && prediction) {
      e.preventDefault();
      setInputVal((prev) => prev + prediction);
      setPrediction("");
      return;
    }

    if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      if (pendingCommand) {
        setPendingCommand(null);
        addLog("[SYSTEM] Đã hủy lệnh tương tác hiện tại.", "info");
      } else if (focusedUser) {
        setFocusedUser(null);
        addLog("[SYSTEM] Đã thoát khỏi phiên làm việc của user (Ctrl+C).", "info");
      } else {
        addLog("admin@hugostudio:~$ ^C", "input");
      }
      setInputVal("");
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = cmdHistoryIndex < 0 ? cmdHistory.length - 1 : Math.max(0, cmdHistoryIndex - 1);
      setCmdHistoryIndex(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cmdHistoryIndex < 0) return;
      if (cmdHistoryIndex >= cmdHistory.length - 1) {
        setCmdHistoryIndex(-1);
        setInputVal("");
      } else {
        const nextIdx = cmdHistoryIndex + 1;
        setCmdHistoryIndex(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    }
  };

  // Copy helper
  const handleCopyText = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          addLog(`[SYSTEM] Copied to clipboard: ${text}`, "success");
        })
        .catch(() => {
          fallbackCopyText(text);
        });
    } else {
      fallbackCopyText(text);
    }
  };

  const fallbackCopyText = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      addLog(`[SYSTEM] Copied to clipboard: ${text}`, "success");
    } catch (err) {
      console.error("Fallback copy failed", err);
      addLog(`[ERROR] Không thể tự động sao chép: ${text}`, "error");
    }
  };

  const triggerCommandDirectly = (cmdText) => {
    setInputVal(cmdText);
    setTimeout(() => {
      if (inputRef.current) {
        const formEl = inputRef.current.form;
        if (formEl) {
          formEl.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
      }
    }, 50);
  };

  const handlePendingCommandResolution = (input) => {
    const { intent, step, amount, recipient } = pendingCommand;

    if (intent === "send-joy-direct") {
      if (step === "waiting_recipient") {
        if (!input) {
          addLog("[ERROR] Email hoặc SĐT người nhận không được để trống.", "error");
          addLog("[AI INTERACTIVE] Bạn muốn gửi JOY cho ai? (Nhập Email hoặc SĐT):", "warning");
          return;
        }
        if (!amount) {
          setPendingCommand({ intent, step: "waiting_amount", recipient: input });
          addLog("[AI INTERACTIVE] Bạn muốn gửi bao nhiêu JOY? (Nhập số lượng):", "warning");
        } else {
          setPendingCommand(null);
          triggerCommandDirectly(`gửi ${amount} joy trực tiếp đến ${input}`);
        }
      } else if (step === "waiting_amount") {
        const amt = Number(input);
        if (isNaN(amt) || amt <= 0) {
          addLog("[ERROR] Số lượng JOY phải là một số lớn hơn 0.", "error");
          addLog("[AI INTERACTIVE] Bạn muốn gửi bao nhiêu JOY? (Nhập số lượng):", "warning");
          return;
        }
        setPendingCommand(null);
        triggerCommandDirectly(`gửi ${amt} joy trực tiếp đến ${recipient}`);
      }
    }

    else if (intent === "lock") {
      if (step === "waiting_recipient") {
        if (!input) {
          addLog("[ERROR] Email hoặc SĐT không được để trống.", "error");
          addLog("[AI INTERACTIVE] Bạn muốn khóa tài khoản nào? (Nhập Email hoặc SĐT):", "warning");
          return;
        }
        setPendingCommand(null);
        triggerCommandDirectly(`/lock ${input}`);
      }
    }

    else if (intent === "unlock") {
      if (step === "waiting_recipient") {
        if (!input) {
          addLog("[ERROR] Email hoặc SĐT không được để trống.", "error");
          addLog("[AI INTERACTIVE] Bạn muốn mở khóa tài khoản nào? (Nhập Email hoặc SĐT):", "warning");
          return;
        }
        setPendingCommand(null);
        triggerCommandDirectly(`/unlock ${input}`);
      }
    }

    else if (intent === "hugo-team") {
      if (step === "waiting_recipient") {
        if (!input) {
          addLog("[ERROR] Email lập trình viên không được để trống.", "error");
          let actionViet = "duyệt";
          if (pendingCommand.action === "reject") actionViet = "từ chối";
          else if (pendingCommand.action === "delete-dev") actionViet = "xóa";
          else if (pendingCommand.action === "block-dev") actionViet = "chặn/đình chỉ";
          addLog(`[AI INTERACTIVE] Bạn muốn ${actionViet} lập trình viên nào? (Nhập Email):`, "warning");
          return;
        }
        setPendingCommand(null);
        triggerCommandDirectly(`/hugo-team ${pendingCommand.action} ${input}`);
      }
    }

    else if (intent === "tickets") {
      if (step === "waiting_query") {
        if (!input) {
          addLog("[ERROR] Mã ticket ID không được để trống.", "error");
          addLog("[AI INTERACTIVE] Bạn muốn giải quyết ticket nào? (Nhập ID ticket):", "warning");
          return;
        }
        setPendingCommand(null);
        triggerCommandDirectly(`/tickets resolve ${input}`);
      }
    }

    else if (intent === "iot") {
      if (step === "waiting_query") {
        if (!input) {
          addLog("[ERROR] Tên hoặc ID thiết bị không được để trống.", "error");
          addLog("[AI INTERACTIVE] Bạn muốn bật/tắt thiết bị nào? (Nhập Tên thiết bị):", "warning");
          return;
        }
        setPendingCommand(null);
        triggerCommandDirectly(`/iot toggle ${input}`);
      }
    }

    else if (intent === "posts") {
      if (step === "waiting_query") {
        if (!input) {
          addLog("[ERROR] ID bài viết cần xóa không được để trống.", "error");
          addLog("[AI INTERACTIVE] Bạn muốn xóa bài viết nào? (Nhập ID bài viết):", "warning");
          return;
        }
        setPendingCommand(null);
        triggerCommandDirectly(`/posts delete ${input}`);
      }
    }

    else if (intent === "orders") {
      if (step === "waiting_query") {
        if (!input) {
          addLog("[ERROR] ID đơn hàng không được để trống.", "error");
          addLog(`[AI INTERACTIVE] Bạn muốn ${pendingCommand.action === "complete" ? "hoàn thành" : "hủy"} đơn hàng nào? (Nhập ID đơn hàng):`, "warning");
          return;
        }
        setPendingCommand(null);
        triggerCommandDirectly(`/orders ${pendingCommand.action} ${input}`);
      }
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);

    if (!val) {
      setPrediction("");
      return;
    }

    const lowerVal = val.toLowerCase();
    const match = COMMAND_TEMPLATES.find(t => t.toLowerCase().startsWith(lowerVal));
    if (match) {
      setPrediction(match.substring(val.length));
    } else {
      setPrediction("");
    }
  };

  const handleCommandSubmit = async (e) => {
    e.preventDefault();
    const command = inputVal.trim();
    if (!command) return;

    addLog(focusedUser ? `admin@hugostudio(user:${focusedUser.email}):~$ ${command}` : `admin@hugostudio:~$ ${command}`, "input");
    setCmdHistory((prev) => [...prev, command]);
    setCmdHistoryIndex(-1);
    setInputVal("");
    setPrediction("");

    const cleanCmd = command.toLowerCase().trim();
    if (cleanCmd === "out" || cleanCmd === "/out" || cleanCmd === "exit" || cleanCmd === "/exit" || cleanCmd === "quit" || cleanCmd === "/quit") {
      if (pendingCommand) {
        setPendingCommand(null);
        addLog("[SYSTEM] Đã hủy lệnh tương tác hiện tại.", "info");
        return;
      }
      if (focusedUser) {
        setFocusedUser(null);
        addLog("[SYSTEM] Đã thoát khỏi phiên làm việc của user.", "success");
      } else {
        addLog("[SYSTEM] Không có phiên làm việc của user nào đang hoạt động.", "warning");
      }
      return;
    }

    if (pendingCommand) {
      handlePendingCommandResolution(command);
      return;
    }

    const parts = command.split(/\s+/);
    const cmdName = parts[0].toLowerCase();

    // 1. Handle local immediate UI commands
    if (cmdName === "/clear") {
      setHistory([]);
      return;
    }

    if (cmdName === "/help") {
      addLog("DANH SÁCH LỆNH CÓ SẴN (ADMIN COMMANDS):", "info");
      addLog("  /help                                                 - Hiển thị hướng dẫn này.");
      addLog("  /stats                                                - Xem chỉ số hệ thống, CPU, RAM & Dung lượng.");
      addLog("  /users [từ_khóa]                                      - Danh sách 10 user mới hoặc tìm kiếm user.");
      addLog("  /create-joy-voucher [số_tiền] [ghi_chú]                - Tạo thẻ quà tặng (Voucher) JOY.");
      addLog("  /create-payment/for{người_nhận}/{số_tiền}/{nội_dung}    - Tạo link thanh toán/QR PayOS (Cú pháp 1).");
      addLog("  /create-payment [người_nhận] [số_tiền] [nội_dung]      - Tạo link thanh toán/QR PayOS (Cú pháp 2).");
      addLog("  /lock [email/sđt]                                     - Khóa tài khoản thành viên.");
      addLog("  /unlock [email/sđt]                                   - Mở khóa tài khoản thành viên.");
      addLog("  /bot [on/off]                                         - Bật/tắt AI Community Bot.");
      addLog("  /clean-logs                                           - Xóa sạch logs rác lưu trên máy chủ.");
      addLog("  /clear                                                - Xóa sạch màn hình Terminal.");
      addLog("  (Hoặc gõ tự do bằng Tiếng Việt, AI sẽ tự động phân tích và thực thi!)", "warning");
      return;
    }

    try {
      addLog("[AI INTERPRETING] Đang xử lý câu lệnh bằng trí tuệ nhân tạo...", "info");
      const aiResult = await apiPost(`${VITE_API}/admin/interpret-command`, { text: command });

      if (!aiResult || aiResult.intent === "unknown") {
        if (!focusedUser) {
          // Check if this input matches a user profile to enter Focus Mode
          addLog(`[PROCESSING] Đang tìm kiếm tài khoản khớp với: "${command}"...`, "info");
          const searchRes = await apiFetch(`${VITE_API}/bios?search=${encodeURIComponent(command)}&limit=1`).catch(() => ({}));
          const list = Array.isArray(searchRes) ? searchRes : (searchRes.bios || []);
          if (list.length > 0) {
            const user = list[0];
            setFocusedUser(user);
            addLog("====================================================================", "info");
            addLog("🔑 [USER DETAILED PROFILE - FOCUS SESSION ENTERED]", "success");
            addLog(`  Tên hiển thị:   ${user.displayName || "N/A"}`);
            addLog(`  Email:          ${user.email}`);
            addLog(`  Số điện thoại:  ${user.phone || "N/A"}`);
            addLog(`  Bio Link URL:   https://hugowishpax.studio/${user.username || "N/A"}`);
            addLog(`  Trạng thái:     ${(user.status || "active").toUpperCase()}`);
            addLog(`  Số dư JOY:      ${(user.joyBalance || 0).toLocaleString("vi-VN")} JOY`);
            addLog(`  Hạn dùng Bio:   ${user.expiresAt ? new Date(user.expiresAt).toLocaleDateString("vi-VN") : "N/A"}`);
            if (user.packages && user.packages.length > 0) {
              addLog("  Các gói sở hữu:");
              user.packages.forEach((p) => {
                addLog(`    - Gói ${p.name} (${p.duration} ngày) | Ngày nhận: ${new Date(p.addedAt).toLocaleDateString("vi-VN")}`);
              });
            } else {
              addLog("  Các gói sở hữu: Không có gói hoạt động.");
            }
            addLog("====================================================================", "info");
            
            const actionButtonsComponent = (
              <div className="flex flex-wrap gap-2 my-2 select-none">
                <button
                  type="button"
                  onClick={() => triggerCommandDirectly("/lock")}
                  className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700/50 text-rose-300 px-3 py-1 rounded-md text-[10px] cursor-pointer transition-colors font-mono font-bold"
                >
                  ⚡ Khóa tài khoản
                </button>
                <button
                  type="button"
                  onClick={() => triggerCommandDirectly("cộng 1000 joy")}
                  className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 px-3 py-1 rounded-md text-[10px] cursor-pointer transition-colors font-mono font-bold"
                >
                  🎁 Nạp 1000 JOY
                </button>
                <button
                  type="button"
                  onClick={() => triggerCommandDirectly("gửi gói VIP 30 ngày")}
                  className="bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 px-3 py-1 rounded-md text-[10px] cursor-pointer transition-colors font-mono font-bold"
                >
                  💎 Giao gói VIP
                </button>
                <button
                  type="button"
                  onClick={() => triggerCommandDirectly("out")}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-md text-[10px] cursor-pointer transition-colors font-mono font-bold"
                >
                  ❌ Thoát phiên
                </button>
              </div>
            );
            addLog(null, "info", actionButtonsComponent);

            addLog(`[SYSTEM] Đã kích hoạt phiên làm việc cho user ${user.email}.`, "success");
            addLog("[SYSTEM] Các lệnh tiếp theo sẽ tự động áp dụng lên user này.", "info");
            addLog("[SYSTEM] Gõ 'out' hoặc nhấn Ctrl+C để thoát khỏi phiên.", "warning");
            return;
          }
        }

        addLog(`[AI ERROR] Không thể nhận diện ý định hành động cho câu lệnh: "${command}".`, "error");
        addLog("Mẹo: Hãy viết rõ ràng hành động như 'tạo voucher 1000' hoặc 'khóa test@fpt.edu.vn'.", "warning");
        return;
      }

      let { intent, amount, recipient, reason, botState, query } = aiResult;

      // Automatically override recipient in contextual session
      if (focusedUser && !recipient) {
        recipient = focusedUser.email;
      }
      
      // Print resolved intent details for transparency
      let resolvedInfo = `[AI RESOLVED] Lệnh: ${intent.toUpperCase()}`;
      if (amount) resolvedInfo += ` | Số tiền: ${amount.toLocaleString("vi-VN")}`;
      if (recipient) resolvedInfo += ` | Đối tượng: ${recipient}`;
      if (reason) resolvedInfo += ` | Ghi chú: ${reason}`;
      if (query) resolvedInfo += ` | Tìm kiếm: ${query}`;
      addLog(resolvedInfo, "success");

      // 2. STATS COMMAND
      if (intent === "stats") {
        addLog("[PROCESSING] Đang tải thông tin hệ thống...", "info");
        const overview = await apiFetch(`${VITE_API}/admin/system-overview`).catch(() => ({}));
        const storage = await apiFetch(`${VITE_API}/admin/system-storage`).catch(() => ({}));
        
        addLog("--- THÔNG SỐ HỆ THỐNG ---", "info");
        addLog(`Tổng thành viên:     ${overview.users || stats.total || 0}`);
        addLog(`Đang hoạt động:      ${stats.active || 0}`);
        addLog(`Đang chờ duyệt:      ${stats.pending || 0}`);
        addLog(`Đang bị khóa:        ${stats.locked || 0}`);
        addLog(`Cảnh báo vị trí lạ:   ${stats.locationAnomaly || 0} tài khoản`);
        addLog(`Uptime máy chủ:      ${overview.uptimeSec ? Math.round(overview.uptimeSec / 60) : 0} phút`);
        
        addLog("--- CƠ SỞ DỮ LIỆU & LƯU TRỮ ---", "info");
        const dbMb = storage.data ? (storage.data.database / (1024 * 1024)).toFixed(2) : "0.00";
        const fileMb = storage.data ? (storage.data.publicFiles / (1024 * 1024)).toFixed(2) : "0.00";
        addLog(`Dữ liệu MongoDB:     ${dbMb} MB`);
        addLog(`Tài nguyên Assets:   ${fileMb} MB`);
        return;
      }

      // 3. USERS COMMAND
      if (intent === "users") {
        addLog(`[PROCESSING] Đang tải danh sách thành viên...`, "info");
        const url = query 
          ? `${VITE_API}/bios?search=${encodeURIComponent(query)}&limit=10`
          : `${VITE_API}/bios?limit=10&sortBy=createdAt&sortOrder=desc`;
          
        const res = await apiFetch(url);
        const list = Array.isArray(res) ? res : (res.bios || []);
        
        if (list.length === 0) {
          addLog("[INFO] Không tìm thấy thành viên nào phù hợp.", "warning");
          return;
        }

        addLog(`--- KẾT QUẢ TÌM KIẾM (${list.length} USER) ---`, "info");
        list.forEach((u, i) => {
          const deviceHash = u.lastUserAgentHash ? u.lastUserAgentHash.slice(0, 12) : "none";
          addLog(`${i + 1}. [${u.status.toUpperCase()}] ${u.displayName || "NoName"} (${u.email}) · DeviceSig:${deviceHash}`);
        });
        return;
      }

      // 4. LOCK COMMAND
      if (intent === "lock") {
        if (!recipient) {
          setPendingCommand({ intent: "lock", step: "waiting_recipient" });
          addLog("[AI INTERACTIVE] Bạn muốn khóa tài khoản nào? (Nhập Email hoặc SĐT):", "warning");
          return;
        }
        addLog(`[PROCESSING] Đang tìm kiếm tài khoản ${recipient}...`, "info");
        const searchRes = await apiFetch(`${VITE_API}/bios?search=${encodeURIComponent(recipient)}&limit=1`);
        const list = Array.isArray(searchRes) ? searchRes : (searchRes.bios || []);
        if (list.length === 0) {
          addLog(`[ERROR] Không tìm thấy người dùng: ${recipient}`, "error");
          return;
        }
        const user = list[0];
        addLog(`[PROCESSING] Đang khóa tài khoản ${user.email} (ID: ${user._id})...`, "info");
        await apiPatch(`${VITE_API}/bios/${user._id}/status`, { status: "locked" });
        addLog(`[SUCCESS] Đã khóa tài khoản của ${user.displayName || user.email} thành công.`, "success");
        return;
      }

      // 5. UNLOCK COMMAND
      if (intent === "unlock") {
        if (!recipient) {
          setPendingCommand({ intent: "unlock", step: "waiting_recipient" });
          addLog("[AI INTERACTIVE] Bạn muốn mở khóa tài khoản nào? (Nhập Email hoặc SĐT):", "warning");
          return;
        }
        addLog(`[PROCESSING] Đang tìm kiếm tài khoản ${recipient}...`, "info");
        const searchRes = await apiFetch(`${VITE_API}/bios?search=${encodeURIComponent(recipient)}&limit=1`);
        const list = Array.isArray(searchRes) ? searchRes : (searchRes.bios || []);
        if (list.length === 0) {
          addLog(`[ERROR] Không tìm thấy người dùng: ${recipient}`, "error");
          return;
        }
        const user = list[0];
        addLog(`[PROCESSING] Đang mở khóa tài khoản ${user.email} (ID: ${user._id})...`, "info");
        await apiPatch(`${VITE_API}/bios/${user._id}/status`, { status: "active" });
        addLog(`[SUCCESS] Đã mở khóa tài khoản của ${user.displayName || user.email} thành công.`, "success");
        return;
      }

      // 6. CREATE JOY VOUCHER COMMAND
      if (intent === "create-joy-voucher") {
        if (!amount || isNaN(Number(amount))) {
          addLog("[ERROR] Số tiền không hợp lệ. Ví dụ: 'tạo voucher 1000 joy'", "error");
          return;
        }
        const note = reason || (recipient ? `Tạo cho ${recipient}` : "Tạo từ Terminal");
        addLog(`[PROCESSING] Đang tạo mã quà tặng ${amount} JOY...`, "info");
        const result = await apiPost(`${VITE_API}/joy-gift-cards`, { amount: Number(amount), note, count: 1 });
        const createdCard = Array.isArray(result) ? result[0] : result;
        
        if (createdCard && createdCard.code) {
          addLog(`[SUCCESS] Đã tạo thành công Voucher JOY:`, "success");
          addLog(`  Mã Code:   ${createdCard.code}`);
          addLog(`  Số lượng:  ${createdCard.amount} JOY`);
          addLog(`  Ghi chú:   ${createdCard.note}`);
          addLog(`  Hạn dùng:  ${new Date(createdCard.expiresAt).toLocaleDateString("vi-VN")}`);
          addLog("", "output", (
            <button 
              onClick={() => handleCopyText(createdCard.code)}
              className="mt-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-mono text-[10px] hover:bg-emerald-500/20 active:scale-95 transition-all"
            >
              [SAO CHÉP MÃ]
            </button>
          ));
        } else {
          throw new Error("Không thể tạo mã voucher.");
        }
        return;
      }

      // 7. CREATE PAYMENT COMMAND
      if (intent === "create-payment") {
        if (!amount || isNaN(Number(amount))) {
          addLog("[ERROR] Số tiền thanh toán không hợp lệ hoặc thiếu số tiền.", "error");
          return;
        }

        const msg = reason || `TXN-${Date.now()}`;
        const payFor = recipient || "All";

        addLog(`[PROCESSING] Đang tạo link thanh toán trị giá ${amount.toLocaleString("vi-VN")} đ cho ${payFor}...`, "info");
        
        let resolvedEmail = payFor;
        if (payFor.toLowerCase() !== "all") {
          const searchRes = await apiFetch(`${VITE_API}/bios?search=${encodeURIComponent(payFor)}&limit=1`).catch(() => ({}));
          const list = Array.isArray(searchRes) ? searchRes : (searchRes.bios || []);
          if (list.length > 0) {
            resolvedEmail = list[0].email;
            addLog(`[RESOLVED] Người dùng: ${list[0].displayName} (${resolvedEmail})`, "info");
          } else {
            addLog(`[WARNING] Không nhận dạng được tài khoản "${payFor}". Tạo link thanh toán chung.`, "warning");
            resolvedEmail = "All";
          }
        }

        let resLink;
        if (resolvedEmail.toLowerCase() === "all") {
          const result = await apiPost(`${VITE_API}/payos/create`, { amount: Number(amount), reason: msg });
          resLink = result.data?.checkoutUrl;
        } else {
          const result = await apiPost(`${VITE_API}/payos/request-payment`, { email: resolvedEmail, amount: Number(amount), reason: msg });
          resLink = result.data?.checkoutUrl;
        }

        if (resLink) {
          addLog(`[SUCCESS] Link thanh toán QR PayOS đã được khởi tạo:`, "success");
          addLog(`  URL: ${resLink}`);
          addLog("", "output", (
            <button 
              onClick={() => handleCopyText(resLink)}
              className="mt-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-mono text-[10px] hover:bg-emerald-500/20 active:scale-95 transition-all"
            >
              [SAO CHÉP LINK THANH TOÁN]
            </button>
          ));
        } else {
          throw new Error("Không lấy được checkoutUrl từ PayOS.");
        }
        return;
      }

      // 8. TOGGLE BOT COMMAND
      if (intent === "bot") {
        if (!botState) {
          addLog("[ERROR] Thiếu trạng thái Bot (on/off). Ví dụ: 'bật bot' hoặc 'tắt bot'.", "error");
          return;
        }
        const state = botState === "on";
        addLog(`[PROCESSING] Đang cập nhật AI Bot trạng thái: ${botState.toUpperCase()}...`, "info");
        await apiPost(`${VITE_API}/admin/community-bot`, { enabled: state });
        addLog(`[SUCCESS] AI Community Bot đã chuyển sang: ${botState.toUpperCase()}`, "success");
        return;
      }

      // 9. CLEAN LOGS COMMAND
      if (intent === "clean-logs") {
        addLog("[PROCESSING] Đang xóa sạch mảng logs lỗi client...", "info");
        await apiPost(`${VITE_API}/ops/clean-events`);
        addLog("[SUCCESS] Logs sự cố hệ thống đã được dọn dẹp trống rỗng.", "success");
        return;
      }

      // 10. SEND JOY DIRECT COMMAND
      if (intent === "send-joy-direct") {
        if (!recipient) {
          setPendingCommand({ intent: "send-joy-direct", step: "waiting_recipient", amount });
          addLog("[AI INTERACTIVE] Bạn muốn gửi JOY cho ai? (Nhập Email hoặc SĐT):", "warning");
          return;
        }
        if (!amount) {
          setPendingCommand({ intent: "send-joy-direct", step: "waiting_amount", recipient });
          addLog("[AI INTERACTIVE] Bạn muốn gửi bao nhiêu JOY? (Nhập số lượng):", "warning");
          return;
        }
        addLog(`[PROCESSING] Đang gửi trực tiếp ${amount} JOY đến tài khoản ${recipient}...`, "info");
        await apiPost(`${VITE_API}/joy-gift-cards/direct-add`, { email: recipient, amount: Number(amount), note: reason || "Gửi trực tiếp từ Terminal" });
        addLog(`[SUCCESS] Đã cộng trực tiếp ${amount} JOY cho ${recipient} thành công.`, "success");
        return;
      }

      // 11. CREATE PACKAGE TEMPLATE COMMAND
      if (intent === "create-package-template") {
        if (!query || !amount) {
          addLog("[ERROR] Thiếu tên gói dịch vụ hoặc thời hạn (số ngày/tháng).", "error");
          return;
        }
        const durationUnit = aiResult.durationUnit || "days";
        addLog(`[PROCESSING] Đang khởi tạo gói dịch vụ mới: ${query} (${amount} ${durationUnit})...`, "info");
        const benefits = reason ? reason.split(",").map(b => b.trim()) : [`Gói ${query} ${amount} ${durationUnit}`];
        const newPkg = await apiPost(`${VITE_API}/packages`, { name: query, duration: Number(amount), durationUnit, benefits });
        addLog(`[SUCCESS] Đã tạo thành công gói dịch vụ mới! ID: ${newPkg._id}`, "success");
        return;
      }

      // 12. SEND PACKAGE USER COMMAND
      if (intent === "send-package-user") {
        if (!recipient || !query) {
          addLog("[ERROR] Thiếu thông tin người nhận hoặc tên gói dịch vụ.", "error");
          return;
        }
        addLog(`[PROCESSING] Đang tải danh sách các gói dịch vụ...`, "info");
        const packages = await apiFetch(`${VITE_API}/packages`);
        const pkg = packages.find(p => p.name.toLowerCase() === query.toLowerCase() || p._id === query);
        if (!pkg) {
          addLog(`[ERROR] Không tìm thấy mẫu gói dịch vụ nào khớp với tên: "${query}".`, "error");
          return;
        }

        const customDuration = amount ? Number(amount) : pkg.duration;
        addLog(`[PROCESSING] Đang kích hoạt gói ${pkg.name} (${customDuration} ngày) cho ${recipient}...`, "info");
        await apiPost(`${VITE_API}/packages/user`, { email: recipient, packageId: pkg._id, customDuration });
        addLog(`[SUCCESS] Đã gán thành công gói ${pkg.name} (${customDuration} ngày) cho tài khoản ${recipient}.`, "success");
        return;
      }

      // 13. DELETE USER COMMAND
      if (intent === "delete-user") {
        if (!recipient) {
          addLog("[ERROR] Vui lòng nhập email tài khoản muốn xóa.", "error");
          return;
        }
        addLog(`[PROCESSING] Đang tìm kiếm tài khoản ${recipient}...`, "info");
        const searchRes = await apiFetch(`${VITE_API}/bios?search=${encodeURIComponent(recipient)}&limit=1`);
        const list = Array.isArray(searchRes) ? searchRes : (searchRes.bios || []);
        if (list.length === 0) {
          addLog(`[ERROR] Không tìm thấy người dùng: ${recipient}`, "error");
          return;
        }
        const user = list[0];
        addLog(`[PROCESSING] Đang xóa vĩnh viễn tài khoản ${user.email} (ID: ${user._id})...`, "info");
        await apiDelete(`${VITE_API}/bios/${user._id}`);
        addLog(`[SUCCESS] Đã xóa vĩnh viễn tài khoản của ${user.displayName || user.email} khỏi hệ thống.`, "success");
        return;
      }

      // 14. DELETE PACKAGE TEMPLATE COMMAND
      if (intent === "delete-package-template") {
        if (!query) {
          addLog("[ERROR] Vui lòng nhập tên gói dịch vụ muốn xóa.", "error");
          return;
        }
        addLog(`[PROCESSING] Đang tải danh sách các gói dịch vụ...`, "info");
        const packages = await apiFetch(`${VITE_API}/packages`);
        const pkg = packages.find(p => p.name.toLowerCase() === query.toLowerCase() || p._id === query);
        if (!pkg) {
          addLog(`[ERROR] Không tìm thấy mẫu gói dịch vụ: "${query}"`, "error");
          return;
        }
        addLog(`[PROCESSING] Đang xóa gói dịch vụ ${pkg.name} (ID: ${pkg._id})...`, "info");
        await apiDelete(`${VITE_API}/packages/${pkg._id}`);
        addLog(`[SUCCESS] Đã xóa thành công mẫu gói dịch vụ ${pkg.name}.`, "success");
        return;
      }

      // 15. DELETE VOUCHER COMMAND
      if (intent === "delete-voucher") {
        if (!query) {
          addLog("[ERROR] Vui lòng nhập mã Voucher JOY cần xóa.", "error");
          return;
        }
        addLog(`[PROCESSING] Đang truy vấn danh sách Voucher JOY...`, "info");
        const cards = await apiFetch(`${VITE_API}/joy-gift-cards`);
        const card = cards.find(c => c.code.toLowerCase() === query.toLowerCase());
        if (!card) {
          addLog(`[ERROR] Không tìm thấy Voucher nào có mã: "${query}"`, "error");
          return;
        }
        addLog(`[PROCESSING] Đang hủy Voucher ${card.code} (ID: ${card._id})...`, "info");
        await apiDelete(`${VITE_API}/joy-gift-cards/${card._id}`);
        addLog(`[SUCCESS] Đã xóa thành công Voucher JOY: ${card.code}`, "success");
        return;
      }

      // 16. DELETE USER PACKAGE COMMAND
      if (intent === "delete-user-package") {
        if (!recipient || !query) {
          addLog("[ERROR] Thiếu email người dùng hoặc tên gói cần xóa khỏi tài khoản.", "error");
          return;
        }
        addLog(`[PROCESSING] Đang tải thông tin Bio của ${recipient}...`, "info");
        const searchRes = await apiFetch(`${VITE_API}/bios?search=${encodeURIComponent(recipient)}&limit=1`);
        const list = Array.isArray(searchRes) ? searchRes : (searchRes.bios || []);
        if (list.length === 0) {
          addLog(`[ERROR] Không tìm thấy người dùng: ${recipient}`, "error");
          return;
        }
        const user = list[0];
        const userPackage = user.packages?.find(p => p.name.toLowerCase() === query.toLowerCase() || p._id === query || p.packageId === query);
        if (!userPackage) {
          addLog(`[ERROR] Người dùng không sở hữu gói nào có tên: "${query}"`, "error");
          return;
        }
        addLog(`[PROCESSING] Đang thu hồi gói ${userPackage.name} khỏi tài khoản ${user.email}...`, "info");
        await apiDelete(`${VITE_API}/packages/user`, { email: user.email, packageInstanceId: userPackage._id });
        addLog(`[SUCCESS] Đã xóa gói ${userPackage.name} khỏi tài khoản ${user.email} thành công.`, "success");
        return;
      }

      // HUGO TEAM DEV MANAGEMENT
      if (intent === "hugo-team") {
        if (reason === "list") {
          addLog("[PROCESSING] Đang tải danh sách đơn đăng ký Hugo Team...", "info");
          const res = await apiFetch(`${VITE_API}/hugoteam/admin/applicants`);
          const apps = res.applicants || [];
          if (apps.length === 0) {
            addLog("[INFO] Không có đơn đăng ký nào đang chờ duyệt.", "warning");
            return;
          }
          addLog("--- DANH SÁCH ỨNG VIÊN ĐANG CHỜ DUYỆT ---", "info");
          apps.forEach((a, idx) => {
            addLog(`${idx + 1}. [PENDING] ${a.name} (${a.email}) · Trường: ${a.school || "N/A"} · CV: ${a.cv}`);
          });
          return;
        }

        if (!recipient) {
          setPendingCommand({ intent: "hugo-team", step: "waiting_recipient", action: reason });
          let actionLabel = "duyệt";
          if (reason === "reject") actionLabel = "từ chối";
          else if (reason === "delete-dev") actionLabel = "xóa";
          else if (reason === "block-dev") actionLabel = "chặn/đình chỉ";
          addLog(`[AI INTERACTIVE] Bạn muốn ${actionLabel} lập trình viên nào? (Nhập Email):`, "warning");
          return;
        }

        if (reason === "approve") {
          addLog(`[PROCESSING] Đang duyệt ứng viên ${recipient} tham gia Hugo Dev Team...`, "info");
          const result = await apiPost(`${VITE_API}/hugoteam/admin/approve`, { email: recipient });
          addLog(`[SUCCESS] ${result.message || "Đã phê duyệt thành công!"}`, "success");
        } else if (reason === "reject") {
          addLog(`[PROCESSING] Đang từ chối ứng viên ${recipient}...`, "info");
          const result = await apiPost(`${VITE_API}/hugoteam/admin/reject`, { email: recipient });
          addLog(`[SUCCESS] ${result.message || "Đã từ chối đơn ứng viên."}`, "success");
        } else if (reason === "delete-dev") {
          addLog(`[PROCESSING] Đang xóa lập trình viên ${recipient} khỏi Hugo Dev Team...`, "info");
          const result = await apiDelete(`${VITE_API}/hugoteam/admin/devs/${encodeURIComponent(recipient)}`);
          addLog(`[SUCCESS] ${result.message || "Đã xóa lập trình viên thành công."}`, "success");
        } else if (reason === "block-dev") {
          addLog(`[PROCESSING] Đang thay đổi trạng thái hoạt động (chặn/đình chỉ) của lập trình viên ${recipient}...`, "info");
          const result = await apiPost(`${VITE_API}/hugoteam/admin/devs/${encodeURIComponent(recipient)}/block`);
          addLog(`[SUCCESS] ${result.message || "Đã cập nhật trạng thái lập trình viên."}`, "success");
        }
        return;
      }

      // SUPPORT TICKETS MANAGEMENT
      if (intent === "tickets") {
        if (reason === "list") {
          addLog("[PROCESSING] Đang tải danh sách yêu cầu hỗ trợ...", "info");
          const res = await apiFetch(`${VITE_API}/support/tickets?status=pending`);
          const tickets = res.tickets || [];
          if (tickets.length === 0) {
            addLog("[INFO] Không có yêu cầu hỗ trợ nào đang chờ xử lý.", "success");
            return;
          }
          addLog("--- DANH SÁCH TICKET CHƯA GIẢI QUYẾT ---", "info");
          tickets.forEach((t) => {
            addLog(`- [PENDING] [ID: ${t._id}] Khách: ${t.fullName} (${t.email}) · Nội dung: "${t.issue}"`);
          });
          return;
        }

        if (reason === "resolve") {
          if (!query) {
            setPendingCommand({ intent: "tickets", step: "waiting_query" });
            addLog("[AI INTERACTIVE] Bạn muốn giải quyết ticket nào? (Nhập ID ticket):", "warning");
            return;
          }
          addLog(`[PROCESSING] Đang giải quyết support ticket [ID: ${query}]...`, "info");
          await apiPatch(`${VITE_API}/support/tickets/${query}/resolve`);
          addLog(`[SUCCESS] Đã giải quyết xong và đóng support ticket [ID: ${query}].`, "success");
          return;
        }
      }

      // IOT DEVICE CONTROL
      if (intent === "iot") {
        if (reason === "list") {
          addLog("[PROCESSING] Đang quét danh sách thiết bị IoT hoạt động...", "info");
          const res = await apiFetch(`${VITE_API}/admin/iot/devices`);
          const devices = res.devices || [];
          if (devices.length === 0) {
            addLog("[INFO] Không có thiết bị IoT nào được đăng ký trên hệ thống.", "warning");
            return;
          }
          addLog("--- TRẠNG THÁI THIẾT BỊ IOT HỆ THỐNG ---", "info");
          devices.forEach((d) => {
            addLog(`- [${d.isActive ? "ACTIVE" : "INACTIVE"}] ${d.deviceName} (ID: ${d.deviceId}) · Loại: ${d.deviceType} · Email: ${d.email}`);
          });
          return;
        }

        if (reason === "toggle") {
          if (!query) {
            setPendingCommand({ intent: "iot", step: "waiting_query" });
            addLog("[AI INTERACTIVE] Bạn muốn bật/tắt thiết bị nào? (Nhập Tên hoặc ID thiết bị):", "warning");
            return;
          }
          addLog(`[PROCESSING] Đang thay đổi trạng thái hoạt động thiết bị: "${query}"...`, "info");
          const res = await apiPost(`${VITE_API}/admin/iot/toggle`, { deviceId: query });
          addLog(`[SUCCESS] ${res.message}`, "success");
          return;
        }
      }

      // COMMUNITY POSTS MODERATION
      if (intent === "posts") {
        if (reason === "list") {
          addLog("[PROCESSING] Đang tải danh sách bài viết cộng đồng...", "info");
          const posts = await apiFetch(`${VITE_API}/admin/community/posts`);
          if (posts.length === 0) {
            addLog("[INFO] Bảng tin cộng đồng trống.", "warning");
            return;
          }
          addLog("--- BÀI VIẾT CỘNG ĐỒNG GẦN ĐÂY ---", "info");
          posts.forEach((p) => {
            addLog(`- [ID: ${p._id}] Tác giả: ${p.senderName} (${p.senderEmail}) · Nội dung: "${p.message}" · Lượt thích: ${p.likesCount || 0}`);
          });
          return;
        }

        if (reason === "delete") {
          if (!query) {
            setPendingCommand({ intent: "posts", step: "waiting_query" });
            addLog("[AI INTERACTIVE] Bạn muốn xóa bài viết nào? (Nhập ID bài viết):", "warning");
            return;
          }
          addLog(`[PROCESSING] Đang gỡ bỏ bài viết cộng đồng [ID: ${query}]...`, "info");
          await apiDelete(`${VITE_API}/admin/community/posts/${query}`);
          addLog(`[SUCCESS] Đã gỡ bỏ bài viết [ID: ${query}] thành công.`, "success");
          return;
        }
      }

      // UTILITY STORE ORDERS MANAGEMENT
      if (intent === "orders") {
        if (reason === "list") {
          addLog("[PROCESSING] Đang tải danh sách đơn hàng Utility Store...", "info");
          const orders = await apiFetch(`${VITE_API}/utility-store/admin/orders`);
          if (orders.length === 0) {
            addLog("[INFO] Hệ thống chưa có đơn đặt hàng nào.", "warning");
            return;
          }
          addLog("--- DANH SÁCH ĐƠN HÀNG MỚI NHẤT ---", "info");
          orders.forEach((o) => {
            addLog(`- [${o.status.toUpperCase()}] [ID: ${o._id}] Member: ${o.email} · Sản phẩm: ${o.productName} · Giá: ${o.pricePaid} JOY`);
          });
          return;
        }

        if (reason === "complete" || reason === "cancel") {
          if (!query) {
            setPendingCommand({ intent: "orders", step: "waiting_query", action: reason });
            addLog(`[AI INTERACTIVE] Bạn muốn ${reason === "complete" ? "hoàn thành" : "hủy"} đơn hàng nào? (Nhập ID đơn đặt hàng):`, "warning");
            return;
          }
          const targetStatus = reason === "complete" ? "completed" : "cancelled";
          addLog(`[PROCESSING] Đang cập nhật trạng thái đơn hàng [ID: ${query}] sang: ${targetStatus.toUpperCase()}...`, "info");
          const res = await apiPost(`${VITE_API}/admin/orders/update-status`, { orderId: query, status: targetStatus });
          addLog(`[SUCCESS] ${res.message}`, "success");
          return;
        }
      }

      // 17. SEND AI NOTIFICATION & EMAIL COMMAND
      if (intent === "send-ai-notification") {
        const msgPrompt = query || reason || "Chào Mừng ngày mới";
        const target = recipient || "All";
        addLog(`[PROCESSING] Đang dùng AI soạn nội dung gửi thông báo & email đến: ${target}...`, "info");
        const res = await apiPost(`${VITE_API}/admin/send-ai-notification`, { recipient: target, prompt: msgPrompt });
        addLog(`[AI WRITER] Chủ đề Email: "${res.subject}"`, "success");
        addLog(`[AI WRITER] Tin nhắn Push: "${res.pushText}"`, "success");
        addLog(`[SUCCESS] Đã gửi thông báo & email thành công tới ${res.recipientCount} tài khoản!`, "success");
        return;
      }

      // Fallback
      addLog(`[ERROR] Không thể xử lý hành động: "${intent}".`, "error");

    } catch (err) {
      console.error(err);
      addLog(`[ERROR] Lỗi thực thi lệnh: ${err.message || err}`, "error");
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case "input":
        return "text-slate-300 font-bold";
      case "error":
        return "text-rose-500 font-bold";
      case "success":
        return "text-emerald-400 font-bold";
      case "info":
        return "text-cyan-400 font-semibold";
      case "warning":
        return "text-amber-400 font-semibold";
      default:
        return "text-emerald-500";
    }
  };

  return (
    <div 
      onClick={handleTerminalClick}
      className="bg-black text-emerald-500 font-mono p-5 rounded-3xl border border-slate-900 shadow-2xl h-[600px] flex flex-col justify-between overflow-hidden cursor-text select-text"
    >
      {/* Terminal Outputs Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-hide">
        {history.map((log, index) => (
          <div key={index} className="text-xs leading-relaxed break-all whitespace-pre-wrap">
            <span className={getLogColor(log.type)}>{log.text}</span>
            {log.component && <div className="mt-1">{log.component}</div>}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Command Input Bar */}
      <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 border-t border-slate-900 pt-3 mt-3 shrink-0">
        <span className="text-slate-400 font-bold text-xs shrink-0 select-none">
          {focusedUser ? `admin@hugostudio(user:${focusedUser.email}):~$` : "admin@hugostudio:~$"}
        </span>
        <div className="flex-1 relative flex items-center">
          {/* Ghost text display layer */}
          <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none text-xs font-mono select-none flex items-center pl-[2px]">
            <span className="text-transparent">{inputVal}</span>
            <span className="text-slate-700">{prediction}</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-emerald-400 outline-none border-none p-0 text-xs font-mono placeholder-emerald-900 relative z-10"
            placeholder={prediction ? "" : "Nhập lệnh ở đây..."}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
      </form>
    </div>
  );
}
