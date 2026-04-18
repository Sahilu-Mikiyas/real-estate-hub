import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Phone, Mail, Calendar, FileText, TrendingUp, Award,
  Users, Building2, Share2, FileSignature, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["agent-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const [profileRes, prefRes, roleRes, leadsRes, visitsRes, postsRes, closingsRes, badgesRes, followupsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("profile_preferences").select("*").eq("user_id", id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", id).maybeSingle(),
        supabase.from("leads").select("*").eq("agent_id", id).order("created_at", { ascending: false }),
        supabase.from("visits").select("*").eq("agent_id", id).order("visit_date", { ascending: false }),
        supabase.from("social_posts").select("*").eq("agent_id", id).order("post_date", { ascending: false }),
        supabase.from("closings").select("*").eq("agent_id", id).order("created_at", { ascending: false }),
        supabase.from("agent_badges").select("*, badges(name, icon, description)").eq("agent_id", id),
        supabase.from("lead_followups").select("*, leads(name)").eq("agent_id", id).order("created_at", { ascending: false }).limit(50),
      ]);
      return {
        profile: profileRes.data,
        prefs: prefRes.data,
        role: roleRes.data?.role,
        leads: leadsRes.data ?? [],
        visits: visitsRes.data ?? [],
        posts: postsRes.data ?? [],
        closings: closingsRes.data ?? [],
        badges: badgesRes.data ?? [],
        followups: followupsRes.data ?? [],
      };
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;
  if (!data?.profile) return <div className="text-center py-12 text-muted-foreground">Agent not found</div>;

  const { profile, prefs, role, leads, visits, posts, closings, badges, followups } = data;
  const completedClosings = closings.filter(c => c.status === "completed");
  const revenue = completedClosings.reduce((s, c) => s + Number(c.deal_price), 0);
  const commission = completedClosings.reduce((s, c) => s + Number(c.commission_amount), 0);
  const points = leads.length * 5 + visits.length * 10 + posts.length * 3 + completedClosings.length * 50;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/team")}>
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to team
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl">{profile.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                <Badge variant="secondary" className="capitalize">{role}</Badge>
                <span>Team {profile.team_id ?? "—"}</span>
                {prefs?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{prefs.phone}</span>}
              </div>
              {prefs?.bio && <p className="text-sm mt-2">{prefs.bio}</p>}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-accent">{points}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Kpi icon={<Users className="w-4 h-4" />} label="Leads" value={leads.length} />
        <Kpi icon={<Building2 className="w-4 h-4" />} label="Visits" value={visits.length} />
        <Kpi icon={<Share2 className="w-4 h-4" />} label="Posts" value={posts.length} />
        <Kpi icon={<FileSignature className="w-4 h-4" />} label="Closings" value={completedClosings.length} accent />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Revenue" value={`${(revenue / 1000000).toFixed(1)}M`} />
        <Kpi icon={<Award className="w-4 h-4" />} label="Badges" value={badges.length} />
      </div>

      {/* Detail tabs */}
      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="visits">Visits ({visits.length})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="closings">Closings ({closings.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4">
          <Card><CardContent className="p-0 overflow-x-auto">
            <DataTable rows={leads} cols={[
              { k: "name", l: "Name" }, { k: "phone", l: "Phone" }, { k: "status", l: "Status" },
              { k: "potential", l: "Potential" }, { k: "property", l: "Interest" },
              { k: "created_at", l: "Added", fmt: (v) => format(new Date(v), "PP") },
            ]} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="visits" className="mt-4">
          <Card><CardContent className="p-0 overflow-x-auto">
            <DataTable rows={visits} cols={[
              { k: "client_name", l: "Client" }, { k: "property", l: "Property" }, { k: "visit_type", l: "Type" },
              { k: "outcome", l: "Outcome" },
              { k: "visit_date", l: "Date", fmt: (v) => format(new Date(v), "PP") },
            ]} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <Card><CardContent className="p-0 overflow-x-auto">
            <DataTable rows={posts} cols={[
              { k: "platform", l: "Platform" }, { k: "property", l: "Property" }, { k: "notes", l: "Notes" },
              { k: "post_date", l: "Date", fmt: (v) => format(new Date(v), "PP") },
            ]} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="closings" className="mt-4">
          <Card><CardContent className="p-0 overflow-x-auto">
            <DataTable rows={closings} cols={[
              { k: "property_name", l: "Property" }, { k: "buyer_name", l: "Buyer" },
              { k: "deal_price", l: "Price", fmt: (v) => `ETB ${Number(v).toLocaleString()}` },
              { k: "commission_amount", l: "Commission", fmt: (v) => `ETB ${Number(v).toLocaleString()}` },
              { k: "status", l: "Status" },
              { k: "created_at", l: "Date", fmt: (v) => format(new Date(v), "PP") },
            ]} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-3">
          {followups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No activity logged yet</p>
          ) : followups.map((f: any) => (
            <Card key={f.id}><CardContent className="p-4 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm"><span className="font-medium">{f.action.replace("_", " ")}</span> on <span className="text-accent">{f.leads?.name}</span></p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}</p>
                </div>
                {f.notes && <p className="text-sm text-muted-foreground mt-1">{f.notes}</p>}
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No badges earned yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {badges.map((b: any, i: number) => (
                <motion.div key={b.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}>
                  <Card><CardContent className="p-4 text-center">
                    <Award className="w-10 h-10 mx-auto text-accent" />
                    <p className="font-semibold mt-2">{b.badges?.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{b.badges?.description}</p>
                  </CardContent></Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: any; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{label}</p>
          <div className={accent ? "text-accent" : "text-muted-foreground"}>{icon}</div>
        </div>
        <p className={`text-xl font-bold mt-1 ${accent ? "text-accent" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function DataTable({ rows, cols }: { rows: any[]; cols: { k: string; l: string; fmt?: (v: any) => string }[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground text-center py-12">No records</p>;
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border bg-secondary/30">
          {cols.map(c => <th key={c.k} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{c.l}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id ?? i} className="border-b border-border last:border-0">
            {cols.map(c => <td key={c.k} className="px-4 py-2.5 text-sm">{r[c.k] == null ? "—" : c.fmt ? c.fmt(r[c.k]) : String(r[c.k])}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
