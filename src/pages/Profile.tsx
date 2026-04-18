import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Save, Lock, Bell, User as UserIcon, TrendingUp, Award, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useRBAC } from "@/contexts/RBACContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Profile() {
  const { user, profile } = useAuth();
  const { userId, role } = useRBAC();
  const qc = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState("system");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyLeads, setNotifyLeads] = useState(true);
  const [notifyClosings, setNotifyClosings] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch preferences
  const { data: prefs } = useQuery({
    queryKey: ["preferences", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profile_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  // Fetch performance stats
  const { data: stats } = useQuery({
    queryKey: ["my-stats", userId],
    queryFn: async () => {
      if (!userId) return null;
      const [leadsRes, visitsRes, postsRes, closingsRes, badgesRes] = await Promise.all([
        supabase.from("leads").select("id, status", { count: "exact" }).eq("agent_id", userId),
        supabase.from("visits").select("id", { count: "exact" }).eq("agent_id", userId),
        supabase.from("social_posts").select("id", { count: "exact" }).eq("agent_id", userId),
        supabase.from("closings").select("id, status, deal_price, commission_amount").eq("agent_id", userId),
        supabase.from("agent_badges").select("badge_id, badges(name, icon)").eq("agent_id", userId),
      ]);
      const closings = closingsRes.data ?? [];
      const completedClosings = closings.filter((c: any) => c.status === "completed");
      const totalRevenue = completedClosings.reduce((sum: number, c: any) => sum + Number(c.deal_price || 0), 0);
      const totalCommission = completedClosings.reduce((sum: number, c: any) => sum + Number(c.commission_amount || 0), 0);
      const closedLeads = (leadsRes.data ?? []).filter((l: any) => l.status === "closed").length;
      const points = ((leadsRes.count ?? 0) * 5) + ((visitsRes.count ?? 0) * 10) + ((postsRes.count ?? 0) * 3) + (completedClosings.length * 50);
      return {
        leads: leadsRes.count ?? 0,
        visits: visitsRes.count ?? 0,
        posts: postsRes.count ?? 0,
        closings: completedClosings.length,
        closedLeads,
        totalRevenue,
        totalCommission,
        points,
        badges: badgesRes.data ?? [],
      };
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (profile) setFullName(profile.full_name);
  }, [profile]);

  useEffect(() => {
    if (prefs) {
      setPhone(prefs.phone ?? "");
      setBio(prefs.bio ?? "");
      setTheme(prefs.theme);
      setNotifyEmail(prefs.notify_email);
      setNotifyInApp(prefs.notify_in_app);
      setNotifyLeads(prefs.notify_leads);
      setNotifyClosings(prefs.notify_closings);
    }
  }, [prefs]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);
      if (pErr) throw pErr;

      const { error: prefErr } = await supabase
        .from("profile_preferences")
        .upsert({
          user_id: userId,
          phone,
          bio,
          theme,
          notify_email: notifyEmail,
          notify_in_app: notifyInApp,
          notify_leads: notifyLeads,
          notify_closings: notifyClosings,
        });
      if (prefErr) throw prefErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["preferences"] });
      toast.success("Profile saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const changePassword = async () => {
    if (newPassword.length < 6) return toast.error("Password must be 6+ chars");
    if (newPassword !== confirmPassword) return toast.error("Passwords don't match");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setNewPassword("");
    setConfirmPassword("");
  };

  const uploadAvatar = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", userId);
      if (updErr) throw updErr;
      toast.success("Avatar updated");
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account, preferences, and view your performance</p>
      </div>

      {/* Performance summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats ? (
          <>
            <StatTile icon={<TrendingUp className="w-4 h-4" />} label="Total Points" value={stats.points} accent />
            <StatTile icon={<UserIcon className="w-4 h-4" />} label="Leads" value={stats.leads} />
            <StatTile icon={<Trophy className="w-4 h-4" />} label="Closings" value={stats.closings} />
            <StatTile icon={<Award className="w-4 h-4" />} label="Badges" value={stats.badges.length} />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        )}
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account"><UserIcon className="w-4 h-4 mr-1.5" />Account</TabsTrigger>
          <TabsTrigger value="security"><Lock className="w-4 h-4 mr-1.5" />Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1.5" />Notifications</TabsTrigger>
          <TabsTrigger value="performance"><TrendingUp className="w-4 h-4 mr-1.5" />Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Account details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback>{fullName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" className="hidden" disabled={uploading}
                      onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                  </label>
                </div>
                <div>
                  <p className="font-semibold text-lg">{fullName || "—"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent capitalize">{role}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Full name</Label>
                  <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 3XX XXXXXXX" />
                </div>
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea className="mt-1" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." />
              </div>
              <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending} className="bg-accent text-accent-foreground hover:bg-orange-light">
                <Save className="w-4 h-4 mr-1.5" /> {saveProfile.isPending ? "Saving..." : "Save changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div>
                <Label>New password</Label>
                <Input type="password" className="mt-1" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label>Confirm new password</Label>
                <Input type="password" className="mt-1" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button onClick={changePassword} className="bg-accent text-accent-foreground hover:bg-orange-light">
                <Lock className="w-4 h-4 mr-1.5" /> Update password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Notification preferences</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <PrefRow label="Email notifications" desc="Receive updates by email" checked={notifyEmail} onChange={setNotifyEmail} />
              <PrefRow label="In-app notifications" desc="Show toast & bell alerts" checked={notifyInApp} onChange={setNotifyInApp} />
              <PrefRow label="Lead alerts" desc="When a lead changes status or needs follow-up" checked={notifyLeads} onChange={setNotifyLeads} />
              <PrefRow label="Closing alerts" desc="Deal status updates and document signatures" checked={notifyClosings} onChange={setNotifyClosings} />
              <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending} className="bg-accent text-accent-foreground hover:bg-orange-light">
                <Save className="w-4 h-4 mr-1.5" /> Save preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4 space-y-4">
          {stats && (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <Card><CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">Total Revenue Generated</p>
                  <p className="text-2xl font-bold text-foreground mt-1">ETB {stats.totalRevenue.toLocaleString()}</p>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">Commission Earned</p>
                  <p className="text-2xl font-bold text-accent mt-1">ETB {stats.totalCommission.toLocaleString()}</p>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">Site Visits</p>
                  <p className="text-2xl font-bold mt-1">{stats.visits}</p>
                </CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Earned badges</CardTitle></CardHeader>
                <CardContent>
                  {stats.badges.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No badges yet — keep working to unlock!</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {stats.badges.map((b: any, i: number) => (
                        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
                          <Award className="w-4 h-4" /> {b.badges?.name}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatTile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className={accent ? "text-accent" : "text-muted-foreground"}>{icon}</div>
        </div>
        <p className={`text-2xl font-bold mt-2 ${accent ? "text-accent" : "text-foreground"}`}>{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function PrefRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
