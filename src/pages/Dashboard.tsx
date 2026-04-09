import { Users, Eye, CheckCircle, Star } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RewardProgress } from "@/components/dashboard/RewardProgress";
import { MiniLeaderboard } from "@/components/dashboard/MiniLeaderboard";
import { useRBAC } from "@/contexts/RBACContext";

const Dashboard = () => {
  const { role } = useRBAC();

  const stats = [
    { title: "Total Leads", value: 142, icon: Users, subtitle: "12 this week" },
    { title: "Site Visits", value: 38, icon: Eye, subtitle: "5 this week" },
    { title: "Closings", value: 7, icon: CheckCircle, subtitle: "2 this month" },
    { title: "Points", value: 1890, icon: Star, subtitle: "63% to next reward" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {role === "admin" ? "Admin Dashboard" : role === "supervisor" ? "Team Dashboard" : "My Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Welcome back — here's your overview
        </p>
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
