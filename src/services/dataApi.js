// API Service for Hugo Wishpax Portal
// Handles all HTTP requests to the MongoDB backend

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
import { isAdminAuthenticated, getAdminSession } from './authSession';

const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (isAdminAuthenticated()) {
    const session = getAdminSession();
    if (session && session.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }
  }
  return headers;
};

// Safe fetch with CORS error handling
const safeFetch = async (url, options = {}) => {
  try {
    // First try with credentials
    let response = await fetch(url, {
      ...options,
      credentials: 'include'
    });

    // If CORS error, retry without credentials
    if (response.status === 0 && options.method === 'GET') {
      response = await fetch(url, {
        ...options,
        credentials: 'omit'
      });
    }

    return response;
  } catch (error) {
    // Network error - try without credentials as fallback
    if (options.method === 'GET' || !options.method) {
      return fetch(url, {
        ...options,
        credentials: 'omit'
      });
    }
    throw error;
  }
};

export const dataApi = {
  // Fetch all data
  async getData() {
    try {
      const endpoint = isAdminAuthenticated() ? `${API_BASE_URL}/data/admin` : `${API_BASE_URL}/data`;
      const response = await safeFetch(endpoint, { headers: getAuthHeaders() });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to fetch data');
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // Update entire data object
  async updateData(data) {
    try {
      const response = await safeFetch(`${API_BASE_URL}/data`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to update data');
      return await response.json();
    } catch (error) {
      console.error('Error updating data:', error);
      throw error;
    }
  },

  // Update specific field
  async updateField(field, value) {
    try {
      const response = await safeFetch(`${API_BASE_URL}/data`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ field, value })
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to update field');
      return await response.json();
    } catch (error) {
      console.error('Error updating field:', error);
      throw error;
    }
  },

  // Reset to default data
  async resetData() {
    try {
      const response = await safeFetch(`${API_BASE_URL}/data/reset`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to reset data');
      return await response.json();
    } catch (error) {
      console.error('Error resetting data:', error);
      throw error;
    }
  },

  // Fetch current member bio by email
  async getMemberBio(email) {
    try {
      const response = await safeFetch(`${API_BASE_URL}/bios/me?email=${encodeURIComponent(email)}`, { headers: getAuthHeaders() });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to fetch bio');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching member bio:', error);
      throw error;
    }
  },

  // Fetch public bio by slug
  async getBioBySlug(slug) {
    try {
      const response = await safeFetch(`${API_BASE_URL}/bios/slug/${encodeURIComponent(slug)}`, { headers: getAuthHeaders() });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Bio not found', { credentials: 'include', credentials: 'include' });
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching bio by slug:', error);
      throw error;
    }
  },

  // Create member bio
  async createMemberBio(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/bios`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to create bio');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating member bio:', error);
      throw error;
    }
  },

  // Update member bio
  async updateMemberBio(id, payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/bios/${id}`, { credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to update bio');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating member bio:', error);
      throw error;
    }
  },

  // Delete member bio
  async deleteMemberBio(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/bios/${id}`, { credentials: 'include',
        method: 'DELETE'
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to delete bio');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting member bio:', error);
      throw error;
    }
  },

  // Validate public partner access for embedded partner bio editor
  async getPartner(partnerId, accessToken) {
    try {
      const params = new URLSearchParams({ token: accessToken || '' });
      const response = await fetch(`${API_BASE_URL}/partners/${encodeURIComponent(partnerId)}/access?${params.toString()}`);
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Partner access denied', { credentials: 'include', credentials: 'include' });
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching partner:', error);
      throw error;
    }
  },

  // Search bios with pagination (Admin only, requires token)
  async getBios(params) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/bio?${query}`, { credentials: 'include', credentials: 'include', headers: getAuthHeaders() });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to fetch bios');
      return await response.json();
    } catch (error) {
      console.error('Error fetching bios:', error);
      throw error;
    }
  },

  // Fetch all partners
  async getPartners() {
    try {
      const response = await fetch(`${API_BASE_URL}/partners`);
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to fetch partners', { credentials: 'include', credentials: 'include' });
      return await response.json();
    } catch (error) {
      console.error('Error fetching partners:', error);
      throw error;
    }
  },

  // Fetch all packages
  async getPackages() {
    try {
      const response = await fetch(`${API_BASE_URL}/packages`);
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to fetch packages', { credentials: 'include', credentials: 'include' });
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // Create new package template
  async createPackage(pkg) {
    try {
      const response = await fetch(`${API_BASE_URL}/packages`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkg)
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to create package');
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // Edit package template
  async updatePackage(id, pkg) {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/${id}`, { credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkg)
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to update package');
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // Delete package template
  async deletePackage(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/${id}`, { credentials: 'include',
        method: 'DELETE'
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to delete package');
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // Get user packages by email
  async getUserPackages(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/user?email=${encodeURIComponent(email)}`);
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to fetch user packages', { credentials: 'include', credentials: 'include' });
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // Assign package to user by email
  async assignUserPackage(email, packageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/user`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, packageId })
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to assign package');
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // Remove package from user by email and instance ID
  async removeUserPackage(email, packageInstanceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/user`, { credentials: 'include',
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, packageInstanceId })
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to remove package');
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // Upload standalone image (projects etc.)
  async uploadImage(base64Str, oldUrl = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/upload-ad`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Str, oldUrl })
      });
      
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('price-doc-member-session');
          localStorage.removeItem('price-doc-admin-session');
          sessionStorage.removeItem('price-doc-member-session');
          sessionStorage.removeItem('price-doc-admin-session');
          window.location.href = '/login';
        }
      }
      if (!response.ok) throw new Error('Failed to upload image');
      return await response.json();
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
};

export default dataApi;
