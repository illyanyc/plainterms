import React from "react";

interface Props {
  status: "analyzing" | "done";
  processingTimeMs: number;
}

export function StatusBar({ status, processingTimeMs }: Props) {
  if (status === "analyzing") {
    return (
      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Analyzing policy...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      <span>
        Analysis complete
        {processingTimeMs > 0 && ` · ${(processingTimeMs / 1000).toFixed(1)}s`}
      </span>
    </div>
  );
}
