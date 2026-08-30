"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ImageIcon, Loader2, Power, Timer, Trash2 } from "lucide-react";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";
import { fetchMaintenanceMode, saveMaintenanceMode } from "@/lib/maintenance-mode";

const DEFAULT_MESSAGE =
  "We are currently performing scheduled maintenance. Please check back shortly.";
const DEFAULT_COUNTDOWN_MESSAGE =
  "The new iTrustLD experience is almost here. We go live at the time shown below.";
const DEFAULT_COUNTDOWN_EYEBROW = "New system launch";
const DEFAULT_COUNTDOWN_TITLE = "Going live soon";
const DEFAULT_COUNTDOWN_FOOTER = "Please check back when the countdown ends.";

function isoToDatetimeLocal(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export default function MaintenanceModePage() {
  const [loading, setLoading] = useState(true);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [savingCountdown, setSavingCountdown] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [countdownEnabled, setCountdownEnabled] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownReleasesAt, setCountdownReleasesAt] = useState("");
  const [countdownMessage, setCountdownMessage] = useState(DEFAULT_COUNTDOWN_MESSAGE);
  const [countdownEyebrow, setCountdownEyebrow] = useState(DEFAULT_COUNTDOWN_EYEBROW);
  const [countdownTitle, setCountdownTitle] = useState(DEFAULT_COUNTDOWN_TITLE);
  const [countdownFooter, setCountdownFooter] = useState(DEFAULT_COUNTDOWN_FOOTER);
  const [countdownBackgroundUrl, setCountdownBackgroundUrl] = useState("");
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState("");
  const [removeBackground, setRemoveBackground] = useState(false);
  const [fileKey, setFileKey] = useState(0);

  function applySettings(maintenanceMode = {}) {
    const countdown = maintenanceMode.countdown || {};
    setEnabled(Boolean(maintenanceMode.enabled));
    setMessage(maintenanceMode.message || DEFAULT_MESSAGE);
    setUpdatedAt(maintenanceMode.updatedAt || null);
    setCountdownEnabled(Boolean(countdown.enabled));
    setCountdownActive(Boolean(countdown.active));
    setCountdownReleasesAt(isoToDatetimeLocal(countdown.releasesAt));
    setCountdownMessage(countdown.message || DEFAULT_COUNTDOWN_MESSAGE);
    setCountdownEyebrow(countdown.eyebrow || DEFAULT_COUNTDOWN_EYEBROW);
    setCountdownTitle(countdown.title || DEFAULT_COUNTDOWN_TITLE);
    setCountdownFooter(countdown.footer || DEFAULT_COUNTDOWN_FOOTER);
    setCountdownBackgroundUrl(countdown.backgroundUrl || "");
    setBackgroundFile(null);
    setBackgroundPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setRemoveBackground(false);
    setFileKey((key) => key + 1);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMaintenanceMode();
      applySettings(data.maintenanceMode || {});
    } catch (err) {
      setError(err.message || "Failed to load maintenance mode settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle() {
    const nextEnabled = !enabled;
    setSavingMaintenance(true);
    setError("");
    setSuccess("");
    try {
      const data = await saveMaintenanceMode({ enabled: nextEnabled });
      applySettings(data.maintenanceMode || {});
      setSuccess(
        data.maintenanceMode?.enabled
          ? "Maintenance mode is ON. Users will see a blocking popup."
          : "Maintenance mode is OFF. The website is available to users.",
      );
    } catch (err) {
      setError(err.message || "Failed to update maintenance mode.");
    } finally {
      setSavingMaintenance(false);
    }
  }

  async function handleSaveMessage(event) {
    event.preventDefault();
    setSavingMaintenance(true);
    setError("");
    setSuccess("");
    try {
      const data = await saveMaintenanceMode({ message });
      applySettings(data.maintenanceMode || {});
      setSuccess("Maintenance message saved.");
    } catch (err) {
      setError(err.message || "Failed to save maintenance message.");
    } finally {
      setSavingMaintenance(false);
    }
  }

  async function handleToggleCountdown() {
    const nextEnabled = !countdownEnabled;
    if (nextEnabled && !countdownReleasesAt) {
      setError("Set a launch date and time before turning the countdown on.");
      return;
    }
    setSavingCountdown(true);
    setError("");
    setSuccess("");
    try {
      const data = await saveMaintenanceMode({
        countdownEnabled: nextEnabled,
        countdownReleasesAt: countdownReleasesAt || undefined,
      });
      applySettings(data.maintenanceMode || {});
      setSuccess(
        data.maintenanceMode?.countdown?.enabled
          ? "Launch countdown is ON. Users see the countdown until the launch time."
          : "Launch countdown is OFF.",
      );
    } catch (err) {
      setError(err.message || "Failed to update launch countdown.");
    } finally {
      setSavingCountdown(false);
    }
  }

  async function handleSaveCountdown(event) {
    event.preventDefault();
    if (countdownEnabled && !countdownReleasesAt) {
      setError("Set a launch date and time before turning the countdown on.");
      return;
    }
    setSavingCountdown(true);
    setError("");
    setSuccess("");
    try {
      const data = await saveMaintenanceMode(
        {
          countdownEnabled,
          countdownReleasesAt: countdownReleasesAt || null,
          countdownEyebrow,
          countdownTitle,
          countdownMessage,
          countdownFooter,
          removeBackground: removeBackground ? true : undefined,
        },
        backgroundFile,
      );
      applySettings(data.maintenanceMode || {});
      setSuccess("Launch countdown settings saved.");
    } catch (err) {
      setError(err.message || "Failed to save launch countdown.");
    } finally {
      setSavingCountdown(false);
    }
  }

  function handleBackgroundFileChange(event) {
    const file = event.target.files?.[0] || null;
    setBackgroundFile(file);
    setRemoveBackground(false);
    setSuccess("");
    setBackgroundPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : "";
    });
  }

  return (
    <div className="pb-10">
      <Breadcrumb
        items={[
          { label: "Content", href: "/content/maintenance" },
          { label: "Maintenance Mode" },
        ]}
      />

      <div className="admin-fade-up mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Maintenance Mode</h1>
        <p className="mt-1 text-sm text-slate-400">
          Block the public website for maintenance, or show a launch countdown until the new system goes live.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      ) : null}

      {loading ? (
        <div className="admin-card flex items-center gap-2 p-8 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading maintenance settings…
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="admin-card admin-fade-up p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Power className="h-4 w-4 text-admin-teal" />
                    Maintenance Status
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    When enabled, users cannot browse or interact with the website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggle}
                  disabled={savingMaintenance}
                  className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
                    enabled ? "bg-theme-green-action" : "bg-white/15"
                  } disabled:opacity-60`}
                  aria-pressed={enabled}
                  aria-label={enabled ? "Turn maintenance mode off" : "Turn maintenance mode on"}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                      enabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div
                className={`mt-5 rounded-xl border px-4 py-3 ${
                  enabled
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-emerald-500/30 bg-emerald-500/10"
                }`}
              >
                <p className={`text-sm font-semibold ${enabled ? "text-amber-200" : "text-emerald-200"}`}>
                  {enabled ? "Maintenance mode is ON" : "Maintenance mode is OFF"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {enabled
                    ? "Visitors see a blocking popup and cannot use the site."
                    : "The website is available to all users."}
                </p>
                {updatedAt ? (
                  <p className="mt-2 text-[11px] text-slate-500">Last updated: {updatedAt}</p>
                ) : null}
              </div>
            </section>

            <section className="admin-card admin-fade-up admin-fade-up-delay-1 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                User Message
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Shown inside the popup when maintenance mode is enabled.
              </p>

              <form onSubmit={handleSaveMessage} className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-300">Message</span>
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setSuccess("");
                    }}
                    rows={5}
                    maxLength={500}
                    className={`${inputCls} min-h-[120px] resize-y`}
                    placeholder={DEFAULT_MESSAGE}
                  />
                  <span className="mt-1 block text-right text-[11px] text-slate-500">
                    {message.length}/500
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={savingMaintenance}
                  className="flex items-center justify-center gap-2 rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {savingMaintenance ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Message
                </button>
              </form>
            </section>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="admin-card admin-fade-up p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Timer className="h-4 w-4 text-admin-teal" />
                    Launch Countdown
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Show a full-page countdown until the new system is released. The timer runs in the
                    browser — it does not keep calling the API.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleCountdown}
                  disabled={savingCountdown}
                  className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
                    countdownEnabled ? "bg-theme-green-action" : "bg-white/15"
                  } disabled:opacity-60`}
                  aria-pressed={countdownEnabled}
                  aria-label={countdownEnabled ? "Turn launch countdown off" : "Turn launch countdown on"}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                      countdownEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div
                className={`mt-5 rounded-xl border px-4 py-3 ${
                  countdownEnabled
                    ? countdownActive
                      ? "border-sky-500/30 bg-sky-500/10"
                      : "border-slate-500/30 bg-white/5"
                    : "border-emerald-500/30 bg-emerald-500/10"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    countdownEnabled
                      ? countdownActive
                        ? "text-sky-200"
                        : "text-slate-200"
                      : "text-emerald-200"
                  }`}
                >
                  {countdownEnabled
                    ? countdownActive
                      ? "Countdown is ON and waiting for launch"
                      : "Countdown is ON, but the launch time has passed"
                    : "Launch countdown is OFF"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {enabled
                    ? "Maintenance mode is currently ON, so users will see the maintenance popup instead of the countdown."
                    : countdownEnabled
                      ? "Visitors see the countdown page until the launch time. After that the site opens automatically."
                      : "Users can browse the website as usual."}
                </p>
              </div>
            </section>

            <section className="admin-card admin-fade-up admin-fade-up-delay-1 p-5">
              <h2 className="text-sm font-semibold text-slate-100">Countdown details</h2>
              <p className="mt-1 text-sm text-slate-400">
                Set when the new system goes live. Time is Sri Lanka time (Asia/Colombo).
              </p>

              <form onSubmit={handleSaveCountdown} className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-300">Launch date & time</span>
                  <input
                    type="datetime-local"
                    value={countdownReleasesAt}
                    onChange={(e) => {
                      setCountdownReleasesAt(e.target.value);
                      setSuccess("");
                    }}
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-300">Eyebrow</span>
                  <input
                    type="text"
                    value={countdownEyebrow}
                    onChange={(e) => {
                      setCountdownEyebrow(e.target.value);
                      setSuccess("");
                    }}
                    maxLength={80}
                    className={inputCls}
                    placeholder={DEFAULT_COUNTDOWN_EYEBROW}
                  />
                  <span className="mt-1 block text-right text-[11px] text-slate-500">
                    {countdownEyebrow.length}/80
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-300">Title</span>
                  <input
                    type="text"
                    value={countdownTitle}
                    onChange={(e) => {
                      setCountdownTitle(e.target.value);
                      setSuccess("");
                    }}
                    maxLength={120}
                    className={inputCls}
                    placeholder={DEFAULT_COUNTDOWN_TITLE}
                  />
                  <span className="mt-1 block text-right text-[11px] text-slate-500">
                    {countdownTitle.length}/120
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-300">Countdown message</span>
                  <textarea
                    value={countdownMessage}
                    onChange={(e) => {
                      setCountdownMessage(e.target.value);
                      setSuccess("");
                    }}
                    rows={4}
                    maxLength={500}
                    className={`${inputCls} min-h-[96px] resize-y`}
                    placeholder={DEFAULT_COUNTDOWN_MESSAGE}
                  />
                  <span className="mt-1 block text-right text-[11px] text-slate-500">
                    {countdownMessage.length}/500
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-300">Footer</span>
                  <input
                    type="text"
                    value={countdownFooter}
                    onChange={(e) => {
                      setCountdownFooter(e.target.value);
                      setSuccess("");
                    }}
                    maxLength={200}
                    className={inputCls}
                    placeholder={DEFAULT_COUNTDOWN_FOOTER}
                  />
                  <span className="mt-1 block text-right text-[11px] text-slate-500">
                    {countdownFooter.length}/200
                  </span>
                </label>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-slate-300">Background image</span>
                  {(backgroundPreview || (countdownBackgroundUrl && !removeBackground)) ? (
                    <div className="mb-3 overflow-hidden rounded-xl border border-white/10">
                      <img
                        src={backgroundPreview || countdownBackgroundUrl}
                        alt="Countdown background preview"
                        className="h-36 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 flex h-24 items-center justify-center rounded-xl border border-dashed border-white/15 text-slate-500">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      <span className="text-xs">No background uploaded</span>
                    </div>
                  )}
                  <input
                    key={fileKey}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleBackgroundFileChange}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/15"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">JPG, PNG, WEBP, or GIF. Max 8MB.</p>
                  {countdownBackgroundUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveBackground(true);
                        setBackgroundFile(null);
                        setBackgroundPreview("");
                        setFileKey((key) => key + 1);
                        setSuccess("");
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-300 hover:text-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove background
                    </button>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={savingCountdown}
                  className="flex items-center justify-center gap-2 rounded-xl bg-admin-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {savingCountdown ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Countdown
                </button>
              </form>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
