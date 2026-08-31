"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard, normalizeCopyText } from "@/lib/clipboard";

export function CopyButton({ value, title = "Copy", className = "" }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const text = normalizeCopyText(value);

  async function copy(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!text) return;
    try {
      await copyTextToClipboard(text);
      setFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
      setFailed(true);
      window.setTimeout(() => setFailed(false), 1600);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!text}
      className={`shrink-0 rounded p-0.5 text-slate-500 transition hover:bg-white/10 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      title={failed ? "Copy failed — try HTTPS or select text manually" : copied ? "Copied" : title}
      aria-label={failed ? "Copy failed" : copied ? "Copied" : title}
    >
      {copied ? (
        <Check className="h-3 w-3 text-theme-green-action" />
      ) : (
        <Copy className={`h-3 w-3 ${failed ? "text-rose-400" : ""}`} />
      )}
    </button>
  );
}

export default function CopyCell({ value, sub, nowrap = false }) {
  const wrapClass = nowrap
    ? "whitespace-nowrap"
    : "break-words [overflow-wrap:anywhere]";
  return (
    <div className={`flex items-start gap-1.5 ${nowrap ? "w-max max-w-none" : "w-full min-w-0 max-w-full"}`}>
      <div className={nowrap ? "shrink-0" : "min-w-0 flex-1"}>
        <p className={`${wrapClass} font-medium text-slate-100`}>{value}</p>
        {sub ? <p className={`${wrapClass} text-[11px] text-slate-500`}>{sub}</p> : null}
      </div>
      <CopyButton value={value} className="mt-0.5 shrink-0" />
    </div>
  );
}

export function IdNameCell({ id, name, nowrap = false }) {
  return (
    <div className={nowrap ? "w-max space-y-0.5" : "min-w-0 space-y-0.5"}>
      <CopyCell value={id || "—"} nowrap={nowrap} />
      {name ? <CopyCell value={name} nowrap={nowrap} /> : null}
    </div>
  );
}

export function PlatformIdCell({ platform, platformId, platformName, platformDetail, method }) {
  const normalizedMethod = String(method || "").trim().toUpperCase();
  const isBankLike = normalizedMethod === "BANK TRANSFER" || normalizedMethod === "CARD PAYMENT";
  const lines = [];

  if (isBankLike) {
    if (platform && platform !== "—") lines.push(platform);
    if (platformId && platformId !== "—") lines.push(platformId);
    if (platformName) {
      lines.push(platformName);
    } else if (platformDetail) {
      const separator = platformDetail.includes(" · ") ? " · " : platformDetail.includes(" - ") ? " - " : null;
      if (separator) {
        const parts = platformDetail.split(separator).map((part) => part.trim()).filter(Boolean);
        const namePart = parts.find((part) => part !== platformId && part !== platform);
        if (namePart) lines.push(namePart);
      }
    }
  } else if (platformId && platformId !== "—") {
    lines.push(platformId);
  } else if (platformDetail && platformDetail !== "—") {
    if (platformDetail.includes(" · ")) {
      lines.push(...platformDetail.split(" · ").map((part) => part.trim()).filter(Boolean));
    } else if (platformDetail.includes(" - ")) {
      lines.push(...platformDetail.split(" - ").map((part) => part.trim()).filter(Boolean));
    } else {
      lines.push(platformDetail);
    }
  } else if (platform && platform !== "—") {
    lines.push(platform);
  }

  if (lines.length === 0) lines.push("—");

  return (
    <div className="min-w-0 space-y-0.5">
      {lines.map((line, index) => (
        <CopyCell key={`${line}-${index}`} value={line} />
      ))}
    </div>
  );
}

export function statusToneClass(status) {
  const s = String(status || "");
  if (s.includes("Pending")) return "bg-amber-500 text-white";
  if (s === "Completed" || s === "Claimed") return "bg-theme-green-action text-white";
  if (s === "Rejected") return "bg-admin-danger text-white";
  return "bg-white/10 text-white";
}

export function statusHeaderToneClass(status) {
  const s = String(status || "");
  if (s.includes("Pending")) return "bg-amber-500/50 text-white";
  if (s === "Completed" || s === "Claimed") return "bg-theme-green-action/50 text-white";
  if (s === "Rejected") return "bg-admin-danger/50 text-white";
  return "bg-white/10 text-white";
}

export function StatusPill({ status, onClick, title }) {
  const tone = statusToneClass(status);
  const cls = `inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title || "View details"}
        className={`${cls} transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/30`}
      >
        {status}
      </button>
    );
  }
  return <span className={cls}>{status}</span>;
}

export function FilterField({ label, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-admin-chrome-deep px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-admin-teal/50 focus:ring-2 focus:ring-admin-teal/20";

export function FormError({ message, className = "" }) {
  if (!message) return null;
  return (
    <div className={`rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ${className}`}>
      {message}
    </div>
  );
}
