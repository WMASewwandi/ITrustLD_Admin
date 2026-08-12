"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertTriangle, Info, X } from "lucide-react";

const AppDialogContext = createContext(null);

export function AppDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const close = useCallback((result) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    resolve?.(result);
  }, []);

  const openDialog = useCallback((next) => {
    return new Promise((resolve) => {
      if (resolverRef.current) {
        resolverRef.current(next.mode === "confirm" ? false : undefined);
      }
      resolverRef.current = resolve;
      setDialog(next);
    });
  }, []);

  const alert = useCallback(
    (message, options = {}) =>
      openDialog({
        mode: "alert",
        title: options.title || "Notice",
        message: String(message || ""),
        confirmLabel: options.confirmLabel || "OK",
        tone: options.tone || "info",
      }),
    [openDialog],
  );

  const confirm = useCallback(
    (message, options = {}) =>
      openDialog({
        mode: "confirm",
        title: options.title || "Please confirm",
        message: String(message || ""),
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        tone: options.tone || "danger",
      }),
    [openDialog],
  );

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      {dialog ? (
        <div
          className="admin-modal-overlay z-[120]"
          onClick={() => close(dialog.mode === "confirm" ? false : undefined)}
          role="presentation"
        >
          <div
            className="admin-card w-full max-w-md p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-app-dialog-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    dialog.tone === "danger"
                      ? "bg-rose-500/15 text-rose-400"
                      : "bg-theme-green-action/15 text-theme-green-action"
                  }`}
                >
                  {dialog.tone === "danger" ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <Info className="h-5 w-5" />
                  )}
                </span>
                <div>
                  <h3 id="admin-app-dialog-title" className="text-lg font-semibold text-white">
                    {dialog.title}
                  </h3>
                  {dialog.message ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">{dialog.message}</p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => close(dialog.mode === "confirm" ? false : undefined)}
                className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              {dialog.mode === "confirm" ? (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="admin-btn-secondary px-4 py-2 text-sm"
                >
                  {dialog.cancelLabel}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => close(dialog.mode === "confirm" ? true : undefined)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 ${
                  dialog.tone === "danger" && dialog.mode === "confirm"
                    ? "bg-[#E11D48]"
                    : "bg-theme-green-action"
                }`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error("useAppDialog must be used within AppDialogProvider");
  }
  return ctx;
}
