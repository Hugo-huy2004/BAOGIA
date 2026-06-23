// Hugo Studio is gradually splitting into 4 subdomains, all served from this
// same codebase/build — DNS just needs to point each subdomain at this
// server. Until those DNS records exist, every one of these checks is false
// on localhost/the current single apex deployment, so behavior is unchanged.
export const ROOT_DOMAIN = 'hugowishpax.studio';

export function getAppMode() {
  if (typeof window === 'undefined') return 'landing';
  const host = window.location.hostname;
  if (host.startsWith('edu.')) return 'edu';
  if (host.startsWith('project.')) return 'project';
  if (host.startsWith('admin.')) return 'admin';
  return 'landing';
}

function crossDomainUrl(subdomain, path = '/') {
  if (typeof window === 'undefined') return path;
  const isProdApex = window.location.hostname === ROOT_DOMAIN || window.location.hostname === `www.${ROOT_DOMAIN}`;
  if (!isProdApex) return path; // localhost / staging — stay on the same host
  return `${window.location.protocol}//${subdomain}.${ROOT_DOMAIN}${path}`;
}

export const eduUrl = (path = '/login') => crossDomainUrl('edu', path);
export const projectUrl = (path = '/customer-portal') => crossDomainUrl('project', path);
export const adminUrl = (path = '/admin') => crossDomainUrl('admin', path);
export const landingUrl = (path = '/') => {
  if (typeof window === 'undefined') return path;
  const mode = getAppMode();
  if (mode === 'landing') return path;
  return `${window.location.protocol}//${ROOT_DOMAIN}${path}`;
};
