/**
 * clientComputeWorker.js
 * Background Web Worker Engine for Client-Edge Offloading.
 * Moves heavy computations (image matrix processing, search indexing, data compression)
 * to a secondary background CPU thread to ensure 120fps UI rendering.
 */

self.onmessage = function (e) {
  const { type, payload, id } = e.data || {};

  try {
    switch (type) {
      case "COMPUTE_SEARCH_INDEX": {
        const { items } = payload || {};
        const indexMap = (items || []).map(item => ({
          id: item.id || item._id,
          terms: [
            item.title || item.displayName || '',
            item.referralCode || '',
            ...(item.tags || [])
          ].join(' ').toLowerCase()
        }));
        self.postMessage({ id, type: "SEARCH_INDEX_READY", result: indexMap });
        break;
      }

      case "PROCESS_COLOR_HISTOGRAM": {
        const { buffer, width, height } = payload || {};
        const data = new Uint8ClampedArray(buffer);
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        const step = 16; // Sub-sampled 4x4

        for (let i = 0; i < data.length; i += step) {
          rSum += data[i];
          gSum += data[i + 1];
          bSum += data[i + 2];
          count++;
        }

        const avgR = Math.round(rSum / (count || 1));
        const avgG = Math.round(gSum / (count || 1));
        const avgB = Math.round(bSum / (count || 1));

        self.postMessage({ id, type: "COLOR_HISTOGRAM_DONE", result: { avgR, avgG, avgB } });
        break;
      }

      default:
        self.postMessage({ id, type: "UNKNOWN_TASK_DONE", result: null });
        break;
    }
  } catch (err) {
    self.postMessage({ id, type: "ERROR", error: err.message });
  }
};
