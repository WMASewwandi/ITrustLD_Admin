"use client";

import { useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/admin/breadcrumb";
import { inputCls } from "@/components/admin/queue-ui";

const ROLES = [
  "Sub Admin",
  "Deposit Executive",
  "Withdrawal Executive",
  "Withdrawal Authorizer",
  "Super Admin",
];

const SHIFTS = ["Shift A", "Shift B"];

function FieldLabel({ children, required }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-slate-300">
      {children}
      {required ? <span className="ml-0.5 text-admin-danger">*</span> : null}
    </span>
  );
}

export default function NewSystemUserPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Sub Admin",
    shift: "",
  });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "System & Scammer", href: "/system/users" },
          { label: "System Users", href: "/system/users" },
          { label: "Create System User" },
        ]}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
        }}
        className="admin-card admin-fade-up mx-auto max-w-4xl p-6 sm:p-8"
      >
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-white">Create System User</h1>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block min-w-0">
            <FieldLabel required>Name</FieldLabel>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Enter Name"
              className={inputCls}
            />
          </label>

          <label className="block min-w-0">
            <FieldLabel required>Email</FieldLabel>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="Enter Email"
              className={inputCls}
            />
          </label>

          <label className="block min-w-0">
            <FieldLabel required>Password</FieldLabel>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Enter password"
              className={inputCls}
            />
          </label>

          <label className="block min-w-0">
            <FieldLabel required>Role</FieldLabel>
            <select
              required
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className={inputCls}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0 sm:col-span-1">
            <FieldLabel>Shift</FieldLabel>
            <select
              value={form.shift}
              onChange={(e) => update("shift", e.target.value)}
              className={inputCls}
            >
              <option value="">Select Shift</option>
              {SHIFTS.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <Link href="/system/users" className="admin-btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-xl bg-theme-green-action px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            Create User
          </button>
        </div>

        {saved ? (
          <p className="mt-4 text-right text-sm font-medium text-theme-green-action">
            User created (frontend demo).
          </p>
        ) : null}
      </form>
    </div>
  );
}
