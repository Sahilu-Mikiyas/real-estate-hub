import type { UserRole } from "@/contexts/AuthContext";

export type ScopeLevel = "own" | "team" | "global";
export type DomainAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "reassign"
  | "approve"
  | "export"
  | "override"
  | "manage_rules"
  | "manage_roles"
  | "manage_system";

export type PermissionRule = {
  domain: string;
  action: DomainAction;
  allowedRoles: UserRole[];
  allowedScope: ScopeLevel[];
  requiresReason?: boolean;
  requiresApprovalChain?: boolean;
  auditLevel: "low" | "medium" | "high";
};

export const permissionRules: PermissionRule[] = [
  { domain: "leads", action: "view", allowedRoles: ["agent", "supervisor", "admin"], allowedScope: ["own", "team", "global"], auditLevel: "low" },
  { domain: "leads", action: "delete", allowedRoles: ["admin"], allowedScope: ["global"], requiresReason: true, auditLevel: "high" },
  { domain: "lead_followups", action: "create", allowedRoles: ["agent", "supervisor", "admin"], allowedScope: ["own", "team", "global"], auditLevel: "medium" },
  { domain: "visits", action: "create", allowedRoles: ["agent", "supervisor", "admin"], allowedScope: ["own", "team", "global"], auditLevel: "medium" },
  { domain: "social_posts", action: "create", allowedRoles: ["agent", "supervisor", "admin"], allowedScope: ["own", "team", "global"], auditLevel: "low" },
  { domain: "closings", action: "approve", allowedRoles: ["supervisor", "admin"], allowedScope: ["team", "global"], requiresReason: true, requiresApprovalChain: true, auditLevel: "high" },
  { domain: "closings", action: "delete", allowedRoles: ["admin"], allowedScope: ["global"], requiresReason: true, auditLevel: "high" },
  { domain: "properties", action: "view", allowedRoles: ["agent", "supervisor", "admin"], allowedScope: ["own", "team", "global"], auditLevel: "low" },
  { domain: "properties", action: "create", allowedRoles: ["admin"], allowedScope: ["global"], auditLevel: "high" },
  { domain: "scoring_rules", action: "manage_rules", allowedRoles: ["admin"], allowedScope: ["global"], auditLevel: "high" },
  { domain: "rewards", action: "manage_rules", allowedRoles: ["admin"], allowedScope: ["global"], auditLevel: "high" },
  { domain: "users", action: "manage_roles", allowedRoles: ["admin"], allowedScope: ["global"], requiresReason: true, auditLevel: "high" },
  { domain: "audit_logs", action: "view", allowedRoles: ["admin"], allowedScope: ["global"], auditLevel: "high" },
];

export const routeRoleMap: Record<string, UserRole[]> = {
  "/": ["agent", "supervisor", "admin"],
  "/leads": ["agent", "supervisor", "admin"],
  "/followup": ["agent", "supervisor", "admin"],
  "/visits": ["agent", "supervisor", "admin"],
  "/closings": ["agent", "supervisor", "admin"],
  "/social": ["agent", "supervisor", "admin"],
  "/inventory": ["agent", "supervisor", "admin"],
  "/showroom": ["agent", "supervisor", "admin"],
  "/leaderboard": ["agent", "supervisor", "admin"],
  "/rewards": ["agent", "supervisor", "admin"],
  "/profile": ["agent", "supervisor", "admin"],
  "/team": ["supervisor", "admin"],
  "/team/:id": ["supervisor", "admin"],
  "/admin": ["admin"],
};

export function canAccessRoute(path: string, role: UserRole) {
  const allowed = routeRoleMap[path];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function canPerform(domain: string, action: DomainAction, role: UserRole) {
  return permissionRules.some((rule) => rule.domain === domain && rule.action === action && rule.allowedRoles.includes(role));
}
