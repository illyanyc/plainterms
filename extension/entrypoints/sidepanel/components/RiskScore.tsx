import React from "react";
import type { RiskScore as RiskScoreType } from "../../../types";

interface Props {
  riskScore: RiskScoreType | null;
  loading: boolean;
}

export function RiskScore({ riskScore, loading }: Props) {
  if (loading && !riskScore) {
    return (
      <div className="section-card">
        <div className="section-header">Risk Score</div>
        <div className="shimmer h-4 w-3/4 mb-2" />
        <div className="shimmer h-3 w-full" />
      </div>
    );
  }

  if (!riskScore) return null;

  const percentage = (riskScore.score / riskScore.max) * 100;
  const colorClass =
    riskScore.level === "high"
      ? "bg-red-500"
      : riskScore.level === "medium"
        ? "bg-amber-500"
        : "bg-green-500";
  const textColor =
    riskScore.level === "high"
      ? "text-red-600 dark:text-red-400"
      : riskScore.level === "medium"
        ? "text-amber-600 dark:text-amber-400"
        : "text-green-600 dark:text-green-400";
  const label = riskScore.level.toUpperCase() + " RISK";

  return (
    <div className="section-card">
      <div className="section-header">Risk Score</div>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-lg font-bold tabular-nums ${textColor}`}>
          {riskScore.score}
        </span>
        <span className="text-xs text-gray-400">/ {riskScore.max}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold ${textColor}`}>{label}</span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {riskScore.explanation}
      </p>
    </div>
  );
}
