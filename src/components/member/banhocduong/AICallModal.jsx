import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";

export default function AICallModal({ isOpen, onClose, botManager }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [callState, setCallState] = useState("dialing"); // dialing, connected, error
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const [volume, setVolume] = useState(0); // Dùng cho hiệu ứng sóng âm lúc user nói

  const ringIntervalRef = useRef(null);
  const synthRef = useRef(null);

  const recognitionRef = useRef(null); // Dùng để detect lúc im lặng

  const currentAudioRef = useRef(null); // Dùng để phát âm thanh AI
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      initiateCall();
    } else {
      stopEverything();
    }
    return () => {
      stopEverything();
    };
  }, [isOpen]);

  const stopEverything = () => {
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    if (synthRef.current) window.speechSynthesis.cancel();
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setIsProcessing(false);
    setAiSpeaking(false);
    setVolume(0);
    setCallState("idle");
  };

  const setupAudioVisualizer = (stream) => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    analyserRef.current = audioContextRef.current.createAnalyser();
    microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
    microphoneRef.current.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      if (!isListening) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      setVolume(average);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        requestAnimationFrame(updateVolume);
      }
    };
    updateVolume();
  };

  const playRingtone = () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(425, ctx.currentTime);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gainNode.gain.setValueAtTime(0.1, now + 0.4);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.45);
    
    gainNode.gain.setValueAtTime(0, now + 0.65);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.7);
    gainNode.gain.setValueAtTime(0.1, now + 1.05);
    gainNode.gain.linearRampToValueAtTime(0, now + 1.1);

    osc.start(now);
    osc.stop(now + 1.2);
  };

  const initiateCall = async () => {
    setCallState("dialing");
    setTranscript("Đang kết nối đến chuyên gia AI...");
    setIsListening(false);
    setIsProcessing(true); // Hiệu ứng loader avatar
    setAiSpeaking(false);

    // Phát tiếng chuông reng reng mỗi 2 giây
    const playRing = () => { try { playRingtone(); } catch(e) {} };
    playRing();
    ringIntervalRef.current = setInterval(playRing, 2000);

    // Gửi tín hiệu kiểm tra (ping) tới backend để xem có bị lỗi hoặc quá tải không
    try {
        const pingResponse = await botManager.chat("Alo, cậu nghe rõ tớ không?");
        const replyText = pingResponse?.reply || "";

        if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
        
        if (replyText.includes("quá tải") || replyText.includes("hạn mức") || replyText.includes("lịch bận")) {
            setCallState("error");
            setIsProcessing(false);
            setTranscript("Chuyên gia AI đang bận...");
            speakAndClose("Chào bạn! Chuyên viên AI đang có lịch bận, vui lòng gọi lại tớ sau vài phút.");
        } else {
            setCallState("connected");
            setIsProcessing(false);
            speakAndStartListening(replyText || "Chào cậu, tớ lắng nghe đây!");
        }
    } catch (err) {
        if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
        setCallState("error");
        setIsProcessing(false);
        speakAndClose("Chào bạn! Chuyên viên AI đang có lịch bận, vui lòng gọi lại tớ sau vài phút.");
    }
  };

  const speakAndClose = (text) => {
    setAiSpeaking(true);
    synthRef.current = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.onend = () => {
        setAiSpeaking(false);
        synthRef.current = false;
        setTimeout(() => { onClose(); }, 500); // Tự động tắt sau khi nói xong
    };
    window.speechSynthesis.speak(utterance);
  };

  const speakAndStartListening = (text) => {
    setAiSpeaking(true);
    setTranscript(text);
    synthRef.current = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.onend = () => {
        setAiSpeaking(false);
        synthRef.current = false;
        startListeningSequence(); // Bắt đầu thu âm của user
    };
    window.speechSynthesis.speak(utterance);
  };

  const startListeningSequence = async () => {
    try {
      setIsListening(true);
      setAiSpeaking(false);
      setIsProcessing(false);
      setTranscript("Đang nghe...");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setupAudioVisualizer(stream);

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          await processAudio(audioBlob);
        } else {
          // Khởi động lại nếu không thu được gì
          startListeningSequence();
        }
      };

      mediaRecorder.start();

      // Sử dụng SpeechRecognition để ngắt tự động khi ngừng nói
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'vi-VN';
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onresult = (event) => {
          const result = event.results[0][0].transcript;
          setTranscript(result);
        };

        recognition.onspeechend = () => {
          // Ngừng nói thì dừng thu âm
          recognition.stop();
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        };

        recognition.onerror = (e) => {
          console.warn("Speech recognition error:", e.error);
          // Fallback: Nếu không detect được, dừng sau 5s (hoặc cần nút thủ công)
          if (e.error === 'no-speech' && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        };

        recognition.start();
      } else {
        // Trình duyệt không hỗ trợ SpeechRecognition -> fallback dừng sau 7 giây
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }, 7000);
      }
    } catch (err) {
      console.error("Lỗi Microphone:", err);
      setTranscript("Không thể truy cập Microphone.");
      setIsListening(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setIsListening(false);
    setIsProcessing(true);
    setTranscript("Đang phân tích...");
    setVolume(0);

    const response = await botManager.chatAudio(audioBlob, true); // true = isCallMode
    setIsProcessing(false);

    if (response && response.audio_base64) {
      playAIAudio(response.audio_base64, response.text);
    } else if (response && response.is_error) {
      // Backend error (e.g. 429 quota exhausted)
      setTranscript(response.text);
      speakAndClose(response.text);
    } else {
      // Có text nhưng không có audio (do fallback)
      speakAndStartListening(response?.text || "Có lỗi xảy ra, không nhận được phản hồi.");
    }
  };

  const playAIAudio = (base64Audio, text) => {
    setAiSpeaking(true);
    setTranscript(text || "AI đang trả lời...");
    const audio = new Audio("data:audio/webm;base64," + base64Audio);
    currentAudioRef.current = audio;

    audio.onended = () => {
      setAiSpeaking(false);
      currentAudioRef.current = null;
      // Khi AI nói xong -> Bật Mic để user nói tiếp
      setTimeout(startListeningSequence, 500);
    };

    audio.onerror = () => {
      console.error("Lỗi phát audio AI");
      setAiSpeaking(false);
      setTimeout(startListeningSequence, 1000);
    };

    audio.play().catch(err => {
      console.error("Lỗi autoplay:", err);
      setAiSpeaking(false);
      setTimeout(startListeningSequence, 1000);
    });
  };

  const toggleMic = () => {
    if (isListening) {
      // Dừng sớm
      if (recognitionRef.current) recognitionRef.current.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    } else if (!isProcessing && !aiSpeaking) {
      startListeningSequence();
    }
  };

  if (!isOpen) return null;

  const getVisualizerScale = () => {
    if (aiSpeaking) {
      // Scale ngẫu nhiên cho AI đang nói
      return 1.2 + Math.random() * 0.4;
    }
    if (isListening) {
      return 1 + (volume / 256) * 1.5;
    }
    return 1;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-zinc-950 text-white p-6"
        >
          {/* Header */}
          <div className="w-full flex justify-between items-center pt-8 px-4">
            <div className="flex flex-col">
              <span className="text-zinc-400 text-sm">{callState === "dialing" ? "Đang đổ chuông..." : callState === "error" ? "Cuộc gọi bị hủy" : "Đang trong cuộc gọi"}</span>
              <span className="font-semibold text-lg flex items-center gap-2">
                {callState === "connected" && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                {callState === "dialing" && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>}
                {callState === "error" && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                Chuyên gia AI
              </span>
            </div>
          </div>

          {/* Center Visualizer */}
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Vòng sáng bên ngoài */}
              <motion.div 
                animate={{ scale: getVisualizerScale() }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`absolute inset-0 rounded-full blur-xl opacity-50 ${aiSpeaking ? 'bg-blue-500' : isListening ? 'bg-purple-500' : 'bg-zinc-800'}`}
              ></motion.div>
              
              {/* Hình đại diện (vòng tròn chính) */}
              <div className={`relative w-32 h-32 rounded-full flex items-center justify-center z-10 border-4 shadow-2xl transition-all duration-300 overflow-hidden ${aiSpeaking ? 'border-blue-400 bg-blue-900' : isListening ? 'border-purple-400 bg-purple-900' : 'border-zinc-700 bg-zinc-800'}`}>
                {isProcessing ? (
                  <Loader2 className="w-12 h-12 animate-spin text-zinc-300" />
                ) : (
                  <img src="/image/avt7.png" alt="AI Avatar" className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            {/* Transcript/Status */}
            <div className="mt-12 text-center px-4 max-w-md h-24">
              <p className={`text-lg transition-all duration-300 ${aiSpeaking ? 'text-blue-300' : 'text-zinc-300'}`}>
                {transcript}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full max-w-xs flex justify-around items-center pb-12">
            <button 
              onClick={toggleMic}
              disabled={isProcessing || aiSpeaking}
              className={`p-4 rounded-full transition-all ${isListening ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            <button 
              onClick={onClose}
              className="p-5 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all hover:scale-110"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
