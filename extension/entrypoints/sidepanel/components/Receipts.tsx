import React, { useState } from "react";
import type { Receipt } from "../../../types";

interface Props {
  receipts: Receipt[];
  loading: boolean;
}

export function Receipts({ receipts, loading }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="section-card">
      <div className="section-header" onClick={() => setExpanded(!expanded)}>
        <span>Receipts {receipts.length > 0 && `(${receipts.length})`}</span>
        <span className="text-gray-400">{expanded ? "−" : "+"}</span>
      </div>

      {expanded && (
        <div className="space-y-2">
          {receipts.map((receipt, i) => (
            <div key={i} className="border-l-2 border-blue-400 dark:border-blue-600 pl-2">
              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
                {receipt.section}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-0.5">
                "{receipt.quote}"
              </p>
            </div>
          ))}

          {loading && receipts.length === 0 && (
            <div className="shimmer h-8 w-full rounded" />
          )}

          {!loading && receipts.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No receipts available</p>
          )}
        </div>
      )}
    </div>
  );
}
