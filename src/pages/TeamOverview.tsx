import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, Users, TrendingUp, GitCompare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useRBAC } from "@/contexts/RBACContext";

export default function TeamOverview() {
  const { role } = useRBAC();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["team-agents"],
    queryFn: async () => {
      // RLS auto-filters: supervisors see team, admins see all
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, team_id");
      if (!profiles) return [];

      // Fetch stats per agent
      const ids = profiles.map(p => p.id);
      const [leadsRes, visitsRes, postsRes, closingsRes] = await Promise.all([
        supabase.from("leads").select("agent_id, status").in("agent_id", ids),
        supabase.from("visits").select("agent_id").in("agent_id", ids),
        supabase.from("social_posts").select("agent_id").in("agent_id", ids),
        supabase.from("closings").select("agent_id, status, deal_price, commission_amount").in("agent_id", ids),
      ]);

      return profiles.map(p => {
        const leads = (leadsRes.data ?? []).filter(l => l.agent_id === p.id);
        const visits = (visitsRes.data ?? []).filter(v => v.agent_id === p.id);
        const posts = (postsRes.data ?? []).filter(s => s.agent_id === p.id);
        const closings = (closingsRes.data ?? []).filter(c => c.agent_id === p.id);
        const completed = closings.filter(c => c.status === "completed");
        const revenue = completed.reduce((s, c) => s + Number(c.deal_price || 0), 0);
        const commission = completed.reduce((s, c) => s + Number(c.commission_amount || 0), 0);
        const points = leads.length * 5 + visits.length * 10 + posts.length * 3 + completed.length * 50;
        return {
          ...p,
          leads: leads.length,
          closedLeads: leads.filter(l => l.status === "closed").length,
          visits: visits.length,
          posts: posts.length,
          closings: completed.length,
          revenue,
          commission,
          points,
        };
      }).sort((a, b) => b.points - a.points);
    },
  });

  const filtered = agents.filter(a => a.full_name.toLowerCase().includes(search.toLowerCase()));
  const compared = agents.filter(a => selectedIds.includes(a.id));

  if (role === "agent") {
    return <div className="text-center py-12 text-muted-foreground">Supervisor or admin access required.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Team Overview</h1>
          <p className="text-sm text-muted-foreground">{agents.length} agents · click for full detail</p>
        </div>
        <div className="flex gap-2">
          <Button variant={compareMode ? "default" : "outline"} size="sm" onClick={() => { setCompareMode(!compareMode); setSelectedIds([]); }}>
            <GitCompare className="w-4 h-4 mr-1.5" /> {compareMode ? "Exit compare" : "Compare agents"}
          </Button>
        </div>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AggCard icon={<Users className="w-4 h-4" />} label="Agents" value={agents.length} />
        <AggCard icon={<TrendingUp className="w-4 h-4" />} label="Total leads" value={agents.reduce((s, a) => s + a.leads, 0)} />
        <AggCard icon={<TrendingUp className="w-4 h-4" />} label="Closings" value={agents.reduce((s, a) => s + a.closings, 0)} accent />
        <AggCard icon={<TrendingUp className="w-4 h-4" />} label="Team points" value={agents.reduce((s, a) => s + a.points, 0)} accent />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search agents..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {compareMode && compared.length > 0 && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Metric</th>
                  {compared.map(a => <th key={a.id} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{a.full_name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { k: "points", l: "Points" }, { k: "leads", l: "Leads" }, { k: "closedLeads", l: "Closed leads" },
                  { k: "visits", l: "Visits" }, { k: "posts", l: "Posts" }, { k: "closings", l: "Closings" },
                  { k: "revenue", l: "Revenue (PKR)" }, { k: "commission", l: "Commission (PKR)" },
                ].map(row => (
                  <tr key={row.k} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-sm font-medium">{row.l}</td>
                    {compared.map(a => <td key={a.id} className="px-4 py-2.5 text-sm">{(a as any)[row.k].toLocaleString()}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />) :
          filtered.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="cursor-pointer hover:shadow-card-hover transition relative" onClick={() => !compareMode && navigate(`/team/${a.id}`)}>
                {compareMode && (
                  <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.includes(a.id)} onCheckedChange={(c) => {
                      if (c) setSelectedIds([...selectedIds, a.id]); else setSelectedIds(selectedIds.filter(x => x !== a.id));
                    }} />
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={a.avatar_url ?? undefined} />
                      <AvatarFallback>{a.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{a.full_name}</p>
                      <p className="text-xs text-muted-foreground">Team {a.team_id ?? "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-accent">{a.points}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">pts</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <Mini label="Leads" value={a.leads} />
                    <Mini label="Visits" value={a.visits} />
                    <Mini label="Posts" value={a.posts} />
                    <Mini label="Deals" value={a.closings} accent />
                  </div>
                  {!compareMode && (
                    <div className="flex items-center justify-end mt-4 text-xs text-accent">
                      View profile <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>
    </div>
  );
}

function AggCard({ icon, label, value, accent }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className={accent ? "text-accent" : "text-muted-foreground"}>{icon}</div>
        </div>
        <p className={`text-2xl font-bold mt-2 ${accent ? "text-accent" : ""}`}>{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function Mini({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p className={`text-lg font-bold ${accent ? "text-accent" : ""}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
