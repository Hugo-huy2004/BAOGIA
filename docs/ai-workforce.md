# AI Workforce for PRICE_DOC

## Purpose

PRICE_DOC uses two separate virtual teams:

1. **Gstack development team** helps the owner think, plan, implement, review,
   test and release changes to this repository.
2. **Production AI workforce** performs narrowly scoped work inside the live
   application through authenticated Node APIs.

Keeping the layers separate matters. Gstack has developer-machine and source
code access. Production employees only receive the data and capabilities that
their role requires.

## Development team

The default delivery loop is:

```text
office-hours -> CEO review -> engineering/design review -> implementation
             -> code review -> browser QA -> ship -> retrospective
```

All commands are namespaced with `gstack-` in Codex. Small, obvious changes do
not need the full loop. Features that touch authentication, JOY, payments,
personal data or autonomous actions should use architecture review, security
review and QA before release.

## Production team (MVP)

| Employee | Key | Responsibility | Default autonomy |
| --- | --- | --- | --- |
| Support Specialist | `support` | Draft a ticket response and propose resolution | Human approval |
| Operations Analyst | `operations` | Summarize health, queues and operational priorities | Read-only automatic |
| Knowledge Curator | `knowledge` | Turn a solved ticket into a reusable KB entry | Human approval |
| Risk Guardian | `risk` | Analyze security and JOY anomalies | Read-only automatic |
| Server Specialist | `server_specialist` | Detect Node/API failures, alert Telegram, diagnose and request a fix PR | Guarded auto-repair |
| UI Specialist | `ui_specialist` | Detect React/browser failures, recover stale bundles and request a fix PR | Guarded auto-repair |

The MVP deliberately has no agent that can transfer JOY, issue refunds, change
prices, send payments, lock accounts or send arbitrary email. Those require a
separate capability with explicit validation and human approval.

## Production incident loop

```text
Browser/React/API 5xx or Node 500
  -> scrub + fingerprint + rate limit
  -> Telegram alert + ErrorLog
  -> Server Specialist or UI Specialist task
  -> diagnosis
  -> Sentry Seer fix PR when an authenticated Sentry issue is available
  -> checks + review + canary/deploy outside the agent
```

Repeated fingerprints are suppressed for five minutes and the public client
endpoint can open at most 20 new incidents per process-hour. Client messages,
stacks and URLs are untrusted data and can never become shell commands.

### Automatic repair boundary

| Incident | Automatic behavior | Deployment behavior |
| --- | --- | --- |
| Stale/missing UI chunk after release | Reload current bundle once per session | No deploy |
| Sentry issue with Seer enabled | Ask Seer to generate and open a focused PR | Never auto-merge or auto-deploy |
| Error without Sentry issue ID | Diagnose, log and alert Telegram | Human starts/links the code change |
| Data migration, auth, JOY, payment or destructive change | Stop at diagnosis | Explicit human approval and staged rollout |

Sentry is optional. Without its DSN/token, the internal client/server telemetry,
Telegram alert and specialist task still run; only source-mapped Sentry issues
and automatic PR creation are unavailable.

## Task lifecycle

```text
queued -> running -> completed
                  -> awaiting_approval -> executing -> completed
                                       -> rejected
                  -> failed
```

- Every task records the employee, objective, requester, input context, result,
  timestamps and decision history.
- Approval uses an atomic status transition so the same action cannot be
  executed twice by two admin requests.
- An approved action is executed by deterministic server code. The language
  model proposes content; it never chooses a database query or route to call.
- All create, approve and reject decisions are written to `AdminAuditLog`.

## Capability policy

| Risk | Examples | Policy |
| --- | --- | --- |
| Low | Read metrics, summarize incidents, draft internal report | May complete automatically |
| Medium | Publish a KB answer, update internal metadata | Admin approval |
| High | Reply to a customer, resolve a ticket, send a notification | Admin approval and audit |
| Critical | JOY balance, refunds, payment, account lock, secrets | Not available in MVP |

Production employees must always:

- go through `aiGateway.js` for model calls;
- use server-verified admin identity for control APIs;
- treat model output as untrusted text;
- expose no generic tool execution, shell, Mongo query or arbitrary URL fetch;
- fail closed when input, task status or target resource is invalid.

## API surface

All endpoints are admin-only under `/api/admin/workforce`:

- `GET /agents` — list the production roster and capabilities.
- `GET /tasks` — list recent tasks with optional `status` and `agentKey`.
- `GET /tasks/:id` — inspect one task.
- `POST /tasks` — create and immediately run one bounded task.
- `POST /tasks/:id/approve` — approve and execute a proposed action once.
- `POST /tasks/:id/reject` — reject a pending proposal.

## Rollout

1. Run the six employees manually from the **Đội ngũ AI** tab in the admin
   panel and inspect their audit trail.
2. Configure Telegram, then Sentry runtime DSNs, source-map upload and a signed
   Service Hook to `POST /api/ops/sentry-hook`.
3. Enable `SENTRY_AUTOFIX_ENABLED=true` only after Sentry is connected to the
   repository and can open PRs on a protected branch.
4. Measure completion rate, approval rate, corrected drafts, latency, token use
   and incidents.
5. Only then consider scheduled tasks or additional write capabilities.
