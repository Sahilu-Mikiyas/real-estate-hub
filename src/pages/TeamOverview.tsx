import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronRight,
  Users,
  TrendingUp,
  GitCompare,
  Activity,
  Filter,
  UserRound,
  Database,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useRBAC } from "@/contexts/RBACContext";
import { formatDistanceToNow } from "date-fns";

export default function TeamOverview() {
  const { role } = useRBAC();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [activityAgentFilter, setActivityAgentFilter] = useState<string>("all");
  const [activityDomainFilter, setActivityDomainFilter] = useState<string>("all");
  const [activityActionFilter, setActivityActionFilter] = useState<string>("all");
  const [activityDateFrom, setActivityDateFrom] = useState("");
  const [activityDateTo, setActivityDateTo] = useState("");
  const [activitySearch, setActivitySearch] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["team-agents"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, team_id");
      if (!profiles) return [];

      const ids = profiles.map((p) => p.id);
      const [leadsRes, visitsRes, postsRes, closingsRes] = await Promise.all([
        supabase.from("leads").select("agent_id, status").in("agent_id", ids),
        supabase.from("visits").select("agent_id").in("agent_id", ids),
        supabase.from("social_posts").select("agent_id").in("agent_id", ids),
        supabase.from("closings").select("agent_id, status, deal_price, commission_amount").in("agent_id", ids),
      ]);

      return profiles
        .map((p) => {
          const leads = (leadsRes.data ?? []).filter((l) => l.agent_id === p.id);
          const visits = (visitsRes.data ?? []).filter((v) => v.agent_id === p.id);
          const posts = (postsRes.data ?? []).filter((s) => s.agent_id === p.id);
          const closings = (closingsRes.data ?? []).filter((c) => c.agent_id === p.id);
          const completed = closings.filter((c) => c.status === "completed");
          const revenue = completed.reduce((s, c) => s + Number(c.deal_price || 0), 0);
          const commission = completed.reduce((s, c) => s + Number(c.commission_amount || 0), 0);
          const points = leads.length * 5 + visits.length * 10 + posts.length * 3 + completed.length * 50;
          return {
            ...p,
            leads: leads.length,
            closedLeads: leads.filter((l) => l.status === "closed").length,
            visits: visits.length,
            posts: posts.length,
            closings: completed.length,
            revenue,
            commission,
            points,
          };
        })
        .sort((a, b) => b.points - a.points);
    },
  });

  const { data: activityRows = [], isLoading: activityLoading } = useQuery({
    queryKey: [
      "team-activity-timeline",
      activityAgentFilter,
      activityDomainFilter,
      activityActionFilter,
      activityDateFrom,
      activityDateTo,
    ],
    queryFn: async () => {
      let q = supabase
        .from("v_audit_explorer_recent")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(250);

      if (activityAgentFilter !== "all") q = q.eq("actor_user_id", activityAgentFilter);
      if (activityDomainFilter !== "all") q = q.eq("domain", activityDomainFilter);
      if (activityActionFilter !== "all") q = q.eq("action", activityActionFilter);
      if (activityDateFrom) q = q.gte("occurred_at", `${activityDateFrom}T00:00:00.000Z`);
      if (activityDateTo) q = q.lte("occurred_at", `${activityDateTo}T23:59:59.999Z`);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: changeLogs = [], isLoading: changeLogLoading } = useQuery({
    queryKey: ["activity-change-log", selectedEvent?.entity_table, selectedEvent?.entity_id],
    enabled: !!selectedEvent,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("record_change_log")
        .select("*")
        .eq("entity_table", selectedEvent.entity_table)
        .eq("entity_id", selectedEvent.entity_id)
        .order("changed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filteredAgents = agents.filter((a) => a.full_name.toLowerCase().includes(search.toLowerCase()));
  const compared = agents.filter((a) => selectedIds.includes(a.id));

  const filteredActivityRows = useMemo(() => {
    if (!activitySearch.trim()) return activityRows;
    const q = activitySearch.toLowerCase();
    return activityRows.filter((row: any) =>
      [row.actor_name, row.domain, row.action, row.entity_table, row.entity_label]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [activityRows, activitySearch]);

  const activityDomains = Array.from(new Set(activityRows.map((r: any) => r.domain).filter(Boolean)));
  const activityActions = Array.from(new Set(activityRows.map((r: any) => r.action).filter(Boolean)));

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
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedIds([]);
            }}
          >
            <GitCompare className="w-4 h-4 mr-1.5" /> {compareMode ? "Exit compare" : "Compare agents"}
          </Button>
        </div>
      </div>

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
                  {compared.map((a) => (
                    <th key={a.id} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">
                      {a.full_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { k: "points", l: "Points" },
                  { k: "leads", l: "Leads" },
                  { k: "closedLeads", l: "Closed leads" },
                  { k: "visits", l: "Visits" },
                  { k: "posts", l: "Posts" },
                  { k: "closings", l: "Closings" },
                  { k: "revenue", l: "Revenue (ETB)" },
                  { k: "commission", l: "Commission (ETB)" },
                ].map((row) => (
                  <tr key={row.k} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-sm font-medium">{row.l}</td>
                    {compared.map((a) => (
                      <td key={a.id} className="px-4 py-2.5 text-sm">
                        {(a as any)[row.k].toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)
          : filteredAgents.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="cursor-pointer hover:shadow-card-hover transition relative" onClick={() => !compareMode && navigate(`/team/${a.id}`)}>
                  {compareMode && (
                    <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(a.id)}
                        onCheckedChange={(c) => {
                          if (c) setSelectedIds([...selectedIds, a.id]);
                          else setSelectedIds(selectedIds.filter((x) => x !== a.id));
                        }}
                      />
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" /> Team Activity Timeline
          </CardTitle>
          <p className="text-sm text-muted-foreground">Filter by agent, module, action, and date to inspect team operations.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <Select value={activityAgentFilter} onValueChange={setActivityAgentFilter}>
              <SelectTrigger>
                <UserRound className="w-4 h-4 mr-1.5" />
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activityDomainFilter} onValueChange={setActivityDomainFilter}>
              <SelectTrigger>
                <Database className="w-4 h-4 mr-1.5" />
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {activityDomains.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activityActionFilter} onValueChange={setActivityActionFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-1.5" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {activityActions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" value={activityDateFrom} onChange={(e) => setActivityDateFrom(e.target.value)} />
            <Input type="date" value={activityDateTo} onChange={(e) => setActivityDateTo(e.target.value)} />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search timeline..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border max-h-[420px] overflow-y-auto">
            {activityLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : filteredActivityRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No timeline entries for this filter set.</p>
            ) : (
              <div className="divide-y divide-border">
                {filteredActivityRows.map((row: any) => (
                  <button
                    key={row.id}
                    onClick={() => {
                      setSelectedEvent(row);
                      setEventDetailOpen(true);
                    }}
                    className="w-full text-left p-4 hover:bg-secondary/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize">{row.domain}</Badge>
                        <Badge variant="secondary" className="capitalize">{row.action}</Badge>
                        {row.is_sensitive && <Badge className="bg-red-100 text-red-700">Sensitive</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(row.occurred_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm font-medium">{row.actor_name} → {row.entity_table} ({row.entity_label || row.entity_id})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Team {row.team_id || "—"} • {new Date(row.occurred_at).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={eventDetailOpen} onOpenChange={setEventDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedEvent && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Record Drill-down History
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mt-4">
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm"><span className="font-medium">Actor:</span> {selectedEvent.actor_name} ({selectedEvent.actor_role})</p>
                    <p className="text-sm"><span className="font-medium">Entity:</span> {selectedEvent.entity_table} / {selectedEvent.entity_id}</p>
                    <p className="text-sm"><span className="font-medium">Action:</span> {selectedEvent.action}</p>
                    <p className="text-sm"><span className="font-medium">Occurred:</span> {new Date(selectedEvent.occurred_at).toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Activity Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-secondary rounded-lg p-3 overflow-x-auto">{JSON.stringify(selectedEvent.metadata ?? {}, null, 2)}</pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Change History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {changeLogLoading ? (
                      Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
                    ) : changeLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No field-level change records found for this entity yet.</p>
                    ) : (
                      changeLogs.map((log: any) => (
                        <div key={log.id} className="rounded-lg border border-border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="capitalize">{log.change_type}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(log.changed_at).toLocaleString()}</span>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-semibold mb-1">Before</p>
                              <pre className="text-[11px] bg-secondary rounded p-2 overflow-x-auto max-h-52">{JSON.stringify(log.before_data, null, 2)}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold mb-1">After</p>
                              <pre className="text-[11px] bg-secondary rounded p-2 overflow-x-auto max-h-52">{JSON.stringify(log.after_data, null, 2)}</pre>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
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
