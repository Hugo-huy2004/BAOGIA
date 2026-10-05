import { useState, useEffect, useCallback } from "react";
import { getAdminSession, logoutAuth } from "../services/api/core/authSession";
import { adminBrainApi } from "../services/api/modules/adminBrainApi";
import useVisiblePoll from "./useVisiblePoll";

const API_BASE = () => import.meta.env.VITE_API_URL || "/api";

/**
 * State cốt lõi của AdminPanel: xác thực, số liệu tổng quan, cảnh báo khủng
 * hoảng và AI briefing. Tách ra đây để AdminPanel.jsx chỉ còn layout thuần.
 */
export function useAdminPanel() {
  // ─── Auth ────────────────────────────────────────────────────────────────
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState("");

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      setIsAuthenticated(true);
      if (session.token) setAdminToken(session.token);
    }
    setAuthChecking(false);
  }, []);

  const handleLogout = useCallback(() => {
    logoutAuth();
    window.location.href = "/login";
  }, []);

  // ─── Overview Counts ─────────────────────────────────────────────────────
  const [counts, setCounts] = useState({
    users: 0, contactSupport: 0, utilityStore: 0,
    projects: 0, openTickets: 0, totalProjects: 0,
    packages: 0, queue: 0,
  });

  const fetchOverviewCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const apiBase = API_BASE();
      const [ticketsRes, packagesRes, projectsRes] = await Promise.allSettled([
        fetch(`${apiBase}/support/tickets?status=pending`, { credentials: "include" }).then(r => r.ok ? r.json() : {}),
        fetch(`${apiBase}/packages`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
        fetch(`${apiBase}/customer-projects`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
      ]);

      const openTickets = ticketsRes.status === "fulfilled"
        ? (ticketsRes.value?.pendingCount ?? ticketsRes.value?.pagination?.total ?? 0) : 0;
      const packagesCount = packagesRes.status === "fulfilled" && Array.isArray(packagesRes.value)
        ? packagesRes.value.length : 0;
      const projectsCount = projectsRes.status === "fulfilled" && Array.isArray(projectsRes.value)
        ? projectsRes.value.length : 0;

      let queueTotal = 0;
      try { queueTotal = (await adminBrainApi.getWorkQueue(200))?.counts?.total || 0; } catch {}

      setCounts(prev => ({
        ...prev, openTickets, contactSupport: openTickets,
        packages: packagesCount, totalProjects: projectsCount,
        projects: projectsCount, queue: queueTotal,
      }));
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => { fetchOverviewCounts(); }, [fetchOverviewCounts]);

  // ─── Crisis Alerts ───────────────────────────────────────────────────────
  const [crisisAlerts, setCrisisAlerts] = useState([]);

  const fetchCrisisAlerts = useCallback(() => {
    const apiBase = API_BASE();
    const headers = {};
    const session = getAdminSession();
    if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;
    fetch(`${apiBase}/companion/admin/crisis-alerts`, { headers, credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCrisisAlerts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useVisiblePoll(fetchCrisisAlerts, 15000);

  const handleResolveCrisisAlert = useCallback((alert) => {
    const apiBase = API_BASE();
    const headers = { "Content-Type": "application/json" };
    const session = getAdminSession();
    if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;
    fetch(`${apiBase}/companion/crisis/resolve`, {
      method: "POST", headers, credentials: "include",
      body: JSON.stringify({ email: alert.email, flagId: alert.flagId }),
    })
      .then(() => setCrisisAlerts(prev => prev.filter(a => a.flagId !== alert.flagId)))
      .catch(() => {});
  }, []);

  // ─── AI Support Briefing ─────────────────────────────────────────────────
  const [aiBriefingModalOpen, setAiBriefingModalOpen] = useState(false);
  const [aiBriefingData, setAiBriefingData] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const apiBase = API_BASE();
    fetch(`${apiBase}/admin/ai-support/briefing`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && data.hasBriefing) {
          setAiBriefingData(data);
          setAiBriefingModalOpen(true);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleCloseAiBriefing = useCallback(() => {
    setAiBriefingModalOpen(false);
    const apiBase = API_BASE();
    fetch(`${apiBase}/admin/ai-support/mark-read`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  }, []);

  // ─── Telegram deep-link token ────────────────────────────────────────────
  const [robotDeepLinkToken] = useState(() => {
    return new URLSearchParams(window.location.search).get("robotToken") || "";
  });

  return {
    authChecking, isAuthenticated, adminToken,
    handleLogout,
    counts, setCounts, fetchOverviewCounts,
    crisisAlerts, handleResolveCrisisAlert,
    aiBriefingModalOpen, aiBriefingData, handleCloseAiBriefing,
    robotDeepLinkToken,
  };
}
