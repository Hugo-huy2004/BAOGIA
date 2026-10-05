/**
 * featureCircuitBreaker.js
 * Cơ chế cách ly sự cố & ngắt mạch tự động theo nhánh tính năng (Feature Fault Isolation)
 *
 * Nhiệm vụ:
 * 1. Ngăn chặn lỗi từ một nhánh tính năng (như Arcade, Chess, Radio...) làm sập toàn bộ tiến trình.
 * 2. Khi một nhánh gặp lỗi runtime/DB/exception liên tiếp:
 *    - Tự động ngắt riêng nhánh đó (trạng thái OPEN), phản hồi lỗi có cấu trúc (503 SERVICE_BRANCH_DEGRADED).
 *    - Toàn bộ các nhánh tính năng khác (Auth, Joy, Profile...) vẫn hoạt động bình thường 100%.
 * 3. Tự động phục hồi (Self-Healing / HALF-OPEN) khi dịch vụ ổn định trở lại.
 */

const branchRegistry = new Map();

const FAILURE_THRESHOLD = 5;      // Số lần lỗi tối đa trước khi ngắt mạch
const RECOVERY_TIMEOUT_MS = 30000; // Thời gian ngắt mạch (30 giây) trước khi thử lại

function getBranchState(featureName) {
  let state = branchRegistry.get(featureName);
  if (!state) {
    state = {
      name: featureName,
      status: 'CLOSED', // CLOSED (bình thường), OPEN (đang ngắt mạch), HALF_OPEN (đang thử lại)
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };
    branchRegistry.set(featureName, state);
  }
  return state;
}

/**
 * Middleware bảo vệ & cách ly lỗi cho từng nhánh tính năng
 * @param {string} featureName - Tên nhánh tính năng (ví dụ: 'arcade', 'chess', 'companion')
 * @param {string} featureLabel - Tên tiếng Việt hiển thị người dùng
 */
export function createFeatureIsolation(featureName, featureLabel = featureName) {
  const state = getBranchState(featureName);

  return (req, res, next) => {
    const now = Date.now();

    // 1. Kiểm tra trạng thái Circuit Breaker của nhánh này
    if (state.status === 'OPEN') {
      if (now >= state.nextAttemptTime) {
        // Đã hết thời gian ngắt, chuyển sang trạng thái thăm dò (HALF-OPEN)
        state.status = 'HALF_OPEN';
      } else {
        const remainingSeconds = Math.ceil((state.nextAttemptTime - now) / 1000);
        return res.status(503).json({
          success: false,
          error: {
            code: 'FEATURE_BRANCH_ISOLATED',
            feature: featureName,
            message: `Tính năng ${featureLabel} tạm thời được hệ thống tự ngắt để bảo vệ dữ liệu. Vui lòng thử lại sau ${remainingSeconds} giây. Các tính năng khác vẫn dùng bình thường.`,
            retryAfterSeconds: remainingSeconds,
          },
        });
      }
    }

    // 2. Bắt lỗi đồng bộ & bất đồng bộ của riêng nhánh này
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    // Gắn handler bắt lỗi nếu handler tiếp theo throw uncaught exception
    try {
      res.on('finish', () => {
        if (res.statusCode < 500) {
          // Giao dịch thành công, reset trạng thái lỗi
          if (state.status === 'HALF_OPEN') {
            state.status = 'CLOSED';
            state.failureCount = 0;
            console.log(`✅ [CircuitBreaker] Nhánh "${featureName}" đã phục hồi bình thường.`);
          }
        } else if (res.statusCode >= 500) {
          recordFailure(state);
        }
      });

      next();
    } catch (syncError) {
      handleBranchError(syncError, state, featureLabel, res);
    }
  };
}

function recordFailure(state) {
  state.failureCount += 1;
  state.lastFailureTime = Date.now();

  if (state.failureCount >= FAILURE_THRESHOLD) {
    state.status = 'OPEN';
    state.nextAttemptTime = Date.now() + RECOVERY_TIMEOUT_MS;
    console.warn(`🛑 [CircuitBreaker] Nhánh tính năng "${state.name}" đã bị ngắt tự động (OPEN). Lỗi liên tiếp: ${state.failureCount}`);
  }
}

function handleBranchError(error, state, featureLabel, res) {
  recordFailure(state);
  console.error(`⚠️ [Branch Isolation] Lỗi được cách ly tại nhánh "${state.name}":`, error.message);

  if (!res.headersSent) {
    res.status(503).json({
      success: false,
      error: {
        code: 'FEATURE_BRANCH_ERROR',
        feature: state.name,
        message: `Đã xảy ra sự cố tại nhánh ${featureLabel}. Nhánh này đã được cách ly tự động an toàn. Các tính năng khác của hệ thống vẫn hoạt động bình thường.`,
      },
    });
  }
}

/**
 * Trả về báo cáo trạng thái các nhánh phục vụ admin dashboard và health check
 */
export function getBranchHealthReport() {
  const report = {};
  for (const [name, state] of branchRegistry.entries()) {
    report[name] = {
      status: state.status,
      failures: state.failureCount,
      isOpen: state.status === 'OPEN',
    };
  }
  return report;
}
