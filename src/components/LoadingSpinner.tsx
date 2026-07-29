import React from "react";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div 
        className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin"
        role="status"
        aria-label="loading"
      />
    </div>
  );
}