import React, { useState } from "react";

interface Props {
  text: string;
  loading: boolean;
}

export function Summary({ text, loading }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="section-card">
      <div className="section-header" onClick={() => setExpanded(!expanded)}>
        <span>Plain English Summary</span>
        <span className="text-gray-400">{expanded ? "−" : "+"}</span>
      </div>

      {expanded && (
        <>
          {loading && !text && (
            <div className="space-y-2">
              <div className="shimmer h-3 w-full" />
              <div className="shimmer h-3 w-5/6" />
              <div className="shimmer h-3 w-4/6" />
            </div>
          )}

          {text && (
            <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              {text}
            </p>
          )}

          {!loading && !text && (
            <p className="text-xs text-gray-400 text-center py-2">No summary available</p>
          )}
        </>
      )}
    </div>
  );
}
