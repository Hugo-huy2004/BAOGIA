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
              ["Peer-to-Peer Transfer", "500 JOY/day (Star-14) · 1,000 JOY/day (other tiers) · 8,000 JOY/month", "Protected by mandatory 6-digit wallet PIN"],
              ["Transfer Fee", "0% (Star-VIP) · 5% (other tiers)", "Keeps the system running; not a profit margin"],
              ["JOYlater (JOY Credit)", "Assessed from your profile, multiplied by your tier", "Reassessed automatically every Saturday at 17:00"],
              ["JOYlater Interest", "In-term rate floats weekly · overdue ×1.5 · late interest 10%/year", "Within the caps of Vietnam's Civil Code 2015, article 466"],
            ],
          },
          {
            type: "steps",
            items: [
              "JOYlater credit is valid only for unlocking digital tools and features inside Hugo Studio. JOY cannot be converted to cash, so this is not a monetary credit relationship.",
              "Your limit is assessed from your member profile (JOY earned minus JOY spent, balance, how regularly you use the system, and your repayment record), then multiplied by your tier. Star-14 members are not granted a limit.",
              "Interest accrues daily on the remaining principal. The in-term rate is fixed when you sign and does not change for the life of the loan. Repaying early always reduces interest and carries no fee.",
              "Late repayment incurs overdue interest (capped at 150% of the in-term rate) and interest on late interest (capped at 10% per year), following the limits of Vietnam's Civil Code 2015, article 466.",
              "Prolonged default triggers escalating measures, each announced in advance: past 7 days, transfers and new plans are suspended; past 21 days, spending is frozen; past 45 days, the account is locked for 30 days; past 90 days, a case is referred to administration for permanent measures.",
              "Hugo Studio never pursues repayment through any channel outside the system, never passes member data to third parties for collection, and never converts a JOYlater balance into a cash obligation.",
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
