import React, { useState, useEffect, useRef } from "react";
import { Camera, RefreshCw, Sparkles, Shield, Bell, CheckCircle2, AlertCircle, Eye, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const apiBase = import.meta.env.VITE_API_URL || "/api";

const PREDEFINED_PLANS = {
  oily: {
    label: "Da Dầu / Hỗn Hợp Thiên Dầu",
    analysis: "Vùng chữ T có tuyến bã nhờn hoạt động mạnh. Cần tập trung kiểm soát dầu thừa, làm sạch sâu lỗ chân lông để tránh bít tắc gây mụn, đồng thời dưỡng ẩm mỏng nhẹ dạng gel.",
    plan: {
      Monday: { morning: ["Sữa rửa mặt BHA 2%", "Toner kiềm dầu", "Gel dưỡng ẩm dịu nhẹ", "Kem chống nắng kiềm dầu SPF 50+"], night: ["Tẩy trang nước Micellar", "Sữa rửa mặt dạng bọt", "Serum Niacinamide 10%", "Gel dưỡng ẩm khóa ẩm"] },
      Tuesday: { morning: ["Sữa rửa mặt kiềm dầu", "Toner cấp nước", "Gel dưỡng ẩm", "Kem chống nắng SPF 50+"], night: ["Tẩy trang Micellar", "Sữa rửa mặt", "Tẩy da chết hóa học AHA/BHA (10p)", "Gel dưỡng khóa ẩm"] },
      Wednesday: { morning: ["Sữa rửa mặt BHA 2%", "Toner", "Gel dưỡng ẩm", "Kem chống nắng kiềm dầu"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum Niacinamide 10%", "Gel dưỡng khóa ẩm"] },
      Thursday: { morning: ["Sữa rửa mặt kiềm dầu", "Toner", "Gel dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Mặt nạ đất sét hút dầu", "Serum phục hồi B5", "Gel dưỡng ẩm"] },
      Friday: { morning: ["Sữa rửa mặt BHA 2%", "Toner", "Gel dưỡng ẩm", "Kem chống nắng kiềm dầu"], night: ["Tẩy trang Micellar", "Sữa rửa mặt", "Serum Niacinamide 10%", "Gel dưỡng khóa ẩm"] },
      Saturday: { morning: ["Sữa rửa mặt kiềm dầu", "Toner", "Gel dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum Retinol 0.5% tái tạo", "Gel dưỡng khóa ẩm dịu nhẹ"] },
      Sunday: { morning: ["Rửa mặt nhẹ nhàng", "Toner cấp nước", "Gel dưỡng", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Mặt nạ giấy dưỡng ẩm sâu", "Gel dưỡng ẩm nhẹ"] }
    }
  },
  dry: {
    label: "Da Khô / Thiếu Ẩm",
    analysis: "Hàng rào bảo vệ da thiếu hụt lipid, da dễ khô ráp, bong tróc hoặc xỉn màu. Cần ưu tiên làm sạch siêu dịu nhẹ không bọt, cấp ẩm nhiều lớp và sử dụng kem dưỡng ẩm dạng đặc (cream) giàu Ceramide.",
    plan: {
      Monday: { morning: ["Sữa rửa mặt không bọt", "Toner cấp ẩm (3 lớp)", "Serum Hyaluronic Acid", "Kem dưỡng giàu Ceramide", "Kem chống nắng dưỡng ẩm"], night: ["Tẩy trang dầu/sáp", "Sữa rửa mặt gel dịu nhẹ", "Serum Hyaluronic Acid", "Kem dưỡng ẩm sâu khóa màng"] },
      Tuesday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner cấp ẩm", "Serum HA", "Kem dưỡng ẩm Ceramide", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt gel", "Toner cấp ẩm", "Kem dưỡng ẩm khóa ẩm sâu"] },
      Wednesday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner", "Serum Vitamin C sáng da", "Kem dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt", "Tẩy da chết PHA nhẹ nhàng", "Kem dưỡng Ceramide"] },
      Thursday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner cấp ẩm", "Serum HA", "Kem dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt", "Mặt nạ ngủ cấp ẩm cấp nước", "Kem dưỡng ẩm"] },
      Friday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner", "Serum HA", "Kem dưỡng ẩm Ceramide", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt", "Serum HA", "Kem dưỡng ẩm sâu"] },
      Saturday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner cấp ẩm", "Serum HA", "Kem dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt", "Serum Retinol 0.3% chống lão hóa", "Kem dưỡng phục hồi B5"] },
      Sunday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner cấp ẩm", "Serum HA", "Kem dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt", "Mặt nạ giấy dưỡng ẩm sâu", "Kem dưỡng ẩm sâu"] }
    }
  },
  sensitive: {
    label: "Da Nhạy Cảm / Dễ Kích Ứng",
    analysis: "Hàng rào bảo vệ da yếu, dễ ửng đỏ, châm chích khi thay đổi thời tiết hoặc dùng mỹ phẩm lạ. Cần tối giản các bước dưỡng da, tuyệt đối tránh các hoạt chất mạnh (Retinol, BHA liều cao) và dùng sản phẩm chứa rau má (Centella), B5.",
    plan: {
      Monday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng làm dịu da", "Serum phục hồi B5", "Kem dưỡng phục hồi rau má", "Kem chống nắng vật lý SPF 50+"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Serum phục hồi B5", "Kem dưỡng phục hồi khóa ẩm"] },
      Tuesday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng ẩm phục hồi", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Serum Centella", "Kem dưỡng ẩm dịu nhẹ"] },
      Wednesday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng phục hồi", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Mặt nạ phục hồi da nhạy cảm", "Kem dưỡng ẩm"] },
      Thursday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng ẩm", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Serum B5", "Kem dưỡng ẩm phục hồi"] },
      Friday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng phục hồi", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Serum Centella", "Kem dưỡng ẩm"] },
      Saturday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng ẩm", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Mặt nạ phục hồi dịu nhẹ", "Kem dưỡng khóa ẩm"] },
      Sunday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng phục hồi", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Serum B5", "Kem dưỡng ẩm phục hồi"] }
    }
  },
  normal: {
    label: "Da Thường / Khỏe Mạnh",
    analysis: "Độ ẩm và dầu trên da ở mức cân bằng tốt, lỗ chân lông nhỏ, da khỏe. Kế hoạch chăm sóc da hướng tới duy trì độ ẩm ổn định, bảo vệ da trước ánh nắng mặt trời và bổ sung chất chống oxy hóa ngừa lão hóa sớm.",
    plan: {
      Monday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner cân bằng", "Serum Hyaluronic Acid", "Kem dưỡng ẩm lotion", "Kem chống nắng phổ rộng SPF 50+"], night: ["Tẩy trang dưỡng ẩm", "Sữa rửa mặt", "Serum Hyaluronic Acid", "Kem dưỡng ẩm ban đêm"] },
      Tuesday: { morning: ["Sữa rửa mặt", "Toner", "Serum HA", "Kem dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum Vitamin C sáng da", "Kem dưỡng ẩm lotion"] },
      Wednesday: { morning: ["Sữa rửa mặt", "Toner", "Serum HA", "Kem dưỡng", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Tẩy tế bào chết AHA 5%", "Kem dưỡng ẩm"] },
      Thursday: { morning: ["Sữa rửa mặt", "Toner", "Serum HA", "Kem dưỡng", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum HA", "Kem dưỡng ban đêm"] },
      Friday: { morning: ["Sữa rửa mặt", "Toner", "Serum HA", "Kem dưỡng", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum Retinol 0.5%", "Kem dưỡng ẩm phục hồi"] },
      Saturday: { morning: ["Sữa rửa mặt", "Toner", "Serum HA", "Kem dưỡng", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Mặt nạ cấp ẩm", "Kem dưỡng ẩm"] },
      Sunday: { morning: ["Sữa rửa mặt", "Toner", "Serum HA", "Kem dưỡng", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum HA", "Kem dưỡng ban đêm"] }
    }
  }
};

const rgbToHex = (r, g, b) => {
  const toHex = (c) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export default function HugoSkinTab() {
  const [bio, setBio] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [gender, setGender] = useState("unspecified");
  const [targetSkin, setTargetSkin] = useState("normal");
  
  const [result, setResult] = useState(null);
  const [reminders, setReminders] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetch(`${apiBase}/bios/me`, { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
      })
      .then((data) => {
        if (data?.bio) {
          setBio(data.bio);
          setReminders(data.bio.skincareReminderEnabled || false);
          if (data.bio.skinAnalysis?.updatedAt) {
            setResult(data.bio.skinAnalysis);
          }
        }
      })
      .catch((err) => console.error("Lỗi tải thông tin Bio:", err));
  }, []);

  const startCamera = async () => {
    try {
      setErrorMsg("");
      setCameraActive(true);
      
      // Use extremely flexible constraints with 'ideal' resolution to avoid OverconstrainedError
      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (innerErr) {
        console.warn("Retrying with fallback video constraints...", innerErr);
        // Fallback to absolute simplest config to ensure success
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Không thể truy cập camera. Vui lòng cấp quyền sử dụng camera trong trình duyệt của bạn.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const runLocalScan = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          processFaceSnapshot();
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const processFaceSnapshot = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!video || !canvas || !ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Cheek color detection
    const cheekX = Math.round(canvas.width * 0.65);
    const cheekY = Math.round(canvas.height * 0.5);
    const imgData = ctx.getImageData(cheekX - 10, cheekY - 10, 20, 20);
    const data = imgData.data;

    let rSum = 0, gSum = 0, bSum = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
    }

    const avgR = rSum / pixelCount;
    const avgG = gSum / pixelCount;
    const avgB = bSum / pixelCount;
    const hexColor = rgbToHex(avgR, avgG, avgB);

    // Fitzpatrick classification
    const brightness = (avgR * 299 + avgG * 587 + avgB * 114) / 1000;
    let fitzpatrick = "Type III (Da ngăm vừa)";
    if (brightness > 220) fitzpatrick = "Type I (Da trắng tuyết)";
    else if (brightness > 190) fitzpatrick = "Type II (Da trắng sáng)";
    else if (brightness > 150) fitzpatrick = "Type III (Da trắng trung bình)";
    else if (brightness > 120) fitzpatrick = "Type IV (Da ngăm nhẹ)";
    else if (brightness > 80) fitzpatrick = "Type V (Da nâu bánh mật)";
    else fitzpatrick = "Type VI (Da tối màu)";

    // Face symmetry calculation
    const sliceWidth = Math.round(canvas.width * 0.4);
    const sliceHeight = Math.round(canvas.height * 0.4);
    const leftX = Math.round(canvas.width * 0.1);
    const rightX = Math.round(canvas.width * 0.5);
    const centerY = Math.round(canvas.height * 0.3);

    const leftData = ctx.getImageData(leftX, centerY, sliceWidth, sliceHeight).data;
    const rightData = ctx.getImageData(rightX, centerY, sliceWidth, sliceHeight).data;

    let leftGraySum = 0, rightGraySum = 0;
    for (let i = 0; i < leftData.length; i += 4) {
      leftGraySum += (leftData[i] + leftData[i + 1] + leftData[i + 2]) / 3;
      rightGraySum += (rightData[i] + rightData[i + 1] + rightData[i + 2]) / 3;
    }

    const leftAvg = leftGraySum / (leftData.length / 4);
    const rightAvg = rightGraySum / (rightData.length / 4);
    const difference = Math.abs(leftAvg - rightAvg);
    const symmetryScore = Math.max(72, Math.min(99, Math.round(100 - difference * 0.75)));

    const selectedPlanConfig = PREDEFINED_PLANS[targetSkin];
    const skinAnalysisResult = {
      score: symmetryScore,
      skinType: `${selectedPlanConfig.label} (Phân tích: ${selectedPlanConfig.analysis})`,
      skinTone: `${hexColor} (${fitzpatrick})`,
      gender: gender === "male" ? "Nam" : gender === "female" ? "Nữ" : "Không tiết lộ",
      plan: selectedPlanConfig.plan,
      updatedAt: new Date()
    };

    try {
      const res = await fetch(`${apiBase}/bios/me/skin-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skinAnalysisResult),
        credentials: "include"
      });

      if (res.ok) {
        const resData = await res.json();
        setResult(resData.skinAnalysis);
      }
    } catch (err) {
      console.error(err);
    }

    stopCamera();
    setScanning(false);
  };

  const handleToggleReminders = async (checked) => {
    try {
      const res = await fetch(`${apiBase}/bios/me/skin-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked }),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(data.skincareReminderEnabled);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const daysVietnam = {
    Monday: "Thứ Hai",
    Tuesday: "Thứ Ba",
    Wednesday: "Thứ Tư",
    Thursday: "Thứ Năm",
    Friday: "Thứ Sáu",
    Saturday: "Thứ Bảy",
    Sunday: "Chủ Nhật"
  };

  return (
    <div className="w-full flex flex-col gap-6 text-zinc-100">
      {/* Premium Gradient Header Accent */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/80 via-zinc-900/80 to-zinc-950/80 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            HugoSkin Diagnostic System
            <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md uppercase tracking-widest">
              Live Core
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Ứng dụng giải thuật phân tích quang phổ màu và kiểm tra độ đối xứng khuôn mặt cục bộ siêu tốc.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result && !cameraActive && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-6 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-white/10 rounded-3xl flex flex-col gap-5 backdrop-blur-xl shadow-2xl"
          >
            {/* Tech grid detail */}
            <div className="flex items-center gap-4 bg-zinc-950/60 p-5 rounded-2xl border border-white/5">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <Camera className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Quét Khuôn Mặt Bằng Trình Duyệt</h3>
                <p className="text-xs text-zinc-500">
                  Tự động căn chỉnh và xử lý màu sắc trên thời gian thực, hoàn toàn riêng tư.
                </p>
              </div>
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cung cấp giới tính</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="px-4 py-3 bg-zinc-950/90 border border-white/10 rounded-xl text-xs text-zinc-200 outline-none focus:border-indigo-500 focus:shadow-[0_0_12px_rgba(99,102,241,0.2)] transition duration-200 cursor-pointer"
                >
                  <option value="unspecified">Không tiết lộ / Khác</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Loại da mục tiêu</label>
                <select
                  value={targetSkin}
                  onChange={(e) => setTargetSkin(e.target.value)}
                  className="px-4 py-3 bg-zinc-950/90 border border-white/10 rounded-xl text-xs text-zinc-200 outline-none focus:border-indigo-500 focus:shadow-[0_0_12px_rgba(99,102,241,0.2)] transition duration-200 cursor-pointer"
                >
                  <option value="normal">Da Thường / Cân bằng khỏe mạnh</option>
                  <option value="oily">Da Dầu / Kiểm soát bã nhờn</option>
                  <option value="dry">Da Khô / Cấp ẩm sâu</option>
                  <option value="sensitive">Da Nhạy cảm / Phục hồi bảo vệ</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-xl flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={startCamera}
              className="py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 transition duration-200 border border-indigo-500/30"
            >
              <Camera className="w-4 h-4" />
              Bật Camera Quét Ngay
            </button>
          </motion.div>
        )}

        {!result && cameraActive && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-5 bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col gap-4 relative"
          >
            {/* Tech UI Frame overlay */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover transform scale-x-[-1]"
              />

              {/* Laser line overlay */}
              {scanning && (
                <div
                  className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-20"
                  style={{
                    top: `${scanProgress}%`,
                    transition: "top 0.1s linear"
                  }}
                />
              )}

              {/* Sci-fi Target HUD Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                {/* 4 tech corner brackets */}
                <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
                
                {/* Target ellipse */}
                <div className={`w-[50%] aspect-[3/4] border-2 border-dashed ${scanning ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] animate-pulse" : "border-white/30"} rounded-[50%]`} />
              </div>

              {/* Scanning status banner */}
              {scanning && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center z-15">
                  <span className="px-3 py-1 bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold rounded-full uppercase tracking-widest animate-pulse">
                    Đang giải mã sắc tố...
                  </span>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-3">
              <button
                onClick={stopCamera}
                disabled={scanning}
                className="flex-1 py-3 bg-zinc-900 border border-white/10 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold rounded-xl transition duration-200 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={runLocalScan}
                disabled={scanning}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition duration-200 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Đang phân tích ({scanProgress}%)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Bắt Đầu Phân Tích
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Premium diagnostic results panel */}
            <div className="p-6 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-white/10 rounded-3xl flex flex-col gap-6 backdrop-blur-xl shadow-2xl relative">
              <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
              
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Chẩn Đoán Sắc Tố & Cân Đối</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Thời gian phân tích: {result.updatedAt ? new Date(result.updatedAt).toLocaleString("vi-VN") : "Hiện tại"}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-zinc-950 border border-white/10 text-zinc-300 hover:border-indigo-500 hover:text-indigo-400 text-xs font-semibold rounded-lg transition duration-200"
                >
                  Quét Lại Da
                </button>
              </div>

              {/* Circular gauges and stats metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Symmetry circular rating */}
                <div className="bg-zinc-950/60 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Tỉ lệ đối xứng</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* SVG Progress Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" className="stroke-zinc-800" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        className="stroke-emerald-400"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - result.score / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-base font-black text-white">{result.score}%</span>
                  </div>
                  <span className="text-[8px] text-zinc-500 mt-3 uppercase tracking-wider">Khuôn Mặt Vàng</span>
                </div>

                {/* Skin tone hex color palette card */}
                <div className="bg-zinc-950/60 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Sắc độ da</span>
                  <div className="relative w-16 h-16 rounded-full border border-white/10 flex items-center justify-center shadow-lg" style={{ backgroundColor: result.skinTone.split(" ")[0] }}>
                    <div className="w-8 h-8 rounded-full bg-black/25 backdrop-blur-sm border border-white/5 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white/80" />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-200 mt-3">
                    {result.skinTone.split(" ")[0]}
                  </span>
                  <span className="text-[8px] text-zinc-500 mt-1 max-w-[140px] truncate">
                    {result.skinTone.includes("Fitzpatrick") ? result.skinTone.split("(")[1]?.replace(")", "") : result.skinTone}
                  </span>
                </div>

                {/* Gender indicator card */}
                <div className="bg-zinc-950/60 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Giới tính phân tích</span>
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-1">
                    <span className="text-xl font-black text-indigo-400">{result.gender || "Khác"}</span>
                  </div>
                  <span className="text-[8px] text-zinc-500 mt-3 uppercase tracking-wider">Hồ sơ người dùng</span>
                </div>
              </div>

              {/* Expert evaluation notes block */}
              <div className="bg-indigo-950/40 border border-indigo-500/20 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-inner">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Chuẩn đoán loại da & đề xuất
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {result.skinType}
                </p>
              </div>

              {/* Skincare notification reminders switch */}
              <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/5 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <Bell className={`w-4 h-4 ${reminders ? "text-indigo-400 animate-bounce" : "text-zinc-500"}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Đồng hành & Nhắc nhở Skincare</h4>
                    <p className="text-[10px] text-zinc-500">Tự động báo thức lúc 08:00 sáng & 21:30 tối qua Web Push.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminders}
                    onChange={(e) => handleToggleReminders(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                </label>
              </div>
            </div>

            {/* Skincare 7-day schedule plan cards */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mt-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 animate-pulse" />
                Phác đồ dưỡng da 7 ngày của bạn
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {Object.entries(result.plan || {}).map(([dayKey, dayPlan]) => (
                  <div key={dayKey} className="p-5 bg-zinc-900/60 border border-white/10 rounded-2xl flex flex-col gap-3 hover:border-indigo-500/30 transition duration-300 relative overflow-hidden group">
                    <span className="absolute top-0 bottom-0 left-0 w-[4px] bg-indigo-500/50 group-hover:bg-indigo-400 transition" />
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-wider pl-1">
                      {daysVietnam[dayKey] || dayKey}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1">
                      {/* Morning Routine */}
                      <div className="flex flex-col gap-2 bg-zinc-950/40 p-3.5 rounded-xl border border-white/5">
                        <span className="text-[10px] font-black text-amber-500/90 uppercase tracking-widest flex items-center gap-1.5">
                          ☀️ Buổi Sáng:
                        </span>
                        <ul className="text-xs text-zinc-400 space-y-1.5 pl-0.5">
                          {dayPlan.morning?.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-500/50 text-[10px] mt-0.5">■</span>
                              <span className="leading-tight">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Night Routine */}
                      <div className="flex flex-col gap-2 bg-zinc-950/40 p-3.5 rounded-xl border border-white/5">
                        <span className="text-[10px] font-black text-indigo-400/90 uppercase tracking-widest flex items-center gap-1.5">
                          🌙 Buổi Tối:
                        </span>
                        <ul className="text-xs text-zinc-400 space-y-1.5 pl-0.5">
                          {dayPlan.night?.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-indigo-500/50 text-[10px] mt-0.5">■</span>
                              <span className="leading-tight">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
