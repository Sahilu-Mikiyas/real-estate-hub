import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRBAC } from "@/contexts/RBACContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";

type SocialPost = Tables<"social_posts">;
type SocialPlatform = Enums<"social_platform">;

const ROWS_PER_PAGE = 10;

const platformConfig: Record<SocialPlatform, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "bg-blue-100 text-blue-700" },
  instagram: { label: "Instagram", color: "bg-pink-100 text-pink-700" },
  telegram: { label: "Telegram", color: "bg-sky-100 text-sky-700" },
  tiktok: { label: "TikTok", color: "bg-gray-100 text-gray-700" },
  linkedin: { label: "LinkedIn", color: "bg-indigo-100 text-indigo-700" },
  twitter: { label: "Twitter/X", color: "bg-slate-100 text-slate-700" },
};

const SocialMedia = () => {
  const { role, userId, teamId } = useRBAC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editPost, setEditPost] = useState<SocialPost | null>(null);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  // Form state
  const [formPlatform, setFormPlatform] = useState<SocialPlatform>("facebook");
  const [formProperty, setFormProperty] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formNotes, setFormNotes] = useState("");

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["social-posts", role, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .order("post_date", { ascending: false });
      if (error) throw error;
      return data as SocialPost[];
    },
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async (post: TablesInsert<"social_posts">) => {
      const { error } = await supabase.from("social_posts").insert(post);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-posts"] });
      toast.success("Post logged!");
      resetForm();
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SocialPost> }) => {
      const { error } = await supabase.from("social_posts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast.success("Post updated!");
      setEditPost(null);
      resetForm();
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-posts"] });
      toast.success("Post deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormPlatform("facebook");
    setFormProperty("");
    setFormDate(format(new Date(), "yyyy-MM-dd"));
    setFormNotes("");
    setEditPost(null);
  };

  const openEdit = (post: SocialPost) => {
    setEditPost(post);
    setFormPlatform(post.platform);
    setFormProperty(post.property || "");
    setFormDate(post.post_date);
    setFormNotes(post.notes || "");
    setOpen(true);
  };

  const handleSave = () => {
    if (editPost) {
      updateMutation.mutate({
        id: editPost.id,
        updates: {
          platform: formPlatform,
          property: formProperty || null,
          post_date: formDate,
          notes: formNotes.trim() || null,
        },
      });
    } else {
      addMutation.mutate({
        platform: formPlatform,
        property: formProperty || null,
        post_date: formDate,
        notes: formNotes.trim() || null,
        agent_id: userId,
        team_id: teamId,
      });
    }
  };

  // Filter & search
  const filtered = posts.filter((p) => {
    const matchesSearch =
      (p.property && p.property.toLowerCase().includes(search.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesPlatform = platformFilter === "all" || p.platform === platformFilter;
    return (search ? matchesSearch : true) && matchesPlatform;
  });

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const roleLabel = role === "admin" ? "All posts across the system" : role === "supervisor" ? "Your team's posts" : "Your personal posts";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Social Media</h1>
          <p className="text-sm text-muted-foreground">{roleLabel} · {filtered.length} total</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-orange-light btn-press">
              <Plus className="w-4 h-4 mr-1.5" /> Log Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editPost ? "Edit Post" : "Log Social Post"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Platform</Label>
                <Select value={formPlatform} onValueChange={(v) => setFormPlatform(v as SocialPlatform)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(platformConfig) as SocialPlatform[]).map((p) => (
                      <SelectItem key={p} value={p}>{platformConfig[p].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Property</Label>
                <Input placeholder="Property name" className="mt-1" value={formProperty} onChange={(e) => setFormProperty(e.target.value)} />
              </div>
              <div>
                <Label>Post Date</Label>
                <Input type="date" className="mt-1" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div>
                <Label>Notes</Label>
                <Input placeholder="Optional notes..." className="mt-1" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-orange-light btn-press"
                onClick={handleSave}
                disabled={addMutation.isPending || updateMutation.isPending}
              >
                {addMutation.isPending || updateMutation.isPending ? "Saving..." : editPost ? "Update Post" : "Save Post"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by property or notes..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={platformFilter} onValueChange={(v) => { setPlatformFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {(Object.keys(platformConfig) as SocialPlatform[]).map((p) => (
              <SelectItem key={p} value={p}>{platformConfig[p].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Platform</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Property</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Notes</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  {search || platformFilter !== "all" ? "No posts match your filters" : "No posts yet — log your first one!"}
                </td>
              </tr>
            ) : (
              paginated.map((post, i) => (
                <motion.tr
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border last:border-0 hover:bg-orange-subtle/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${platformConfig[post.platform].color}`}>
                      {platformConfig[post.platform].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{post.property || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(post.post_date), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{post.notes || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(post)}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      {(role === "admin" || post.agent_id === userId) && (
                        <button
                          onClick={() => {
                            if (confirm("Delete this post?")) deleteMutation.mutate(post.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages} · {filtered.length} posts</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMedia;
