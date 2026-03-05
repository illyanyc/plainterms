import type { AnalysisResult, Tier, UsageInfo } from "../types";
import { STORAGE_KEYS, ANALYSIS_CACHE_TTL_MS } from "./constants";

export async function getClientId(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CLIENT_ID);
  if (result[STORAGE_KEYS.CLIENT_ID]) return result[STORAGE_KEYS.CLIENT_ID];

  const id = crypto.randomUUID();
  await chrome.storage.local.set({ [STORAGE_KEYS.CLIENT_ID]: id });
  return id;
}

export async function getTier(): Promise<Tier> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TIER);
  return result[STORAGE_KEYS.TIER] ?? "free";
}

export async function setTier(tier: Tier): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.TIER]: tier });
}

export async function isEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.ENABLED);
  return result[STORAGE_KEYS.ENABLED] !== false;
}

export async function setEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.ENABLED]: enabled });
}

export async function getBackendUrl(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.BACKEND_URL);
  return result[STORAGE_KEYS.BACKEND_URL] ?? "https://plainterms-production.up.railway.app";
}

export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.JWT_TOKEN);
  return result[STORAGE_KEYS.JWT_TOKEN] ?? null;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.JWT_TOKEN]: token });
}

export async function getCachedAnalysis(cacheKey: string): Promise<AnalysisResult | null> {
  const key = STORAGE_KEYS.CACHE_PREFIX + cacheKey;
  const result = await chrome.storage.local.get(key);
  const cached = result[key];

  if (!cached) return null;

  if (Date.now() - cached.timestamp > ANALYSIS_CACHE_TTL_MS) {
    await chrome.storage.local.remove(key);
    return null;
  }

  return cached.data;
}

export async function setCachedAnalysis(cacheKey: string, data: AnalysisResult): Promise<void> {
  const key = STORAGE_KEYS.CACHE_PREFIX + cacheKey;
  await chrome.storage.local.set({
    [key]: { data, timestamp: Date.now() },
  });
}

export async function getUsage(): Promise<UsageInfo> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.USAGE);
  const usage = result[STORAGE_KEYS.USAGE];
  const tier = await getTier();
  const now = new Date();

  const limits = {
    free: { quickDaily: 5, deepMonthly: 0 },
    pro: { quickDaily: 20, deepMonthly: 50 },
    enterprise: { quickDaily: Infinity, deepMonthly: Infinity },
  };

  if (!usage || usage.date !== now.toDateString()) {
    return {
      tier,
      quickScansUsedToday: 0,
      quickScansLimitToday: limits[tier].quickDaily,
      deepScansUsedThisMonth: usage?.month === now.getMonth() ? usage.deepScansUsedThisMonth : 0,
      deepScansLimitThisMonth: limits[tier].deepMonthly,
    };
  }

  return {
    tier,
    quickScansUsedToday: usage.quickScansUsedToday ?? 0,
    quickScansLimitToday: limits[tier].quickDaily,
    deepScansUsedThisMonth: usage.deepScansUsedThisMonth ?? 0,
    deepScansLimitThisMonth: limits[tier].deepMonthly,
  };
}

export async function incrementUsage(mode: "quick" | "deep"): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.USAGE);
  const now = new Date();
  const existing = result[STORAGE_KEYS.USAGE] ?? {};

  const isNewDay = existing.date !== now.toDateString();
  const isNewMonth = existing.month !== now.getMonth();

  const updated = {
    date: now.toDateString(),
    month: now.getMonth(),
    quickScansUsedToday: isNewDay ? 0 : (existing.quickScansUsedToday ?? 0),
    deepScansUsedThisMonth: isNewMonth ? 0 : (existing.deepScansUsedThisMonth ?? 0),
  };

  if (mode === "quick") updated.quickScansUsedToday++;
  else updated.deepScansUsedThisMonth++;

  await chrome.storage.local.set({ [STORAGE_KEYS.USAGE]: updated });
}
