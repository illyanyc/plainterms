import React, { useState } from "react";
import type { Pro } from "../../../types";

interface Props {
  pros: Pro[];
  loading: boolean;
}

export function ProsList({ pros, loading }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="section-card">
      <div className="section-header" onClick={() => setExpanded(!expanded)}>
        <span>Pros {pros.length > 0 && `(${pros.length})`}</span>
        <span className="text-gray-400">{expanded ? "−" : "+"}</span>
      </div>

      {expanded && (
        <div className="space-y-1.5">
          {pros.map((pro) => (
            <div key={pro.id} className="flex items-start gap-2 text-xs">
              <span className="text-green-500 mt-0.5 flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </span>
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">{pro.title}</span>
                {pro.snippet && (
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5 italic">"{pro.snippet}"</p>
                )}
              </div>
            </div>
          ))}

          {loading && pros.length === 0 && (
            <div className="shimmer h-6 w-full rounded" />
          )}

          {!loading && pros.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No user-friendly clauses found</p>
          )}
        </div>
      )}
    </div>
  );
}
