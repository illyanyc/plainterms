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

export default function App() {
  const [links, setLinks] = useState<Omit<DetectedLink, "element">[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [enabled, setEnabledState] = useState(true);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_DETECTED_LINKS" }, (response) => {
      if (response) setLinks(response);
    });

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
  };

  const handleAnalyze = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
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

  return (
    <div className="p-4 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="font-semibold text-sm">PlainTerms</span>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-4" : ""
            }`}
          />
        </button>
      </div>

      {/* Detected links */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Detected on this page
        </p>
        {links.length > 0 ? (
          <div className="space-y-1">
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="badge-info">{link.policyType}</span>
                <span className="truncate text-gray-700 dark:text-gray-300">{link.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No policy links detected</p>
        )}
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
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${
            backendOk === true ? "bg-green-500" :
            backendOk === false ? "bg-red-500" : "bg-gray-400"
          }`} />
          <span>{backendOk === true ? "Connected" : backendOk === false ? "Offline" : "..."}</span>
        </div>
        <span>{tierLabel}</span>
        {quickRemaining != null && tier !== "enterprise" && (
          <span>{quickRemaining} scans left</span>
        )}
      </div>
    </div>
  );
}
