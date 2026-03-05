import React, { useState, useEffect } from "react";
import type { DetectedLink } from "../../types";
import { isEnabled, setEnabled } from "../../lib/storage";
import {
  checkBackendHealth,
  fetchUserStatus,
  registerUser,
  getUpgradeUrl,
  getBillingPortalUrl,
  type UserStatus,
} from "../../lib/api";

const SITE_URL = "https://plain-terms.app";

export default function App() {
  const [links, setLinks] = useState<Omit<DetectedLink, "element">[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [enabled, setEnabledState] = useState(true);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scanning, setScanning] = useState(false);

  const refreshLinks = () => {
    chrome.runtime.sendMessage({ type: "GET_DETECTED_LINKS" }, (response) => {
      if (response) setLinks(response);
      setScanning(false);
    });
  };

  useEffect(() => {
    refreshLinks();
    isEnabled().then(setEnabledState);
    checkBackendHealth().then(setBackendOk);
    registerUser().then(setUserStatus).catch(() => {
      fetchUserStatus().then(setUserStatus).catch(() => {});
    });
  }, []);

  const handleToggle = async () => {
    const next = !enabled;
    setEnabledState(next);
    await setEnabled(next);

    if (!next) {
      setLinks([]);
    } else {
      setScanning(true);
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    try {
      await chrome.tabs.sendMessage(tab.id, { type: "SET_ENABLED", payload: { enabled: next } });
    } catch {
      if (next) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content-scripts/content.js"],
          });
        } catch {
          setScanning(false);
        }
      }
    }

    if (next) {
      setTimeout(refreshLinks, 800);
    }
  };

  const handleAnalyze = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || links.length === 0) return;

    const link = links[0];

    try {
      const response: { text: string; truncated: boolean } = await new Promise(
        (resolve, reject) => {
          chrome.tabs.sendMessage(
            tab.id!,
            { type: "EXTRACT_TEXT", payload: { url: link.url } },
            (res) => (res ? resolve(res) : reject(new Error("No response")))
          );
        }
      );

      await chrome.storage.session.set({
        pendingAnalysis: {
          url: link.url,
          policyText: response.text,
          policyType: link.policyType,
        },
      });
    } catch {
      await chrome.storage.session.set({
        pendingAnalysis: {
          url: link.url,
          policyText: "",
          policyType: link.policyType,
        },
      });
    }

    await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const url = await getUpgradeUrl();
      chrome.tabs.create({ url });
      window.close();
    } catch (err) {
      console.error("Upgrade error:", err);
    } finally {
      setUpgrading(false);
    }
  };

  const handleManage = async () => {
    try {
      const url = await getBillingPortalUrl();
      chrome.tabs.create({ url });
      window.close();
    } catch {
      // No billing account
    }
  };

  const tier = userStatus?.tier ?? "free";
  const tierLabel = tier === "enterprise" ? "Enterprise" : tier === "pro" ? "Pro" : "Free";
  const quickRemaining = userStatus
    ? userStatus.quick_scans_limit_today - userStatus.quick_scans_used_today
    : null;

  const openLink = (url: string) => {
    chrome.tabs.create({ url });
    window.close();
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-w-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => openLink(SITE_URL)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="font-semibold text-sm">PlainTerms</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
          <button
            onClick={handleToggle}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
            }`}
            title={enabled ? "Disable PlainTerms" : "Enable PlainTerms"}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-4" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
          <div className="space-y-1.5">
            <button
              onClick={() => openLink(SITE_URL)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Homepage
            </button>
            <button
              onClick={() => openLink(`${SITE_URL}/blog/`)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
              Blog
            </button>
            <button
              onClick={() => openLink(`${SITE_URL}/privacy/`)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Privacy Policy
            </button>
            <button
              onClick={() => openLink(`${SITE_URL}/privacy/`)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
              </svg>
              Terms of Service
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1.5" />
            <div className="px-2 py-1 text-[10px] text-gray-400">
              v1.0.0 &middot; <a href="mailto:support@plain-terms.app" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">support@plain-terms.app</a>
            </div>
          </div>
        </div>
      )}

      {/* Detected links */}
      <div className={`mb-4 ${!enabled ? "opacity-50" : ""}`}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {!enabled ? "Detection disabled" : scanning ? "Scanning page..." : "Detected on this page"}
        </p>
        {enabled && !scanning && links.length > 0 ? (
          <div className="space-y-1">
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="badge-info">{link.policyType}</span>
                <span className="truncate text-gray-700 dark:text-gray-300">{link.text}</span>
              </div>
            ))}
          </div>
        ) : enabled && !scanning ? (
          <p className="text-xs text-gray-400">No policy links detected</p>
        ) : !enabled ? (
          <p className="text-xs text-gray-400">Toggle on to scan this page</p>
        ) : null}
      </div>

      {/* Actions */}
      <button
        onClick={handleAnalyze}
        disabled={links.length === 0}
        className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-2"
      >
        Analyze Policies ({links.length})
      </button>

      {/* Upgrade / Manage */}
      {tier === "free" && (
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          className="w-full py-1.5 px-3 text-xs font-medium rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-50 transition-colors mb-3"
        >
          {upgrading ? "Loading..." : "Upgrade to Pro — $9.99/mo"}
        </button>
      )}

      {tier === "pro" && userStatus?.has_payment_method && (
        <button
          onClick={handleManage}
          className="w-full py-1.5 px-3 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors mb-3"
        >
          Manage Billing
        </button>
      )}

      {/* Status footer */}
      <div className="text-[10px] text-gray-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              backendOk === true ? "bg-green-500" :
              backendOk === false ? "bg-red-500" : "bg-gray-400 animate-pulse"
            }`} />
            <span>{backendOk === true ? "Connected" : backendOk === false ? "Offline" : "Connecting..."}</span>
          </div>
          <span>{tierLabel}</span>
          {quickRemaining != null && tier !== "enterprise" && (
            <span>{quickRemaining} scans left</span>
          )}
        </div>
        {backendOk === false && (
          <p className="mt-1.5 text-[10px] text-red-400 leading-tight">
            Cannot reach PlainTerms server. Check your internet connection.
          </p>
        )}
      </div>
    </div>
  );
}
