/**
 * 通信与数据库时序架构数据 (简体中文)
 * 通过 DocBlock 为 CommunicationDiagram 与 DatabaseDiagram 提供多语种支持
 */

export const COMM_DIAGRAMS_ZH = {
  "particle-qr": {
    "badge": "Particle Connect P2P Protocol",
    "title": "通信时序图：光子动态二维码 P2P 积分转移",
    "desc": "点对点安全积分流转协议。采用光子流态动态二维码、HMAC 密码学生成签名以及端侧个人 PIN 码加密校验。",
    "nodes": [
      {
        "id": "receiver",
        "label": "JOY 接收方",
        "sub": "生成光子二维码",
        "icon": "qr_code_2"
      },
      {
        "id": "sender",
        "label": "JOY 发送方",
        "sub": "扫码并验证 PIN",
        "icon": "smartphone",
        "highlight": true
      },
      {
        "id": "server",
        "label": "认证与账本服务器",
        "sub": "JOY 账本与反欺诈引擎",
        "icon": "dns"
      }
    ],
    "steps": [
      {
        "from": "receiver",
        "to": "server",
        "action": "1. 请求收款令牌",
        "detail": "接收方点击“收取 JOY”。服务器生成包含用户 ID、加密随机数与时间戳的一次性密码学令牌。"
      },
      {
        "from": "server",
        "to": "receiver",
        "action": "2. 渲染光子动态二维码（60 秒时效）",
        "detail": "客户端渲染具备微粒光效动画的动态二维码，并启动严格的 60 秒倒计时器。"
      },
      {
        "from": "sender",
        "to": "receiver",
        "action": "3. 开启相机直接扫码",
        "detail": "发送方在 PWA 应用中调用相机，对准接收方屏幕上的光子二维码完成毫秒级解析识别。"
      },
      {
        "from": "sender",
        "to": "sender",
        "action": "4. 输入积分数额与 6 位 PIN 码",
        "detail": "发送方指定流转数额，并在本设备输入 6 位隐私 PIN 码完成端侧私密签名。"
      },
      {
        "from": "sender",
        "to": "server",
        "action": "5. 发送带 HMAC 签名的转账包",
        "detail": "通过 TLS 1.3 发送附带 HMAC 签名与加盐 SHA-256 PIN 哈希的转账报文。"
      },
      {
        "from": "server",
        "to": "sender",
        "action": "6. 原子双记账与余额即时同步",
        "detail": "服务器核验当日风控限额，通过原子事务同时创建 2 条账本记录（发送方扣减，接收方增加），1 秒内完成同步。"
      }
    ],
    "securityNote": "安全承诺：光子二维码在 60 秒后自动彻底失效，彻底杜绝拍照盗用与重复结算风险。",
    "uiLabels": {
      "sequenceLabel": "通信时序图",
      "stepsHeading": "握手时序交互步骤："
    }
  },
  "pwa-lifecycle": {
    "badge": "Service Worker Cache-First Protocol",
    "title": "通信时序图：离线 PWA 生命周期与缓存核心机制",
    "desc": "展示浏览器、Service Worker 代理与边缘云网络的高效协同。即使在完全断网环境下，仍可实现 0.5 秒极速冷启动。",
    "nodes": [
      {
        "id": "ui",
        "label": "用户界面",
        "sub": "DOM / React 应用",
        "icon": "touch_app"
      },
      {
        "id": "sw",
        "label": "Service Worker 引擎",
        "sub": "后台代理网关",
        "icon": "cloud_sync",
        "highlight": true
      },
      {
        "id": "network",
        "label": "边缘云网络",
        "sub": "Cloudflare / Node 服务器",
        "icon": "public"
      }
    ],
    "steps": [
      {
        "from": "ui",
        "to": "sw",
        "action": "1. 发起静态资源请求 (fetch)",
        "detail": "当用户打开页面或切换路由时，浏览器派发 fetch 事件，由 Service Worker 代理层优先拦截。"
      },
      {
        "from": "sw",
        "to": "ui",
        "action": "2. 缓存空间即刻响应 (< 50ms)",
        "detail": "Cache-First 策略：Service Worker 检索本地 Cache Storage，在 50 毫秒内瞬间返回编译后的 JS/CSS/字体包。"
      },
      {
        "from": "sw",
        "to": "network",
        "action": "3. 后台探查最新版本 (Stale-While-Revalidate)",
        "detail": "Service Worker 同步向服务器发送轻量请求，核对 ETag 与构建版本文件哈希。"
      },
      {
        "from": "network",
        "to": "sw",
        "action": "4. 静默拉取增量更新包",
        "detail": "若发现服务器已发布新版本，Service Worker 会在后台悄然下载并写入隔离缓存区。"
      },
      {
        "from": "sw",
        "to": "ui",
        "action": "5. 平滑无感更新提醒",
        "detail": "触发 postMessage 通知 UI“新版本已就绪”。用户一键轻触即可无缝更新，不中断当前操作。"
      }
    ],
    "securityNote": "安全承诺：Service Worker 严格在强制 HTTPS 加密环境下运行，彻底杜绝中间人篡改（MITM）。",
    "uiLabels": {
      "sequenceLabel": "通信时序图",
      "stepsHeading": "握手时序交互步骤："
    }
  },
  "passkey": {
    "badge": "FIDO2 / WebAuthn Protocol",
    "title": "通信时序图：无密码 Passkey 生物识别身份验证",
    "desc": "非对称密码学握手流程。指纹/Face ID 生物识别数据始终保留在硬件芯片（Secure Enclave / TPM）内，绝不离开您的设备。",
    "nodes": [
      {
        "id": "client",
        "label": "您的浏览器",
        "sub": "PWA 客户端",
        "icon": "devices"
      },
      {
        "id": "hardware",
        "label": "设备安全芯片",
        "sub": "Secure Enclave / TPM",
        "icon": "fingerprint",
        "highlight": true
      },
      {
        "id": "server",
        "label": "Hugo Studio 服务器",
        "sub": "API 认证服务器",
        "icon": "dns"
      }
    ],
    "steps": [
      {
        "from": "client",
        "to": "server",
        "action": "1. 发起登录请求",
        "detail": "发送账户邮箱标识（绝对不传输任何密码）。"
      },
      {
        "from": "server",
        "to": "client",
        "action": "2. 签发随机加密挑战码",
        "detail": "服务器生成 32 字节一次性密码学随机数 (Nonce)，抵御重放攻击 (Replay Attack)。"
      },
      {
        "from": "client",
        "to": "hardware",
        "action": "3. 唤起生物识别验证",
        "detail": "调用 navigator.credentials.get()。设备激活安全硬件，提示触摸 Touch ID 或识别 Face ID。"
      },
      {
        "from": "hardware",
        "to": "client",
        "action": "4. 私钥硬件数字签名",
        "detail": "安全芯片确认设备合法持有人，使用永不离开芯片的私钥对挑战码进行签名。"
      },
      {
        "from": "client",
        "to": "server",
        "action": "5. 发送密码学签名",
        "detail": "仅发送数字签名与认证元数据，绝不传输生物识别信息或私钥。"
      },
      {
        "from": "server",
        "to": "client",
        "action": "6. 验证公钥并签发会话",
        "detail": "服务器使用预先注册的公钥对验签名。在 1.0 秒内完成即时安全登录！"
      }
    ],
    "securityNote": "安全承诺：服务器仅存储公钥；即使服务器遭遇数据泄漏，攻击者也绝无法反推您的指纹、Face ID 或私钥。",
    "uiLabels": {
      "sequenceLabel": "通信时序图",
      "stepsHeading": "握手时序交互步骤："
    }
  },
  "scale-1m": {
    "badge": "1M CCU High-Throughput Pipeline",
    "title": "高并发处理管线：1,000,000 同时在线连接 (Scale-out Pipeline)",
    "desc": "4 层极限负载分流架构：Anycast CDN 边缘层吸收 95% 静态读取量，Kubernetes Ingress 调度 250 个 Node.js 实例，Redis 集群与分片 MongoDB 承载写操作。",
    "nodes": [
      {
        "id": "edge",
        "label": "Anycast CDN 边缘节点",
        "sub": "Cloudflare 300+ PoP (95% 命中率)",
        "icon": "public",
        "highlight": true
      },
      {
        "id": "k8s",
        "label": "Kubernetes 集群",
        "sub": "250 Pods 自动伸缩 HPA",
        "icon": "hub"
      },
      {
        "id": "data",
        "label": "数据持久层",
        "sub": "Redis + 分片 MongoDB",
        "icon": "database"
      }
    ],
    "steps": [
      {
        "from": "edge",
        "to": "edge",
        "action": "1. 接入最近 Anycast PoP 承接百万请求",
        "detail": "1,000,000 CCU 流量命中全球 300 多个边缘 PoP 节点，依地理位置进行无感分流。"
      },
      {
        "from": "edge",
        "to": "edge",
        "action": "2. 边缘吸收 950,000 读取请求 (95% 缓存命中)",
        "detail": "PWA 资源、Bio 资料卡及静态内容直接从边缘内存与 NVMe 极速回传，响应时延 < 25ms。"
      },
      {
        "from": "edge",
        "to": "k8s",
        "action": "3. 转发 50,000 动态写入请求 (Dynamic Ingestion)",
        "detail": "仅 5% 涉及实时事务的数据（Passkey、JOY 账本、报价单）经由 HTTP/2 复用汇入 K8s Ingress。"
      },
      {
        "from": "k8s",
        "to": "k8s",
        "action": "4. K8s HPA 弹性扩容至 250 个 Node.js Pod",
        "detail": "采用最少连接算法均衡调度；单个 Pod 仅承担约 200 CCU，保障 Event Loop CPU 始终低于 40%。"
      },
      {
        "from": "k8s",
        "to": "data",
        "action": "5. Redis 集群执行会话与限流校验 (< 2ms)",
        "detail": "内存级 Redis 哨兵集群以每秒 100,000 次操作校验 Nonce 与分布式锁，化解数据库 90% 查询压力。"
      },
      {
        "from": "data",
        "to": "k8s",
        "action": "6. MongoDB 分片写入分布式账本",
        "detail": "依据用户邮箱哈希将 JoyLedger 记账拆入分片集合；遵循 Write Concern: majority 确保持久写入。"
      }
    ],
    "securityNote": "架构承诺：4 层解耦架构在网络最边缘消化 95% 负载，确保在 1,000,000 CCU 冲击下 p95 响应时延仍低于 45ms。",
    "uiLabels": {
      "sequenceLabel": "通信时序图",
      "stepsHeading": "握手时序交互步骤："
    }
  },
  "global-latency": {
    "badge": "Global Edge & GeoDNS Anycast",
    "title": "全球加速时序图：跨地域网络延迟消除机制 (Geographic Latency)",
    "desc": "攻克光纤传输物理极限。在用户本地边缘节点就近完成 TLS 1.3 握手，并融合无冲突复制数据类型 (CRDTs) 异步合并技术。",
    "nodes": [
      {
        "id": "user",
        "label": "全球用户群",
        "sub": "美洲 / 欧洲 / 日本 / 澳洲",
        "icon": "language"
      },
      {
        "id": "pop",
        "label": "Anycast 边缘节点",
        "sub": "本地边缘 (RTT 8-15ms)",
        "icon": "cell_tower",
        "highlight": true
      },
      {
        "id": "origin",
        "label": "多可用区中心集群",
        "sub": "多区域持久同步",
        "icon": "dns"
      }
    ],
    "steps": [
      {
        "from": "user",
        "to": "pop",
        "action": "1. 本地 PoP 节点就近完成 TLS 1.3 握手",
        "detail": "无需等待跨洋往返 240ms，TLS 1.3 握手直接在用户所在城市的边缘节点终结，仅耗时 12ms。"
      },
      {
        "from": "pop",
        "to": "user",
        "action": "2. 毫秒级交付 PWA 核心包与静态缓存",
        "detail": "JavaScript 运行时、CSS 与 Canvas 图像资源直接从边缘存储调取，0.3 秒内完成前端画面渲染。"
      },
      {
        "from": "pop",
        "to": "origin",
        "action": "3. 经由 Tier-1 骨干专属虚拟内网传输",
        "detail": "动态写入报文在 Cloudflare/Vercel 私有光纤专用链路（Argo 智能路由）上疾速通行，规避公网拥堵。"
      },
      {
        "from": "origin",
        "to": "origin",
        "action": "4. 无冲突数据自动同步 (CRDTs 引擎)",
        "detail": "离线记录的睡眠日记与番茄钟专注进度，利用无冲突复制数据类型 (CRDTs) 算法完成自动合并。"
      },
      {
        "from": "origin",
        "to": "user",
        "action": "5. 完成跨国事务闭环响应",
        "detail": "压缩处理结果直接回传至用户端，全球任意角落均可享受等同于本土部署的流畅体验。"
      }
    ],
    "securityNote": "性能承诺：得益于边缘计算网络，海外用户可享受与国内本土同等 95% 以上的超低时延交互体验。",
    "uiLabels": {
      "sequenceLabel": "通信时序图",
      "stepsHeading": "握手时序交互步骤："
    }
  },
  "circuit-breaker": {
    "badge": "Circuit Breaker & Self-Healing",
    "title": "状态机时序图：断路器熔断与故障自愈机制",
    "desc": "遵循 Martin Fowler 与 Michael Nygard 经典架构规范的多层防御：Closed（常态通行）-> Open（错误率 > 50% 时断路）-> Half-Open（渐进试探恢复），配合端侧离线容灾队列。",
    "nodes": [
      {
        "id": "client",
        "label": "客户端 Service Worker",
        "sub": "IndexedDB 离线队列",
        "icon": "phonelink_ring"
      },
      {
        "id": "circuit",
        "label": "断路器引擎",
        "sub": "状态机哨兵",
        "icon": "power_settings_new",
        "highlight": true
      },
      {
        "id": "services",
        "label": "微服务与数据库集群",
        "sub": "自愈巡检看门狗",
        "icon": "healing"
      }
    ],
    "steps": [
      {
        "from": "circuit",
        "to": "circuit",
        "action": "1. Closed 闭合状态（常态流量 100% 通过）",
        "detail": "网关实时监控上游错误率与接口时延。所有合法请求均顺畅递交至后端处理。"
      },
      {
        "from": "circuit",
        "to": "circuit",
        "action": "2. 切换至 Open 熔断状态（错误率 > 50% 时快速失败）",
        "detail": "若下游依赖在 10 秒内连续超时或报错，断路器立即切断链路，阻断雪崩惊群效应 (Thundering Herd)。"
      },
      {
        "from": "circuit",
        "to": "client",
        "action": "3. 返回优雅降级备用响应 (Graceful Degradation)",
        "detail": "系统自动回退预置缓存数据，关闭非必要视觉特效（如 Bio 天气图层），为核心业务保留 100% 算力。"
      },
      {
        "from": "client",
        "to": "client",
        "action": "4. 客户端无感转入 IndexedDB 本地队列",
        "detail": "Service Worker 自动将用户操作存入本地加密 IndexedDB，用户日常操作与数据录入不中断。"
      },
      {
        "from": "services",
        "to": "services",
        "action": "5. 基础服务秒级自愈 (< 0.5s)",
        "detail": "PM2 Watchdog 与 Docker 健康探针自动重启内存泄漏进程，释放被堵塞的连接池句柄。"
      },
      {
        "from": "circuit",
        "to": "client",
        "action": "6. Half-Open 试探与后台静默同步",
        "detail": "30 秒后断路器放行 5% 流量试探。服务确认恢复后合闸，后台同步机制自动将 IndexedDB 队列清算至服务器。"
      }
    ],
    "securityNote": "可靠性承诺：系统彻底杜绝全局崩溃或白屏死机，任何网络波动下用户本地数据均获得 100% 完整留存。",
    "uiLabels": {
      "sequenceLabel": "通信时序图",
      "stepsHeading": "握手时序交互步骤："
    }
  },
  "third-party": {
    "badge": "Three-Tier Integration Architecture",
    "title": "通信时序图：三层零信任集成架构 (Client ↔ Server ↔ Third-Party)",
    "desc": "在用户端、Hugo Studio 应用后端与第三方可信服务商（Google OAuth 与 PayOS Napas）之间建立严密隔离的权限防线。",
    "nodes": [
      {
        "id": "client",
        "label": "用户浏览器",
        "sub": "客户端接入层",
        "icon": "person"
      },
      {
        "id": "hugo",
        "label": "Hugo Studio 核心服务器",
        "sub": "应用后端服务",
        "icon": "dns",
        "highlight": true
      },
      {
        "id": "third",
        "label": "官方合规第三方服务",
        "sub": "Google IdP / PayOS Napas",
        "icon": "verified_user"
      }
    ],
    "steps": [
      {
        "from": "client",
        "to": "hugo",
        "action": "1. 发起受保护的业务请求",
        "detail": "用户申请 Google 快捷登录或生成企业网站开发合同支付订单。"
      },
      {
        "from": "hugo",
        "to": "third",
        "action": "2. 安全转发至合规验证与支付网关",
        "detail": "Hugo 服务器对请求数据包进行数字签名，并通过 TLS 1.3 安全通道专线传递。"
      },
      {
        "from": "third",
        "to": "client",
        "action": "3. 用户直接在第三方安全界面交互",
        "detail": "用户在 Google 原生弹窗或银行手机 App 中扫码完成授权，第三方服务独立进行合规核验。"
      },
      {
        "from": "third",
        "to": "hugo",
        "action": "4. 服务端异步 Webhook 附带数字签名",
        "detail": "第三方平台向 Hugo Studio 专用端点发送带有 HMAC 密码学签名的身份令牌或支付凭据。"
      },
      {
        "from": "hugo",
        "to": "client",
        "action": "5. 校验密码学凭证并签发业务会话",
        "detail": "Hugo 服务器完成数字签名校验，更新内部数据库状态，并向客户端签发受控会话令牌。"
      }
    ],
    "securityNote": "隐私承诺：Hugo Studio 服务器绝不记录或存储您的 Google 密码、银行卡信息或短信动态验证码。",
    "uiLabels": {
      "sequenceLabel": "通信时序图",
      "stepsHeading": "握手时序交互步骤："
    }
  },
  "payos": {
    "badge": "Napas 24/7 / PayOS Webhook Protocol",
    "title": "通信时序图：VietQR 即时结算与电子合同自动履约",
    "desc": "直连国家 Napas 24/7 跨行清算网络，分厘级精准对账，通过 HMAC-SHA256 签名 Webhook 实现秒级资金确认与交付履约。",
    "nodes": [
      {
        "id": "client",
        "label": "客户",
        "sub": "手机银行 App",
        "icon": "person"
      },
      {
        "id": "payos",
        "label": "PayOS 支付清算通道",
        "sub": "Napas 24/7 跨行网关",
        "icon": "qr_code_scanner",
        "highlight": true
      },
      {
        "id": "server",
        "label": "Hugo Studio 核心服务器",
        "sub": "订单履约管理",
        "icon": "dns"
      }
    ],
    "steps": [
      {
        "from": "client",
        "to": "payos",
        "action": "1. 手机银行扫描动态 VietQR",
        "detail": "客户扫描已预置精准金额与唯一订单识别码的动态二维码。"
      },
      {
        "from": "payos",
        "to": "payos",
        "action": "2. Napas 24/7 跨行即时结算入账",
        "detail": "银行清算网络在 2 秒内完成资金入账，PayOS 网关确认交易终局状态。"
      },
      {
        "from": "payos",
        "to": "server",
        "action": "3. 派发带 HMAC-SHA256 签名的 Webhook",
        "detail": "PayOS 向 Hugo Studio 安全网关发送带密码学哈希签名的结算凭证数据包。"
      },
      {
        "from": "server",
        "to": "server",
        "action": "4. 核验校验和并对账订单",
        "detail": "服务器严格校验 HMAC 摘要，核对实收金额与账单编号，杜绝伪造交易攻击。"
      },
      {
        "from": "server",
        "to": "client",
        "action": "5. 自动激活服务并生成电子合同",
        "detail": "系统自动将订单流转为“已支付”，3 秒内初始化对接工作群并发送确认邮件凭证。"
      }
    ],
    "securityNote": "透明承诺：零隐形扣费。资金直通您的银行账户，Hugo Studio 绝不碰触信用卡或银行 OTP 核心敏感数据。",
    "uiLabels": {
      "sequenceLabel": "通信时序图",
      "stepsHeading": "握手时序交互步骤："
    }
  }
};
COMM_DIAGRAMS_ZH["joy-transfer"] = COMM_DIAGRAMS_ZH["particle-qr"];
COMM_DIAGRAMS_ZH["sw-offline"] = COMM_DIAGRAMS_ZH["pwa-lifecycle"];

