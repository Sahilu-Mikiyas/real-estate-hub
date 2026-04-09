import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "agent" | "supervisor" | "admin";

interface RBACContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userId: string;
  teamId: string;
  userName: string;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("agent");

  return (
    <RBACContext.Provider
      value={{
        role,
        setRole,
        userId: "agent-001",
        teamId: "team-001",
        userName: "Ahmed Ali",
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
