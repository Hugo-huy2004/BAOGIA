#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Công cụ quét và đánh giá toàn diện CV:
1. Độ tương thích hệ thống lọc ứng viên (ATS Score).
2. Mật độ từ khoá tuyển dụng ngành IT (Keyword Density).
3. Minh chứng thực chiến & kiểm chứng liên kết (Proof & Verification).
4. Chuẩn định dạng trang & khổ in A4 (Layout & Page Budget).
5. Chuẩn SEO & khả năng xuất hiện trên công cụ tìm kiếm (Search Engine Optimization).
"""

import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def run_cmd(cmd):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=ROOT)
    return res.stdout

def get_pdf_text(path, layout=True):
    full_path = os.path.join(ROOT, path)
    if not os.path.exists(full_path):
        return ""
    cmd = ["pdftotext"] + (["-layout"] if layout else []) + [full_path, "-"]
    return subprocess.run(cmd, capture_output=True, text=True).stdout

def get_pdf_pages(path):
    full_path = os.path.join(ROOT, path)
    if not os.path.exists(full_path):
        return 0
    cmd = f"pdfinfo {full_path} | grep 'Pages:'"
    out = run_cmd(cmd)
    m = re.search(r"Pages:\s+(\d+)", out)
    return int(m.group(1)) if m else 0

def evaluate():
    print("=" * 68)
    print(" BÁO CÁO ĐÁNH GIÁ TOÀN DIỆN HỒ SƠ CV (ATS + SEO + KEYWORDS + LAYOUT)")
    print("=" * 68)

    score = 0
    max_score = 100

    # ── 1. Đánh giá ATS Parsability (25 điểm) ─────────────────────────────────
    print("\n[1] ĐÁNH GIÁ TƯƠNG THÍCH HỆ THỐNG LỌC ATS (25 điểm)")
    ats_vi_text = get_pdf_text("public/cv-le-gia-huy-ats.pdf")
    ats_vi_flat = get_pdf_text("public/cv-le-gia-huy-ats.pdf", layout=False)
    ats_en_text = get_pdf_text("public/cv-le-gia-huy-ats-en.pdf")

    ats_checks = [
        ("Trích xuất ký tự văn bản chuẩn (pdftotext)", len(ats_vi_text) > 2000, 5, f"{len(ats_vi_text)} ký tự"),
        ("Thông tin liên hệ (Email & GitHub đọc chuẩn)", "contact@hugowishpax.studio" in ats_vi_text and "github.com" in ats_vi_text, 5, "Email + GitHub xác thực"),
        ("Cấu trúc tiêu đề mục chuẩn ATS (HỒ SƠ, KỸ NĂNG, HỌC VẤN, DỰ ÁN)", all(h in ats_vi_text.upper() for h in ["HỒ SƠ", "KỸ NĂNG", "HỌC VẤN", "DỰ ÁN"]), 5, "4/4 mục chuẩn"),
        ("Ký tự gạch đầu dòng thật (- ) cho máy đọc", ats_vi_text.count("\n- ") >= 8, 5, f"{ats_vi_text.count(chr(10) + '- ')} gạch"),
        ("Luồng văn bản 1 cột, không dính dòng (max line < 200)", max((len(l) for l in ats_vi_flat.splitlines()), default=0) < 200, 5, f"dòng max {max((len(l) for l in ats_vi_flat.splitlines()), default=0)} ký tự")
    ]

    for label, passed, pts, detail in ats_checks:
        if passed:
            score += pts
            print(f"  ✓ {label:<48} [{pts}/{pts}đ] {detail}")
        else:
            print(f"  ✗ {label:<48} [0/{pts}đ] {detail}")

    # ── 2. Đánh giá từ khoá tuyển dụng IT & Công nghệ (25 điểm) ──────────────
    print("\n[2] ĐÁNH GIÁ ĐỘ PHỦ TỪ KHOÁ TUYỂN DỤNG IT & CÔNG NGHỆ (25 điểm)")
    target_keywords = {
        "Frontend": ["React", "Next.js", "TypeScript", "JavaScript", "HTML/CSS", "Tailwind CSS", "PWA"],
        "Backend & DB": ["Node.js", "Express", "PHP", "REST API", "WebSocket", "SQL", "MongoDB", "Firebase", "SQLite"],
        "AI & Workflow": ["Prompt Engineering", "AI", "Quản lý dự án"],
        "DevOps": ["Git", "Vercel", "Render", "Cloudflare"]
    }

    vi_pdf_text = get_pdf_text("public/cv-le-gia-huy.pdf")
    all_found = []
    missing = []
    for cat, kws in target_keywords.items():
        found = [kw for kw in kws if kw.lower() in vi_pdf_text.lower()]
        all_found.extend(found)
        if len(found) == len(kws):
            print(f"  ✓ Danh mục {cat:<18}: {', '.join(found)}")
        else:
            not_f = [k for k in kws if k.lower() not in vi_pdf_text.lower()]
            missing.extend(not_f)
            print(f"  ~ Danh mục {cat:<18}: Đạt {len(found)}/{len(kws)} (thiếu: {', '.join(not_f)})")

    kw_coverage = len(all_found) / sum(len(kws) for kws in target_keywords.values())
    kw_pts = round(kw_coverage * 25)
    score += kw_pts
    print(f"  -> Điểm từ khoá tuyển dụng: {kw_pts}/25 điểm (Độ phủ {round(kw_coverage * 100)}%)")

    # ── 3. Minh chứng & Dự án thực chiến (20 điểm) ────────────────────────────
    print("\n[3] MINH CHỨNG NĂNG LỰC, DỰ ÁN & KIỂM CHỨNG LIÊN KẾT (20 điểm)")
    proof_checks = [
        ("6 dự án có mô tả năng lực & vai trò cụ thể", vi_pdf_text.count("Thiết kế") >= 5, 5, "Hành động năng lực rõ ràng"),
        ("Đường dẫn mã nguồn GitHub đầy đủ (in ra giấy xem được)", len(re.findall(r"github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", vi_pdf_text)) >= 4, 5, "4 repo đầy đủ URL"),
        ("Chứng chỉ tiếng Anh & Học vấn Greenwich tích lũy GPA", "3.6/4.0" in vi_pdf_text and "VSTEP B2" in vi_pdf_text, 5, "Greenwich GPA 3.6/4.0 + VSTEP B2"),
        ("Kiểm chứng vai trò Huynh trưởng / Ban Điều Hành có web link", "chanhtoa.tnttgiaophanmytho.online" in vi_pdf_text, 5, "chanhtoa.tnttgiaophanmytho.online")
    ]

    for label, passed, pts, detail in proof_checks:
        if passed:
            score += pts
            print(f"  ✓ {label:<48} [{pts}/{pts}đ] {detail}")
        else:
            print(f"  ✗ {label:<48} [0/{pts}đ] {detail}")

    # ── 4. Chuẩn định dạng & Khổ in A4 (15 điểm) ──────────────────────────────
    print("\n[4] CHUẨN KHỔ IN A4 & BẢN XUẤT CHO NGƯỜI ĐỌC (15 điểm)")
    pages_vi = get_pdf_pages("public/cv-le-gia-huy.pdf")
    pages_en = get_pdf_pages("public/cv-le-gia-huy-en.pdf")
    pages_zh = get_pdf_pages("public/cv-le-gia-huy-zh.pdf")
    pages_ats = get_pdf_pages("public/cv-le-gia-huy-ats.pdf")

    layout_checks = [
        ("Bản tiếng Việt vừa vặn đúng 1 trang A4", pages_vi == 1, 5, f"{pages_vi} trang"),
        ("Bản tiếng Anh vừa vặn đúng 1 trang A4", pages_en == 1, 5, f"{pages_en} trang"),
        ("Bản tiếng Trung vừa vặn đúng 1 trang A4", pages_zh == 1, 5, f"{pages_zh} trang")
    ]

    for label, passed, pts, detail in layout_checks:
        if passed:
            score += pts
            print(f"  ✓ {label:<48} [{pts}/{pts}đ] {detail}")
        else:
            print(f"  ✗ {label:<48} [0/{pts}đ] {detail}")

    # ── 5. Chuẩn SEO & Khả năng tìm kiếm trên Google/Bing (15 điểm) ───────────
    print("\n[5] CHUẨN SEO WEB & XUẤT HIỆN KHI TÌM KIẾM KEYWORD TUYỂN DỤNG (15 điểm)")
    html_path = os.path.join(ROOT, "public/cv/index.html")
    html_content = open(html_path, "r", encoding="utf-8").read()

    seo_checks = [
        ("Tiêu đề chứa tên ứng viên + vị trí + từ khoá tuyển dụng", bool(re.search(r"<title>[\s\S]*?Lê Gia Huy[\s\S]*?Tuyển Dụng[\s\S]*?</title>", html_content)), 3, "Title tối ưu tìm kiếm"),
        ("Thẻ Meta Description chứa tóm tắt năng lực & liên hệ", bool(re.search(r'<meta name="description" content="[\s\S]{70,300}"', html_content)), 3, "Meta Description đạt chuẩn"),
        ("Thẻ Meta Keywords chứa đầy đủ từ khoá tìm việc IT", bool(re.search(r'<meta name="keywords" content="[\s\S]*?Lê Gia Huy[\s\S]*?React[\s\S]*?"', html_content)), 3, "Keywords phong phú"),
        ("Open Graph & Twitter Cards chia sẻ mạng xã hội", 'property="og:title"' in html_content and 'name="twitter:card"' in html_content, 3, "Rich snippet đầy đủ"),
        ("Dữ liệu có cấu trúc Schema.org (Person + ProfilePage)", '"@type": "Person"' in html_content and '"@type": "ProfilePage"' in html_content, 3, "Google Rich Results chuẩn")
    ]

    for label, passed, pts, detail in seo_checks:
        if passed:
            score += pts
            print(f"  ✓ {label:<48} [{pts}/{pts}đ] {detail}")
        else:
            print(f"  ✗ {label:<48} [0/{pts}đ] {detail}")

    # ── TỔNG KẾT ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 68)
    print(f" TỔNG ĐIỂM ĐÁNH GIÁ CV: {score}/{max_score} ĐIỂM")
    if score >= 90:
        print(" XẾP LOẠI: XUẤT SẮC (Sẵn sàng gửi ứng tuyển mọi tập đoàn & săn việc)")
    elif score >= 80:
        print(" XẾP LOẠI: TỐT")
    else:
        print(" XẾP LOẠI: CẦN CẢI THIỆN")
    print("=" * 68)

if __name__ == "__main__":
    evaluate()
