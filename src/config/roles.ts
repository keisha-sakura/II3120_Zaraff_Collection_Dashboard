export const roles = [
  "owner",
  "admin",
  "penyortir",
  "live-host",
  "packing",
] as const;
export type Role = (typeof roles)[number];
export const roleLabels: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  penyortir: "Penyortir",
  "live-host": "Live Host",
  packing: "Tim Packing",
};
export const managementRoles = [
  "owner",
  "admin",
] as const satisfies readonly Role[];
export const warehouseRoles = [...managementRoles, "penyortir"] as const;
export const packingRoles = [...managementRoles, "packing"] as const;
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.some((role) => role === value);
}
export const notificationRoles = [
  ...managementRoles,
  "penyortir",
  "packing",
] as const;
