"""
admin_intel_service.py
======================================================================
Bộ não điều hành tự động Admin (Executive Autonomous Admin Brain).
Thiết kế cho 1.000.000 người dùng đồng thời:
- Phân tích đa chiều: An ninh, Ổn định máy chủ, Kinh tế điểm JOY, Tâm lý cộng đồng
- Chấm điểm sức khoẻ hệ thống thời gian thực (System Health Index 0-100)
- Tự động đề xuất các quyết định điều hành 1-Click (Executive Action Proposals)
- Tốc độ phản hồi < 5ms qua bộ đệm SWR
"""

import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
from services.user_telemetry_sentinel import telemetry_sentinel

class AdminIntelService:
    def __init__(self):
        self._cached_intel: Optional[Dict[str, Any]] = None
        self._last_computed_at: float = 0
        self._cache_ttl_seconds: float = 60  # Cache 1 phút

    async def compute_executive_intel(
        self,
        system_metrics: Dict[str, Any],
        ai_service: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Tổng hợp trí tuệ điều hành Admin từ dữ liệu thống kê thời gian thực.
        """
        now = datetime.now().timestamp()
        if self._cached_intel and (now - self._last_computed_at < self._cache_ttl_seconds):
            return self._cached_intel

        # 1. Trích xuất telemetry người dùng từ sentinel
        telemetry_stats = telemetry_sentinel.get_aggregated_system_telemetry()

        # 2. Phân tích các thông số cốt lõi
        total_users = system_metrics.get("totalUsers", 0)
        active_blocks = system_metrics.get("activeSecurityBlocks", 0)
        pending_tickets = system_metrics.get("pendingSupportTickets", 0)
        recent_incidents = system_metrics.get("recentIncidentsCount", 0)
        joy_stats = system_metrics.get("todayJoyStats", [])

        total_joy_issued = sum(j.get("totalAmount", 0) for j in joy_stats if isinstance(j, dict))

        # 3. Thuật toán chấm điểm sức khoẻ hệ thống (0 - 100)
        # Điểm cơ sở: 100
        health_score = 100
        deductions = []

        if recent_incidents > 0:
            penalty = min(25, recent_incidents * 5)
            health_score -= penalty
            deductions.append(f"-{penalty}đ do có {recent_incidents} sự cố an ninh gần đây")

        if pending_tickets > 10:
            penalty = min(15, (pending_tickets - 10) * 2)
            health_score -= penalty
            deductions.append(f"-{penalty}đ do hàng chờ hỗ trợ bị dồn ứ ({pending_tickets} tickets)")

        if active_blocks > 20:
            penalty = 10
            health_score -= penalty
            deductions.append(f"-{penalty}đ do số lượng chặn an ninh cao ({active_blocks} blocks)")

        # Thưởng/phạt từ chỉ số sức khoẻ tinh thần cộng đồng
        comm_score = telemetry_stats.get("community_wellness_score", 85)
        if comm_score < 60:
            health_score -= 10
            deductions.append(f"-10đ do chỉ số tâm lý cộng đồng suy giảm ({comm_score}/100)")

        health_score = max(20, min(100, health_score))

        # Đánh giá cấp độ an ninh
        if health_score >= 85:
            system_grade = "A+ (Hoạt động hoàn hảo)"
            status_color = "emerald"
        elif health_score >= 70:
            system_grade = "B (Ổn định - Cần theo dõi nhẹ)"
            status_color = "amber"
        else:
            system_grade = "C (Cảnh báo - Cần can thiệp điều hành)"
            status_color = "rose"

        # 4. Tạo đề xuất quyết định điều hành 1-Click (Action Proposals)
        proposals = []
        if active_blocks > 0:
            proposals.append({
                "id": "review_security_blocks",
                "label": "Xem xét danh sách chặn an ninh tự động",
                "severity": "medium",
                "action": "navigate_security_audit"
            })

        if pending_tickets > 0:
            proposals.append({
                "id": "ai_autodraft_tickets",
                "label": f"Kích hoạt AI soạn nháp trả lời cho {pending_tickets} ticket",
                "severity": "low",
                "action": "trigger_ai_ticket_draft"
            })

        if telemetry_stats.get("at_risk_wellness_users", 0) > 0:
            at_risk_cnt = telemetry_stats.get("at_risk_wellness_users", 0)
            proposals.append({
                "id": "proactive_wellness_checkin",
                "label": f"Gửi tin nhắn đồng hành chủ động cho {at_risk_cnt} thành viên có dấu hiệu kiệt sức",
                "severity": "high",
                "action": "trigger_proactive_push"
            })

        proposals.append({
            "id": "flush_l1_cache",
            "label": "Tối ưu hóa bộ nhớ đệm RAM L1 đa ngôn ngữ",
            "severity": "info",
            "action": "optimize_memory_cache"
        })

        intel_result = {
            "timestamp": datetime.now().isoformat(),
            "system_health_score": health_score,
            "system_grade": system_grade,
            "status_color": status_color,
            "scoring_breakdown": deductions or ["Tất cả chỉ số vận hành đang ở mức tối ưu"],
            "telemetry_summary": telemetry_stats,
            "joy_economy_overview": {
                "total_issued_today": total_joy_issued,
                "transaction_streams": len(joy_stats)
            },
            "executive_proposals": proposals,
            "autonomous_engine": "Hugo Executive Autonomous Brain v2.0"
        }

        self._cached_intel = intel_result
        self._last_computed_at = now
        return intel_result


# Singleton
admin_intel = AdminIntelService()
