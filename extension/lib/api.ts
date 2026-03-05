import type { AnalysisMode, PolicyType, SSEEvent, SSEEventType } from "../types";
import { getBackendUrl, getClientId, getToken, setToken } from "./storage";

export type SSECallback = (event: SSEEventType, data: unknown) => void;

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function ensureRegistered(): Promise<string> {
  let token = await getToken();
  if (token) return token;

  const backendUrl = await getBackendUrl();
  const clientId = await getClientId();

  const response = await fetch(`${backendUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId }),
  });

  if (!response.ok) throw new Error(`Registration failed (${response.status})`);

  const data = await response.json();
  token = data.token;
  if (!token) throw new Error("Server did not return a token");
  await setToken(token);
  return token;
}

export async function streamAnalysis(
  url: string,
  policyText: string,
  policyType: PolicyType,
  mode: AnalysisMode,
  onEvent: SSECallback,
  signal?: AbortSignal
): Promise<void> {
  await ensureRegistered();
  const backendUrl = await getBackendUrl();
  const headers = await authHeaders();
  headers["Accept"] = "text/event-stream";
  const endpoint = mode === "deep" ? "analyze/deep" : "analyze/quick";

  const response = await fetch(`${backendUrl}/api/v1/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url,
      policy_text: policyText,
      policy_type: policyType,
    }),
    signal,
  });

  if (response.status === 401) {
    await setToken("");
    await ensureRegistered();
    return streamAnalysis(url, policyText, policyType, mode, onEvent, signal);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analysis failed (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    let currentEvent: SSEEventType | null = null;

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim() as SSEEventType;
      } else if (line.startsWith("data: ") && currentEvent) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent(currentEvent, data);
        } catch {
          onEvent(currentEvent, line.slice(6));
        }
        currentEvent = null;
      } else if (line === "") {
        currentEvent = null;
      }
    }
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const backendUrl = await getBackendUrl();
    const response = await fetch(`${backendUrl}/api/v1/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export interface UserStatus {
  client_id: string;
  tier: string;
  subscription_status: string;
  quick_scans_used_today: number;
  quick_scans_limit_today: number;
  deep_scans_used_this_month: number;
  deep_scans_limit_this_month: number;
  has_payment_method: boolean;
}

export async function registerUser(): Promise<UserStatus> {
  await ensureRegistered();
  return fetchUserStatus();
}

export async function fetchUserStatus(): Promise<UserStatus> {
  await ensureRegistered();
  const backendUrl = await getBackendUrl();
  const headers = await authHeaders();

  const response = await fetch(`${backendUrl}/api/v1/auth/status`, {
    headers,
    signal: AbortSignal.timeout(5000),
  });

  if (response.status === 401) {
    await setToken("");
    await ensureRegistered();
    return fetchUserStatus();
  }

  if (!response.ok) throw new Error("Failed to fetch user status");
  return response.json();
}

export async function getUpgradeUrl(): Promise<string> {
  await ensureRegistered();
  const backendUrl = await getBackendUrl();
  const headers = await authHeaders();

  const response = await fetch(`${backendUrl}/api/v1/auth/upgrade`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      success_url: `${backendUrl}/api/v1/health`,
      cancel_url: `${backendUrl}/api/v1/health`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upgrade failed: ${text}`);
  }

  const data = await response.json();
  return data.checkout_url;
}

export async function getBillingPortalUrl(): Promise<string> {
  await ensureRegistered();
  const backendUrl = await getBackendUrl();
  const headers = await authHeaders();

  const response = await fetch(`${backendUrl}/api/v1/auth/portal`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Portal failed: ${text}`);
  }

  const data = await response.json();
  return data.portal_url;
}
