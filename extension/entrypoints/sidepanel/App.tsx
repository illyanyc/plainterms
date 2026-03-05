import React, { useState, useEffect, useCallback } from "react";
import { useAnalysis } from "../../hooks/useAnalysis";
import { RiskScore } from "./components/RiskScore";
import { RedFlagList } from "./components/RedFlagList";
import { ProsList } from "./components/ProsList";
import { WatchOuts } from "./components/WatchOuts";
import { Summary } from "./components/Summary";
import { Receipts } from "./components/Receipts";
import { StatusBar } from "./components/StatusBar";
import { ReputationBadge } from "./components/ReputationBadge";
import { TierBanner } from "./components/TierBanner";
import { UpgradeCTA } from "./components/UpgradeCTA";
import type { PolicyType, AnalysisMode } from "../../types";
import { getUsage } from "../../lib/storage";
import { fetchUserStatus, registerUser } from "../../lib/api";

interface PendingAnalysis {
  url: string;
  policyText: string;
  policyType: PolicyType;
}

export default function App() {
  const [pending, setPending] = useState<PendingAnalysis | null>(null);
  const [userTier, setUserTier] = useState<string>("free");
  const { state, startAnalysis, reset } = useAnalysis();

  useEffect(() => {
    registerUser()
      .then((s) => setUserTier(s.tier))
      .catch(() => {});
  }, []);

  useEffect(() => {
    chrome.storage.session.get("pendingAnalysis", (result) => {
      if (result.pendingAnalysis) {
        setPending(result.pendingAnalysis);
        chrome.storage.session.remove("pendingAnalysis");
      }
    });

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.pendingAnalysis?.newValue) {
        setPending(changes.pendingAnalysis.newValue);
        chrome.storage.session.remove("pendingAnalysis");
      }
    };
    chrome.storage.session.onChanged.addListener(listener);
    return () => chrome.storage.session.onChanged.removeListener(listener);
  }, []);

  useEffect(() => {
    if (!pending) return;

    const run = async () => {
      let text = pending.policyText;

      if (!text) {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            const res: { text: string; truncated: boolean } = await new Promise(
              (resolve, reject) => {
                chrome.tabs.sendMessage(
                  tab.id!,
                  { type: "EXTRACT_TEXT", payload: { url: pending.url } },
                  (r) => (r ? resolve(r) : reject(new Error("extraction failed")))
                );
              }
            );
            text = res.text;
          }
        } catch {
          // fall through with empty text
        }
      }

      if (text) {
        handleAnalyze(pending.url, text, pending.policyType, "quick");
      }
    };

    run();
  }, [pending]);

  const handleAnalyze = useCallback(
    async (url: string, text: string, policyType: PolicyType, mode: AnalysisMode) => {
      const usage = await getUsage();
      if (mode === "quick" && usage.quickScansUsedToday >= usage.quickScansLimitToday) {
        return;
      }
      if (mode === "deep" && usage.deepScansUsedThisMonth >= usage.deepScansLimitThisMonth) {
        return;
      }
      startAnalysis(url, text, policyType, mode);
    },
    [startAnalysis]
  );

  const domain = pending?.url
    ? new URL(pending.url).hostname.replace("www.", "")
    : "";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="font-semibold text-sm">PlainTerms</span>
          </div>
          <TierBanner />
        </div>
        {domain && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {state.status === "analyzing" ? "Analyzing" : "Analyzed"}: {domain}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {state.status === "idle" && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 opacity-40"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="text-sm font-medium">No policy analyzed yet</p>
            <p className="text-xs mt-1">
              Click a policy link badge or use the popup to start
            </p>
          </div>
        )}

        {state.status === "error" && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Analysis failed
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
              {state.error}
            </p>
            <button
              onClick={reset}
              className="mt-2 text-xs text-red-700 dark:text-red-400 underline"
            >
              Try again
            </button>
          </div>
        )}

        {(state.status === "analyzing" || state.status === "done") && (
          <>
            <StatusBar status={state.status} processingTimeMs={state.result.processingTimeMs} />
            <RiskScore riskScore={state.result.riskScore} loading={state.status === "analyzing" && !state.result.riskScore} />
            {state.result.reputation && <ReputationBadge reputation={state.result.reputation} />}
            <RedFlagList flags={state.result.redFlags} loading={state.status === "analyzing"} />
            <ProsList pros={state.result.pros} loading={state.status === "analyzing"} />
            <WatchOuts items={state.result.watchOuts} loading={state.status === "analyzing"} />
            <Summary text={state.result.summary} loading={state.status === "analyzing" && !state.result.summary} />
            <Receipts receipts={state.result.receipts} loading={state.status === "analyzing"} />
            {state.status === "done" && userTier === "free" && <UpgradeCTA />}
          </>
        )}
      </div>
    </div>
  );
}
