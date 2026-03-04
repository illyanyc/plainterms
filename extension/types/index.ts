export type Severity = "critical" | "warning" | "info";
export type Confidence = "high" | "medium" | "low";
export type RiskLevel = "high" | "medium" | "low";
export type PolicyType = "privacy" | "terms" | "cookie" | "refund" | "other";
export type Tier = "free" | "pro" | "enterprise";
export type AnalysisMode = "quick" | "deep";

export interface DetectedLink {
  url: string;
  text: string;
  policyType: PolicyType;
  score: number;
  element?: HTMLAnchorElement;
}

export interface RiskScore {
  score: number;
  max: number;
  level: RiskLevel;
  explanation: string;
}

export interface RedFlag {
  id: number;
  category: string;
  severity: Severity;
  confidence: Confidence;
  title: string;
  snippet: string;
  why: string;
  action: string;
  sectionRef: string;
}

export interface Pro {
  id: number;
  title: string;
  snippet: string;
  sectionRef: string;
}

export interface WatchOut {
  id: number;
  title: string;
  snippet: string;
  sectionRef: string;
}

export interface Receipt {
  section: string;
  quote: string;
  context: string;
}

export interface ReputationBadge {
  trustpilot?: { rating: number; reviewCount: number };
  bbb?: { rating: string; accredited: boolean; complaintCount?: number };
}

export interface AnalysisResult {
  riskScore: RiskScore | null;
  redFlags: RedFlag[];
  pros: Pro[];
  watchOuts: WatchOut[];
  summary: string;
  receipts: Receipt[];
  reputation: ReputationBadge | null;
  cached: boolean;
  processingTimeMs: number;
}

export interface UsageInfo {
  tier: Tier;
  quickScansUsedToday: number;
  quickScansLimitToday: number;
  deepScansUsedThisMonth: number;
  deepScansLimitThisMonth: number;
}

// Chrome messaging protocol
export type MessageType =
  | "LINKS_DETECTED"
  | "ANALYZE_POLICY"
  | "ANALYSIS_UPDATE"
  | "OPEN_SIDEPANEL"
  | "GET_DETECTED_LINKS"
  | "GET_USAGE";

export interface BaseMessage {
  type: MessageType;
}

export interface LinksDetectedMessage extends BaseMessage {
  type: "LINKS_DETECTED";
  payload: {
    links: Omit<DetectedLink, "element">[];
    tabId: number;
  };
}

export interface AnalyzePolicyMessage extends BaseMessage {
  type: "ANALYZE_POLICY";
  payload: {
    url: string;
    policyText: string;
    policyType: PolicyType;
    mode: AnalysisMode;
  };
}

export interface OpenSidePanelMessage extends BaseMessage {
  type: "OPEN_SIDEPANEL";
  payload: {
    url: string;
    policyText: string;
    policyType: PolicyType;
  };
}

export interface GetDetectedLinksMessage extends BaseMessage {
  type: "GET_DETECTED_LINKS";
}

export interface GetUsageMessage extends BaseMessage {
  type: "GET_USAGE";
}

export type ExtensionMessage =
  | LinksDetectedMessage
  | AnalyzePolicyMessage
  | OpenSidePanelMessage
  | GetDetectedLinksMessage
  | GetUsageMessage;

// SSE event types from backend
export type SSEEventType =
  | "risk_score"
  | "red_flag"
  | "pro"
  | "watch_out"
  | "summary"
  | "receipt"
  | "reputation"
  | "done"
  | "error";

export interface SSEEvent {
  event: SSEEventType;
  data: string;
}

// Storage keys and defaults are in lib/constants.ts
