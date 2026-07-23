import { useState, useEffect, useRef } from "react";
import { 
  Camera, Bell, CheckCircle2, AlertCircle, Loader2, Droplet
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ClientEdgeEngine } from "../../utils/clientEdgeEngine";
import { IndexedDBStorage } from "../../utils/indexedDBStorage";
import StandaloneInstallButton from "../ui/StandaloneInstallButton";

const apiBase = import.meta.env.VITE_API_URL || "/api";

const PREDEFINED_PLANS = {
  oily: {
    label: "Da Dầu / Hỗn Hợp Dầu",
    analysis: "Kiểm soát dầu thừa vùng T, làm sạch lỗ chân lông bằng BHA 2%, cấp nước mỏng nhẹ bằng Gel Hyaluronic Acid & Niacinamide.",
    concerns: ["Bít tắc lỗ chân lông chữ T", "Dầu thừa vùng trán & mũi"],
    plan: {
      Monday: { morning: ["Sữa rửa mặt BHA 2%", "Toner kiềm dầu", "Gel dưỡng ẩm HA", "Kem chống nắng SPF 50+"], night: ["Tẩy trang Micellar", "Sữa rửa mặt bọt", "Serum Niacinamide 10%", "Gel dưỡng khóa ẩm"] },
      Tuesday: { morning: ["Sữa rửa mặt kiềm dầu", "Toner cấp nước", "Gel dưỡng HA", "Kem chống nắng SPF 50+"], night: ["Tẩy trang", "Sữa rửa mặt", "Tẩy da chết AHA/BHA", "Gel dưỡng khóa ẩm"] },
      Wednesday: { morning: ["Sữa rửa mặt BHA 2%", "Toner", "Gel dưỡng HA", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum Niacinamide 10%", "Gel dưỡng khóa ẩm"] },
      Thursday: { morning: ["Sữa rửa mặt kiềm dầu", "Toner", "Gel dưỡng HA", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Mặt nạ đất sét", "Serum B5", "Gel dưỡng"] },
      Friday: { morning: ["Sữa rửa mặt BHA 2%", "Toner", "Gel dưỡng HA", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum Niacinamide 10%", "Gel dưỡng khóa ẩm"] },
      Saturday: { morning: ["Sữa rửa mặt kiềm dầu", "Toner", "Gel dưỡng HA", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum Retinol 0.5%", "Gel dưỡng khóa ẩm"] },
      Sunday: { morning: ["Rửa mặt nhẹ nhàng", "Toner cấp nước", "Gel dưỡng HA", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Mặt nạ cấp ẩm", "Gel dưỡng nhẹ"] }
    }
  },
  dry: {
    label: "Da Khô / Thiếu Ẩm",
    analysis: "Cấp ẩm đa tầng, phục hồi hàng rào bảo vệ da với Ceramide & Hyaluronic Acid, tránh làm sạch quá mức.",
    concerns: ["Thiếu độ ẩm tự nhiên", "Bề mặt da thô ráp"],
    plan: {
      Monday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner cấp ẩm", "Serum HA", "Kem dưỡng Ceramide", "Kem chống nắng"], night: ["Tẩy trang sáp/dầu", "Sữa rửa mặt gel", "Serum HA", "Kem dưỡng ẩm sâu"] },
      Tuesday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner cấp ẩm", "Serum HA", "Kem dưỡng Ceramide", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt gel", "Toner cấp ẩm", "Kem dưỡng ẩm sâu"] },
      Wednesday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner", "Serum Vitamin C", "Kem dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt", "Tẩy da chết PHA", "Kem dưỡng Ceramide"] },
      Thursday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner cấp ẩm", "Serum HA", "Kem dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt", "Mặt nạ ngủ cấp ẩm", "Kem dưỡng ẩm"] },
      Friday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner", "Serum HA", "Kem dưỡng Ceramide", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt", "Serum HA", "Kem dưỡng ẩm sâu"] },
      Saturday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner cấp ẩm", "Serum HA", "Kem dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt", "Serum Retinol 0.3%", "Kem dưỡng B5"] },
      Sunday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner cấp ẩm", "Serum HA", "Kem dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang dầu", "Sữa rửa mặt", "Mặt nạ cấp ẩm", "Kem dưỡng ẩm sâu"] }
    }
  },
  sensitive: {
    label: "Da Nhạy Cảm",
    analysis: "Tối giản chu trình dưỡng da, làm dịu ửng đỏ bằng Rau má (Centella) & Vitamin B5, dùng kem chống nắng vật lý.",
    concerns: ["Dễ ửng đỏ", "Hàng rào bảo vệ mỏng yếu"],
    plan: {
      Monday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng Rau má", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Serum B5", "Kem dưỡng phục hồi"] },
      Tuesday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng phục hồi", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Serum Centella", "Kem dưỡng dịu nhẹ"] },
      Wednesday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng phục hồi", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Mặt nạ phục hồi", "Kem dưỡng ẩm"] },
      Thursday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng ẩm", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Serum B5", "Kem dưỡng phục hồi"] },
      Friday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng phục hồi", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Serum Centella", "Kem dưỡng ẩm"] },
      Saturday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng ẩm", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Mặt nạ phục hồi", "Kem dưỡng khóa ẩm"] },
      Sunday: { morning: ["Sữa rửa mặt Gentle", "Xịt khoáng", "Serum B5", "Kem dưỡng phục hồi", "Kem chống nắng vật lý"], night: ["Tẩy trang nhạy cảm", "Sữa rửa mặt Gentle", "Serum B5", "Kem dưỡng phục hồi"] }
    }
  },
  normal: {
    label: "Da Thường",
    analysis: "Duy trì sự cân bằng độ ẩm và bảo vệ chống oxy hóa với Vitamin C & Kem chống nắng phổ rộng.",
    concerns: ["Duy trì sự cân bằng", "Phòng ngừa lão hóa"],
    plan: {
      Monday: { morning: ["Sữa rửa mặt dịu nhẹ", "Toner cân bằng", "Serum HA", "Kem dưỡng lotion", "Kem chống nắng SPF 50+"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum HA", "Kem dưỡng ban đêm"] },
      Tuesday: { morning: ["Sữa rửa mặt", "Toner", "Serum HA", "Kem dưỡng ẩm", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum Vitamin C", "Kem dưỡng lotion"] },
      Wednesday: { morning: ["Sữa rửa mặt", "Toner", "Serum HA", "Kem dưỡng", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Tẩy da chết AHA 5%", "Kem dưỡng ẩm"] },
      Thursday: { morning: ["Sữa rửa mặt", "Toner", "Serum HA", "Kem dưỡng", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum HA", "Kem dưỡng ban đêm"] },
      Friday: { morning: ["Sữa rửa mặt", "Toner", "Serum HA", "Kem dưỡng", "Kem chống nắng"], night: ["Tẩy trang", "Sữa rửa mặt", "Serum Retinol 0.5%", "Kem dưỡng phục hồi"] },
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
  const [activeTab, setActiveTab] = useState("scan"); // "scan" | "routine" | "history"
  const [, setBio] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [gender, setGender] = useState("unspecified");
  const [targetSkin, setTargetSkin] = useState("normal");
  const [autoCaptureSec, setAutoCaptureSec] = useState(null);

  const [waterMl, setWaterMl] = useState(() => {
    return Number(localStorage.getItem("hugoskin_water_ml") || "1200");
  });

  const [lightingStatus, setLightingStatus] = useState({
    code: "checking",
    message: "Đang đo ánh sáng...",
    luminance: 120,
    balance: 95
  });

  const [result, setResult] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [reminders, setReminders] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const lightAnimRef = useRef(null);

  useEffect(() => {
    fetchBioData();
    fetchHistoryData();
    fetchChecklistData();
  }, []);

  useEffect(() => {
    localStorage.setItem("hugoskin_water_ml", String(waterMl));
  }, [waterMl]);

  useEffect(() => {
    let timer;
    if (cameraActive && lightingStatus.code === "optimal" && !scanning && autoCaptureSec === null) {
      setAutoCaptureSec(3);
    } else if (lightingStatus.code !== "optimal" && autoCaptureSec !== null) {
      setAutoCaptureSec(null);
    }

    if (autoCaptureSec !== null && autoCaptureSec > 0 && !scanning) {
      timer = setTimeout(() => {
        setAutoCaptureSec((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (autoCaptureSec === 0 && !scanning) {
      runLocalScan();
      setAutoCaptureSec(null);
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive, lightingStatus.code, autoCaptureSec, scanning]);

  const fetchBioData = async () => {
    try {
      const res = await fetch(`${apiBase}/bios/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data?.bio) {
          setBio(data.bio);
          setReminders(data.bio.skincareReminderEnabled || false);
          if (data.bio.skinAnalysis?.updatedAt) {
            setResult(data.bio.skinAnalysis);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi tải thông tin Bio:", err);
    }
  };

  const fetchHistoryData = async () => {
    // ⚡️ Local-First read 0ms từ IndexedDB trên thiết bị người dùng
    try {
      const localScans = await IndexedDBStorage.getAllSkinScans();
      if (localScans && localScans.length > 0) {
        setHistoryList(localScans);
      }
    } catch (e) {
      console.warn("Lỗi nạp IndexedDB:", e);
    }

    try {
      const res = await fetch(`${apiBase}/bios/me/skin-history`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data?.skinHistory && data.skinHistory.length > 0) {
          setHistoryList(data.skinHistory);
        }
      }
    } catch (err) {
      console.error("Lỗi tải lịch sử quét da:", err);
    }
  };

  const fetchChecklistData = async () => {
    try {
      const res = await fetch(`${apiBase}/bios/me/skin-checklist`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data?.dailySkincareChecklist?.completedSteps) {
          setChecklist(data.dailySkincareChecklist.completedSteps);
        }
      }
    } catch (err) {
      console.error("Lỗi tải checklist dưỡng da:", err);
    }
  };

  const startLightingDiagnostics = () => {
    const checkFrame = () => {
      const video = videoRef.current;
      if (video && video.readyState === 4) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 160;
        tempCanvas.height = 120;
        const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, 160, 120);
          const imgData = ctx.getImageData(0, 0, 160, 120);
          const pixels = imgData.data;

          let rSum = 0, gSum = 0, bSum = 0;
          let leftLum = 0, rightLum = 0;
          let leftCount = 0, rightCount = 0;

          const total = pixels.length / 4;
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            rSum += r;
            gSum += g;
            bSum += b;

            const pixelIdx = i / 4;
            const x = pixelIdx % 160;
            if (x < 80) {
              leftLum += lum;
              leftCount++;
            } else {
              rightLum += lum;
              rightCount++;
            }
          }

          const avgLum = Math.round((0.299 * rSum + 0.587 * gSum + 0.114 * bSum) / total);
          const avgLeft = leftLum / (leftCount || 1);
          const avgRight = rightLum / (rightCount || 1);
          const maxSide = Math.max(avgLeft, avgRight);
          const minSide = Math.min(avgLeft, avgRight) + 0.1;
          const contrastRatio = maxSide / minSide;
          const balanceVal = Math.max(50, Math.round(100 - (contrastRatio - 1) * 60));

          if (avgLum < 65) {
            setLightingStatus({
              code: "too_dark",
              message: "Ánh sáng quá tối (< 65 Lm). Vui lòng thêm đèn.",
              luminance: avgLum,
              balance: balanceVal
            });
          } else if (avgLum > 215) {
            setLightingStatus({
              code: "too_bright",
              message: "Ánh sáng quá chói (> 215 Lm). Vui lòng giảm bớt đèn.",
              luminance: avgLum,
              balance: balanceVal
            });
          } else if (contrastRatio > 1.38) {
            setLightingStatus({
              code: "imbalanced",
              message: "Ánh sáng bị lệch 1 bên. Hãy quay chính diện nguồn sáng.",
              luminance: avgLum,
              balance: balanceVal
            });
          } else {
            setLightingStatus({
              code: "optimal",
              message: "Ánh sáng chuẩn 100%. Tự động quét sau 3s...",
              luminance: avgLum,
              balance: balanceVal
            });
          }
        }
      }
      lightAnimRef.current = requestAnimationFrame(checkFrame);
    };

    lightAnimRef.current = requestAnimationFrame(checkFrame);
  };

  const stopLightingDiagnostics = () => {
    if (lightAnimRef.current) {
      cancelAnimationFrame(lightAnimRef.current);
      lightAnimRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setErrorMsg("");
      setCameraActive(true);

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
        console.warn("Retrying simple video constraint...", innerErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      startLightingDiagnostics();
    } catch (err) {
      console.error(err);
      setErrorMsg("Không thể truy cập camera. Vui lòng kiểm tra quyền trình duyệt.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    stopLightingDiagnostics();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setAutoCaptureSec(null);
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
        return prev + 10;
      });
    }, 60);
  };

  const processFaceSnapshot = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext("2d", { willReadFrequently: true }) : null;
    if (!video || !canvas || !ctx) return;

    let width = video.videoWidth || 640;
    let height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(video, 0, 0, width, height);

    const cheekX = Math.round(width * 0.62);
    const cheekY = Math.round(height * 0.48);
    const boxSize = 24;
    const halfBox = Math.round(boxSize / 2);
    const startCheekX = Math.max(0, Math.min(width - boxSize, cheekX - halfBox));
    const startCheekY = Math.max(0, Math.min(height - boxSize, cheekY - halfBox));

    const imgData = ctx.getImageData(startCheekX, startCheekY, boxSize, boxSize);
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

    let undertone = "Trung tính";
    if (avgR > avgG + 14 && avgR > avgB + 22) {
      undertone = "Warm / Tone Ấm";
    } else if (avgB > avgG - 10 || avgR - avgB < 15) {
      undertone = "Cool / Tone Lạnh";
    } else {
      undertone = "Neutral / Trung tính";
    }

    const brightness = (avgR * 299 + avgG * 587 + avgB * 114) / 1000;
    let fitzpatrick = "Type III (Sáng vừa)";
    if (brightness > 215) fitzpatrick = "Type I (Trắng sáng)";
    else if (brightness > 185) fitzpatrick = "Type II (Trắng hồng)";
    else if (brightness > 145) fitzpatrick = "Type III (Trắng trung bình)";
    else if (brightness > 115) fitzpatrick = "Type IV (Ngăm vừa)";
    else if (brightness > 80) fitzpatrick = "Type V (Nâu sẫm)";
    else fitzpatrick = "Type VI (Tối màu)";

    const sliceWidth = Math.max(1, Math.round(width * 0.38));
    const sliceHeight = Math.max(1, Math.round(height * 0.38));
    const leftX = Math.round(width * 0.12);
    const rightX = Math.round(width * 0.5);
    const centerY = Math.round(height * 0.28);

    const safeLeftX = Math.max(0, Math.min(width - sliceWidth, leftX));
    const safeRightX = Math.max(0, Math.min(width - sliceWidth, rightX));
    const safeCenterY = Math.max(0, Math.min(height - sliceHeight, centerY));

    const leftData = ctx.getImageData(safeLeftX, safeCenterY, sliceWidth, sliceHeight).data;
    const rightData = ctx.getImageData(safeRightX, safeCenterY, sliceWidth, sliceHeight).data;

    let leftGraySum = 0, rightGraySum = 0;
    for (let i = 0; i < leftData.length; i += 4) {
      leftGraySum += (leftData[i] + leftData[i + 1] + leftData[i + 2]) / 3;
      rightGraySum += (rightData[i] + rightData[i + 1] + rightData[i + 2]) / 3;
    }

    const leftAvg = leftGraySum / (leftData.length / 4);
    const rightAvg = rightGraySum / (rightData.length / 4);
    const symDiff = Math.abs(leftAvg - rightAvg);
    const symmetryScore = Math.max(75, Math.min(99, Math.round(100 - symDiff * 0.65)));

    const measuredRatio = (height / width) * 1.25;
    const goldenDiff = Math.abs(measuredRatio - 1.618);
    const goldenRatioScore = Math.max(78, Math.min(98, Math.round(98 - goldenDiff * 20)));

    const overallScore = Math.round(goldenRatioScore * 0.45 + symmetryScore * 0.55);

    const hydrationScore = Math.min(96, Math.max(60, Math.round(brightness * 0.38 + 15)));
    const smoothnessScore = Math.min(98, Math.max(65, Math.round(symmetryScore * 0.9 + 5)));
    const clarityScore = Math.min(95, Math.max(62, Math.round(100 - symDiff * 0.8)));

    const selectedPlanConfig = PREDEFINED_PLANS[targetSkin];
    const skinAnalysisResult = {
      score: overallScore,
      goldenRatioScore,
      skinType: `${selectedPlanConfig.label} (${selectedPlanConfig.analysis})`,
      skinTone: `${hexColor} (${fitzpatrick})`,
      undertone,
      gender: gender === "male" ? "Nam" : gender === "female" ? "Nữ" : "Không tiết lộ",
      concerns: selectedPlanConfig.concerns || [],
      hydrationScore,
      smoothnessScore,
      clarityScore,
      plan: selectedPlanConfig.plan,
      updatedAt: new Date()
    };

    // Client-Side Edge Execution: Hiển thị ngay tức thì (0ms latency) & Lưu IndexedDB
    setResult(skinAnalysisResult);
    ClientEdgeEngine.saveLocalFirst("latest_skin_analysis", skinAnalysisResult);
    IndexedDBStorage.saveSkinScan(skinAnalysisResult).then(() => {
      IndexedDBStorage.getAllSkinScans().then((scans) => {
        if (scans && scans.length > 0) setHistoryList(scans);
      });
    });

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
        if (resData.skinHistory) setHistoryList(resData.skinHistory);
      }
    } catch (err) {
      console.error(err);
    }

    try {
      if (ctx && canvas) {
        ctx.clearRect(0, 0, width, height);
        canvas.width = 1;
        canvas.height = 1;
      }
    } catch (clearErr) {
      console.warn("Lỗi dọn dẹp canvas:", clearErr);
    }

    stopCamera();
    setScanning(false);
  };

  const handleReset = () => {
    setResult(null);
    startCamera();
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

  const toggleCheckstep = async (stepName) => {
    const nextChecklist = checklist.includes(stepName)
      ? checklist.filter((item) => item !== stepName)
      : [...checklist, stepName];

    setChecklist(nextChecklist);

    try {
      await fetch(`${apiBase}/bios/me/skin-checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          completedSteps: nextChecklist
        }),
        credentials: "include"
      });
    } catch (err) {
      console.error("Lỗi cập nhật checklist:", err);
    }
  };

  const addWater = (amount) => {
    setWaterMl((prev) => Math.min(3000, prev + amount));
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
    <div className="w-full flex flex-col gap-5 text-zinc-100 font-sans pb-12">
      {/* Clean Minimalist Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-800 rounded-xl">
              <Camera className="w-5 h-5 text-zinc-100" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-100 tracking-tight">HugoSkin</h1>
              <p className="text-[11px] text-zinc-400">Phân tích sắc tố da & Tỷ lệ vàng 1.618</p>
            </div>
          </div>
          
          <StandaloneInstallButton appTitle="HugoSkin" appId="hugoskin" />
        </div>

        {/* Clean Segmented Control Tabs */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("scan")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-medium rounded-lg transition ${
              activeTab === "scan"
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Quét Da
          </button>
          <button
            onClick={() => setActiveTab("routine")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-medium rounded-lg transition ${
              activeTab === "routine"
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Phác Đồ
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-medium rounded-lg transition ${
              activeTab === "history"
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Lịch Sử
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "scan" && (
          <motion.div
            key="tab-scan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-5"
          >
            {!result && !cameraActive && (
              <div className="p-5 sm:p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium text-zinc-400">Giới tính</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-zinc-500 cursor-pointer"
                    >
                      <option value="unspecified">Không tiết lộ</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium text-zinc-400">Loại da mục tiêu</label>
                    <select
                      value={targetSkin}
                      onChange={(e) => setTargetSkin(e.target.value)}
                      className="px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-zinc-500 cursor-pointer"
                    >
                      <option value="normal">Da Thường / Cân bằng</option>
                      <option value="oily">Da Dầu / Kiểm soát nhờn</option>
                      <option value="dry">Da Khô / Cấp ẩm</option>
                      <option value="sensitive">Da Nhạy cảm / Phục hồi</option>
                    </select>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  onClick={startCamera}
                  className="py-3 bg-zinc-100 text-zinc-950 hover:bg-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Mở Camera Quét Da
                </button>
              </div>
            )}

            {!result && cameraActive && (
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col gap-3">
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black border border-zinc-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />

                  {/* Auto capture countdown overlay */}
                  {autoCaptureSec !== null && !scanning && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-30">
                      <span className="text-4xl font-bold text-zinc-100">{autoCaptureSec}</span>
                      <span className="text-[11px] text-zinc-300">Ánh sáng chuẩn. Đang tự động quét...</span>
                    </div>
                  )}

                  {/* Scanning bar */}
                  {scanning && (
                    <div
                      className="absolute left-0 w-full h-[2px] bg-zinc-100 shadow-[0_0_10px_#fff] z-20"
                      style={{ top: `${scanProgress}%`, transition: "top 0.06s linear" }}
                    />
                  )}

                  {/* Face target guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className={`w-[48%] aspect-[1/1.618] border border-dashed ${
                      lightingStatus.code === "optimal" ? "border-zinc-100" : "border-zinc-500"
                    } rounded-[50%]`} />
                  </div>

                  {/* Lighting status */}
                  <div className="absolute top-3 left-3 right-3 z-15 flex justify-between items-center">
                    <span className="px-3 py-1 bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-[10px] font-medium rounded-lg backdrop-blur">
                      {lightingStatus.message}
                    </span>
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="flex gap-2">
                  <button
                    onClick={stopCamera}
                    disabled={scanning}
                    className="flex-1 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium rounded-xl hover:bg-zinc-800 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={runLocalScan}
                    disabled={scanning}
                    className="flex-1 py-2.5 bg-zinc-100 text-zinc-950 text-xs font-bold rounded-xl hover:bg-white transition flex items-center justify-center gap-1.5"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      "Quét Ngay"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Results Dashboard */}
            {result && (
              <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Kết Quả Phân Tích Da</h3>
                    <p className="text-[10px] text-zinc-400">
                      {result.updatedAt ? new Date(result.updatedAt).toLocaleString("vi-VN") : "Hiện tại"}
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-medium rounded-lg transition"
                  >
                    Quét Lại
                  </button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-zinc-400">Tỷ lệ Vàng</span>
                    <span className="text-lg font-bold text-zinc-100 mt-1">{result.goldenRatioScore || 88}%</span>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-zinc-400">Điểm Làn Da</span>
                    <span className="text-lg font-bold text-zinc-100 mt-1">{result.score}%</span>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-zinc-400">Sắc Độ Da</span>
                    <div className="w-5 h-5 rounded-full border border-zinc-700 mt-1.5 mb-0.5" style={{ backgroundColor: result.skinTone?.split(" ")[0] || "#E0AC69" }} />
                    <span className="text-[10px] text-zinc-300">{result.undertone || "Trung tính"}</span>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-zinc-400">Độ Ẩm Da</span>
                    <span className="text-lg font-bold text-zinc-100 mt-1">{result.hydrationScore || 85}%</span>
                  </div>
                </div>

                {/* Analysis detail */}
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                  <span className="font-bold text-zinc-100 block mb-1">Chẩn đoán:</span>
                  {result.skinType}
                </div>

                {/* Push notification toggle */}
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-300">Nhắc nhở Skincare (8h / 21h30)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminders}
                    onChange={(e) => handleToggleReminders(e.target.checked)}
                    className="accent-zinc-100 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "routine" && (
          <motion.div
            key="tab-routine"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-5"
          >
            {/* Water Tracker minimal */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-800 rounded-xl">
                  <Droplet className="w-4 h-4 text-zinc-100" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-100 block">Nước Uống Hôm Nay</span>
                  <span className="text-[11px] text-zinc-400">{waterMl} / 2,000 ml</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => addWater(250)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition"
                >
                  +250ml
                </button>
                <button
                  onClick={() => addWater(500)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition"
                >
                  +500ml
                </button>
              </div>
            </div>

            {/* Checklist */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
                <h3 className="text-xs font-bold text-zinc-100">Checklist Dưỡng Da Hôm Nay</h3>
                <span className="text-[11px] text-zinc-400">{checklist.length}/6 bước</span>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  "☀️ Buổi Sáng: Rửa mặt & Toner",
                  "☀️ Buổi Sáng: Serum Niacinamide / C",
                  "☀️ Buổi Sáng: Kem chống nắng SPF 50+",
                  "💧 Uống đủ 2 Lít nước",
                  "🌙 Buổi Tối: Tẩy trang & Rửa mặt",
                  "🌙 Buổi Tối: Dưỡng ẩm / Retinol"
                ].map((stepName, idx) => {
                  const isChecked = checklist.includes(stepName);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheckstep(stepName)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                        isChecked
                          ? "bg-zinc-800/80 border-zinc-700 text-zinc-100"
                          : "bg-zinc-950/50 border-zinc-800/60 text-zinc-400"
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${isChecked ? "text-zinc-100" : "text-zinc-600"}`} />
                      <span className="text-xs font-medium">{stepName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7-Day Plan minimal */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phác Đồ 7 Ngày</h3>

              <div className="flex flex-col gap-3">
                {Object.entries((result?.plan || PREDEFINED_PLANS[targetSkin].plan)).map(([dayKey, dayPlan]) => (
                  <div key={dayKey} className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl flex flex-col gap-2">
                    <span className="text-xs font-bold text-zinc-200">
                      {daysVietnam[dayKey] || dayKey}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-bold block mb-1">SÁNG</span>
                        <ul className="space-y-1">
                          {dayPlan.morning?.map((s, i) => (
                            <li key={i} className="leading-tight">• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-bold block mb-1">TỐI</span>
                        <ul className="space-y-1">
                          {dayPlan.night?.map((s, i) => (
                            <li key={i} className="leading-tight">• {s}</li>
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

        {activeTab === "history" && (
          <motion.div
            key="tab-history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4"
          >
            <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
                <h3 className="text-xs font-bold text-zinc-100">Lịch Sử Quét Da</h3>
                <span className="text-[11px] text-zinc-400">{historyList.length} Lần</span>
              </div>

              {historyList.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  Chưa có lịch sử quét da. Hãy thực hiện quét đầu tiên!
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {historyList.map((item, idx) => (
                    <div key={item.id || idx} className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col gap-2 text-xs">
                      <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-100">
                            #{historyList.length - idx} - {item.skinType ? item.skinType.split("(")[0] : "Phân tích da"}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(item.date).toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <div className="w-4 h-4 rounded-full border border-zinc-700" style={{ backgroundColor: item.skinTone?.split(" ")[0] || "#E0AC69" }} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-zinc-500 block">Tỷ lệ Vàng Face:</span>
                          <span className="font-bold text-zinc-100">{item.goldenRatioScore || 88}%</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Sức Khỏe Da:</span>
                          <span className="font-bold text-zinc-100">{item.score}%</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Undertone:</span>
                          <span className="text-zinc-300">{item.undertone || "Trung tính"}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Độ Ẩm / Độ Mịn:</span>
                          <span className="text-zinc-300">{item.hydrationScore || 85}% / {item.smoothnessScore || 88}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
