import { Users, Eye, CheckCircle, Star } from "lucide-react";
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

  const { data: leadCount = 0 } = useQuery({
    queryKey: ["dashboard-leads", role, userId, teamId],
    queryFn: async () => {
      const { count } = await supabase.from("leads").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: closedCount = 0 } = useQuery({
    queryKey: ["dashboard-closed", role, userId, teamId],
    queryFn: async () => {
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "closed");
      return count ?? 0;
    },
  });

  const { data: visitCount = 0 } = useQuery({
    queryKey: ["dashboard-visits", role, userId, teamId],
    queryFn: async () => {
      const { count } = await supabase.from("visits").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: postCount = 0 } = useQuery({
    queryKey: ["dashboard-posts", role, userId, teamId],
    queryFn: async () => {
      const { count } = await supabase.from("social_posts").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const stats = [
    { title: "Total Leads", value: leadCount, icon: Users, subtitle: "All tracked leads" },
    { title: "Site Visits", value: visitCount, icon: Eye, subtitle: "Logged visits" },
    { title: "Closings", value: closedCount, icon: CheckCircle, subtitle: "Closed deals" },
    { title: "Posts", value: postCount, icon: Star, subtitle: "Social media posts" },
  ];

  const dashboardTitle =
    role === "admin" ? "Admin Dashboard" : role === "supervisor" ? "Team Dashboard" : "My Dashboard";

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.title} {...stat} index={i} />
        ))}
      </div>

      <PerformanceChart />

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
