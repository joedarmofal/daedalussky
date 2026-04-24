/** Organization-scoped admin capabilities (Firebase `member_role` enum is lowercase). */
export function isOrgAdminRole(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}
