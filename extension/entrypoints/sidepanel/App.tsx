import React, { useState, useEffect, useCallback, useRef } from "react";
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
import type { PolicyType, AnalysisMode, DetectedLink } from "../../types";
import { getUsage } from "../../lib/storage";
import { fetchUserStatus, registerUser } from "../../lib/api";

interface PendingAnalysis {
  url: string;
  policyText: string;
  policyType: PolicyType;
}

type PageLink = Omit<DetectedLink, "element">;

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

export default function App() {
  const [pending, setPending] = useState<PendingAnalysis | null>(null);
  const [userTier, setUserTier] = useState<string>("free");
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [pageLinks, setPageLinks] = useState<PageLink[]>([]);
  const [scanning, setScanning] = useState(false);
  const { state, startAnalysis, reset } = useAnalysis();
  const lastAnalyzedDomain = useRef("");

  useEffect(() => {
    registerUser()
      .then((s) => setUserTier(s.tier))
      .catch(() => {});

    chrome.storage.local.get("plainterms_auto_analyze", (r) => {
      if (r.plainterms_auto_analyze === true) setAutoAnalyze(true);
    });
  }, []);

  const scanTab = useCallback(async (tabId: number): Promise<PageLink[]> => {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const HREF_KW = ["privacy","terms","tos","legal","cookie","refund","return","cancellation","eula","policy","disclaimer","agreement"];
          const TEXT_KW: Record<string, string[]> = {
            privacy: ["privacy","privacy policy","privacy notice","privacy statement","data protection","data privacy"],
            terms: ["terms","terms of service","terms of use","terms and conditions","terms & conditions","t&c","tos","user agreement","service agreement","legal terms"],
            cookie: ["cookie policy","cookie notice","cookie preferences","cookie settings","use of cookies"],
            refund: ["refund policy","return policy","cancellation policy","billing terms","subscription terms","money back","returns & refunds"],
            other: ["eula","end user license","acceptable use","aup","dmca","copyright policy","legal notice","legal","disclaimer","community guidelines"],
          };
          function inferType(href: string): string {
            if (href.includes("privacy")) return "privacy";
            if (href.includes("terms") || href.includes("tos")) return "terms";
            if (href.includes("cookie")) return "cookie";
            if (href.includes("refund") || href.includes("return")) return "refund";
            return "other";
          }
          const found: { url: string; text: string; policyType: string; score: number }[] = [];
          const seen = new Set<string>();
          for (const a of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
            const href = a.href;
            const text = (a.textContent || "").trim().toLowerCase().replace(/\s+/g, " ");
            if (!text || text.length > 200 || seen.has(href)) continue;
            seen.add(href);
            let matched = false;
            for (const [type, kws] of Object.entries(TEXT_KW)) {
              for (const kw of kws) {
                if (text === kw || text.includes(kw)) {
                  found.push({ url: href, text: (a.textContent || "").trim(), policyType: type, score: text === kw ? 1 : 0.8 });
                  matched = true; break;
                }
              }
              if (matched) break;
            }
            if (!matched) {
              const lhref = href.toLowerCase();
              for (const kw of HREF_KW) {
                if (lhref.includes(kw)) {
                  found.push({ url: href, text: (a.textContent || "").trim(), policyType: inferType(lhref), score: 0.6 });
                  break;
                }
              }
            }
          }
          return found;
        },
      });
      return (results?.[0]?.result ?? []) as PageLink[];
    } catch {
      return [];
    }
  }, []);

  const extractAndAnalyze = useCallback(async (link: PageLink) => {
    reset();
    setPending({ url: link.url, policyText: "", policyType: link.policyType as PolicyType });
  }, [reset]);

  const handleNavigation = useCallback(async (url: string) => {
    const newDomain = getDomain(url);
    const oldDomain = getDomain(currentUrl);
    if (!newDomain || newDomain === oldDomain) return;

    setCurrentUrl(url);
    setScanning(true);
    setPageLinks([]);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) { setScanning(false); return; }

    const links = await scanTab(tab.id);
    setPageLinks(links);
    setScanning(false);

    if (autoAnalyze && links.length > 0 && newDomain !== lastAnalyzedDomain.current) {
      lastAnalyzedDomain.current = newDomain;
      extractAndAnalyze(links[0]);
    }
  }, [currentUrl, autoAnalyze, scanTab, extractAndAnalyze]);

  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === "TAB_NAVIGATED") {
        handleNavigation(message.payload.url);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [handleNavigation]);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (tab?.url && tab.id) {
        setCurrentUrl(tab.url);
        setScanning(true);
        const links = await scanTab(tab.id);
        setPageLinks(links);
        setScanning(false);
      }
    });
  }, [scanTab]);

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
          const html: string = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: "FETCH_URL", url: pending.url }, (res) => {
              resolve(res?.html ?? "");
            });
          });
          if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            doc.querySelectorAll("nav,header,footer,aside,script,style,noscript,iframe").forEach((el) => el.remove());
            const main = doc.querySelector("main") ?? doc.querySelector("article") ?? doc.querySelector('[role="main"]') ?? doc.body;
            text = (main?.textContent ?? "").replace(/\s+/g, " ").trim();
          }
        } catch {}
      }
      if (text && text.length > 100) {
        handleAnalyze(pending.url, text, pending.policyType, "quick");
        lastAnalyzedDomain.current = getDomain(pending.url);
      }
    };
    run();
  }, [pending]);

  const handleAnalyze = useCallback(
    async (url: string, text: string, policyType: PolicyType, mode: AnalysisMode) => {
      startAnalysis(url, text, policyType, mode);
    },
    [startAnalysis]
  );

  const toggleAutoAnalyze = () => {
    const next = !autoAnalyze;
    setAutoAnalyze(next);
    chrome.storage.local.set({ plainterms_auto_analyze: next });
  };

  const domain = pending?.url ? getDomain(pending.url) : "";
  const pageDomain = getDomain(currentUrl);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="font-semibold text-sm">PlainTerms</span>
          </div>
          <TierBanner />
        </div>

        {/* Auto-analyze toggle */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {pageDomain && `Browsing: ${pageDomain}`}
          </span>
          <button
            onClick={toggleAutoAnalyze}
            className="flex items-center gap-1.5 text-[10px]"
            title={autoAnalyze ? "Disable auto-analyze on navigation" : "Enable auto-analyze on navigation"}
          >
            <span className="text-gray-400">{autoAnalyze ? "Auto-analyze on" : "Auto-analyze off"}</span>
            <span className={`relative w-7 h-3.5 rounded-full transition-colors ${autoAnalyze ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`}>
              <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform ${autoAnalyze ? "translate-x-3" : ""}`} />
            </span>
          </button>
        </div>

        {/* Analyzed domain + re-analyze */}
        {domain && (
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {state.status === "analyzing" ? "Analyzing" : "Analyzed"}: {domain}
            </p>
            {state.status === "done" && pending && (
              <button
                onClick={() => { reset(); setPending({ ...pending }); }}
                className="text-[10px] text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1 shrink-0 ml-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
                Re-analyze
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Detected links on current page */}
        {state.status === "idle" && (
          <>
            {scanning ? (
              <div className="text-center py-8 text-gray-400">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs">Scanning page for policies...</p>
              </div>
            ) : pageLinks.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Found {pageLinks.length} policy link{pageLinks.length > 1 ? "s" : ""} on this page
                </p>
                <div className="space-y-2">
                  {pageLinks.map((link, i) => (
                    <button
                      key={i}
                      onClick={() => extractAndAnalyze(link)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium shrink-0">
                          {link.policyType}
                        </span>
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{link.text}</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0 ml-2">
                        <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-40">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <p className="text-sm font-medium">No policy links found</p>
                <p className="text-xs mt-1">Navigate to a site to detect policies</p>
              </div>
            )}
          </>
        )}

        {state.status === "error" && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Analysis failed</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">{state.error}</p>
            <button onClick={reset} className="mt-2 text-xs text-red-700 dark:text-red-400 underline">
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

            {/* Back to links */}
            {state.status === "done" && pageLinks.length > 1 && (
              <button
                onClick={reset}
                className="w-full py-2 text-xs text-blue-500 hover:text-blue-400 transition-colors"
              >
                ← Back to detected links ({pageLinks.length})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
