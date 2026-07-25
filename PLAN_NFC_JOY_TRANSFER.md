# Plan: NFC Tap to Transfer JOY

## Overview

Add NFC tap functionality to the JOY transfer flow, supporting two modes:
1. **Physical NFC Tag**: Recipient writes referral code to a physical tag; sender taps to read
2. **Device-to-Device NFC**: Two phones tap each other to exchange referral codes

## Technical Constraints

- **Web NFC API** (read/write): Supported on **Android Chrome 89+** only
- **iOS Safari**: Does NOT support Web NFC → fallback to QR scan (existing)
- **NFC Tag Emulation (HCE)**: Not available in Web NFC API → device-to-device requires Android-specific workaround or fallback to QR

## Files to Create/Modify

### 1. `src/hooks/useNfc.js` — NEW (NFC service hook)

```js
// Wraps Web NFC API (NDEFReader)
// - isSupported: boolean
// - readTag(): Promise<{ records: [{ id, type, data }] }>  
// - writeTag(data: string): Promise<void>
// - startScan(onRead): cleanup function
// Uses NDEFReader if available, falls back gracefully
```

**Key functions:**
- `useNfc()` → returns `{ isSupported, readTag, writeTag, startScan }`
- `readTag()`: Opens NDEFReader, reads one NDEF record, returns decoded text
- `writeTag(data)`: Writes an NDEF text record with the referral code
- `startScan(onRead)`: Starts continuous scanning, calls `onRead` with each tag read

### 2. `src/components/member/shared/ParticleConnectModal.jsx` — MODIFY

**Changes in the "My QR" mode (line ~858-873):**
- Add "Ghi NFC" button below the Particle Generator
- When tapped: calls `writeTag(myQR.referralCode)` → shows success toast
- Button only visible when `nfc.isSupported === true`

**Changes in the "Select" step (line ~772-893):**
- Add 4th tab: `{ id: "nfc", icon: "nfc", label: "Tap NFC" }`
- NFC tab content: Shows scanning animation + "Đặt thẻ NFC vào mặt sau điện thoại"
- When tag is read: calls `resolveJoyQr(tagData)` or `searchJoyUser(tagData)` → selects recipient

**New state:**
- `nfcScanning` — whether NFC reader is actively listening
- `nfcSupported` — detected on mount

### 3. `src/services/joyApi.js` — MINOR MODIFY

Add a new function to resolve by raw referral code (without HMAC verification):

```js
export async function resolveReferralCode(code) {
  const res = await fetch(`${getApiUrl()}/joy/resolve-qr?payload=${encodeURIComponent(code)}`);
  return parseOrThrow(res);
}
```

Actually, `resolveJoyQr` already falls back to `searchJoyUser` for non-14-char strings, so this might not be needed. The NFC tag will contain the plain referral code, and `resolveJoyQr` handles it via the fallback path.

### 4. Server-side: `server/routes/joyRoutes.js` — ADD new route

Add `GET /api/joy/resolve-nfc?code=` to resolve a plain referral code:

```js
router.get('/resolve-nfc', async (req, res) => {
  const code = String(req.query.code || '').trim();
  if (!code || code.length > 8) return res.status(400).json({ error: 'Invalid code' });
  const bio = await Bio.findOne({ referralCode: code.toUpperCase() }).select('displayName avatarUrl referralCode slug');
  if (!bio) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, displayName: bio.displayName, avatarUrl: bio.avatarUrl, referralCode: bio.referralCode });
});
```

This is a simpler, non-time-bound endpoint for NFC tags (which contain static referral codes, not signed tokens).

### 5. `src/i18n/locales/vi/translation.json` & `en/translation.json` — ADD NFC keys

Under `joy.particle`:
```json
{
  "tabNfc": "Tap NFC",
  "nfcWrite": "Ghi NFC",
  "nfcWriteSuccess": "Đã ghi NFC thành công!",
  "nfcWriteHint": "Chạm thẻ NFC vật lý vào mặt sau điện thoại để ghi mã",
  "nfcScanTitle": "Đang tìm thẻ NFC...",
  "nfcScanHint": "Đặt thẻ NFC vào mặt sau điện thoại",
  "nfcUnsupported": "Trình duyệt không hỗ trợ NFC",
  "nfcDeviceToDevice": "Chạm hai điện thoại lại với nhau"
}
```

## Implementation Steps

### Step 1: Create `useNfc.js` hook
- Detect Web NFC support (`'NDEFReader' in window`)
- Implement `writeTag(code)`: write NDEF text record with referral code
- Implement `startScan(callback)`: continuous NDEF reading
- Handle errors gracefully (permission denied, unsupported)

### Step 2: Add NFC tab to ParticleConnectModal
- Add 4th tab in the mode selector
- NFC tab shows scanning UI
- When a tag is read, resolve the referral code and select recipient

### Step 3: Add "Write NFC" button to My QR section
- Below the ParticleGenerator, add a button
- On click, write current referral code to NFC tag
- Show success/error toast

### Step 4: Add server route
- `GET /api/joy/resolve-nfc?code=` — simple referral code lookup

### Step 5: Add i18n translations
- Add NFC-related keys to both `vi` and `en` locales

## Device-to-Device NFC (Limitations)

Web NFC API does **not** support tag emulation (one phone acting as a tag). For device-to-device:

**Option A (Recommended)**: Use NFC for physical tags only. Device-to-device falls back to QR scan.

**Option B (Advanced)**: Use `Web Bluetooth` or `WebRTC` for device-to-device proximity transfer. This is significantly more complex and not true NFC.

**Option C (Native App)**: If the app is wrapped in a native shell (Capacitor/Cordova), use the native NFC plugin for HCE (Host Card Emulation). The referral code could be emulated as an NDEF record.

For this plan, we implement **Option A** — NFC for physical tags, QR for device-to-device. This is the most practical approach for a PWA.

## User Flow

### Write NFC (Recipient)
1. Open JOY transfer modal → "Mã của tôi" tab
2. See Particle Generator + "Ghi NFC" button
3. Tap "Ghi NFC" → prompt "Chạm thẻ NFC vật lý vào điện thoại"
4. User holds physical NFC tag against phone back
5. Toast: "Ghi NFC thành công!"
6. Tag now contains referral code → anyone can tap to send JOY

### Read NFC (Sender)
1. Open JOY transfer modal → "Tap NFC" tab
2. Scanning animation: "Đặt thẻ NFC vào mặt sau điện thoại"
3. User holds phone against the NFC tag
4. Tag is read → referral code extracted
5. Server resolves user → recipient card shown
6. Continue with normal flow (amount → invoice → PIN → send)

## Testing

1. Test on Android Chrome with a physical NFC tag
2. Verify NFC write reads back correctly
3. Verify fallback on iOS (QR tab still works)
4. Test resolve-nfc route with valid/invalid codes
5. Test end-to-end: write tag → tap tag → transfer JOY

## Estimated Size

- `useNfc.js`: ~80 lines
- `ParticleConnectModal.jsx` changes: ~60 lines added
- `joyRoutes.js` addition: ~15 lines
- Translation additions: ~20 keys
- Total: ~175 lines of new/modified code
