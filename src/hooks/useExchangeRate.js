import { useEffect } from "react";
import { getVietcombankRate } from "../services/exchangeRateService";

// Hook để fetch tỷ giá VCB khi app load
export function useExchangeRate() {
  useEffect(() => {
    // Fetch tỷ giá realtime khi component mount
    const initRate = async () => {
      try {
        await getVietcombankRate();
      } catch (error) {
        console.warn("Could not fetch exchange rate:", error);
      }
    };

    initRate();
  }, []);
}
