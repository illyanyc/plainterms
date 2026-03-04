import React, { useState, useEffect } from "react";
import { fetchUserStatus, getUpgradeUrl, getBillingPortalUrl, type UserStatus } from "../../../lib/api";

export function TierBanner() {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchUserStatus().then(setStatus).catch(() => {});
  }, []);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const url = await getUpgradeUrl();
      chrome.tabs.create({ url });
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
    } catch {
      // No billing account yet
    }
  };

  if (!status) return null;

  const tier = status.tier;
  const tierColor =
    tier === "enterprise"
      ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30"
      : tier === "pro"
        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
        : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800";

  const quickRemaining = status.quick_scans_limit_today - status.quick_scans_used_today;

  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tierColor}`}>
        {tier === "enterprise" ? "Enterprise" : tier === "pro" ? "Pro" : "Free"}
      </span>

      {tier !== "enterprise" && (
        <span className="text-[10px] text-gray-400">
          {quickRemaining} scan{quickRemaining !== 1 ? "s" : ""} left
        </span>
      )}

      {tier === "free" && (
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
        >
          {upgrading ? "..." : "Upgrade"}
        </button>
      )}

      {tier === "pro" && status.has_payment_method && (
        <button
          onClick={handleManage}
          className="text-[10px] text-gray-400 hover:underline"
        >
          Manage
        </button>
      )}
    </div>
  );
}
