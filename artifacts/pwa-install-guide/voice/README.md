# Lời đọc video cài PWA

- `source/<lang>.mp3` — bản ElevenLabs liền một mạch (vi: Tuấn Anh, en/zh: Hope;
  Multilingual v2). Lời: `../voice-script.md`.
- `<lang>-01.mp3 … -07.mp3` — 7 đoạn theo cảnh, tách bằng
  `node artifacts/pwa-install-guide/source/split-voice.mjs <lang> <6 điểm cắt>`.

Điểm cắt đang dùng (giây, giữa khoảng lặng giữa hai đoạn):

| lang | cuts |
| --- | --- |
| vi | 5.17,13.96,18.11,21.53,27.25,34.65 |
| en | 5.56,14.71,19.05,22.28,28.70,37.16 |
| zh | 5.51,16.10,20.57,24.58,31.21,39.08 |

Thu lại một thứ tiếng: thay `source/<lang>.mp3`, tìm khoảng lặng bằng
`ffmpeg -i source/<lang>.mp3 -af silencedetect=noise=-35dB:d=0.3 -f null -`,
tách lại, rồi `node artifacts/pwa-install-guide/source/render.mjs <lang>`.
