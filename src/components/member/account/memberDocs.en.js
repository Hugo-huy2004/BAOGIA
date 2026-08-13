import { MembershipFactory } from "../../../models/membershipTier.js";

const CONTACT_EMAIL = "contact@hugowishpax.studio";

const TIER_PRIVILEGES = {
  membership: [
    "Standard Hugo Studio account",
    "Earn JOY by completing missions",
  ],
  silver: [
    "7 days of Hugo Arcade — free access for 7 days",
    "500 JOY voucher — added to your wallet",
  ],
  gold: [
    "1 month of Hugo Arcade VIP",
    "1,300 JOY voucher",
    "14-day account access voucher",
  ],
  diamond: [
    "6 months of Hugo Arcade VIP",
    "3,500 JOY voucher",
    "90-day account access voucher",
  ],
  premium: [
    "6 months of Hugo Arcade VIP",
    "20,000 JOY voucher",
    "1-year account access voucher",
    "A surprise gift from Hugo Studio",
  ],
};

export function privilegeSectionsEn() {
  const tiers = MembershipFactory.getAllTiers();

  return [
    {
      id: "how-tiers-work",
      title: "How card tiers are calculated",
      blocks: [
        {
          type: "p",
          text: "Your membership card tier is based on the number of people who successfully sign up with your referral code. A referral counts only when a real new member creates an account and enters your code. Your tier updates automatically as soon as you reach the required number.",
        },
        {
          type: "table",
          head: ["Card tier", "Requirement"],
          rows: tiers.map((tier) => [
            tier.name,
            tier.minReferrals === 0
              ? "Included when you create an account"
              : `${tier.minReferrals} successful referrals`,
          ]),
        },
        {
          type: "note",
          tone: "info",
          title: "Card tiers and Star tiers are different",
          text: "Card tiers (MemberShip through Premium) are earned through referrals. Star tiers (Star-14, Star-18 and Star-VIP) depend on age and determine birthday rewards. See Member rights and responsibilities for details.",
        },
      ],
    },
    ...tiers.map((tier) => ({
      id: `tier-${tier.id}`,
      title: `${tier.name} tier`,
      blocks: [
        {
          type: "p",
          text: tier.minReferrals === 0
            ? "Every account starts at this tier immediately after registration."
            : `Unlocks after ${tier.minReferrals} successful referrals.`,
        },
        { type: "list", items: TIER_PRIVILEGES[tier.id] || [] },
      ],
    })),
    {
      id: "how-to-earn-privileges",
      title: "How to earn privileges",
      blocks: [
        {
          type: "steps",
          items: [
            "Share the referral code shown on your membership card in Account.",
            "The new member registers and enters your code in the Referrer's code field.",
            "Your successful referral count increases and your card tier updates automatically.",
            "Any JOY or voucher included with the tier is added to your wallet and remains visible in My perks.",
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "A referral code can be applied only once",
          text: "Each account may enter one referrer's code during initial registration. Creating additional accounts to use your own code is fraud and may result in the related JOY and privileges being revoked.",
        },
      ],
    },
    {
      id: "privilege-protection",
      title: "How your privileges are protected",
      blocks: [
        {
          type: "list",
          items: [
            "A validly issued privilege is recorded in your account. You may review its status, expiry date and conditions before using it.",
            "If Hugo Studio changes the tier structure, the new structure applies prospectively. A valid, unexpired benefit remains available under the conditions shown when it was issued, unless it resulted from a system error or fraud, or the law requires another outcome.",
            "If a benefit can no longer be provided because its feature has ended, Hugo Studio may replace it with an ecosystem benefit of comparable practical value and will notify members before the replacement.",
            "You may request a review if your tier, referral count, voucher or JOY balance appears incorrect. System records are the primary reconciliation source, and relevant evidence you provide will also be considered.",
            "An unused benefit does not create a cash refund, because JOY, vouchers and access time are internal benefits rather than deposits or investments.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "You can review the conditions first",
          text: "Each voucher or benefit has its own duration, scope and usage limit. The conditions displayed in your account when it is issued apply to that benefit. Where wording conflicts, the interpretation more favorable to the member is preferred to the extent permitted by law.",
        },
      ],
    },
  ];
}

export function conditionSectionsEn() {
  return [
    {
      id: "member-rights",
      title: "Member rights",
      blocks: [{
        type: "list",
        items: [
          "Know which features are free and which require verification, a membership tier, a minimum age, JOY or payment before choosing to use them.",
          "Use features open to your account group on equal terms. Your core access will not be reduced because you do not donate, purchase a service or grant an optional device permission.",
          "Retain ownership of content you create and decide what is public on your Bio and what remains private in your account, within each feature's technical limits.",
          "Access, correct, obtain, delete or restrict the processing of personal data; withdraw consent; object to processing; make a complaint; and seek compensation as provided by law.",
          "Receive a reason when an account or access right is restricted, except for information that must remain confidential to protect the system or another person, or to comply with a competent authority.",
          "Request support, reconcile benefits and challenge a decision to lock an account, revoke JOY or refuse a request.",
          "Stop using the service, delete content and request account deletion at any time, with the understanding that deleted data may not be recoverable.",
        ],
      }],
    },
    {
      id: "age",
      title: "Age requirements",
      blocks: [
        {
          type: "list",
          items: [
            "The member area is available only to people aged 14 or older. A person under 14 may view public pages but may not create or use a member account.",
            "Ages 14 to under 16: a parent or legal guardian must read the Privacy Policy and consent before the account continues processing personal data. The system records the confirmation time but does not require an identity document solely to prove age.",
            "Ages 16 to under 18: regular member features are available. Features for adults, transactions or agreements requiring full legal capacity remain restricted and may require a legal representative.",
            "Age 18 or older: adult features may become available after a complete date of birth is provided and the feature's separate conditions are met.",
            "If an account belongs to a person under 14 or lacks required consent, Hugo Studio may pause processing, verify the circumstances, and delete or restrict data as required by law. A parent or guardian may contact us to request earlier action.",
          ],
        },
        { type: "age-card" },
      ],
    },
    {
      id: "member-responsibilities",
      title: "Member responsibilities",
      blocks: [
        {
          type: "list",
          items: [
            "Provide truthful information in required fields, especially your date of birth, email and verification status. Do not impersonate another person or use their account.",
            "Take reasonable steps to protect your Google account, device, JOY PIN, QR code and sign-in session, and promptly report suspected unauthorized access so potential harm can be limited.",
            "Respect other people's privacy, dignity, copyright and personal data, and publish only content you are entitled to use.",
            "Follow product guidance. Do not exploit errors, use unauthorized automation, interfere with technical controls, create false transactions or bypass age and access controls.",
            "Verify information from AI, health tools, news sources or third parties before relying on it for an important decision.",
            "If you purchase a service, pay for the confirmed work and provide agreed feedback, source materials and approvals on time so the project is not delayed by missing information.",
            "Remain responsible for content you publish, decisions you make and loss caused to Hugo Studio or another person through your breach of these terms or the law.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Responsibility follows reasonable control",
          text: "A member is responsible only for conduct, content and devices within their reasonable control, and is not held responsible for an incident caused entirely by Hugo Studio's systems or providers.",
        },
      ],
    },
    {
      id: "star-tiers",
      title: "Star tiers and birthday rewards",
      blocks: [
        {
          type: "p",
          text: "Your Star tier is calculated from your date of birth whenever it is read and is not stored permanently. Star-14 becomes Star-18 on your 18th birthday. This tier determines your birthday-month reward.",
        },
        {
          type: "list",
          items: [
            "Star-14 (ages 14 to under 18): 15 additional days of account access.",
            "Star-18 (age 18 or older): 30 additional days, plus a 15% voucher for a landing page or multi-page website.",
            "Star-VIP (an honorary status granted by Hugo Studio): 90 additional days, plus a 15% static-web voucher and a 10% dynamic-web-app voucher.",
          ],
        },
        {
          type: "list",
          items: [
            "The reward opens only during your birthday month, once per year, and includes one lucky spin.",
            "A complete day, month and year of birth is required. Without a year, the system treats your age as unknown.",
            "Service vouchers expire 30 days after issue, may be used once and should be provided when discussing your project.",
          ],
        },
      ],
    },
    {
      id: "account-access",
      title: "Keeping your account active",
      blocks: [{
        type: "list",
        items: [
          "Each person should use one primary account. Additional accounts used to manipulate referrals, JOY, achievements or benefits may be consolidated, have benefits revoked or be locked.",
          "Account access has a maintenance period. When it ends, a public Bio may be paused, but data is not immediately deleted solely because access expired. You may renew using an available valid benefit or option.",
          "Some learning features for students require verification. A lack of student verification does not remove basic member rights that do not depend on student status.",
          "A saved date of birth is locked to protect age controls. If it is incorrect, you may request a correction after reasonable verification designed to prevent misuse.",
        ],
      }],
    },
    {
      id: "joy-rules",
      title: "JOY rules",
      blocks: [
        {
          type: "list",
          items: [
            "JOY is an internal reward balance, not currency, and cannot be converted back to cash.",
            "JOY may come from missions, check-ins, games, referrals and system rewards. Every credit and debit is recorded in wallet history.",
            "Creating JOY, achievements or transactions through fraud, error exploitation or automated tools may result in reversal and account locking.",
            "Sending JOY to another person requires a six-digit transaction PIN, which can be set in the wallet.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Full legal documents",
          text: `This member summary supplements the binding Terms of Use and Privacy Policy on the public site. Questions may be sent to ${CONTACT_EMAIL}.`,
        },
      ],
    },
    {
      id: "support-and-complaints",
      title: "Support requests and complaints",
      blocks: [{
        type: "steps",
        items: [
          `Email ${CONTACT_EMAIL} from the address linked to your account and state the feature, relevant time, requested outcome and any supporting evidence.`,
          "Hugo Studio will acknowledge the request within a reasonable period. Personal-data requests receive an initial response within two working days under current requirements.",
          "If more information is needed to verify account ownership or clarify the matter, processing time runs from receipt of the complete valid information.",
          "If you disagree with the result, you may request one reconsideration and retain any right to complain, report, bring a claim or seek assistance from a competent authority under applicable law.",
        ],
      }],
    },
  ];
}

export function rightsAccessSectionsEn() {
  return [
    {
      id: "access-principles",
      title: "Access principles",
      blocks: [
        {
          type: "p",
          text: "Hugo Studio grants access according to need. You receive the features appropriate to your age, verification status, membership tier and current benefits. Private data is shown only to the account holder or a person authorized by law.",
        },
        {
          type: "table",
          head: ["Access group", "Available access", "Main condition"],
          rows: [
            ["Public visitor", "Introduction, services, guides, terms and any Bio made public by its owner", "No sign-in required"],
            ["Basic member", "Account, Bio, JOY and community utilities", "Age 14 or older and a valid required profile"],
            ["Verified student", "Utilities and benefits reserved for learners", "Current valid verification"],
            ["Card tier or benefit", "Vouchers, access time, items and features stated on the benefit", "Required tier; unexpired; uses remaining"],
            ["Adult feature", "Content, transactions or risks intended only for adults", "Age 18 or older and all feature-specific conditions"],
            ["System administration", "Operations, anti-fraud and support tools", "Authorized staff only; important actions are controlled on the server"],
          ],
        },
      ],
    },
    {
      id: "device-permissions",
      title: "You control device permissions",
      blocks: [
        {
          type: "table",
          head: ["Permission", "Used only when", "If you decline"],
          rows: [
            ["Notifications", "You enable reminders and account updates", "Your account continues to work; push alerts are unavailable"],
            ["Location", "You enable weather, location features or location-based sign-in protection", "The related feature is unavailable or uses default data"],
            ["Camera", "You choose to scan a QR code or capture an image", "You may type or choose a file where the feature supports an alternative"],
            ["Microphone", "You choose a supported audio-input feature", "You can continue using text input"],
            ["Biometrics", "Your device confirms a passkey sign-in", "You can continue with Google; Hugo Studio does not receive your fingerprint or face template"],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Core access is not exchanged for device permissions",
          text: "Declining an optional permission disables only the feature that requires it. Hugo Studio will not lower your membership tier, deduct JOY or block unrelated features solely because you decline a device permission.",
        },
      ],
    },
    {
      id: "hugo-studio-rights",
      title: "Hugo Studio's rights",
      blocks: [{
        type: "list",
        items: [
          "Design, operate, test, maintain, change or discontinue a feature for safety, legal compliance, operating cost or product-direction reasons.",
          "Verify identity, age, student status, transactions, referral counts and rights in content when activity appears unusual or a benefit depends on that information.",
          "Reject, hide or remove content; apply rate limits; hold a transaction; or correct JOY, achievements or benefits arising from an error, refund, misuse or fraud.",
          "Temporarily lock or end access when reasonably needed to prevent harm, protect users or the system, comply with law, or address a serious or repeated breach.",
          "Use suitable infrastructure and data-processing providers to operate the service within the scope disclosed in the Privacy Policy and applicable data-protection arrangements.",
          "Protect Hugo Studio's intellectual property, technical secrets, reputation and lawful interests from infringement.",
        ],
      }],
    },
    {
      id: "hugo-studio-responsibilities",
      title: "Hugo Studio's responsibilities and commitments",
      blocks: [{
        type: "list",
        items: [
          "Provide clear information about features, prices, benefit conditions, important limits and data processing before a user makes a choice.",
          "Respect personal-data rights and provide mechanisms to access, correct, obtain, delete, restrict or object to processing, or withdraw consent, as provided by law.",
          "Apply management and technical safeguards appropriate to the scale, nature and risk of the data; control access; address incidents; and notify authorities or affected people where required by law.",
          "Not sell personal data, require unnecessary device permissions or use a member's private content to train Hugo Studio's own AI models.",
          "Record JOY, tiers and benefits according to the published rules, accept reconciliation requests and correct supported errors.",
          "Honor the agreed scope, price, delivery milestones and remedies for paid services, including mandatory consumer rights even when they are not repeated in this document.",
          "Where practicable, provide advance notice of an important adverse change and avoid retroactively removing a validly earned benefit, unless required for legal, safety or fraud reasons.",
          "Give a reason and a channel to challenge an access restriction, except where disclosure could expose a security measure, infringe another person's rights or be restricted by law.",
        ],
      }],
    },
    {
      id: "suspension-and-review",
      title: "Suspension, restoration and review",
      blocks: [{
        type: "steps",
        items: [
          "In an emergency, Hugo Studio may first apply a block to prevent harm and then verify the circumstances. The preferred measure is the narrowest one sufficient to address the risk.",
          "Where notice can be given, the member receives the general reason, scope of the restriction, expected duration or the action needed for restoration review.",
          `The member may respond from the account email to ${CONTACT_EMAIL}, explaining why the decision may be incorrect and providing relevant evidence.`,
          "Hugo Studio reconsiders the matter using system logs, evidence from both sides and the level of risk. Access is restored or the measure narrowed when the basis for restriction no longer applies.",
        ],
      }],
    },
    {
      id: "responsibility-boundaries",
      title: "Limits and allocation of responsibility",
      blocks: [{
        type: "list",
        items: [
          "Free community features are provided according to actual operating capacity and do not guarantee uninterrupted availability or a particular educational, health, career or income outcome.",
          "Hugo Studio is responsible for systems and conduct within its reasonable control. A third-party provider remains responsible for the accounts, infrastructure and transactions it directly controls.",
          "To the extent permitted by law, Hugo Studio is not responsible for indirect loss, expected profit, lost opportunity or consequences caused by ignoring a warning, misusing a feature, supplying inaccurate data or relying on AI content for an important decision.",
          "For a paid service, the preferred remedy is to correct the issue, repeat deficient work or refund the value not provided, in accordance with the agreement and applicable law.",
          "Nothing in this document excludes mandatory responsibility for personal-data protection, consumer rights, intentional or gross fault, or another obligation that the law does not allow to be excluded.",
        ],
      }],
    },
  ];
}

export const MEMBER_DOCS_EN = {
  privileges: {
    id: "privileges",
    title: "Member privileges",
    intro: "How card tiers work, what each tier includes, and how to unlock the next tier.",
    sections: privilegeSectionsEn,
  },
  conditions: {
    id: "conditions",
    title: "Member rights and responsibilities",
    intro: "Core rights, age requirements, safe-use responsibilities, Star tiers and JOY rules.",
    sections: conditionSectionsEn,
  },
  "rights-access": {
    id: "rights-access",
    title: "Rights and access",
    intro: "Access by account group, device permissions, each party's responsibilities and review of restrictions.",
    sections: rightsAccessSectionsEn,
  },
};
