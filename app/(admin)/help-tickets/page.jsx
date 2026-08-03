"use client";

import { useCallback, useEffect, useState } from "react";
import Breadcrumb from "@/components/admin/breadcrumb";
import DepositStatusConfirmModal from "@/components/admin/deposit-status-confirm-modal";
import CopyCell, { FilterField, inputCls } from "@/components/admin/queue-ui";
import { useCan } from "@/contexts/admin-permissions";
import {
  fetchHelpTickets,
  markAllHelpTicketsRead,
  markHelpTicketRead,
  notifyAdminNavCountsRefresh,
  replyToHelpTicket,
} from "@/lib/help-tickets";
import { CheckCheck, Eye, Loader2, Mail, Search, X } from "lucide-react";

function buildReplySubject(subject) {
  const value = String(subject || "").trim();
  if (!value) return "Re: Your iTrustLD support request";
  return /^re:/i.test(value) ? value : `Re: ${value}`;
}

export default function HelpTicketsPage() {
  const canReply = useCan("change_help_requests_status");
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [applied, setApplied] = useState({ search: "", email: "", type: "", read: "" });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [viewBusy, setViewBusy] = useState(false);
  const [markAllBusy, setMarkAllBusy] = useState(false);
  const [markAllConfirmOpen, setMarkAllConfirmOpen] = useState(false);
  const [perPage, setPerPage] = useState(10);

  const loadTickets = useCallback(
    async (page = 1) => {
      setLoading(true);
      setPageError("");
      try {
        const data = await fetchHelpTickets({
          search: applied.search,
          email: applied.email,
          type: applied.type,
          read: applied.read,
          page,
          perPage,
        });
        setRows(data.tickets || []);
        setPagination(data.pagination || { page: 1, total_pages: 1, total: 0 });
      } catch (err) {
        setPageError(err.message || "Failed to load help tickets.");
      } finally {
        setLoading(false);
      }
    },
    [applied, perPage],
  );

  useEffect(() => {
    loadTickets(1);
  }, [loadTickets]);

  function runSearch() {
    setApplied({ search, email, type, read: readFilter });
  }

  function updateRowReadState(ticket) {
    setRows((prev) =>
      prev.map((row) => (row.id === ticket.id ? { ...row, isRead: ticket.isRead } : row)),
    );
    setSelected((prev) => (prev?.id === ticket.id ? { ...prev, isRead: ticket.isRead } : prev));
  }

  async function handleViewTicket(row) {
    setViewBusy(true);
    setActionMessage("");
    setReplySubject(buildReplySubject(row.subject));
    setReplyMessage("");
    setSelected(row);

    try {
      if (!row.isRead) {
        const data = await markHelpTicketRead(row.id);
        updateRowReadState(data.ticket);
        notifyAdminNavCountsRefresh();
      }
    } catch (err) {
      setActionMessage(err.message || "Could not mark ticket as read.");
    } finally {
      setViewBusy(false);
    }
  }

  async function handleSendReply() {
    if (!selected) return;
    setReplyBusy(true);
    setActionMessage("");
    try {
      const data = await replyToHelpTicket(selected.id, {
        subject: replySubject.trim(),
        message: replyMessage.trim(),
      });
      updateRowReadState(data.ticket);
      setActionMessage(data.message || "Reply sent successfully.");
      notifyAdminNavCountsRefresh();
    } catch (err) {
      setActionMessage(err.message || "Failed to send reply.");
    } finally {
      setReplyBusy(false);
    }
  }

  function closeModal() {
    setSelected(null);
    setReplyMessage("");
    setReplySubject("");
  }

  async function confirmMarkAllRead() {
    setMarkAllBusy(true);
    setActionMessage("");
    try {
      const data = await markAllHelpTicketsRead();
      setRows((prev) => prev.map((row) => ({ ...row, isRead: true })));
      setActionMessage(data.message || "All help tickets marked as read.");
      notifyAdminNavCountsRefresh();
      await loadTickets(pagination.page);
      setMarkAllConfirmOpen(false);
    } catch (err) {
      setActionMessage(err.message || "Failed to mark all tickets as read.");
    } finally {
      setMarkAllBusy(false);
    }
  }

  const pageSize = Number(pagination.per_page) || perPage;
  const rangeStart =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pageSize + 1;
  const rangeEnd = Math.min(pagination.page * pageSize, pagination.total);

  return (
    <div>
      <Breadcrumb items={[{ label: "Help Tickets" }]} />

      <section className="admin-card admin-fade-up overflow-visible p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Help Tickets</h1>
            <p className="mt-0.5 text-xs text-slate-400">
              {pagination.total || rows.length} support requests from members and guests
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMarkAllConfirmOpen(true)}
            disabled={markAllBusy || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-50"
          >
            {markAllBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all as read
          </button>
        </div>

        <div className="border-b border-white/10 bg-white/5 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            <FilterField label="Search" className="lg:col-span-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, subject, message"
                className={inputCls}
              />
            </FilterField>
            <FilterField label="Email" className="lg:col-span-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className={inputCls}
              />
            </FilterField>
            <FilterField label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                <option value="">All</option>
                <option value="member">Member</option>
                <option value="guest">Guest</option>
              </select>
            </FilterField>
            <FilterField label="Status">
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className={inputCls}
              >
                <option value="">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </FilterField>
            <div className="flex items-end">
              <button
                type="button"
                onClick={runSearch}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-admin-teal px-4 py-2 text-sm font-semibold text-white"
              >
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
            </div>
          </div>
        </div>

        {pageError ? (
          <div className="border-b border-white/10 px-5 py-3 text-sm text-rose-300">{pageError}</div>
        ) : null}
        {actionMessage ? (
          <div className="border-b border-white/10 px-5 py-3 text-sm text-admin-teal">{actionMessage}</div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-left text-[13px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-slate-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t border-white/10 transition hover:bg-admin-teal/[0.05] ${
                      row.isRead ? "text-slate-400" : "text-slate-200"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!row.isRead ? (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-rose-400"
                            aria-label="Unread"
                          />
                        ) : null}
                        <CopyCell value={row.fullName} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CopyCell value={row.email} />
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <CopyCell value={row.subject} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          row.isGuest
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-admin-teal/15 text-admin-teal"
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.submittedAt}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewTicket(row)}
                        disabled={viewBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/5 disabled:opacity-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-slate-400">
                    No Results Found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {pagination.total > 0 || !loading ? (
          <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                Per page
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="rounded-lg border border-white/10 bg-admin-surface px-2 py-1.5 text-xs text-white"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n} className="bg-admin-surface">
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <span>
                Showing {rangeStart} to {rangeEnd} of {pagination.total}
              </span>
            </div>
            {pagination.total_pages > 1 ? (
              <div className="flex items-center gap-3">
                <span>
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => loadTickets(pagination.page - 1)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.total_pages || loading}
                    onClick={() => loadTickets(pagination.page + 1)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0B1020] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-admin-teal">
                  {selected.isRead ? "Read ticket" : "Unread ticket"}
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">{selected.subject}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {selected.fullName} · {selected.email} · {selected.type} · {selected.submittedAt}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{selected.message}</p>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-admin-teal" />
                <p className="text-sm font-semibold text-white">Reply by email</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Subject
                  </label>
                  <input
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Reply message
                  </label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={5}
                    placeholder="Write your reply to the customer..."
                    className={`${inputCls} min-h-[120px] resize-y`}
                  />
                </div>
                {canReply ? (
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={replyBusy || !replySubject.trim() || !replyMessage.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-admin-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {replyBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {replyBusy ? "Sending…" : "Send reply"}
                </button>
                ) : (
                  <p className="text-xs text-slate-500">
                    You need &quot;Change Customer Help Status&quot; permission to reply.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <DepositStatusConfirmModal
        open={markAllConfirmOpen}
        title="Mark all as read?"
        message="This will mark every unread help ticket as read. The unread badge in the top bar will be cleared."
        confirmLabel="Mark all as read"
        confirmClassName="bg-admin-teal"
        busy={markAllBusy}
        onCancel={() => {
          if (!markAllBusy) setMarkAllConfirmOpen(false);
        }}
        onConfirm={confirmMarkAllRead}
      />
    </div>
  );
}
