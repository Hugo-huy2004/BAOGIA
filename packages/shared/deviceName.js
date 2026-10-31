/** "Safari · iPhone" từ user-agent — đủ để chủ tài khoản nhận ra máy của mình. '' khi không đoán được. */
export function deviceName(ua = '') {
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android'
    : /Macintosh|Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) ? 'Safari' : /Hugo|Capacitor/i.test(ua) ? 'Hugo Studio' : '';
  return [browser, os].filter(Boolean).join(' · ');
}
