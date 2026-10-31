/**
 * Utility to optimize Cloudinary URLs by injecting format, quality, and size transformations.
 * If the URL is not a Cloudinary link, it returns the original URL.
 * 
 * @param {string} url - The original image URL.
 * @param {number} width - Target width for resizing.
 * @returns {string} Optimized URL.
 */
export function optimizeCloudinaryUrl(url, width = 800) {
  if (!url || typeof url !== "string") return url;

  // Only apply to Cloudinary links
  if (url.includes("cloudinary.com")) {
    const uploadIndex = url.indexOf("/image/upload");
    if (uploadIndex !== -1) {
      const prefix = url.substring(0, uploadIndex + 13); // up to "/image/upload"
      const suffix = url.substring(uploadIndex + 13);    // everything after "/image/upload"

      // Handle existing transformations (e.g. e_bgremoval)
      if (suffix.startsWith("/e_bgremoval")) {
        return `${prefix}/e_bgremoval,f_auto,q_auto,w_${width}${suffix.substring(12)}`;
      }

      // Check if it already has transformations (i.e. doesn't start with /v or a direct slash-folder)
      // Usually Cloudinary paths are /v12345/public_id or /folder/public_id
      if (suffix.startsWith("/")) {
        return `${prefix}/f_auto,q_auto,w_${width}${suffix}`;
      }
    }
  }
  return url;
}