export const DB_DIAGRAM_ZH = {
  "headerBadge": "Relational Schema & Architecture Model",
  "headerTitle": "数据库实体关系图 (ERD)",
  "headerDesc": "对 MongoDB 中的 7 个核心集合进行标准化建模。基于零信任隔离、职责分离与账本不可变性原则设计。",
  "engineLabel": "MongoDB 7.x Engine",
  "footerNote": "架构承诺：MongoDB 运行于分布式副本集架构，确保持久化写入（Write Concern: majority）。所有敏感凭据在落盘前均完成密码学加密散列处理。",
  "uiLabels": {
    "fieldName": "字段名称 (Field)",
    "dataType": "数据类型 (Type)",
    "keyIndex": "键与索引 (Key/Index)",
    "businessMeaning": "业务含义与约束",
    "directRelations": "直接关联关系：",
    "integrityTitle": "数据一致性与实体关系约束矩阵 (Integrity Constraints)：",
    "collectionLabel": "集合名称："
  },
  "entities": [
    {
      "id": "UserProfile",
      "name": "UserProfile",
      "collection": "userprofiles",
      "role": "核心身份标识实体 (Core Identity)",
      "desc": "存储用户账户信息、兴趣画像（用户理解层）、24小时活跃时段分布及会话配置。",
      "color": "sky",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "MongoDB 自动生成的主键"
        },
        {
          "name": "email",
          "type": "String",
          "key": "Indexed, Unique",
          "desc": "用户账户唯一身份标识邮箱"
        },
        {
          "name": "interests",
          "type": "Map<String, Number>",
          "key": "",
          "desc": "学习与技术领域的兴趣偏好权重"
        },
        {
          "name": "activeHours",
          "type": "Array<Number>[24]",
          "key": "",
          "desc": "归一化至用户本地时区的 24 小时活跃度直方图"
        },
        {
          "name": "engagementCount",
          "type": "Number",
          "key": "",
          "desc": "用户积极交互行为累计频次"
        },
        {
          "name": "createdAt / updatedAt",
          "type": "Date",
          "key": "",
          "desc": "系统级生命周期时间戳"
        }
      ],
      "relations": [
        {
          "target": "WebAuthnCredential",
          "type": "1:N",
          "desc": "单个用户可注册多个 Passkey 生物识别认证设备"
        },
        {
          "target": "BioProfile",
          "type": "1:1",
          "desc": "单个用户独占拥有 1 个专属 @slug 电影感个人主页"
        },
        {
          "target": "JoyLedger",
          "type": "1:N",
          "desc": "单个用户拥有不可变的 JOY 积分流水变动账本"
        },
        {
          "target": "PaymentLink",
          "type": "1:N",
          "desc": "服务开发订单与赞助记录"
        }
      ]
    },
    {
      "id": "WebAuthnCredential",
      "name": "WebAuthnCredential",
      "collection": "webauthncredentials",
      "role": "Passkey 生物识别公钥实体",
      "desc": "存储 COSE 格式公钥与签名计数器。严格永不存储私钥或用户生物特征原始读数。",
      "color": "indigo",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "主键"
        },
        {
          "name": "email",
          "type": "String",
          "key": "FK, Indexed",
          "desc": "外键关联 UserProfile.email"
        },
        {
          "name": "credentialID",
          "type": "String",
          "key": "Indexed, Unique",
          "desc": "Base64URL 格式凭证唯一标识符"
        },
        {
          "name": "publicKey",
          "type": "String",
          "key": "",
          "desc": "COSE 格式的二进制公钥数据"
        },
        {
          "name": "counter",
          "type": "Number",
          "key": "",
          "desc": "单调递增签名计数器，防止重放攻击"
        },
        {
          "name": "deviceName",
          "type": "String",
          "key": "",
          "desc": "设备名称（如 iPhone Face ID、MacBook Touch ID）"
        },
        {
          "name": "lastUsedAt",
          "type": "Date",
          "key": "",
          "desc": "最近一次登录时间戳"
        }
      ],
      "relations": [
        {
          "target": "UserProfile",
          "type": "N:1",
          "desc": "归属于唯一账户（级联删除 Cascade on Delete）"
        }
      ]
    },
    {
      "id": "BioProfile",
      "name": "BioProfile",
      "collection": "bios",
      "role": "电影感个人主页实体 (Cinematic Bio Profile)",
      "desc": "配置专属 @slug 链接、灵光 Aura 渐变动效、可交互实时天气图层与公共链接卡片。",
      "color": "blue",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "主键"
        },
        {
          "name": "slug",
          "type": "String",
          "key": "Indexed, Unique",
          "desc": "专属短链路径 (hugowishpax.studio/bio/:slug)"
        },
        {
          "name": "ownerEmail",
          "type": "String",
          "key": "FK, Indexed",
          "desc": "主页持有者邮箱"
        },
        {
          "name": "displayName",
          "type": "String",
          "key": "",
          "desc": "艺术化对外展示昵称"
        },
        {
          "name": "auraTheme",
          "type": "String",
          "key": "",
          "desc": "灵光色彩主题（Cosmic、Emerald、Amber 等）"
        },
        {
          "name": "blocks",
          "type": "Array<BlockObject>",
          "key": "",
          "desc": "链接卡片、社交媒体与精选项目列表"
        },
        {
          "name": "weatherEffect",
          "type": "Boolean",
          "key": "",
          "desc": "实时互动天气动效开关"
        }
      ],
      "relations": [
        {
          "target": "UserProfile",
          "type": "1:1",
          "desc": "与主账户建立一一对应关系"
        }
      ]
    },
    {
      "id": "JoyLedger",
      "name": "JoyLedger",
      "collection": "joyledgers",
      "role": "不可变只追加积分账本 (Append-Only Ledger)",
      "desc": "记录所有 JOY 积分流水。严禁直接 UPDATE 账户余额字段，仅通过追加不可变记账记录规避并发竞态（Race Condition）。",
      "color": "emerald",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "主键"
        },
        {
          "name": "email",
          "type": "String",
          "key": "FK, Indexed",
          "desc": "记账目标账户"
        },
        {
          "name": "amount",
          "type": "Number",
          "key": "",
          "desc": "积分变动数额（+/- JOY 整数）"
        },
        {
          "name": "balanceAfter",
          "type": "Number",
          "key": "",
          "desc": "事务发生后的即时快照余额"
        },
        {
          "name": "source",
          "type": "String",
          "key": "Indexed",
          "desc": "积分来源：streak_checkin, pomodoro, chess_win, p2p_transfer"
        },
        {
          "name": "refId",
          "type": "String",
          "key": "",
          "desc": "关联订单号或 P2P 转账令牌"
        },
        {
          "name": "createdAt",
          "type": "Date",
          "key": "Indexed (Compound)",
          "desc": "交易时间（复合索引：email + createdAt）"
        }
      ],
      "relations": [
        {
          "target": "UserProfile",
          "type": "N:1",
          "desc": "每条流水严格绑定到一个账户"
        },
        {
          "target": "PendingTransfer",
          "type": "1:1 (ref)",
          "desc": "若源于扫码转账，关联至 P2P 流转令牌"
        }
      ]
    },
    {
      "id": "PendingTransfer",
      "name": "PendingTransfer",
      "collection": "pendingtransfers",
      "role": "光子 P2P 瞬态中继实体 (TTL 60s)",
      "desc": "光子二维码扫码流转的中介会话对象。依托 MongoDB TTL 索引机制，在创建 60 秒后自动物理删除。",
      "color": "amber",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "主键"
        },
        {
          "name": "token",
          "type": "String",
          "key": "Indexed, Unique",
          "desc": "编码于二维码中的密码学哈希令牌"
        },
        {
          "name": "receiverEmail",
          "type": "String",
          "key": "FK",
          "desc": "发起收款凭据的用户邮箱"
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
          "desc": "一次性密码学加盐串，用于校验 PIN 码"
        },
        {
          "name": "createdAt",
          "type": "Date",
          "key": "TTL Index (60s)",
          "desc": "60 秒后自动物理销毁"
        }
      ],
      "relations": [
        {
          "target": "UserProfile",
          "type": "N:1",
          "desc": "接收方与发送方均映射至 UserProfile 实体"
        },
        {
          "target": "JoyLedger",
          "type": "1:2",
          "desc": "转账成功后原子生成 2 条账本记录（发送方 -JOY，接收方 +JOY）"
        }
      ]
    },
    {
      "id": "PaymentLink",
      "name": "PaymentLink",
      "collection": "paymentlinks",
      "role": "在线支付与账单结算实体 (PayOS)",
      "desc": "记录定制网站开发订单或服务器赞助账单，与国家 Napas 24/7 跨行清算流水对账绑定。",
      "color": "blue",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "主键"
        },
        {
          "name": "orderCode",
          "type": "Number",
          "key": "Indexed, Unique",
          "desc": "国家跨行整数订单唯一编号"
        },
        {
          "name": "customLinkId",
          "type": "String",
          "key": "Unique",
          "desc": "支付链接专属特征串"
        },
        {
          "name": "amount",
          "type": "Number",
          "key": "",
          "desc": "精确至分厘的应收金额 (VND)"
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
          "desc": "若登录时支付，记录付款人邮箱"
        },
        {
          "name": "paidAt",
          "type": "Date",
          "key": "",
          "desc": "Napas HMAC Webhook 签名确认时间戳"
        }
      ],
      "relations": [
        {
          "target": "UserProfile",
          "type": "N:1 (optional)",
          "desc": "已登录用户可关联至其账户"
        }
      ]
    },
    {
      "id": "AdminAuditLog",
      "name": "AdminAuditLog",
      "collection": "adminauditlogs",
      "role": "管理安全审计日志 (Audit Trail)",
      "desc": "永久记录管理员的一切关键操作。只读只追加，严禁篡改或删除以保障最高合规透明度。",
      "color": "slate",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "key": "PK",
          "desc": "主键"
        },
        {
          "name": "adminId",
          "type": "String",
          "key": "Indexed",
          "desc": "执行操作的管理员唯一标识"
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
          "desc": "受影响的业务目标对象"
        },
        {
          "name": "ipAddress",
          "type": "String",
          "key": "",
          "desc": "管理会话来源 IPv4/IPv6 地址"
        },
        {
          "name": "userAgent",
          "type": "String",
          "key": "",
          "desc": "操作者终端浏览器与环境设备字符串"
        },
        {
          "name": "details",
          "type": "Mixed",
          "key": "",
          "desc": "数据变更前后的快照快照对比 (Snapshot)"
        },
        {
          "name": "createdAt",
          "type": "Date",
          "key": "Indexed",
          "desc": "精确至毫秒级的日志写入时间戳"
        }
      ],
      "relations": [
        {
          "target": "Admin",
          "type": "N:1",
          "desc": "严格追溯至执行操作的管理员身份"
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": "UserProfile",
      "to": "WebAuthnCredential",
      "cardinality": "1 : N",
      "rule": "单一用户可绑定多个 Passkey（Touch ID、Face ID、Windows Hello 等）。当账户注销时，级联注销其所有下属凭证。"
    },
    {
      "from": "UserProfile",
      "to": "BioProfile",
      "cardinality": "1 : 1",
      "rule": "每个用户仅能对应 1 个独一无二的 @slug 主页。系统对 slug 建立唯一索引以保护个人品牌。"
    },
    {
      "from": "UserProfile",
      "to": "JoyLedger",
      "cardinality": "1 : N (Append-Only)",
      "rule": "单向账本流转关系。系统严禁直接 UPDATE 用户表中的余额，而是由不可变 JoyLedger 动态汇总结算，根除并发竞争。"
    },
    {
      "from": "PendingTransfer",
      "to": "JoyLedger",
      "cardinality": "1 : 2 Atomic",
      "rule": "P2P 转账完成时，系统触发原子事务同时生成 2 条双向 JoyLedger 记录：扣款方 (-JOY) 与入账方 (+JOY)。"
    },
    {
      "from": "UserProfile",
      "to": "PaymentLink",
      "cardinality": "1 : N",
      "rule": "开发服务合同与电子账单严格通过订单号 orderCode 与国家 Napas 24/7 跨行系统一一对账确认。"
    },
    {
      "from": "AdminAuditLog",
      "to": "System Integrity",
      "cardinality": "不可变 (Immutable)",
      "rule": "审计日志 AdminAuditLog 仅开放 INSERT 写入权限，在数据库引擎层封禁 UPDATE 与 DELETE 行为以杜绝越权篡改。"
    }
  ]
};
