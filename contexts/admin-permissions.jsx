"use client";

import { createContext, useContext } from "react";
import { hasPermission } from "@/lib/permissions";

const AdminPermissionsContext = createContext([]);

export function AdminPermissionsProvider({ permissions = [], children }) {
  return (
    <AdminPermissionsContext.Provider value={permissions}>
      {children}
    </AdminPermissionsContext.Provider>
  );
}

export function useAdminPermissions() {
  return useContext(AdminPermissionsContext);
}

export function useCan(required) {
  const permissions = useAdminPermissions();
  return hasPermission(permissions, required);
}
