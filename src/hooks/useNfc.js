import { useState, useCallback, useRef, useEffect } from "react";

const isNfcSupported = () => typeof window !== "undefined" && "NDEFReader" in window;

export function useNfc() {
  const [supported, setSupported] = useState(() => isNfcSupported());
  const ndefRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    setSupported(isNfcSupported());
  }, []);

  const writeTag = useCallback(async (text) => {
    if (!isNfcSupported()) throw new Error("NFC_NOT_SUPPORTED");
    const ndef = new window.NDEFReader();
    await ndef.write({ records: [{ recordType: "text", data: new TextEncoder().encode(text) }] });
  }, []);

  const startScan = useCallback((onRead) => {
    if (!isNfcSupported()) return () => {};
    const ndef = new window.NDEFReader();
    ndefRef.current = ndef;
    const controller = new AbortController();
    abortRef.current = controller;

    ndef.addEventListener("reading", ({ message }) => {
      for (const record of message.records) {
        if (record.recordType === "text") {
          const text = new TextDecoder().decode(record.data);
          onRead(text);
        }
      }
    }, { signal: controller.signal });

    ndef.scan({ signal: controller.signal }).catch(() => {});

    return () => {
      controller.abort();
      ndefRef.current = null;
    };
  }, []);

  const stopScan = useCallback(() => {
    abortRef.current?.abort();
    ndefRef.current = null;
  }, []);

  useEffect(() => () => stopScan(), [stopScan]);

  return { supported, writeTag, startScan, stopScan };
}
