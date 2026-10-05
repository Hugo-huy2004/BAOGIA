import { useState, useCallback } from "react";
import { dataApi } from "../services/api/modules/dataApi";

/**
 * Logic upload/xoá banner quảng cáo. Tách ra để AdminSettingsTab không cần
 * prop-drill qua AdminPanel nữa — hook này có thể gọi thẳng từ Tab.
 */
export function useAdminAds({ data, updateAdvertisement, showNotification, t }) {
  const [uploadingAd, setUploadingAd] = useState(false);

  const handleAdImageUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAd(true);
    try {
      const base64Str = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { url } = await dataApi.uploadImage(base64Str, data?.advertisement?.imageUrl || null);
      await updateAdvertisement({ imageUrl: url });
      showNotification(t("adminTabs.settings.adUpload", "Đã tải ảnh quảng cáo"));
    } catch {
      showNotification("Tải ảnh quảng cáo thất bại.", "error");
    } finally {
      setUploadingAd(false);
      event.target.value = "";
    }
  }, [data, updateAdvertisement, showNotification, t]);

  const handleAdDelete = useCallback(async () => {
    const url = data?.advertisement?.imageUrl;
    await updateAdvertisement({ imageUrl: "", isActive: false });
    if (url) {
      try {
        await dataApi.delete("/api/data/delete-ad", { body: JSON.stringify({ url }) });
      } catch {}
    }
  }, [data, updateAdvertisement]);

  return { uploadingAd, handleAdImageUpload, handleAdDelete };
}
