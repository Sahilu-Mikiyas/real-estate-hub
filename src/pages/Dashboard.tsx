import { Users, Eye, CheckCircle, Star, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RewardProgress } from "@/components/dashboard/RewardProgress";
import { MiniLeaderboard } from "@/components/dashboard/MiniLeaderboard";
import { useRBAC } from "@/contexts/RBACContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { role, userId, teamId } = useRBAC();

  // Fetch lead counts based on role
  const { data: leadCount = 0 } = useQuery({
    queryKey: ["dashboard-leads", role, userId, teamId],
    queryFn: async () => {
      let query = supabase.from("leads").select("id", { count: "exact", head: true });
      // RLS handles filtering automatically
      const { count } = await query;
      return count ?? 0;
    },
  });

  const { data: closedCount = 0 } = useQuery({
    queryKey: ["dashboard-closed", role, userId, teamId],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "closed");
      const { count } = await query;
      return count ?? 0;
    },
  });

  const stats = [
    { title: "Total Leads", value: leadCount, icon: Users, subtitle: "All tracked leads" },
    { title: "Site Visits", value: 0, icon: Eye, subtitle: "Coming soon" },
    { title: "Closings", value: closedCount, icon: CheckCircle, subtitle: "Closed deals" },
    { title: "Points", value: 0, icon: Star, subtitle: "Earn via activity" },
  ];

  const dashboardTitle =
    role === "admin"
      ? "Admin Dashboard"
      : role === "supervisor"
      ? "Team Dashboard"
      : "My Dashboard";

  const dashboardSubtitle =
    role === "admin"
      ? "Full system overview — all agents and teams"
      : role === "supervisor"
      ? "Your team's performance at a glance"
      : "Welcome back — here's your personal overview";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{dashboardTitle}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{dashboardSubtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.title} {...stat} index={i} />
        ))}
      </div>

      {/* Chart */}
      <PerformanceChart />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div className="space-y-4">
          <RewardProgress />
          <MiniLeaderboard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
