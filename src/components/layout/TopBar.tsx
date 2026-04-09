import { Bell, ChevronDown } from "lucide-react";
import { useRBAC, UserRole } from "@/contexts/RBACContext";

const roleLabels: Record<UserRole, string> = {
  agent: "Agent",
  supervisor: "Supervisor",
  admin: "Admin",
};

export function TopBar() {
  const { role, setRole, userName } = useRBAC();

  const cycleRole = () => {
    const roles: UserRole[] = ["agent", "supervisor", "admin"];
    const next = roles[(roles.indexOf(role) + 1) % roles.length];
    setRole(next);
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shadow-card">
      <div />
      <div className="flex items-center gap-4">
        {/* Role switcher (demo) */}
        <button
          onClick={cycleRole}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-subtle text-sm font-medium text-accent hover:bg-accent hover:text-accent-foreground transition-colors btn-press"
        >
          {roleLabels[role]}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-semibold">
            {userName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:block">{userName}</span>
        </div>
      </div>
    </header>
  );
}
