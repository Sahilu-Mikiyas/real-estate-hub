import { describe, expect, it } from "vitest";
import { canAccessRoute, canPerform, permissionRules, routeRoleMap } from "@/lib/permissions";

const roles = ["agent", "supervisor", "admin"] as const;

describe("permission contract", () => {
  it("has routes mapped for protected navigation", () => {
    expect(Object.keys(routeRoleMap)).toEqual(
      expect.arrayContaining(["/", "/leads", "/team", "/admin"]),
    );
  });

  it("only allows admin access to /admin", () => {
    expect(canAccessRoute("/admin", "admin")).toBe(true);
    expect(canAccessRoute("/admin", "supervisor")).toBe(false);
    expect(canAccessRoute("/admin", "agent")).toBe(false);
  });

  it("ensures each permission rule has at least one role", () => {
    for (const rule of permissionRules) {
      expect(rule.allowedRoles.length).toBeGreaterThan(0);
    }
  });

  it("ensures every role has at least one route", () => {
    for (const role of roles) {
      expect(Object.values(routeRoleMap).some((allowed) => allowed.includes(role))).toBe(true);
    }
  });

  it("blocks non-admin role management", () => {
    expect(canPerform("users", "manage_roles", "admin")).toBe(true);
    expect(canPerform("users", "manage_roles", "supervisor")).toBe(false);
    expect(canPerform("users", "manage_roles", "agent")).toBe(false);
  });
});
