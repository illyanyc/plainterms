import React, { useState } from "react";
import type { WatchOut } from "../../../types";

interface Props {
  items: WatchOut[];
  loading: boolean;
}

export function WatchOuts({ items, loading }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="section-card">
      <div className="section-header" onClick={() => setExpanded(!expanded)}>
        <span>Watch Outs {items.length > 0 && `(${items.length})`}</span>
        <span className="text-gray-400">{expanded ? "−" : "+"}</span>
      </div>

      {expanded && (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-xs">
              <span className="text-amber-500 mt-0.5 flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              </span>
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">{item.title}</span>
                {item.snippet && (
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5 italic">"{item.snippet}"</p>
                )}
              </div>
            </div>
          ))}

          {loading && items.length === 0 && (
            <div className="shimmer h-6 w-full rounded" />
          )}

          {!loading && items.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">Nothing to watch out for</p>
          )}
        </div>
      )}
    </div>
  );
}
