#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Soát bộ đồng hành HugoPsy — chạy: npm run check:psy

Bắt lại đúng ba lỗi đã từng có thật (xem đầu hugopsy_companion_engine.py).
Quan trọng nhất là phép kiểm SỐ HOTLINE: tin khủng hoảng từng bị cắt cụt ở dấu
xuống dòng đầu tiên, người đang nghĩ tới chuyện tự hại nhận được lời an ủi mà
KHÔNG có một số điện thoại nào. Phép kiểm này mô phỏng đúng bộ đọc luồng của
client, không tin vào cái server định gửi.
"""
import asyncio, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "python-ai-server"))
from services.hugopsy_companion_engine import (  # noqa: E402
    hugopsy_engine as engine, CRISIS_RESPONSE_VI, TOPICS, detect_address, render,
)

HOTLINES = ["096 306 1414", "111", "1900 599 830"]
fails = []


def client_parse(frames):
    """Bản sao vòng đọc ở src/services/classes/CompanionBot/AIBot.js — tách theo
    DÒNG, chỉ nhận dòng mở đầu bằng 'data: '. Sửa bên kia thì sửa cả đây."""
    out = ""
    for raw in "".join(frames).split("\n"):
        line = raw.strip()
        if not line.startswith("data: "):
            continue
        body = line[6:].strip()
        if body == "[DONE]":
            continue
        try:
            payload = json.loads(body)
            out += payload.get("text", "")
        except json.JSONDecodeError:
            out += body
    return out


async def reply(message, history=None, bio=None):
    frames = [f async for f in engine.stream_chat_resilient(message, history=history, bio=bio)]
    return client_parse(frames)


def check(name, ok, detail=""):
    print(f"  {'✅' if ok else '❌'} {name}" + (f" — {detail}" if detail else ""))
    if not ok:
        fails.append(name)


async def main():
    print("Radar khủng hoảng")
    for msg in ["mình muốn chết", "tôi không muốn sống nữa", "em muốn tự tử",
                "uớc gì mình biến mất", "sống làm gì nữa"]:
        check(f"nhận ra {msg!r}", engine.is_crisis(msg))
    check("không báo động nhầm câu thường", not engine.is_crisis("hôm nay mình hơi mệt"))

    print("\nTin khủng hoảng tới tay người dùng nguyên vẹn")
    msg = "mình không muốn sống nữa"
    expected = render(CRISIS_RESPONSE_VI, detect_address(msg))
    got = await reply(msg)
    check("không bị cắt ở dấu xuống dòng", got == expected,
          f"{len(got)}/{len(expected)} ký tự")
    check("không sót chỗ trống đại từ", "{user}" not in got and "{self}" not in got)
    for number in HOTLINES:
        check(f"số {number} tới nơi", number in got)

    print("\nChữ không dính nhau (client .trim() từng mẩu)")
    for msg in ["mình buồn", "áp lực quá", "không ngủ được"]:
        got = await reply(msg)
        check(f"{msg!r} không có khoảng trắng kép", "  " not in got, got[:48] + "…")
        check(f"{msg!r} không sót chỗ trống", "{" not in got)

    print("\nPhủ chủ đề — người Việt gõ CÓ DẤU")
    samples = {
        "tôi thấy buồn quá": "sadness", "mình lo lắng về kỳ thi": "anxiety",
        "áp lực công việc nặng quá": "stress", "dạo này cô đơn lắm": "loneliness",
        "mình thấy mình vô dụng": "self_worth", "tức không chịu nổi": "anger",
        "vừa chia tay người yêu": "relationship", "bố mẹ suốt ngày so sánh": "family",
        "mấy hôm nay không ngủ được": "sleep", "thấy trống rỗng": "numb",
        "kiệt sức rồi": "burnout", "ông em vừa qua đời": "grief",
        "em thấy có lỗi lắm": "guilt", "đau đầu suốt": "body",
    }
    for msg, expected in samples.items():
        ids = [t["id"] for t in engine.detect_topics(msg)]
        check(f"{msg!r} → {expected}", expected in ids, ", ".join(ids) or "không khớp")

    print("\nĐa diện: một câu hai vấn đề")
    ids = [t["id"] for t in engine.detect_topics("áp lực thi cử làm em mất ngủ")]
    check("nhận ra cả hai chủ đề", len(ids) >= 2, ", ".join(ids))

    print("\nKhông lặp nguyên văn khi nói mãi một chuyện")
    history, seen = [], []
    for _ in range(4):
        r = await reply("mình buồn quá", history=list(history))
        seen.append(r)
        history += [{"role": "user", "content": "mình buồn quá"},
                    {"role": "model", "content": r}]
    check("bốn lượt đều khác nhau", len(set(seen)) == 4, f"{len(set(seen))}/4 câu khác nhau")

    print("\nMọi chủ đề đều đủ biến thể")
    for topic in TOPICS:
        check(f"{topic['id']} có ≥3 phản chiếu và ≥3 câu hỏi",
              len(topic["reflect"]) >= 3 and len(topic["ask"]) >= 3)

    print()
    if fails:
        print(f"❌ HugoPsy: {len(fails)} phép kiểm hỏng")
        for name in fails:
            print(f"   · {name}")
        sys.exit(1)
    print("✅ HugoPsy đạt — hotline tới nơi, chữ liền mạch, chủ đề phủ đủ, không lặp")


asyncio.run(main())
