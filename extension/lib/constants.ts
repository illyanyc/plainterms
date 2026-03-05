import type { PolicyType } from "../types";

export const STORAGE_KEYS = {
  CLIENT_ID: "plainterms_client_id",
  TIER: "plainterms_tier",
  CACHE_PREFIX: "plainterms_cache_",
  USAGE: "plainterms_usage",
  ENABLED: "plainterms_enabled",
  BACKEND_URL: "plainterms_backend_url",
  JWT_TOKEN: "plainterms_jwt_token",
} as const;

export const DEFAULT_BACKEND_URL = "https://plainterms-production.up.railway.app";

export const POLICY_KEYWORDS: Record<PolicyType, string[]> = {
  privacy: [
    "privacy policy",
    "privacy notice",
    "privacy statement",
    "data protection",
    "data privacy",
    "information we collect",
    "personal data",
    "privacy practices",
  ],
  terms: [
    "terms of service",
    "terms of use",
    "terms and conditions",
    "terms & conditions",
    "t&c",
    "tos",
    "user agreement",
    "service agreement",
    "legal terms",
  ],
  cookie: [
    "cookie policy",
    "cookie notice",
    "cookie preferences",
    "cookie settings",
    "use of cookies",
  ],
  refund: [
    "refund policy",
    "return policy",
    "cancellation policy",
    "billing terms",
    "subscription terms",
    "money back",
    "returns & refunds",
  ],
  other: [
    "eula",
    "end user license",
    "acceptable use",
    "aup",
    "dmca",
    "copyright policy",
    "legal notice",
    "legal",
    "disclaimer",
    "community guidelines",
  ],
};

export const HREF_KEYWORDS = [
  "privacy",
  "terms",
  "tos",
  "legal",
  "cookie",
  "refund",
  "return",
  "cancellation",
  "eula",
  "policy",
  "disclaimer",
  "agreement",
];

export const LINK_SCORE_THRESHOLDS = {
  EXACT_TEXT_MATCH: 1.0,
  PARTIAL_TEXT_MATCH: 0.8,
  HREF_MATCH: 0.6,
  PARENT_CONTEXT_MATCH: 0.4,
  MINIMUM: 0.6,
} as const;

export const MAX_POLICY_TEXT_LENGTH = 100_000;

export const ANALYSIS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
