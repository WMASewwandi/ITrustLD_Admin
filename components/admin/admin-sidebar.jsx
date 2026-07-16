"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Award,
  ChevronDown,
  Crown,
  Gift,
  LayoutDashboard,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Percent,
  Settings2,
  ShieldAlert,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import { SIDEBAR_NAV } from "@/lib/mock-data";

const ICONS = {
  LayoutDashboard,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  Award,
  Ticket,
  Crown,
  ShieldAlert,
  UserCog,
  Settings2,
  Percent,
  Newspaper,
};

function pathMatches(pathname, search, href) {
  if (!href) return false;
  const [path, query = ""] = href.split("?");
  if (pathname !== path) return false;
  if (!query) return true;
  const want = new URLSearchParams(query);
  for (const [k, v] of want.entries()) {
    if ((search.get(k) || "") !== v) return false;
  }
  return true;
}

function itemActive(pathname, search, item) {
  if (item.items?.length) {
    return item.items.some((child) => itemActive(pathname, search, child));
  }
  return pathMatches(pathname, search, item.href);
}

function sectionActive(pathname, search, section) {
  if (section.href) {
    const [path] = section.href.split("?");
    return pathname === path || pathname.startsWith(`${path}/`);
  }
  return section.items?.some((item) => itemActive(pathname, search, item));
}

/** IDs for the active section and any nested expandable parents (only the active branch). */
function activeOpenIds(pathname, search) {
  const ids = [];
  for (const section of SIDEBAR_NAV) {
    if (!section.items?.length) continue;
    let sectionHit = false;
    for (const item of section.items) {
      if (item.items?.length && itemActive(pathname, search, item)) {
        ids.push(item.id || item.label);
        sectionHit = true;
      } else if (item.href && pathMatches(pathname, search, item.href)) {
        sectionHit = true;
      }
    }
    if (sectionHit) ids.push(section.id);
  }
  return ids;
}

