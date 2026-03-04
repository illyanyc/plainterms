import { useState, useCallback, useRef } from "react";
import type {
  AnalysisResult,
  AnalysisMode,
  PolicyType,
  RiskScore,
  RedFlag,
  Pro,
  WatchOut,
  Receipt,
  ReputationBadge,
  SSEEventType,
} from "../types";
import { streamAnalysis } from "../lib/api";
import { incrementUsage } from "../lib/storage";

type AnalysisStatus = "idle" | "analyzing" | "done" | "error";

interface AnalysisState {
  status: AnalysisStatus;
  result: AnalysisResult;
  error: string | null;
}

const EMPTY_RESULT: AnalysisResult = {
  riskScore: null,
  redFlags: [],
  pros: [],
  watchOuts: [],
  summary: "",
  receipts: [],
  reputation: null,
  cached: false,
  processingTimeMs: 0,
};

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    status: "idle",
    result: { ...EMPTY_RESULT },
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const handleEvent = useCallback((event: SSEEventType, data: unknown) => {
    setState((prev) => {
      const result = { ...prev.result };
      switch (event) {
        case "risk_score":
          result.riskScore = data as RiskScore;
          break;
        case "red_flag":
          result.redFlags = [...result.redFlags, data as RedFlag];
          break;
        case "pro":
          result.pros = [...result.pros, data as Pro];
          break;
        case "watch_out":
          result.watchOuts = [...result.watchOuts, data as WatchOut];
          break;
        case "summary":
          result.summary = (data as { text: string }).text;
          break;
        case "receipt":
          result.receipts = [...result.receipts, data as Receipt];
          break;
        case "reputation":
          result.reputation = data as ReputationBadge;
          break;
        case "done": {
          const doneData = data as { cached: boolean; processing_time_ms: number };
          result.cached = doneData.cached;
          result.processingTimeMs = doneData.processing_time_ms;
          return { ...prev, status: "done" as const, result };
        }
        case "error":
          return {
            ...prev,
            status: "error" as const,
            error: (data as { message: string }).message ?? "Unknown error",
          };
      }
      return { ...prev, result };
    });
  }, []);

  const startAnalysis = useCallback(
    async (url: string, policyText: string, policyType: PolicyType, mode: AnalysisMode) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        status: "analyzing",
        result: { ...EMPTY_RESULT },
        error: null,
      });

      try {
        await streamAnalysis(url, policyText, policyType, mode, handleEvent, controller.signal);
        await incrementUsage(mode);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: (err as Error).message,
          }));
        }
      }
    },
    [handleEvent]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle", result: { ...EMPTY_RESULT }, error: null });
  }, []);

  return { state, startAnalysis, reset };
}
