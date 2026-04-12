import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Activity, Plus, Pencil, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const AdminPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [userModal, setUserModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editRole, setEditRole] = useState<string>("agent");
  const [editTeam, setEditTeam] = useState<string>("");
  const [editName, setEditName] = useState<string>("");

  // Fetch all profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("full_name");
      return data || [];
    },
  });

  // Fetch all roles
  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("*");
      return data || [];
    },
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  // Fetch scoring rules
  const { data: scoringRules = [] } = useQuery({
    queryKey: ["scoring-rules"],
    queryFn: async () => {
      const { data } = await supabase.from("scoring_rules").select("*").order("rule_name");
      return data || [];
    },
  });

  // Fetch rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ["admin-rewards"],
    queryFn: async () => {
      const { data } = await supabase.from("rewards").select("*").order("threshold_points");
      return data || [];
    },
  });

  const getRoleForUser = (userId: string) => roles.find(r => r.user_id === userId)?.role || "agent";

  const logAction = async (action: string, targetTable?: string, targetId?: string, details?: any) => {
    await supabase.from("audit_logs").insert({
      user_id: user?.id || "",
      user_name: "Admin",
      action,
      target_table: targetTable || null,
      target_id: targetId || null,
      details: details || null,
    });
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  };

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from("user_roles").update({ role: role as any }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      logAction(`Role changed to ${vars.role}`, "user_roles", vars.userId);
      toast.success("Role updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, full_name, team_id }: { userId: string; full_name: string; team_id: string }) => {
      const { error } = await supabase.from("profiles").update({ full_name, team_id: team_id || null }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      logAction(`Profile updated`, "profiles", vars.userId);
      toast.success("Profile updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update scoring rule
  const updateScoringMutation = useMutation({
    mutationFn: async ({ id, points }: { id: string; points: number }) => {
      const { error } = await supabase.from("scoring_rules").update({ points_per_action: points }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["scoring-rules"] });
      logAction(`Scoring rule updated`, "scoring_rules", vars.id);
      toast.success("Scoring rule updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update reward
  const updateRewardMutation = useMutation({
    mutationFn: async ({ id, threshold }: { id: string; threshold: number }) => {
      const { error } = await supabase.from("rewards").update({ threshold_points: threshold }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      logAction(`Reward threshold updated`, "rewards", vars.id);
      toast.success("Reward updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEditUser = (p: any) => {
    setEditUser(p);
    setEditName(p.full_name);
    setEditTeam(p.team_id || "");
    setEditRole(getRoleForUser(p.id));
    setUserModal(true);
  };

  const saveUser = () => {
    if (!editUser) return;
    updateProfileMutation.mutate({ userId: editUser.id, full_name: editName, team_id: editTeam });
    if (getRoleForUser(editUser.id) !== editRole) {
      updateRoleMutation.mutate({ userId: editUser.id, role: editRole });
    }
    setUserModal(false);
  };

  const totalUsers = profiles.length;
  const activeAgents = profiles.filter(p => getRoleForUser(p.id) === "agent").length;
  const todayLogs = auditLogs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage users, settings, and audit logs</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: totalUsers, icon: Users },
          { label: "Active Agents", value: activeAgents, icon: Shield },
          { label: "Actions Today", value: todayLogs, icon: Activity },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl shadow-card p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="scoring">Scoring Rules</TabsTrigger>
          <TabsTrigger value="rewards">Reward Rules</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
        </TabsList>

        {/* User management tab */}
        <TabsContent value="users">
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Team</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Joined</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p, i) => {
                  const r = getRoleForUser(p.id);
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-border last:border-0 hover:bg-secondary transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{p.full_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          r === "admin" ? "bg-red-100 text-red-700" : r === "supervisor" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>{r}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.team_id || "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditUser(p)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {profiles.length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No users found</div>}
          </div>
        </TabsContent>

        {/* Scoring rules tab */}
        <TabsContent value="scoring">
          <div className="bg-card rounded-xl shadow-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Point Values Per Action</h3>
            <div className="space-y-3">
              {scoringRules.map(rule => (
                <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground capitalize">{rule.rule_name.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                  <Input
                    type="number"
                    className="w-20 text-center"
                    defaultValue={rule.points_per_action}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (val !== rule.points_per_action) updateScoringMutation.mutate({ id: rule.id, points: val });
                    }}
                  />
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Reward rules tab */}
        <TabsContent value="rewards">
          <div className="bg-card rounded-xl shadow-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Reward Thresholds</h3>
            <div className="space-y-3">
              {rewards.map(reward => (
                <div key={reward.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{reward.name}</p>
                    <p className="text-xs text-muted-foreground">{reward.description} — Type: {reward.type}</p>
                  </div>
                  <Input
                    type="number"
                    className="w-24 text-center"
                    defaultValue={reward.threshold_points}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (val !== reward.threshold_points) updateRewardMutation.mutate({ id: reward.id, threshold: val });
                    }}
                  />
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Audit logs tab */}
        <TabsContent value="logs">
          <div className="bg-card rounded-xl shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {auditLogs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No audit logs yet</p>}
              {auditLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-secondary"
                >
                  <div>
                    <span className="text-sm text-foreground">{log.action}</span>
                    {log.target_table && <span className="text-xs text-muted-foreground ml-2">({log.target_table})</span>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-3">{formatTime(log.created_at)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit user modal */}
      <Dialog open={userModal} onOpenChange={setUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Team ID</Label>
              <Input placeholder="e.g. team-alpha" value={editTeam} onChange={e => setEditTeam(e.target.value)} />
            </div>
            <Button onClick={saveUser} className="w-full bg-accent text-accent-foreground hover:bg-orange-light">
              <Save className="w-4 h-4 mr-1.5" /> Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
