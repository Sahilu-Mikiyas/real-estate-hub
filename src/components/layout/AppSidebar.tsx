import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Building2,
  Trophy,
  Gift,
  Share2,
  Shield,
  ChevronLeft,
  ChevronRight,
  Home,
  GitBranch,
  FileSignature,
  UserCircle,
  UsersRound,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useRBAC } from "@/contexts/RBACContext";
import { useState } from "react";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["agent", "supervisor", "admin"] },
  { title: "Leads", path: "/leads", icon: Users, roles: ["agent", "supervisor", "admin"] },
  { title: "Follow-up", path: "/followup", icon: GitBranch, roles: ["agent", "supervisor", "admin"] },
  { title: "Visits", path: "/visits", icon: CalendarDays, roles: ["agent", "supervisor", "admin"] },
  { title: "Closings", path: "/closings", icon: FileSignature, roles: ["agent", "supervisor", "admin"] },
  { title: "Social Media", path: "/social", icon: Share2, roles: ["agent", "supervisor", "admin"] },
  { title: "Inventory", path: "/inventory", icon: Building2, roles: ["agent", "supervisor", "admin"] },
  { title: "Showroom", path: "/showroom", icon: Home, roles: ["agent", "supervisor", "admin"] },
  { title: "Leaderboard", path: "/leaderboard", icon: Trophy, roles: ["agent", "supervisor", "admin"] },
  { title: "Rewards", path: "/rewards", icon: Gift, roles: ["agent", "supervisor", "admin"] },
  { title: "Team", path: "/team", icon: UsersRound, roles: ["supervisor", "admin"] },
  { title: "Profile", path: "/profile", icon: UserCircle, roles: ["agent", "supervisor", "admin"] },
  { title: "Admin Panel", path: "/admin", icon: Shield, roles: ["admin"] },
];

export function AppSidebar() {
  const { role } = useRBAC();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`relative flex flex-col bg-primary transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      } min-h-screen`}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Building2 className="w-5 h-5 text-accent-foreground" />
        </div>
        {!collapsed && (
          <span className="text-primary-foreground font-semibold text-lg tracking-tight">
            Emarosh CRM
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {filtered.map((item) => {
          const isActive = location.pathname === item.path || (item.path === "/team" && location.pathname.startsWith("/team"));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-sidebar-accent text-accent"
                  : "text-primary-foreground/70 hover:bg-sidebar-accent hover:text-accent"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-card flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
