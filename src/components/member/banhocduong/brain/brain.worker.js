// Model chạy trong worker: sinh chữ nặng GPU/CPU, để ở luồng chính là khung chat
// đứng hình mỗi lần nhân vật "nghĩ".
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
