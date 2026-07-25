/**
 * walletPassGenerator.js
 * Apple Wallet & Google Wallet PKPass Generator Utility.
 * Allows members to export their Hugo Member Card directly into Apple Wallet (iOS) & Google Wallet (Android).
 */

export const WalletPassGenerator = {
  /**
   * Generates a downloadable JSON / Web Pass manifest that iOS Apple Wallet & Android Google Wallet can parse.
   */
  generatePassManifest(bio = {}) {
    const memberName = bio.displayName || "Thành Viên HugoStudio";
    const referralCode = bio.referralCode || "HUGO_CARD";
    const joyBalance = bio.joyBalance || 0;

    return {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.hugostudio.card",
      serialNumber: referralCode,
      teamIdentifier: "HUGO_STUDIO",
      organizationName: "HugoStudio",
      description: "Thẻ Thành Viên HugoStudio",
      logoText: "Hugo Card",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(99, 102, 241)",
      labelColor: "rgba(255, 255, 255, 0.7)",
      generic: {
        primaryFields: [
          {
            key: "member",
            label: "THÀNH VIÊN",
            value: memberName.toUpperCase()
          }
        ],
        secondaryFields: [
          {
            key: "code",
            label: "MÃ THẺ",
            value: referralCode
          },
          {
            key: "balance",
            label: "SỐ DƯ VÍ JOY",
            value: `${joyBalance.toLocaleString()} JOY`
          }
        ]
      },
      barcode: {
        format: "PKBarcodeFormatQR",
        message: `https://price-doc.vercel.app/member/joy?ref=${referralCode}`,
        messageEncoding: "iso-8859-1"
      }
    };
  },

  downloadPass(bio = {}) {
    const manifest = this.generatePassManifest(bio);
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HugoCard_${bio.referralCode || "Member"}.pkpass.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
