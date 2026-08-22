const SENTRY_API_BASE = 'https://sentry.io/api/0';

export async function requestSentryAutofix({ issueId, userContext = '' } = {}) {
  if (process.env.SENTRY_AUTOFIX_ENABLED !== 'true') {
    return { started: false, reason: 'disabled' };
  }

  const authToken = process.env.SENTRY_AUTH_TOKEN;
  const organization = process.env.SENTRY_ORG;
  const safeIssueId = String(issueId || '').trim();
  if (!authToken || !organization || !safeIssueId) {
    return { started: false, reason: 'missing_config' };
  }

  const body = {
    stopping_point: 'open_pr',
    referrer: 'price-doc-ai-workforce',
    user_context: String(userContext || '').slice(0, 1000),
  };
  if (process.env.SENTRY_REPO_NAME) body.repo_name = process.env.SENTRY_REPO_NAME;

  try {
    const response = await fetch(
      `${SENTRY_API_BASE}/organizations/${encodeURIComponent(organization)}/issues/${encodeURIComponent(safeIssueId)}/autofix/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        started: false,
        reason: 'sentry_rejected',
        status: response.status,
        detail: String(data.detail || data.error || '').slice(0, 300),
      };
    }
    return {
      started: true,
      runId: data.run_id || null,
      sentryRunId: data.sentry_run_id || null,
      stoppingPoint: 'open_pr',
    };
  } catch (error) {
    return {
      started: false,
      reason: 'network_error',
      detail: String(error.message || error).slice(0, 300),
    };
  }
}
