/**
 * Communication and Database Diagram Data (English)
 * Provides schema & sequence definitions to CommunicationDiagram and DatabaseDiagram via DocBlock
 */

export const COMM_DIAGRAMS_EN = {
  "particle-qr": {
    "badge": "Particle Connect P2P Protocol",
    "title": "Communication Sequence: P2P JOY Transfer via Particle Dynamic QR",
    "desc": "Secure peer-to-peer rewards transaction protocol using dynamic particle QR codes, HMAC cryptographic signatures, and local PIN authorization.",
    "nodes": [
      {
        "id": "receiver",
        "label": "JOY Receiver",
        "sub": "Generate Dynamic QR",
        "icon": "qr_code_2"
      },
      {
        "id": "sender",
        "label": "JOY Sender",
        "sub": "Scan & Verify PIN",
        "icon": "smartphone",
        "highlight": true
      },
      {
        "id": "server",
        "label": "Auth & Ledger Server",
        "sub": "JOY Ledger & Anti-Fraud",
        "icon": "dns"
      }
    ],
    "steps": [
      {
        "from": "receiver",
        "to": "server",
        "action": "1. Request Inbound Transfer Token",
        "detail": "Receiver taps 'Receive JOY'. Server generates a cryptographic token containing user ID, random nonce, and Unix timestamp."
      },
      {
        "from": "server",
        "to": "receiver",
        "action": "2. Render Particle QR (60s TTL)",
        "detail": "Dynamic QR code is rendered with shimmering particle animation and a strict 60-second countdown timer."
      },
      {
        "from": "sender",
        "to": "receiver",
        "action": "3. Direct Camera QR Scan",
        "detail": "Sender activates native device camera within PWA to scan receiver's on-screen particle QR code."
      },
      {
        "from": "sender",
        "to": "sender",
        "action": "4. Specify Amount & Enter 6-Digit PIN",
        "detail": "Sender enters transfer amount and authorizes the payload with a secret 6-digit PIN on device."
      },
      {
        "from": "sender",
        "to": "server",
        "action": "5. Dispatch HMAC-Signed Payload",
        "detail": "Dispatches transfer request signed with HMAC and salted SHA-256 PIN hash over encrypted TLS 1.3."
      },
      {
        "from": "server",
        "to": "sender",
        "action": "6. Atomic Ledger Insert & Dual Balance Sync",
        "detail": "Server validates daily rate limits, creates 2 atomic JoyLedger records (debit sender, credit receiver), and updates balances within 1.0s."
      }
    ],
    "securityNote": "Security Guarantee: Particle QR codes automatically expire after 60 seconds to prevent unauthorized captures or duplicate execution.",
    "uiLabels": {
      "sequenceLabel": "Communication Sequence Diagram",
      "stepsHeading": "Handshake Sequence Steps:"
    }
  },
  "pwa-lifecycle": {
    "badge": "Service Worker Cache-First Protocol",
    "title": "Communication Sequence: Offline PWA Lifecycle & Cache Engine",
    "desc": "Browser, Service Worker proxy, and edge network coordination. Ensures near-instant cold boot under 0.5s even in complete offline mode.",
    "nodes": [
      {
        "id": "ui",
        "label": "User Interface",
        "sub": "DOM / React App",
        "icon": "touch_app"
      },
      {
        "id": "sw",
        "label": "Service Worker Engine",
        "sub": "Background Proxy",
        "icon": "cloud_sync",
        "highlight": true
      },
      {
        "id": "network",
        "label": "Edge Cloud Network",
        "sub": "Cloudflare / Node Server",
        "icon": "public"
      }
    ],
    "steps": [
      {
        "from": "ui",
        "to": "sw",
        "action": "1. Asset Fetch Request",
        "detail": "When user navigates or opens the app, browser dispatches fetch events intercepted by the Service Worker proxy."
      },
      {
        "from": "sw",
        "to": "ui",
        "action": "2. Instant Serve from Cache Storage",
        "detail": "Cache-First policy: Service Worker queries Cache Storage and streams compiled JS/CSS/Font bundles in < 50ms."
      },
      {
        "from": "sw",
        "to": "network",
        "action": "3. Stale-While-Revalidate Probe",
        "detail": "Worker simultaneously triggers a lightweight background query checking server ETags and file build hashes."
      },
      {
        "from": "network",
        "to": "sw",
        "action": "4. Background Differential Sync",
        "detail": "If an updated application bundle is detected, the worker silently downloads assets into a versioned cache partition."
      },
      {
        "from": "sw",
        "to": "ui",
        "action": "5. Seamless Upgrade Notification",
        "detail": "Emits a postMessage event to UI displaying 'New version ready'. Users update with a single tap without interruption."
      }
    ],
    "securityNote": "Security Guarantee: Service Worker executes exclusively over strictly enforced HTTPS connections, eliminating Man-in-the-Middle risks.",
    "uiLabels": {
      "sequenceLabel": "Communication Sequence Diagram",
      "stepsHeading": "Handshake Sequence Steps:"
    }
  },
  "passkey": {
    "badge": "FIDO2 / WebAuthn Protocol",
    "title": "Communication Sequence: Passwordless Passkey Biometric Authentication",
    "desc": "Asymmetric cryptographic handshake flow. Biometric fingerprint/Face ID data stays securely within hardware (Secure Enclave / TPM) and never leaves your device.",
    "nodes": [
      {
        "id": "client",
        "label": "Your Browser",
        "sub": "PWA Client",
        "icon": "devices"
      },
      {
        "id": "hardware",
        "label": "Hardware Security Module",
        "sub": "Secure Enclave / TPM",
        "icon": "fingerprint",
        "highlight": true
      },
      {
        "id": "server",
        "label": "Hugo Studio Server",
        "sub": "API Auth Server",
        "icon": "dns"
      }
    ],
    "steps": [
      {
        "from": "client",
        "to": "server",
        "action": "1. Sign-in Request",
        "detail": "Send account identifier / email (never transmits any password)."
      },
      {
        "from": "server",
        "to": "client",
        "action": "2. Issue Cryptographic Challenge",
        "detail": "Server generates a 32-byte one-time cryptographic nonce to prevent replay attacks."
      },
      {
        "from": "client",
        "to": "hardware",
        "action": "3. Prompt Biometric Verification",
        "detail": "Calls navigator.credentials.get(). Device triggers hardware prompting Touch ID or Face ID verification."
      },
      {
        "from": "hardware",
        "to": "client",
        "action": "4. Hardware Digital Signature",
        "detail": "Chip confirms device ownership and uses the private key (stored permanently inside hardware) to sign the challenge."
      },
      {
        "from": "client",
        "to": "server",
        "action": "5. Send Cryptographic Signature",
        "detail": "Transmits only signature and authentication metadata; NEVER sends biometric data or private keys."
      },
      {
        "from": "server",
        "to": "client",
        "action": "6. Verify Public Key & Grant Session",
        "detail": "Server verifies signature against stored public key. Instant secure sign-in completes in < 1.0s!"
      }
    ],
    "securityNote": "Security Guarantee: Server stores only benign public keys; even in the event of a server breach, private keys and biometric data remain cryptographically unrecoverable.",
    "uiLabels": {
      "sequenceLabel": "Communication Sequence Diagram",
      "stepsHeading": "Handshake Sequence Steps:"
    }
  },
  "scale-1m": {
    "badge": "1M CCU High-Throughput Pipeline",
    "title": "Scale-out Pipeline: Concurrency Architecture for 1,000,000 Sessions",
    "desc": "4-tier extreme load absorption model: Anycast CDN Edge absorbs 95% of static read volume, Kubernetes Ingress distributes across 250 Node.js pods, Redis Cluster and Sharded MongoDB handle persistent write throughput.",
    "nodes": [
      {
        "id": "edge",
        "label": "Anycast CDN Edge",
        "sub": "Cloudflare 300+ PoPs (95% Hit)",
        "icon": "public",
        "highlight": true
      },
      {
        "id": "k8s",
        "label": "Kubernetes Cluster",
        "sub": "250 Pods Auto-Scaled HPA",
        "icon": "hub"
      },
      {
        "id": "data",
        "label": "Data Persistence Tier",
        "sub": "Redis + Sharded MongoDB",
        "icon": "database"
      }
    ],
    "steps": [
      {
        "from": "edge",
        "to": "edge",
        "action": "1. Ingest 1,000,000 Concurrent Requests at Nearest Anycast PoP",
        "detail": "1,000,000 CCU traffic hits over 300 global edge PoPs, distributing load across geographic perimeter nodes."
      },
      {
        "from": "edge",
        "to": "edge",
        "action": "2. Edge Caches Absorb 950,000 Read Queries (95% Hit Rate)",
        "detail": "PWA app shells, bio profiles, and static assets stream directly from NVMe/RAM edge caches with < 25ms latency."
      },
      {
        "from": "edge",
        "to": "k8s",
        "action": "3. Forward 50,000 Dynamic Ingestion Requests",
        "detail": "Only 5% transactional write traffic (Passkey auth, JOY transactions, quotes) is multiplexed over HTTP/2 to K8s Ingress."
      },
      {
        "from": "k8s",
        "to": "k8s",
        "action": "4. K8s HPA Horizontal Autoscaling to 250 Pods",
        "detail": "Least-connections scheduling guarantees each worker pod handles ~200 CCU, keeping Node.js Event Loop CPU below 40%."
      },
      {
        "from": "k8s",
        "to": "data",
        "action": "5. Redis Cluster Session & Rate-Limiting Check (< 2ms)",
        "detail": "In-memory Redis cluster validates session nonces and atomic locks at 100,000 QPS, shielding primary database from 90% queries."
      },
      {
        "from": "data",
        "to": "k8s",
        "action": "6. Sharded MongoDB Decentralized Ledger Commit",
        "detail": "JoyLedger transactions commit into sharded collections partitioned by email hash, guaranteed via Write Concern: majority."
      }
    ],
    "securityNote": "Architecture Guarantee: 4-tier isolation absorbs 95% of traffic at the edge, maintaining sub-45ms p95 response times under 1,000,000 CCU sustained stress.",
    "uiLabels": {
      "sequenceLabel": "Communication Sequence Diagram",
      "stepsHeading": "Handshake Sequence Steps:"
    }
  },
  "global-latency": {
    "badge": "Global Edge & GeoDNS Anycast",
    "title": "Global Routing Sequence: Geographic Latency Elimination",
    "desc": "Overcoming fiber-optic speed-of-light constraints. Local TLS 1.3 termination at edge PoPs combined with Conflict-Free Replicated Data Types (CRDTs).",
    "nodes": [
      {
        "id": "user",
        "label": "Global Users",
        "sub": "US / EU / JP / AU",
        "icon": "language"
      },
      {
        "id": "pop",
        "label": "Anycast PoP Edge",
        "sub": "Local Edge (RTT 8-15ms)",
        "icon": "cell_tower",
        "highlight": true
      },
      {
        "id": "origin",
        "label": "Multi-Region Core",
        "sub": "Multi-Region Replication",
        "icon": "dns"
      }
    ],
    "steps": [
      {
        "from": "user",
        "to": "pop",
        "action": "1. TLS 1.3 Handshake Termination at Local Edge PoP",
        "detail": "Instead of incurring a 240ms round-trip to origin servers, TLS 1.3 handshakes terminate at user's local metropolitan PoP in 12ms."
      },
      {
        "from": "pop",
        "to": "user",
        "action": "2. Instant PWA Bundle & Cache Delivery",
        "detail": "JavaScript runtimes, style sheets, and Canvas graphic assets load directly from edge storage, rendering UI in < 0.3s."
      },
      {
        "from": "pop",
        "to": "origin",
        "action": "3. Tier-1 Backbone Dedicated Routing",
        "detail": "Dynamic write payloads traverse Cloudflare/Vercel private fiber optic backbones (Argo Smart Routing) bypassing public Internet congestion."
      },
      {
        "from": "origin",
        "to": "origin",
        "action": "4. Conflict-Free Data Replication (CRDTs Engine)",
        "detail": "Locally recorded sleep logs and Pomodoro cycles merge autonomously via state-based Conflict-Free Replicated Data Types."
      },
      {
        "from": "origin",
        "to": "user",
        "action": "5. Cross-Border Response Completion",
        "detail": "Compressed responses return directly over optimized paths, delivering uniform high-speed responsiveness regardless of geography."
      }
    ],
    "securityNote": "Performance Guarantee: International users experience responsiveness parity within 95% of domestic users through distributed Edge Computing.",
    "uiLabels": {
      "sequenceLabel": "Communication Sequence Diagram",
      "stepsHeading": "Handshake Sequence Steps:"
    }
  },
  "circuit-breaker": {
    "badge": "Circuit Breaker & Self-Healing",
    "title": "State Machine: Circuit Breaker & Automatic Fault Recovery",
    "desc": "Multi-tiered resilience following Martin Fowler & Michael Nygard state specifications: Closed (Nominal) -> Open (Tripped when errors > 50%) -> Half-Open (Probing recovery), paired with client-side offline queues.",
    "nodes": [
      {
        "id": "client",
        "label": "Client Service Worker",
        "sub": "IndexedDB Offline Queue",
        "icon": "phonelink_ring"
      },
      {
        "id": "circuit",
        "label": "Circuit Breaker Engine",
        "sub": "State Machine Sentinel",
        "icon": "power_settings_new",
        "highlight": true
      },
      {
        "id": "services",
        "label": "Microservices & Database",
        "sub": "Self-Healing Watchdog",
        "icon": "healing"
      }
    ],
    "steps": [
      {
        "from": "circuit",
        "to": "circuit",
        "action": "1. Closed State (Nominal: 100% Traffic Flow)",
        "detail": "Gateway continuously monitors upstream error rates and p99 latency. All valid requests pass freely to the application cluster."
      },
      {
        "from": "circuit",
        "to": "circuit",
        "action": "2. Transition to Open State (Trip on Error Rate > 50%)",
        "detail": "If downstream services timeout or fail repeatedly over 10s, the circuit trips immediately to protect against cascading failure (Thundering Herd)."
      },
      {
        "from": "circuit",
        "to": "client",
        "action": "3. Return Graceful Degradation Fallback",
        "detail": "System immediately returns cached responses and disables non-critical visual effects (bio weather) to preserve core session resources."
      },
      {
        "from": "client",
        "to": "client",
        "action": "4. Client Fallback to Local IndexedDB Queue",
        "detail": "Service Worker captures user actions into encrypted local IndexedDB storage, allowing user workflows to proceed uninterrupted."
      },
      {
        "from": "services",
        "to": "services",
        "action": "5. Infrastructure Self-Healing (< 0.5s)",
        "detail": "PM2 Watchdog and Docker healthcheck daemons automatically recycle memory-leaking processes and flush saturated socket queues."
      },
      {
        "from": "circuit",
        "to": "client",
        "action": "6. Half-Open Probe & Background Synchronization",
        "detail": "After 30s, breaker allows 5% canary requests. Upon confirmed health, circuit seals back to Closed and background sync flushes IndexedDB to server."
      }
    ],
    "securityNote": "Reliability Guarantee: The platform eliminates fatal crash screens; all client work remains 100% preserved locally during upstream outages.",
    "uiLabels": {
      "sequenceLabel": "Communication Sequence Diagram",
      "stepsHeading": "Handshake Sequence Steps:"
    }
  },
  "third-party": {
    "badge": "Three-Tier Integration Architecture",
    "title": "Communication Sequence: 3-Tier Zero-Trust Integration (Client ↔ Server ↔ Third-Party)",
    "desc": "Strictly isolated tiered architecture between Client, Hugo Studio Application Backend, and vetted third-party service providers (Google Identity & PayOS Napas).",
    "nodes": [
      {
        "id": "client",
        "label": "Client Browser",
        "sub": "Client Layer",
        "icon": "person"
      },
      {
        "id": "hugo",
        "label": "Hugo Studio Server",
        "sub": "Application Backend",
        "icon": "dns",
        "highlight": true
      },
      {
        "id": "third",
        "label": "Vetted Service Partner",
        "sub": "Google IdP / PayOS Napas",
        "icon": "verified_user"
      }
    ],
    "steps": [
      {
        "from": "client",
        "to": "hugo",
        "action": "1. Initiate Protected Service Request",
        "detail": "User initiates an action requiring third-party interaction (Google OAuth sign-in or verified quotation payment)."
      },
      {
        "from": "hugo",
        "to": "third",
        "action": "2. Forward Authenticated Request to Provider",
        "detail": "Hugo Server signs payload with private gateway keys and forwards securely over mutual TLS 1.3."
      },
      {
        "from": "third",
        "to": "client",
        "action": "3. Direct User Verification at Partner Surface",
        "detail": "User authenticates on Google secure prompt or scans VietQR in their native banking app; provider verifies independently."
      },
      {
        "from": "third",
        "to": "hugo",
        "action": "4. Server-to-Server HMAC-Signed Webhook",
        "detail": "Provider transmits signed callback (ID Token / Payment Webhook) directly to Hugo Studio's hardened verification endpoint."
      },
      {
        "from": "hugo",
        "to": "client",
        "action": "5. Verify Cryptographic Proof & Authorize Session",
        "detail": "Hugo Server verifies digital signatures, updates internal state, and issues secure session token to client."
      }
    ],
    "securityNote": "Privacy Guarantee: Hugo Studio servers never observe or store Google passwords, banking credentials, or personal OTP codes.",
    "uiLabels": {
      "sequenceLabel": "Communication Sequence Diagram",
      "stepsHeading": "Handshake Sequence Steps:"
    }
  },
  "payos": {
    "badge": "Napas 24/7 / PayOS Webhook Protocol",
    "title": "Communication Sequence: VietQR Payment & Automated Contract Provisioning",
    "desc": "Penny-accurate settlement pipeline via national Napas 24/7 banking rail, confirmed in real time using HMAC-SHA256 cryptographically signed webhooks.",
    "nodes": [
      {
        "id": "client",
        "label": "Client",
        "sub": "Banking Mobile App",
        "icon": "person"
      },
      {
        "id": "payos",
        "label": "PayOS Payment Rail",
        "sub": "Napas 24/7 Gateway",
        "icon": "qr_code_scanner",
        "highlight": true
      },
      {
        "id": "server",
        "label": "Hugo Studio Core",
        "sub": "Order Management",
        "icon": "dns"
      }
    ],
    "steps": [
      {
        "from": "client",
        "to": "payos",
        "action": "1. Scan Dynamic VietQR via Mobile Banking",
        "detail": "Customer scans dynamic VietQR embedded with exact invoice amount and unique orderCode identifier."
      },
      {
        "from": "payos",
        "to": "payos",
        "action": "2. Instant Napas 24/7 Interbank Settlement",
        "detail": "Interbank network credits the account within 2 seconds. Gateway verifies transaction finality."
      },
      {
        "from": "payos",
        "to": "server",
        "action": "3. Dispatch Webhook with HMAC-SHA256 Signature",
        "detail": "PayOS transmits an encrypted webhook payload to Hugo Studio containing the cryptographically signed signature hash."
      },
      {
        "from": "server",
        "to": "server",
        "action": "4. Verify Signature Checksum & Reconcile Order",
        "detail": "Core server checks HMAC checksum, reconciling payment amount and invoice ID to reject spoofed payment requests."
      },
      {
        "from": "server",
        "to": "client",
        "action": "5. Provision Services & Dispatch Digital Agreement",
        "detail": "System updates order status to 'PAID', initializes communication channels, and dispatches confirmation email in 3.0s."
      }
    ],
    "securityNote": "Transparency Guarantee: Zero hidden fees. Direct bank-to-bank settlement means Hugo Studio never handles credit cards or bank OTP credentials.",
    "uiLabels": {
      "sequenceLabel": "Communication Sequence Diagram",
      "stepsHeading": "Handshake Sequence Steps:"
    }
  }
};
COMM_DIAGRAMS_EN["joy-transfer"] = COMM_DIAGRAMS_EN["particle-qr"];
COMM_DIAGRAMS_EN["sw-offline"] = COMM_DIAGRAMS_EN["pwa-lifecycle"];