function SidebarInner({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [openIds, setOpenIds] = useState([]);

  useEffect(() => {
    const ids = activeOpenIds(pathname, search);
    // Only auto-expand the active branch; leave menus collapsed on unrelated pages.
    if (!ids.length) return;
    setOpenIds(ids);
  }, [pathname, search]);

  function toggle(id) {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function renderNavItems(items, { depth = 0 } = {}) {
    return items.map((item) => {
      const hasChildren = !!item.items?.length;
      const itemId = item.id || item.label;
      const expanded = openIds.includes(itemId);
      const active = itemActive(pathname, search, item);

      if (hasChildren) {
        return (
          <li key={itemId}>
            <button
              type="button"
              onClick={() => toggle(itemId)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                active
                  ? "admin-sidebar-item-active bg-admin-teal/20 font-semibold text-white"
                  : "text-white/80 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <span className="truncate text-left">{item.label}</span>
              <span className="ml-2 flex shrink-0 items-center gap-1.5">
                {item.badge ? (
                  <span className="admin-badge-glow px-1.5 py-0.5 text-[10px]">{item.badge}</span>
                ) : null}
                <ChevronDown className={`h-3.5 w-3.5 text-white/60 transition ${expanded ? "rotate-180" : ""}`} />
              </span>
            </button>
            {expanded ? (
              <ul
                className={`mt-0.5 space-y-0.5 border-l border-white/15 pb-0.5 pl-2.5 ${
                  depth === 0 ? "ml-1" : "ml-2"
                }`}
              >
                {renderNavItems(item.items, { depth: depth + 1 })}
              </ul>
            ) : null}
          </li>
        );
      }

      const linkActive = pathMatches(pathname, search, item.href);
      return (
        <li key={item.href + item.label}>
          <Link
            href={item.href}
            onClick={onCloseMobile}
            className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
              linkActive
                ? "admin-sidebar-item-active bg-admin-teal/30 font-semibold text-white"
                : "text-white/80 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <span className="truncate">{item.label}</span>
            {item.badge ? (
              <span className="admin-badge-glow ml-2 shrink-0 px-1.5 py-0.5 text-[10px]">{item.badge}</span>
            ) : null}
          </Link>
        </li>
      );
    });
  }

  function renderAside({ forceExpanded = false } = {}) {
    const isCollapsed = forceExpanded ? false : collapsed;

    return (
      <aside
        className={`admin-sidebar flex h-full flex-col border-r border-white/15 text-white transition-[width] duration-200 ${
          isCollapsed ? "w-[72px]" : "w-[280px]"
        }`}
      >
        <div
          className={`flex h-[68px] shrink-0 items-center border-b border-white/15 ${
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          {!isCollapsed ? (
            <Link href="/dashboard" className="inline-flex items-center gap-2" onClick={onCloseMobile}>
              <img
                src="/assets/img/logos/logo-itrustld-wide.png"
                alt="iTrustLD"
                className="h-8 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]"
              />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-admin-teal/30 text-teal-100 shadow-[0_0_16px_rgba(45,212,191,0.35)]"
              onClick={onCloseMobile}
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          )}
          {!forceExpanded ? (
            <button
              type="button"
              onClick={onToggle}
              className="hidden rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white lg:inline-flex"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          ) : null}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-3">
          {!isCollapsed ? (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
              Operations
            </p>
          ) : null}

          <ul className="space-y-0.5">
            {SIDEBAR_NAV.map((section) => {
              const Icon = ICONS[section.icon] || LayoutDashboard;
              const active = sectionActive(pathname, search, section);
              const expanded = openIds.includes(section.id);
              const hasChildren = !!section.items?.length;

              if (!hasChildren) {
                return (
                  <li key={section.id}>
                    <Link
                      href={section.href}
                      onClick={onCloseMobile}
                      title={section.label}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "admin-sidebar-link-active bg-admin-chrome-lift text-white"
                          : "text-white/90 hover:bg-white/[0.08] hover:text-white"
                      } ${isCollapsed ? "justify-center px-2" : ""}`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? "text-teal-200" : "text-white/75 group-hover:text-white"
                        }`}
                      />
                      {!isCollapsed ? <span className="truncate">{section.label}</span> : null}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => (isCollapsed ? onToggle?.() : toggle(section.id))}
                    title={section.label}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "admin-sidebar-item-active bg-admin-chrome-lift text-white"
                        : "text-white/90 hover:bg-white/[0.08] hover:text-white"
                    } ${isCollapsed ? "justify-center px-2" : ""}`}
                  >
                    <span className="relative">
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-teal-200" : "text-white/75"}`} />
                      {isCollapsed && section.badge ? (
                        <span className="admin-badge-glow absolute -right-1.5 -top-1.5 h-3.5 min-w-3.5 px-0.5 text-[8px]">
                          {section.badge}
                        </span>
                      ) : null}
                    </span>
                    {!isCollapsed ? (
                      <>
                        <span className="min-w-0 flex-1 truncate text-left">{section.label}</span>
                        {section.badge ? (
                          <span className="admin-badge-glow px-1.5 py-0.5 text-[10px]">{section.badge}</span>
                        ) : null}
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 text-white/60 transition ${expanded ? "rotate-180" : ""}`}
                        />
                      </>
                    ) : null}
                  </button>

                  {!isCollapsed && expanded ? (
                    <ul className="relative ml-4 mt-0.5 space-y-0.5 border-l border-white/20 pl-3 pb-1">
                      {renderNavItems(section.items)}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        {!isCollapsed ? (
          <div className="shrink-0 border-t border-white/15 p-3">
            <div className="rounded-xl border border-white/20 bg-black/35 px-3 py-2.5 backdrop-blur-sm shadow-[0_0_20px_rgba(104,152,255,0.15)]">
              <p className="text-[10px] uppercase tracking-wide text-white/75">Shift</p>
              <p className="mt-0.5 text-sm font-semibold text-white">A · Super Admin</p>
            </div>
          </div>
        ) : null}
      </aside>
    );
  }

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{renderAside()}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-admin-chrome/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={onCloseMobile}
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl">{renderAside({ forceExpanded: true })}</div>
        </div>
      ) : null}
    </>
  );
}

export default function AdminSidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  return (
    <Suspense
      fallback={
        <div className="admin-sidebar fixed inset-y-0 left-0 hidden w-[280px] border-r border-white/15 lg:block" />
      }
    >
      <SidebarInner
        collapsed={collapsed}
        onToggle={onToggle}
        mobileOpen={mobileOpen}
        onCloseMobile={onCloseMobile}
      />
    </Suspense>
  );
}
