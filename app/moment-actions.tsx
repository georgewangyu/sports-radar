"use client";

import { useState } from "react";
import type { SportsMoment } from "@/lib/sports";

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      <rect height="12" rx="2" width="12" x="8" y="8" />
      <path d="M4 16.2V5.8C4 4.8 4.8 4 5.8 4h10.4" />
    </svg>
  );
}

export function MomentCopyButton({ moment }: { moment: SportsMoment }) {
  const [copied, setCopied] = useState(false);

  async function copyMoment() {
    await navigator.clipboard.writeText(
      `${moment.title}\n\n${moment.summary}\n\nWhy it works: ${moment.whyFunny}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button className="icon-button" onClick={copyMoment} type="button">
      <CopyIcon />
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
