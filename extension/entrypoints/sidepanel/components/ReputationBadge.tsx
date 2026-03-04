import React from "react";
import type { ReputationBadge as ReputationType } from "../../../types";

interface Props {
  reputation: ReputationType;
}

export function ReputationBadge({ reputation }: Props) {
  const hasTrustpilot = reputation.trustpilot != null;
  const hasBBB = reputation.bbb != null;

  if (!hasTrustpilot && !hasBBB) return null;

  return (
    <div className="section-card">
      <div className="section-header">
        <span>Reputation Snapshot</span>
      </div>

      <div className="flex gap-3">
        {hasTrustpilot && reputation.trustpilot && (
          <div className="flex-1 rounded bg-gray-50 dark:bg-gray-900 p-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Trustpilot</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {reputation.trustpilot.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">/ 5</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {reputation.trustpilot.reviewCount.toLocaleString()} reviews
            </p>
          </div>
        )}

        {hasBBB && reputation.bbb && (
          <div className="flex-1 rounded bg-gray-50 dark:bg-gray-900 p-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">BBB</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {reputation.bbb.rating}
              </span>
              {reputation.bbb.accredited && (
                <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                  Accredited
                </span>
              )}
            </div>
            {reputation.bbb.complaintCount != null && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                {reputation.bbb.complaintCount} complaints
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
