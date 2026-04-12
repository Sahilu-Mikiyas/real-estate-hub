import { useState, useEffect } from "react";
import { Bell, LogOut, X } from "lucide-react";
import { useRBAC, UserRole } from "@/contexts/RBACContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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

const typeColors: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  info: "bg-blue-100 text-blue-700",
  warning: "bg-yellow-100 text-yellow-700",
};

export function TopBar() {
  const { role, userName, userId } = useRBAC();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!userId,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Realtime subscription for notifications
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shadow-card">
      <div />
      <div className="flex items-center gap-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${roleBadgeColors[role]}`}>
          {roleLabels[role]}
        </span>

        {/* Notifications */}
        <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
          <SheetTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-accent text-accent-foreground text-[10px] font-bold rounded-full px-1"
                >
                  {unreadCount}
                </motion.span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent className="w-[380px]">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle>Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-accent hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
            </SheetHeader>
            <div className="mt-4 space-y-2 max-h-[70vh] overflow-y-auto">
              {notifications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
              )}
              <AnimatePresence>
                {notifications.map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`p-3 rounded-lg border transition-colors ${
                      notif.read ? "bg-secondary/50 border-border" : "bg-card border-accent/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeColors[notif.type] || typeColors.info}`}>
                            {notif.type}
                          </span>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-accent" />}
                        </div>
                        <p className="text-sm font-medium text-foreground">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <button onClick={() => markRead(notif.id)} className="p-1 hover:bg-secondary rounded">
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SheetContent>
        </Sheet>

        {/* Avatar + name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:block">{userName}</span>
        </div>

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
