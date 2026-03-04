import type { AnalysisMode, PolicyType, SSEEvent, SSEEventType } from "../types";
import { getBackendUrl, getClientId } from "./storage";

export type SSECallback = (event: SSEEventType, data: unknown) => void;

export async function streamAnalysis(
  url: string,
  policyText: string,
  policyType: PolicyType,
  mode: AnalysisMode,
  onEvent: SSECallback,
  signal?: AbortSignal
): Promise<void> {
  const backendUrl = await getBackendUrl();
  const clientId = await getClientId();
  const endpoint = mode === "deep" ? "analyze/deep" : "analyze/quick";

  const response = await fetch(`${backendUrl}/api/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      url,
      policy_text: policyText,
      policy_type: policyType,
      client_id: clientId,
    }),
    signal,
  });

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
  const backendUrl = await getBackendUrl();
  const clientId = await getClientId();

  await fetch(`${backendUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId }),
  });

  return fetchUserStatus();
}

export async function fetchUserStatus(): Promise<UserStatus> {
  const backendUrl = await getBackendUrl();
  const clientId = await getClientId();

  const response = await fetch(
    `${backendUrl}/api/v1/auth/status?client_id=${encodeURIComponent(clientId)}`,
    { signal: AbortSignal.timeout(5000) }
  );

  if (!response.ok) throw new Error("Failed to fetch user status");
  return response.json();
}

export async function getUpgradeUrl(): Promise<string> {
  const backendUrl = await getBackendUrl();
  const clientId = await getClientId();

  const response = await fetch(`${backendUrl}/api/v1/auth/upgrade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
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
  const backendUrl = await getBackendUrl();
  const clientId = await getClientId();

  const response = await fetch(`${backendUrl}/api/v1/auth/portal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Portal failed: ${text}`);
  }

  const data = await response.json();
  return data.portal_url;
}
