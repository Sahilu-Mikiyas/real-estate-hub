import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { useRBAC } from "@/contexts/RBACContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];
const medalBgs = [
  "from-yellow-50 to-yellow-100 border-yellow-200",
  "from-gray-50 to-gray-100 border-gray-200",
  "from-amber-50 to-amber-100 border-amber-200",
];

type SortKey = "points" | "leads" | "closings" | "visits" | "posts";

const Leaderboard = () => {
  const { userId, role } = useRBAC();
  const [sortBy, setSortBy] = useState<SortKey>("points");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Fetch all profiles (visible based on role/RLS)
  const { data: profiles = [] } = useQuery({
    queryKey: ["leaderboard-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url, team_id");
      return data || [];
    },
  });

  // Fetch counts per agent
  const { data: leadsMap = {} } = useQuery({
    queryKey: ["leaderboard-leads"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("agent_id");
      const map: Record<string, number> = {};
      (data || []).forEach(l => { map[l.agent_id] = (map[l.agent_id] || 0) + 1; });
      return map;
    },
  });

  const { data: closingsMap = {} } = useQuery({
    queryKey: ["leaderboard-closings"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("agent_id").eq("status", "closed");
      const map: Record<string, number> = {};
      (data || []).forEach(l => { map[l.agent_id] = (map[l.agent_id] || 0) + 1; });
      return map;
    },
  });

  const { data: visitsMap = {} } = useQuery({
    queryKey: ["leaderboard-visits"],
    queryFn: async () => {
      const { data } = await supabase.from("visits").select("agent_id");
      const map: Record<string, number> = {};
      (data || []).forEach(v => { map[v.agent_id] = (map[v.agent_id] || 0) + 1; });
      return map;
    },
  });

  const { data: postsMap = {} } = useQuery({
    queryKey: ["leaderboard-posts"],
    queryFn: async () => {
      const { data } = await supabase.from("social_posts").select("agent_id");
      const map: Record<string, number> = {};
      (data || []).forEach(p => { map[p.agent_id] = (map[p.agent_id] || 0) + 1; });
      return map;
    },
  });

  const { data: scoringRules = [] } = useQuery({
    queryKey: ["scoring-rules"],
    queryFn: async () => {
      const { data } = await supabase.from("scoring_rules").select("*");
      return data || [];
    },
  });

  const getPoints = (agentId: string) => {
    const leadPts = scoringRules.find(r => r.rule_name === "lead_added")?.points_per_action || 10;
    const closePts = scoringRules.find(r => r.rule_name === "lead_closed")?.points_per_action || 100;
    const visitPts = scoringRules.find(r => r.rule_name === "visit_logged")?.points_per_action || 15;
    const postPts = scoringRules.find(r => r.rule_name === "social_post")?.points_per_action || 5;
    return (leadsMap[agentId] || 0) * leadPts + (closingsMap[agentId] || 0) * closePts +
      (visitsMap[agentId] || 0) * visitPts + (postsMap[agentId] || 0) * postPts;
  };

  const agents = profiles.map(p => ({
    id: p.id,
    name: p.full_name || "Unknown",
    leads: leadsMap[p.id] || 0,
    closings: closingsMap[p.id] || 0,
    visits: visitsMap[p.id] || 0,
    posts: postsMap[p.id] || 0,
    points: getPoints(p.id),
  })).sort((a, b) => {
    const aVal = a[sortBy]; const bVal = b[sortBy];
    return sortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

  const top3 = agents.slice(0, 3);
  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "desc" ? <ChevronDown className="w-3 h-3 ml-1 text-accent" /> : <ChevronUp className="w-3 h-3 ml-1 text-accent" />;
  };
  const toggleSort = (field: SortKey) => {
    if (sortBy === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          {role === "agent" ? "See where you stand" : role === "supervisor" ? "Team rankings" : "All agent rankings"}
        </p>
      </div>

      {/* Top 3 podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 0, 2].map((idx) => {
            const agent = top3[idx];
            if (!agent) return null;
            const isMe = agent.id === userId;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, type: "spring", stiffness: 300, damping: 20 }}
                className={`bg-gradient-to-b ${medalBgs[idx]} border rounded-xl p-6 text-center ${
                  idx === 0 ? "sm:order-2 sm:scale-105 sm:-mt-2" : idx === 1 ? "sm:order-1" : "sm:order-3"
                } ${isMe ? "ring-2 ring-accent" : ""}`}
              >
                <div className="flex justify-center mb-3">
                  <Trophy className={`w-8 h-8 ${medalColors[idx]}`} />
                </div>
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xl font-bold mx-auto mb-2">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                {isMe && <span className="text-[10px] text-accent font-medium">(You)</span>}
                <p className="text-2xl font-bold text-accent mt-1">{agent.points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">points</p>
                <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>{agent.leads} leads</span>
                  <span>{agent.closings} closings</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full ranking table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Rank</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Agent</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("points")}>
                <span className="flex items-center">Points<SortIcon field="points" /></span>
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("leads")}>
                <span className="flex items-center">Leads<SortIcon field="leads" /></span>
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("closings")}>
                <span className="flex items-center">Closings<SortIcon field="closings" /></span>
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("visits")}>
                <span className="flex items-center">Visits<SortIcon field="visits" /></span>
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("posts")}>
                <span className="flex items-center">Posts<SortIcon field="posts" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, i) => {
              const isMe = agent.id === userId;
              return (
                <motion.tr
                  key={agent.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  className={`border-b border-border last:border-0 transition-colors ${
                    isMe ? "bg-accent/5 font-medium" : "hover:bg-secondary"
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${i < 3 ? medalColors[i] : "text-muted-foreground"}`}>
                      #{i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {agent.name} {isMe && <span className="text-accent text-[10px] ml-1">(You)</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-accent">{agent.points.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{agent.leads}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{agent.closings}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{agent.visits}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{agent.posts}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {agents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No agents found</div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
