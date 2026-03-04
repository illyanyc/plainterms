import React, { useState } from "react";
import type { RedFlag } from "../../../types";

interface Props {
  flags: RedFlag[];
  loading: boolean;
}

export function RedFlagList({ flags, loading }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [expandedFlags, setExpandedFlags] = useState<Set<number>>(new Set());

  const toggleFlag = (id: number) => {
    setExpandedFlags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const severityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <span className="badge-critical">CRITICAL</span>;
      case "warning":
        return <span className="badge-warning">WARNING</span>;
      default:
        return <span className="badge-info">INFO</span>;
    }
  };

  return (
    <div className="section-card">
      <div className="section-header" onClick={() => setExpanded(!expanded)}>
        <span>Red Flags {flags.length > 0 && `(${flags.length})`}</span>
        <span className="text-gray-400">{expanded ? "−" : "+"}</span>
      </div>

      {expanded && (
        <div className="space-y-2">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="rounded border border-gray-100 dark:border-gray-800 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              onClick={() => toggleFlag(flag.id)}
            >
              <div className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5 flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {severityBadge(flag.severity)}
                    <span className="text-xs font-medium truncate">{flag.title}</span>
                  </div>

                  {expandedFlags.has(flag.id) && (
                    <div className="mt-2 space-y-1.5 text-xs">
                      <p className="text-gray-600 dark:text-gray-400 italic border-l-2 border-gray-300 dark:border-gray-700 pl-2">
                        "{flag.snippet}"
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Why:</strong> {flag.why}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Do:</strong> {flag.action}
                      </p>
                      <p className="text-gray-400 text-[10px]">
                        {flag.sectionRef} · {flag.confidence} confidence
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && flags.length === 0 && (
            <div className="space-y-2">
              <div className="shimmer h-10 w-full rounded" />
              <div className="shimmer h-10 w-full rounded" />
            </div>
          )}

          {!loading && flags.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No red flags found</p>
          )}
        </div>
      )}
    </div>
  );
}
