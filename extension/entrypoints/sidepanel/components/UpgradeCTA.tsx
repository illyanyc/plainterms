import React, { useState } from "react";
import { getUpgradeUrl } from "../../../lib/api";

export function UpgradeCTA() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const url = await getUpgradeUrl();
      chrome.tabs.create({ url });
    } catch (err) {
      console.error("Upgrade error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4">
      <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
        Want the full report?
      </p>
      <p className="text-[11px] text-blue-600 dark:text-blue-400 mb-3 leading-relaxed">
        Upgrade to Pro for detailed "why it matters" explanations, reputation deep
        dives, business model warnings, policy change tracking, and 20 quick scans
        per day + 50 deep scans per month.
      </p>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Loading..." : "Upgrade to Pro — $9.99/month"}
      </button>
    </div>
  );
}
