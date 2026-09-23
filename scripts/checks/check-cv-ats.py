# -*- coding: utf-8 -*-
"""Soát bản ATS theo những thứ hệ thống lọc hồ sơ thật sự làm."""
import os, re, subprocess, sys

PDFS = (("public/cv-le-gia-huy-ats.pdf", "vi"), ("public/cv-le-gia-huy-ats-en.pdf", "en"))

def text(path, layout=True):
    cmd = ["pdftotext"] + (["-layout"] if layout else []) + [path, "-"]
    return subprocess.run(cmd, capture_output=True, text=True).stdout

# Các bản PDF là SẢN PHẨM DỰNG, không commit vào repo (xem docs/cv-noi-dung.md).
# Thiếu tệp thì nói thẳng ra, đừng để pdftotext trả chuỗi rỗng rồi vỡ ở max().
missing = [p for p, _ in PDFS if not os.path.exists(p)]
if missing:
    print("Chưa có bản PDF để soát: " + ", ".join(missing))
    print("Dựng lại bằng: npm run cv:pdf")
    sys.exit(1)

for path, lang in PDFS:
    t = text(path)
    flat = text(path, layout=False)
    print(f"\n════ {path}")
    checks = []
    checks.append(("Rút được chữ (không phải ảnh quét)", len(t) > 1500, f"{len(t)} ký tự"))
    checks.append(("Email đọc được", bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", t)), re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", t).group(0) if re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", t) else "—"))
    heads = ["HỒ SƠ","KỸ NĂNG","HỌC VẤN","DỰ ÁN"] if lang == "vi" else ["PROFILE","SKILLS","EDUCATION","PROJECTS"]
    found = [h for h in heads if h in t.upper()]
    checks.append(("Nhãn mục chuẩn", len(found) == len(heads), " · ".join(found)))
    checks.append(("Gạch đầu dòng có ký tự thật", t.count("\n- ") >= 8, f"{t.count(chr(10) + '- ')} gạch"))
    urls = re.findall(r"github\.com/[\w./-]+", t)
    checks.append(("Địa chỉ mã nguồn hiện thành chữ", len(urls) >= 4, f"{len(urls)} địa chỉ"))
    checks.append(("Không dính cột (một dòng < 200 ký tự)", max(len(l) for l in flat.splitlines() or [""]) < 200, f"dòng dài nhất {max(len(l) for l in flat.splitlines())}"))
    years = re.findall(r"\b(20\d\d)\b", t)
    checks.append(("Mốc thời gian đọc được", len(set(years)) >= 3, " ".join(sorted(set(years)))))
    kw = ["React", "Node.js", "TypeScript", "MongoDB", "Git"]
    miss = [k for k in kw if k not in t]
    checks.append(("Từ khoá công nghệ nguyên vẹn", not miss, "thiếu: " + ", ".join(miss) if miss else "đủ"))

    for name, ok, detail in checks:
        print(f"  {'✓' if ok else '✗'} {name.ljust(38)} {detail}")
