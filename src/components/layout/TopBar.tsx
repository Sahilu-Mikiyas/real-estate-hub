import { Bell, LogOut } from "lucide-react";
import { useRBAC, UserRole } from "@/contexts/RBACContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<UserRole, string> = {
  agent: "Agent",
  supervisor: "Supervisor",
  admin: "Admin",
};

const roleBadgeColors: Record<UserRole, string> = {
  agent: "bg-blue-100 text-blue-700",
  supervisor: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

export function TopBar() {
  const { role, userName } = useRBAC();
  const { signOut } = useAuth();

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shadow-card">
      <div />
      <div className="flex items-center gap-4">
        {/* Role badge */}
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${roleBadgeColors[role]}`}>
          {roleLabels[role]}
        </span>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card" />
        </button>

        {/* Avatar + name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:block">{userName}</span>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
