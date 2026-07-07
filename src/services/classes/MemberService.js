import dataApi from '../dataApi';

class MemberService {
  constructor() {
    this.api = dataApi;
  }

  // Fetch current member bio (API Wrapper)
  async getMemberBio(email, displayName = "", avatarUrl = "") {
    try {
      return await this.api.getMemberBio(email, displayName, avatarUrl);
    } catch (error) {
      console.error('MemberService: Failed to get member bio', error);
      throw error;
    }
  }

  // Update member bio (API Wrapper)
  async updateMemberBio(id, payload) {
    try {
      return await this.api.updateMemberBio(id, payload);
    } catch (error) {
      console.error('MemberService: Failed to update member bio', error);
      throw error;
    }
  }

  // Create member bio (API Wrapper)
  async createMemberBio(payload) {
    try {
      return await this.api.createMemberBio(payload);
    } catch (error) {
      console.error('MemberService: Failed to create member bio', error);
      throw error;
    }
  }

  // Delete member bio (API Wrapper)
  async deleteMemberBio(id) {
    try {
      return await this.api.deleteMemberBio(id);
    } catch (error) {
      console.error('MemberService: Failed to delete member bio', error);
      throw error;
    }
  }

  // Submit verification request for non-edu members (API Wrapper)
  async submitVerification(email, verificationData) {
    try {
      return await this.api.submitVerification(email, verificationData);
    } catch (error) {
      console.error('MemberService: Failed to submit verification request', error);
      throw error;
    }
  }

  // Dismiss verification notification banner (API Wrapper)
  async dismissVerificationNotification(email) {
    try {
      return await this.api.dismissVerificationNotification(email);
    } catch (error) {
      console.error('MemberService: Failed to dismiss notification', error);
      throw error;
    }
  }

  // Redeem Gift Code (API Wrapper)
  async redeemGiftCode(email, giftCode) {
    try {
      return await this.api.redeemGiftCode(email, giftCode);
    } catch (error) {
      console.error('MemberService: Failed to redeem gift code', error);
      throw error;
    }
  }

  // Fetch partners list (API Wrapper)
  async getPartners() {
    try {
      return await this.api.getPartners();
    } catch (error) {
      console.error('MemberService: Failed to get partners', error);
      throw error;
    }
  }

  // --- Local Guest Bio Management (OOP encapsulation of LocalStorage) ---
  getGuestBio(t) {
    try {
      const savedLocal = localStorage.getItem("hugo_guest_bio");
      if (savedLocal) {
        return JSON.parse(savedLocal);
      }
      return {
        displayName: "HUGO STUDIO PARTNER GUEST",
        headline: t("memberPortal.guest.headline"),
        bio: t("memberPortal.guest.bio"),
        birthday: "19/05/2026",
        phone: "0999.888.777",
        hobbies: "Design, Code, Coffee, Music",
        height: "1m75",
        weight: "65kg",
        measurements: "90-60-90",
        address: t("memberPortal.guest.address"),
        education: t("memberPortal.guest.education"),
        skills: "Figma, React, UI/UX",
        jobTitle: "UI/UX Designer",
        contactEmail: "hello@hugostudio.vn",
        avatarUrl: "",
        links: [
          { label: "Instagram", url: "https://instagram.com" },
          { label: t("memberPortal.guest.fb"), url: "https://facebook.com" }
        ],
        theme: {
          bgColor: "#0f172a",
          textColor: "#f8fafc",
          accentColor: "#6366f1",
          pattern: "stars",
          preset: "indigo-dark",
          btnRadius: 16,
          btnBorderWidth: 1,
          btnShadow: 6,
          template: "default"
        },
        tabs: [],
        projects: [],
        services: []
      };
    } catch (e) {
      console.error("MemberService: Failed to load local guest bio", e);
      return null;
    }
  }

  saveGuestBio(data) {
    try {
      localStorage.setItem("hugo_guest_bio", JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("MemberService: Failed to save guest bio", e);
      return false;
    }
  }

  deleteGuestBio() {
    try {
      localStorage.removeItem("hugo_guest_bio");
      return true;
    } catch (e) {
      console.error("MemberService: Failed to delete guest bio", e);
      return false;
    }
  }
}

export const memberService = new MemberService();
export default memberService;
