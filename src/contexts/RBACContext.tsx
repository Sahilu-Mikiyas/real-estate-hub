import { createContext, useContext, ReactNode } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";

// Re-export for backward compatibility
export type { UserRole } from "@/contexts/AuthContext";

interface RBACContextType {
  role: UserRole;
  userId: string;
  teamId: string | null;
  userName: string;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({ children }: { children: ReactNode }) {
  const { user, role, profile } = useAuth();

  return (
    <RBACContext.Provider
      value={{
        role,
        userId: user?.id ?? "",
        teamId: profile?.team_id ?? null,
        userName: profile?.full_name ?? user?.email?.split("@")[0] ?? "User",
      }}
    >
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const ctx = useContext(RBACContext);
  if (!ctx) throw new Error("useRBAC must be used within RBACProvider");
  return ctx;
}
