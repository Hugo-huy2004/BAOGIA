/**
 * 2 STANDARD LEGAL DOCUMENTS FOR HUGO STUDIO MEMBERS (ENGLISH EDITION)
 * ===================================================================
 * Doc 1: terms-manifest - Terms of Service & System Manifesto
 * Doc 2: database-policy - User Database Architecture & Membership Policy
 */

export const MEMBER_DOCS_EN = {
  "terms-manifest": {
    id: "terms-manifest",
    title: "Terms of Service & System Manifesto",
    subtitle: "Commitment to sustainable operations, member rights, and transparent mutual trust",
    version: "2026.4",
    lastUpdated: "September 2026",
    badge: "Current Standard",
    sections: [
      {
        id: "manifesto",
        title: "System Manifesto & Operating Philosophy",
        blocks: [
          {
            type: "p",
            text: "Hugo Studio is founded upon the core principles of absolute transparency, fairness, and uncompromising respect for individual digital privacy. The system strictly rejects exploitative data monetization practices.",
          },
          {
            type: "note",
            tone: "info",
            title: "Resource Conservation Commitment",
            text: "All features, services, and digital assets within the ecosystem are optimized under carbon-neutral principles, minimizing computing overhead and extending client hardware lifespan.",
          },
          {
            type: "steps",
            items: [
              "Autonomous ecosystem free from third-party social media monopolies.",
              "Your data belongs exclusively to you. You maintain full rights to export, backup, or permanently erase your profile.",
              "Zero behavioral tracking sold to external advertising networks.",
              "A safe, civilized environment fostering creative arts and collaborative digital knowledge.",
            ],
          },
        ],
      },
      {
        id: "terms-of-service",
        title: "Member Rights & Operating Obligations",
        blocks: [
          {
            type: "p",
            text: "Every individual who creates and verifies an account on the Member Portal is recognized as a full member of Hugo Studio with defined rights and obligations.",
          },
          {
            type: "table",
            head: ["Domain", "Member Entitlements", "Binding Responsibilities"],
            rows: [
              ["Account & Profile", "Full control of public Hugo Bio, custom Aura themes, and Passkey security", "Maintain personal credential custody; no account leasing or unauthorized transfer"],
              ["JOY Resources", "Accumulate utility JOY through creative missions, daily check-ins, and interactions", "Use JOY exclusively within legitimate ecosystem activities; zero fraud or exploit"],
              ["Public Content", "Freedom of artistic expression, creative showcase, and portfolio hosting", "No hate speech, copyright infringement, violence, or violation of territorial integrity"],
              ["Security & Support", "Rapid 24-hour dispute resolution and rigorous asset protection", "Provide truthful verification details during security reviews or audit procedures"],
            ],
          },
          {
            type: "p",
            text: "Hugo Studio strictly reserves the right to suspend or terminate service to any account engaging in system subversion, security exploitation, or sovereignty violation.",
          },
        ],
      },
      {
        id: "device-permissions",
        title: "Device Permissions & Access Bounds",
        blocks: [
          {
            type: "p",
            text: "The application requests only the strictly minimal hardware and software permissions necessary for smooth mobile and desktop interaction.",
          },
          {
            type: "steps",
            items: [
              "Push Notifications: Only deployed for critical security warnings, JOY balance alerts, and essential announcements.",
              "Local Storage (IndexedDB/Cache): Caches interface assets and offline documentation to deliver instant load times with zero bandwidth waste.",
              "Biometric Authentication (WebAuthn / Passkey): Authenticates via on-device Secure Enclave; raw biometric data never leaves your personal hardware.",
            ],
          },
        ],
      },
    ],
  },

  "database-policy": {
    id: "database-policy",
    title: "User Database Conventions & Membership Policy",
    subtitle: "Zero-Trust cryptographic architecture, JOY reward wallet terms, and card tier benefits",
    version: "2026.4",
    lastUpdated: "September 2026",
    badge: "System Convention",
    sections: [
      {
        id: "database-architecture",
        title: "Database Architecture & Zero-Trust Conventions",
        blocks: [
          {
            type: "p",
            text: "Hugo Studio's user database is engineered under Zero-Knowledge and Zero-Trust tenets. Sensitive fields are cryptographically protected using AES-256-GCM field-level encryption prior to physical disk persistence.",
          },
          {
            type: "table",
            head: ["Data Entity", "Storage Mechanism", "Retention Period"],
            rows: [
              ["Passwords / PINs", "Bcrypt salt 12 rounds / Argon2id; raw passwords are never recorded", "Permanent until member changes security credentials"],
              ["Passkeys (FIDO2)", "Public Key stored on server, Private Key protected in device hardware", "Permanent or until device unpairing"],
              ["JOY Transaction History", "Immutable append-only ledger with digital checksum signatures", "Permanent historical record for transparent accounting"],
              ["Device Login Logs", "Anonymized IP (SHA-256 hash), sanitized User-Agent header", "Automatically purged after 90 days"],
            ],
          },
          {
            type: "note",
            tone: "warning",
            title: "Right to be Forgotten",
            text: "When selecting 'Permanently Delete Account' under Security Settings, all personal profiles, bios, links, and avatar files are immediately erased from the cluster. Financial transaction ledgers retain only anonymized hashes to preserve ledger integrity.",
          },
        ],
      },
      {
        id: "joy-policy",
        title: "JOY Utility Points & JOYlater Terms",
        blocks: [
          {
            type: "p",
            text: "JOY represents internal utility reward points within the Hugo Studio ecosystem. JOY holds no fiat currency status, cannot be exchanged for cash, and unauthorized secondary trading is prohibited.",
          },
          {
            type: "table",
            head: ["Action / Service", "Reward / Cap", "Operational Notes"],
            rows: [
              ["Daily Check-in", "+5 to +20 JOY / day", "Automatically resets at 00:00 (GMT+7)"],
              ["Friend Referral", "+100 JOY / verified peer", "Credited when referee completes profile setup"],
              ["Peer-to-Peer Transfer", "Up to 5,000 JOY / day", "Protected by mandatory 6-digit wallet PIN"],
              ["JOYlater (Point Advance)", "Tier-based credit allowance", "Automatically amortized as new rewards accrue"],
            ],
          },
          {
            type: "steps",
            items: [
              "JOYlater credit is exclusively valid for unlocking digital tools and themes inside Hugo Studio.",
              "Delayed repayment of JOYlater never incurs financial interest and involves no external collection mechanisms.",
              "Accounts with active JOYlater advances cannot initiate outgoing peer transfers until settlement is complete.",
            ],
          },
        ],
      },
      {
        id: "tier-system",
        title: "Membership Tier System & Privileges",
        blocks: [
          {
            type: "p",
            text: "Card tiers update automatically based on community referral contributions. There are no ongoing subscription maintenance fees and tiers never downgrade.",
          },
          {
            type: "table",
            head: ["Tier Level", "Requirement", "Core Privileges"],
            rows: [
              ["Member", "Default upon registration", "Standard Hugo Bio hosting, individual JOY wallet"],
              ["Silver", "3 verified referrals", "Unlocks Dark Aura themes, +500 JOY bonus voucher"],
              ["Gold", "10 verified referrals", "+1,300 JOY bonus voucher, prioritized 24/7 support response"],
              ["Diamond", "25 verified referrals", "+3,500 JOY bonus voucher, full Bio effect library access"],
              ["Premium VIP", "50 verified referrals", "+20,000 JOY bonus voucher, bespoke Hugo Studio physical memorabilia"],
            ],
          },
        ],
      },
    ],
  },
};
