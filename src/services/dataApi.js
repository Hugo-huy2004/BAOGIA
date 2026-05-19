// API Service for Hugo Wishpax Portal
// Handles all HTTP requests to the MongoDB backend

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const dataApi = {
  // Fetch all data
  async getData() {
    try {
      const response = await fetch(`${API_BASE_URL}/data`);
      if (!response.ok) throw new Error('Failed to fetch data');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Update entire data object
  async updateData(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
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
      const response = await fetch(`${API_BASE_URL}/data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value })
      });
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
      const response = await fetch(`${API_BASE_URL}/data/reset`, {
        method: 'POST'
      });
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
      const response = await fetch(`${API_BASE_URL}/bios/me?email=${encodeURIComponent(email)}`);
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
      const response = await fetch(`${API_BASE_URL}/bios/slug/${encodeURIComponent(slug)}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Bio not found');
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
      const response = await fetch(`${API_BASE_URL}/bios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
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
      const response = await fetch(`${API_BASE_URL}/bios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
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
      const response = await fetch(`${API_BASE_URL}/bios/${id}`, {
        method: 'DELETE'
      });
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
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Partner access denied');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching partner:', error);
      throw error;
    }
  }
};

export default dataApi;
