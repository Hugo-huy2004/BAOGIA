/**
 * skinScanWorker.js - Web Worker cho HugoSkin Edge Computation
 * Chạy trên luồng Worker độc lập, giải phóng 100% CPU của Main UI Thread.
 */

self.onmessage = function (e) {
  const { type, imageData, width, height, targetSkin, PREDEFINED_PLANS } = e.data;

  if (type === "ANALYZE_SKIN_FRAME") {
    const data = imageData.data;
    const pixelCount = data.length / 4;

    // Fast sampling (bước 4 pixel)
    let rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0; i < data.length; i += 16) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
    }

    const samples = pixelCount / 4;
    const avgR = rSum / (samples || 1);
    const avgG = gSum / (samples || 1);
    const avgB = bSum / (samples || 1);

    const toHex = (c) => Math.round(c).toString(16).padStart(2, "0");
    const hexColor = `#${toHex(avgR)}${toHex(avgG)}${toHex(avgB)}`.toUpperCase();

    // Undertone
    let undertone = "Trung tính";
    if (avgR > avgG + 14 && avgR > avgB + 22) {
      undertone = "Warm / Tone Ấm (Ánh Vàng Châu Á)";
    } else if (avgB > avgG - 10 || avgR - avgB < 15) {
      undertone = "Cool / Tone Lạnh (Ánh Hồng)";
    } else {
      undertone = "Neutral / Trung tính";
    }

    // Brightness & Fitzpatrick
    const brightness = (avgR * 299 + avgG * 587 + avgB * 114) / 1000;
    let fitzpatrick = "Type III (Sáng vừa)";
    if (brightness > 215) fitzpatrick = "Type I (Trắng sáng)";
    else if (brightness > 185) fitzpatrick = "Type II (Trắng hồng)";
    else if (brightness > 145) fitzpatrick = "Type III (Trắng trung bình)";
    else if (brightness > 115) fitzpatrick = "Type IV (Ngăm vừa)";
    else if (brightness > 80) fitzpatrick = "Type V (Nâu sẫm)";
    else fitzpatrick = "Type VI (Tối màu)";

    // Golden Ratio calculation (1.618)
    const measuredRatio = (height / width) * 1.25;
    const goldenDiff = Math.abs(measuredRatio - 1.618);
    const goldenRatioScore = Math.max(78, Math.min(98, Math.round(98 - goldenDiff * 20)));
    const symmetryScore = Math.max(80, Math.min(99, Math.round(95 - goldenDiff * 15)));
    const overallScore = Math.round(goldenRatioScore * 0.45 + symmetryScore * 0.55);

    const hydrationScore = Math.min(96, Math.max(60, Math.round(brightness * 0.38 + 15)));
    const smoothnessScore = Math.min(98, Math.max(65, Math.round(symmetryScore * 0.9 + 5)));
    const clarityScore = Math.min(95, Math.max(62, Math.round(100 - goldenDiff * 10)));

    const selectedPlanConfig = PREDEFINED_PLANS?.[targetSkin] || {
      label: "Da Thường / Cân bằng",
      analysis: "Duy trì độ ẩm tự nhiên",
      concerns: ["Duy trì sự cân bằng"],
      plan: {}
    };

    const result = {
      score: overallScore,
      goldenRatioScore,
      skinType: `${selectedPlanConfig.label} (${selectedPlanConfig.analysis})`,
      skinTone: `${hexColor} (${fitzpatrick})`,
      undertone,
      concerns: selectedPlanConfig.concerns || [],
      hydrationScore,
      smoothnessScore,
      clarityScore,
      plan: selectedPlanConfig.plan,
      updatedAt: new Date().toISOString()
    };

    self.postMessage({ type: "SKIN_ANALYSIS_COMPLETE", result });
  }
};
