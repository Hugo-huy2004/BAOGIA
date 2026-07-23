/**
 * hardwareAdaptiveEngine.js
 * Động cơ tự động thích ứng với cấu hình phần cứng CPU, RAM & Dung lượng Pin điện thoại.
 */

export const HardwareAdaptiveEngine = {
  async getDeviceProfile() {
    const cores = navigator.hardwareConcurrency || 4;
    let batteryLevel = 1.0;
    let isCharging = true;

    try {
      if (typeof navigator.getBattery === "function") {
        const batt = await navigator.getBattery();
        batteryLevel = batt.level;
        isCharging = batt.charging;
      }
    } catch {
      // Ignored if unsupported
    }

    const isLowPowerMode = !isCharging && batteryLevel < 0.20;
    const isHighEndDevice = cores >= 6 && batteryLevel > 0.40;

    return {
      cores,
      batteryLevel,
      isCharging,
      isLowPowerMode,
      isHighEndDevice,
      recommendedTimeoutMs: isLowPowerMode ? 800 : isHighEndDevice ? 2500 : 1500,
      maxWorkerThreads: isLowPowerMode ? 1 : Math.min(cores, 4)
    };
  }
};
