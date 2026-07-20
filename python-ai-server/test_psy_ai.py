import urllib.request
import json

url = "http://127.0.0.1:8000/api/ai/chat"
headers = {
    "Content-Type": "application/json",
    "X-Internal-Key": "sec_4a7b219e831f24dcd93081e7d0fbe0d7"
}
payload = {
    "message": "Tớ đang cảm thấy cực kỳ stress vì kỳ thi cuối kỳ sắp tới, tớ học mãi mà không nhớ được gì cả...",
    "bio": {
        "displayName": "Hugo",
        "age": 20
    }
}

req = urllib.request.Request(
    url, 
    data=json.dumps(payload).encode("utf-8"), 
    headers=headers,
    method="POST"
)

try:
    print("⏳ Đang gửi câu hỏi test đến HugoPSY AI (Sử dụng model Gemini 2.5 Pro)...")
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        print("\n✨ CÂU TRẢ LỜI CỦA HugoPSY AI:")
        print("--------------------------------------------------------------------------------")
        reply = res_data.get("reply", "")
        # Thay thế dấu phân tách '|||' bằng ngắt dòng để xem trực quan
        formatted_reply = reply.replace("|||", "\n\n💬 [Tin nhắn tiếp theo]:\n")
        print(formatted_reply)
        print("--------------------------------------------------------------------------------")
except Exception as e:
    print(f"❌ Lỗi khi test AI: {e}")
