"use client";

import { Loader2, Mail, MessageSquare, X } from "lucide-react";
import { inputCls } from "@/components/admin/queue-ui";

export function EmailSendModal({ open, receivers, subject, body, attachment, saving, error, onChange, onClose, onSend }) {
  if (!open) return null;
  return (
    <div className="admin-modal-overlay z-[80]" onClick={onClose}>
      <div className="admin-card w-full max-w-lg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Send Email</h3>
            <p className="mt-1 text-sm text-slate-400">Compose a message to selected customer(s).</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <label className="mb-3 block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">To</span>
          <input value={receivers} onChange={(e) => onChange({ receivers: e.target.value })} className={inputCls} />
        </label>
        <label className="mb-3 block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Subject</span>
          <input value={subject} onChange={(e) => onChange({ subject: e.target.value })} className={inputCls} />
        </label>
        <label className="mb-3 block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Attachment</span>
          <input
            type="file"
            onChange={(e) => onChange({ attachment: e.target.files?.[0] || null })}
            className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white"
          />
        </label>
        <label className="mb-3 block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Message</span>
          <textarea value={body} onChange={(e) => onChange({ body: e.target.value })} rows={5} className={`${inputCls} resize-y`} />
        </label>
        {error ? <p className="mb-3 text-xs text-rose-300">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="admin-btn-secondary" disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export function SmsSendModal({ open, receivers, message, saving, error, onChange, onClose, onSend }) {
  if (!open) return null;
  return (
    <div className="admin-modal-overlay z-[80]" onClick={onClose}>
      <div className="admin-card w-full max-w-lg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Send SMS</h3>
            <p className="mt-1 text-sm text-slate-400">Comma-separated mobile numbers.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <label className="mb-3 block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">To</span>
          <input value={receivers} onChange={(e) => onChange({ receivers: e.target.value })} className={inputCls} />
        </label>
        <label className="mb-3 block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Message</span>
          <textarea value={message} onChange={(e) => onChange({ message: e.target.value })} rows={4} className={`${inputCls} resize-y`} />
        </label>
        {error ? <p className="mb-3 text-xs text-rose-300">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="admin-btn-secondary" disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