export const DB_DIAGRAM_EN = {
  "headerBadge": "Relational Schema & Architecture Model",
  "headerTitle": "Database Entity Relationship Diagram (ERD)",
  "headerDesc": "Architectural schema modeling 7 core MongoDB collections. Standardized around Zero-Trust isolation, role segregation, and append-only ledger immutability.",
  "engineLabel": "MongoDB 7.x Engine",
  "footerNote": "Architectural Guarantee: MongoDB operates as a distributed Replica Set ensuring durable writes (Write Concern: majority). All sensitive user credentials undergo cryptographic hashing before disk write.",
  "uiLabels": {
    "fieldName": "Field Name",
    "dataType": "Data Type",
    "keyIndex": "Key / Indexing",
    "businessMeaning": "Domain Description & Constraints",
    "directRelations": "Direct Entity Relationships:",
    "integrityTitle": "Data Integrity & Relationship Constraints Matrix:",
    "collectionLabel": "Collection:"
  },
  "entities": [
    {
      "id": "UserProfile",
      "name": "UserProfile",
      "collection": "userprofiles",
      "role": "Core Identity Entity",
      "desc": "Stores user account profile, User Understanding Layer telemetry, 24-hour activity distribution, and session configurations.",
      "color": "sky",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "Auto-generated MongoDB Primary Key"
        },
        {
          "name": "email",
          "type": "String",
          "key": "Indexed, Unique",
          "desc": "Canonical user account identifier"
        },
        {
          "name": "interests",
          "type": "Map<String, Number>",
          "key": "",
          "desc": "Weighted learning and technology topic affinities"
        },
        {
          "name": "activeHours",
          "type": "Array<Number>[24]",
          "key": "",
          "desc": "24-hour activity histogram normalized to user timezone"
        },
        {
          "name": "engagementCount",
          "type": "Number",
          "key": "",
          "desc": "Cumulative positive interaction count"
        },
        {
          "name": "createdAt / updatedAt",
          "type": "Date",
          "key": "",
          "desc": "System lifecycle timestamps"
        }
      ],
      "relations": [
        {
          "target": "WebAuthnCredential",
          "type": "1:N",
          "desc": "A user registers multiple Passkey authenticator devices"
        },
        {
          "target": "BioProfile",
          "type": "1:1",
          "desc": "A user owns exactly 1 cinematic Bio @slug page"
        },
        {
          "target": "JoyLedger",
          "type": "1:N",
          "desc": "A user holds immutable JOY points ledger history"
        },
        {
          "target": "PaymentLink",
          "type": "1:N",
          "desc": "Service invoice and sponsorship transactions"
        }
      ]
    },
    {
      "id": "WebAuthnCredential",
      "name": "WebAuthnCredential",
      "collection": "webauthncredentials",
      "role": "Passkey Biometric Key Entity",
      "desc": "Stores COSE public key structures and signature counters. Strictly never stores private keys or biometric raw readings.",
      "color": "indigo",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "Primary Key"
        },
        {
          "name": "email",
          "type": "String",
          "key": "FK, Indexed",
          "desc": "Foreign Key referencing UserProfile.email"
        },
        {
          "name": "credentialID",
          "type": "String",
          "key": "Indexed, Unique",
          "desc": "Base64URL encoded credential identifier"
        },
        {
          "name": "publicKey",
          "type": "String",
          "key": "",
          "desc": "Public Key binary (COSE format)"
        },
        {
          "name": "counter",
          "type": "Number",
          "key": "",
          "desc": "Monotonic signature counter preventing replay attacks"
        },
        {
          "name": "deviceName",
          "type": "String",
          "key": "",
          "desc": "Human-readable device label (e.g., iPhone Face ID)"
        },
        {
          "name": "lastUsedAt",
          "type": "Date",
          "key": "",
          "desc": "Timestamp of most recent authentication"
        }
      ],
      "relations": [
        {
          "target": "UserProfile",
          "type": "N:1",
          "desc": "Owned by exactly one account (Cascade on Delete)"
        }
      ]
    },
    {
      "id": "BioProfile",
      "name": "BioProfile",
      "collection": "bios",
      "role": "Cinematic Bio Profile Entity",
      "desc": "Custom @slug page configuration, dynamic Aura gradient effects, interactive weather layers, and public link blocks.",
      "color": "blue",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "Primary Key"
        },
        {
          "name": "slug",
          "type": "String",
          "key": "Indexed, Unique",
          "desc": "Custom vanity path (hugowishpax.studio/bio/:slug)"
        },
        {
          "name": "ownerEmail",
          "type": "String",
          "key": "FK, Indexed",
          "desc": "Email of profile owner"
        },
        {
          "name": "displayName",
          "type": "String",
          "key": "",
          "desc": "Public artistic display name"
        },
        {
          "name": "auraTheme",
          "type": "String",
          "key": "",
          "desc": "Aura gradient color theme (Cosmic, Emerald, Amber...)"
        },
        {
          "name": "blocks",
          "type": "Array<BlockObject>",
          "key": "",
          "desc": "Array of link cards, social media references, and project highlights"
        },
        {
          "name": "weatherEffect",
          "type": "Boolean",
          "key": "",
          "desc": "Toggle flag for real-time interactive canvas weather effects"
        }
      ],
      "relations": [
        {
          "target": "UserProfile",
          "type": "1:1",
          "desc": "One-to-one relationship with owner account"
        }
      ]
    },
    {
      "id": "JoyLedger",
      "name": "JoyLedger",
      "collection": "joyledgers",
      "role": "Append-Only Points Ledger",
      "desc": "Audit log of all JOY reward point transactions. Never executes in-place balance updates; appends immutable entries to eradicate race conditions.",
      "color": "emerald",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "Primary Key"
        },
        {
          "name": "email",
          "type": "String",
          "key": "FK, Indexed",
          "desc": "Target account credited or debited"
        },
        {
          "name": "amount",
          "type": "Number",
          "key": "",
          "desc": "Point delta (+/- JOY integer)"
        },
        {
          "name": "balanceAfter",
          "type": "Number",
          "key": "",
          "desc": "Immediate snapshot balance following transaction"
        },
        {
          "name": "source",
          "type": "String",
          "key": "Indexed",
          "desc": "Source: streak_checkin, pomodoro, chess_win, p2p_transfer"
        },
        {
          "name": "refId",
          "type": "String",
          "key": "",
          "desc": "External invoice reference or P2P transfer token"
        },
        {
          "name": "createdAt",
          "type": "Date",
          "key": "Indexed (Compound)",
          "desc": "Timestamp (compound index: email + createdAt)"
        }
      ],
      "relations": [
        {
          "target": "UserProfile",
          "type": "N:1",
          "desc": "Every ledger entry binds strictly to one user account"
        },
        {
          "target": "PendingTransfer",
          "type": "1:1 (ref)",
          "desc": "References P2P transfer session if generated via Particle QR"
        }
      ]
    },
    {
      "id": "PendingTransfer",
      "name": "PendingTransfer",
      "collection": "pendingtransfers",
      "role": "Ephemeral Particle P2P Token (TTL 60s)",
      "desc": "Intermediate state entity for particle QR scanning sessions. Automatically purged from database after 60 seconds via MongoDB TTL Index.",
      "color": "amber",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "Primary Key"
        },
        {
          "name": "token",
          "type": "String",
          "key": "Indexed, Unique",
          "desc": "Cryptographic hash token embedded in QR"
        },
        {
          "name": "receiverEmail",
          "type": "String",
          "key": "FK",
          "desc": "Account claiming incoming JOY points"
        },
        {
          "name": "status",
          "type": "String",
          "key": "",
          "desc": "PENDING | COMPLETED | EXPIRED"
        },
        {
          "name": "pinChallenge",
          "type": "String",
          "key": "",
          "desc": "Single-use cryptographic salt for local PIN verification"
        },
        {
          "name": "createdAt",
          "type": "Date",
          "key": "TTL Index (60s)",
          "desc": "Auto-expires and drops document after 60 seconds"
        }
      ],
      "relations": [
        {
          "target": "UserProfile",
          "type": "N:1",
          "desc": "Both receiver and sender resolve to UserProfile records"
        },
        {
          "target": "JoyLedger",
          "type": "1:2",
          "desc": "On completion, atomically produces 2 JoyLedger rows (sender -JOY, receiver +JOY)"
        }
      ]
    },
    {
      "id": "PaymentLink",
      "name": "PaymentLink",
      "collection": "paymentlinks",
      "role": "Automated Payment & Invoice Record (PayOS)",
      "desc": "Tracks project contract payments and infrastructure donations, matching invoice IDs with Napas 24/7 bank rails.",
      "color": "blue",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "Primary Key"
        },
        {
          "name": "orderCode",
          "type": "Number",
          "key": "Indexed, Unique",
          "desc": "Unique interbank integer order identifier"
        },
        {
          "name": "customLinkId",
          "type": "String",
          "key": "Unique",
          "desc": "Payment link hash string"
        },
        {
          "name": "amount",
          "type": "Number",
          "key": "",
          "desc": "Penny-accurate transaction amount (VND)"
        },
        {
          "name": "status",
          "type": "String",
          "key": "Indexed",
          "desc": "PENDING | PAID | CANCELLED"
        },
        {
          "name": "donorEmail",
          "type": "String",
          "key": "FK, Optional",
          "desc": "Payer email address if authenticated"
        },
        {
          "name": "paidAt",
          "type": "Date",
          "key": "",
          "desc": "Timestamp of Napas HMAC-signed webhook confirmation"
        }
      ],
      "relations": [
        {
          "target": "UserProfile",
          "type": "N:1 (optional)",
          "desc": "Links to member account when signed in"
        }
      ]
    },
    {
      "id": "AdminAuditLog",
      "name": "AdminAuditLog",
      "collection": "adminauditlogs",
      "role": "Security Audit Trail",
      "desc": "Immutable historical log recording all administrative mutations. Read/Insert only; modifications and deletions are strictly blocked.",
      "color": "slate",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "Primary Key"
        },
        {
          "name": "adminId",
          "type": "String",
          "key": "Indexed",
          "desc": "Identifier of executing administrator"
        },
        {
          "name": "action",
          "type": "String",
          "key": "Indexed",
          "desc": "login | adjust_joy | block_user | update_config"
        },
        {
          "name": "targetEmail",
          "type": "String",
          "key": "Indexed",
          "desc": "Affected user account (if applicable)"
        },
        {
          "name": "ipAddress",
          "type": "String",
          "key": "",
          "desc": "Originating IPv4/IPv6 address of administrative session"
        },
        {
          "name": "userAgent",
          "type": "String",
          "key": "",
          "desc": "Browser and client device user-agent string"
        },
        {
          "name": "details",
          "type": "Mixed",
          "key": "",
          "desc": "State snapshot before and after modification"
        },
        {
          "name": "createdAt",
          "type": "Date",
          "key": "Indexed",
          "desc": "High-precision millisecond timestamp"
        }
      ],
      "relations": [
        {
          "target": "Admin",
          "type": "N:1",
          "desc": "Binds to executing administrative operator"
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": "UserProfile",
      "to": "WebAuthnCredential",
      "cardinality": "1 : N",
      "rule": "A single user can register multiple Passkeys (Touch ID, Face ID, Windows Hello). Deleting a user account cascades and revokes all linked credentials."
    },
    {
      "from": "UserProfile",
      "to": "BioProfile",
      "cardinality": "1 : 1",
      "rule": "Each user profile binds to exactly one unique @slug bio page. Slug uniqueness is enforced via index to protect personal branding."
    },
    {
      "from": "UserProfile",
      "to": "JoyLedger",
      "cardinality": "1 : N (Append-Only)",
      "rule": "Unidirectional ledger relationship. The system never executes direct UPDATE statements on user point balances; balances are derived from append-only JoyLedger rows to eliminate race conditions."
    },
    {
      "from": "PendingTransfer",
      "to": "JoyLedger",
      "cardinality": "1 : 2 Atomic",
      "rule": "Upon successful P2P verification, an atomic transaction produces 2 dual JoyLedger rows simultaneously: Sender (-JOY) and Receiver (+JOY)."
    },
    {
      "from": "UserProfile",
      "to": "PaymentLink",
      "cardinality": "1 : N",
      "rule": "Web engineering invoices and digital payments reconcile strictly against unique orderCode values via national Napas 24/7 channels."
    },
    {
      "from": "AdminAuditLog",
      "to": "System Integrity",
      "cardinality": "Immutable",
      "rule": "AdminAuditLog permits INSERT operations only. UPDATE and DELETE actions are hard-blocked at the database engine layer to prevent administrative tampering."
    }
  ]
};
