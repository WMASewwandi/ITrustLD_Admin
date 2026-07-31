"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  fetchUserCountDisplay,
  formatCount,
  saveUserCountBase,
} from "@/lib/user-count-display";

export default function UserCountDisplayPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [baseCount, setBaseCount] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchUserCountDisplay();
      const userCount = data.userCount || {};
      setBaseCount(Number(userCount.baseCount) || 0);
      setLiveCount(Number(userCount.liveCount) || 0);
      setDisplayedCount(Number(userCount.displayedCount) || 0);
    } catch (err) {
      setError(err.message || "Failed to load user count settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const data = await saveUserCountBase(baseCount);
      const userCount = data.userCount || {};
      setBaseCount(Number(userCount.baseCount) || 0);
      setLiveCount(Number(userCount.liveCount) || 0);
      setDisplayedCount(Number(userCount.displayedCount) || 0);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Failed to save base count.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="admin-card mt-5 flex max-w-xl items-center gap-2 p-5 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading user count settings…
      </section>
    );
  }

  return (
    <section className="admin-card mt-5 max-w-xl p-5">
      <h2 className="text-lg font-semibold text-white">Dynamic User Count Display</h2>
      <p className="mt-1 text-sm text-slate-400">
        Set the initial public user count. Active registrations increase it automatically; bans decrease it.
      </p>

      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}

      <label className="mt-4 block text-sm text-slate-400">
        Initial / base count
        <input
          type="number"
          min={0}
          value={baseCount}
          onChange={(e) => {
            setBaseCount(Number(e.target.value) || 0);
            setSaved(false);
          }}
          className="admin-input mt-1"
        />
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white/5 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Live additions</p>
          <p className="mt-1 text-2xl font-bold text-white">+{formatCount(liveCount)}</p>
          <p className="mt-1 text-xs text-slate-500">Active account holders in the database</p>
        </div>
        <div className="rounded-xl bg-white/5 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Displayed count</p>
          <p className="mt-1 text-2xl font-bold text-teal-300">{formatCount(displayedCount)}</p>
          <p className="mt-1 text-xs text-slate-500">Shown on the public homepage</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={load}
          disabled={saving}
          className="admin-btn-secondary"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="admin-btn-primary"
        >
          {saving ? "Saving…" : "Save base count"}
        </button>
      </div>

      {saved ? <p className="mt-3 text-sm text-theme-green-action">Base count saved.</p> : null}
    </section>
  );
}
