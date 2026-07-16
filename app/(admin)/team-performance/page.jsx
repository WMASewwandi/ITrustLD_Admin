"use client";

import Breadcrumb from "@/components/admin/breadcrumb";
import { SYSTEM_USERS } from "@/lib/mock-data";

export default function TeamPerformancePage() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Team Performance" }]} />
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Team Performance</h1>
      <p className="mb-6 text-sm text-slate-500">Super Admin view — aggregate metrics & leaderboard</p>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Team Transactions", "1,842"],
          ["Avg Success Rate", "91.8%"],
          ["Total Commission", "$18.4K"],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Leaderboard — Top performers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Admin</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Handled</th>
                <th className="px-3 py-2">Success</th>
                <th className="px-3 py-2">Commission</th>
              </tr>
            </thead>
            <tbody>
              {SYSTEM_USERS.map((u, i) => (
                <tr key={u.id} className="border-t border-slate-200 text-slate-700">
                  <td className="px-3 py-3 text-admin-teal">{i + 1}</td>
                  <td className="px-3 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-3 py-3">{u.role}</td>
                  <td className="px-3 py-3">{140 - i * 20}</td>
                  <td className="px-3 py-3">{96 - i * 2}%</td>
                  <td className="px-3 py-3">${1200 - i * 180}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
