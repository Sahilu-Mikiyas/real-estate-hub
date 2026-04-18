import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Calendar, MessageSquare, ChevronRight, LayoutGrid, List, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRBAC } from "@/contexts/RBACContext";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;
type LeadStatus = Enums<"lead_status">;

const STAGES: { key: LeadStatus; label: string; color: string }[] = [
  { key: "new", label: "New", color: "bg-blue-500" },
  { key: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { key: "potential", label: "Potential", color: "bg-purple-500" },
  { key: "negotiating", label: "Negotiating", color: "bg-orange-500" },
  { key: "closed", label: "Closed", color: "bg-green-500" },
  { key: "lost", label: "Lost", color: "bg-red-500" },
];

export default function LeadFollowup() {
  const { userId } = useRBAC();
  const qc = useQueryClient();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [open, setOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // New follow-up form
  const [noteText, setNoteText] = useState("");
  const [actionType, setActionType] = useState<string>("note");
  const [nextDate, setNextDate] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["followup-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: followups = [] } = useQuery({
    queryKey: ["lead-followups", selected?.id],
    queryFn: async () => {
      if (!selected) return [];
      const { data, error } = await supabase
        .from("lead_followups")
        .select("*")
        .eq("lead_id", selected.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selected,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ leadId, newStatus, oldStatus }: { leadId: string; newStatus: LeadStatus; oldStatus: LeadStatus }) => {
      const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
      if (error) throw error;
      await supabase.from("lead_followups").insert({
        lead_id: leadId,
        agent_id: userId,
        action: "status_change",
        old_status: oldStatus,
        new_status: newStatus,
        notes: `Moved from ${oldStatus} to ${newStatus}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followup-leads"] });
      qc.invalidateQueries({ queryKey: ["lead-followups"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addFollowup = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const { error } = await supabase.from("lead_followups").insert({
        lead_id: selected.id,
        agent_id: userId,
        action: actionType as any,
        notes: noteText,
        next_action_date: nextDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-followups"] });
      setNoteText(""); setNextDate("");
      toast.success("Follow-up logged");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleDrop = (newStatus: LeadStatus) => {
    if (!draggingId) return;
    const lead = leads.find(l => l.id === draggingId);
    if (lead && lead.status !== newStatus) {
      updateStatus.mutate({ leadId: draggingId, newStatus, oldStatus: lead.status });
    }
    setDraggingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Lead Follow-up</h1>
          <p className="text-sm text-muted-foreground">Track and progress your leads through the pipeline</p>
        </div>
        <div className="flex gap-2 bg-secondary rounded-lg p-1">
          <button
            onClick={() => setView("kanban")}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition ${view === "kanban" ? "bg-card shadow-sm" : ""}`}
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition ${view === "list" ? "bg-card shadow-sm" : ""}`}
          >
            <List className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.status === stage.key);
            return (
              <div
                key={stage.key}
                className="bg-secondary/50 rounded-lg p-2 min-h-[400px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage.key)}
              >
                <div className="flex items-center justify-between px-2 py-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <p className="text-xs font-semibold uppercase tracking-wider">{stage.label}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {stageLeads.map(lead => (
                      <motion.div
                        key={lead.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        draggable
                        onDragStart={() => setDraggingId(lead.id)}
                        onClick={() => { setSelected(lead); setOpen(true); }}
                        className="bg-card rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition border border-border"
                      >
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{lead.phone}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            lead.potential === "high" ? "bg-red-100 text-red-700" :
                            lead.potential === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {lead.potential}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{lead.property ?? ""}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Lead</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Potential</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Last Update</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-orange-subtle/40 cursor-pointer"
                    onClick={() => { setSelected(lead); setOpen(true); }}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={lead.status} onValueChange={(v) => updateStatus.mutate({ leadId: lead.id, newStatus: v as LeadStatus, oldStatus: lead.status })}>
                        <SelectTrigger className="h-7 w-32 text-xs" onClick={(e) => e.stopPropagation()}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{lead.potential}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}</td>
                    <td className="px-4 py-3 text-right"><ChevronRight className="w-4 h-4 inline text-muted-foreground" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Detail Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <a href={`tel:${selected.phone}`} className="flex-1"><Button variant="outline" className="w-full" size="sm"><Phone className="w-4 h-4 mr-1.5" />Call</Button></a>
                  {selected.email && <a href={`mailto:${selected.email}`} className="flex-1"><Button variant="outline" className="w-full" size="sm"><Mail className="w-4 h-4 mr-1.5" />Email</Button></a>}
                </div>

                <Tabs defaultValue="timeline">
                  <TabsList className="w-full">
                    <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
                    <TabsTrigger value="add" className="flex-1">Log Action</TabsTrigger>
                    <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline" className="space-y-3 mt-4">
                    {followups.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No follow-ups yet — log your first action.</p>
                    ) : followups.map((f: any) => (
                      <div key={f.id} className="flex gap-3 p-3 bg-secondary/50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                          {f.action === "call" ? <Phone className="w-4 h-4" /> :
                           f.action === "email" ? <Mail className="w-4 h-4" /> :
                           f.action === "meeting" ? <Calendar className="w-4 h-4" /> :
                           f.action === "status_change" ? <ChevronRight className="w-4 h-4" /> :
                           f.action === "reminder" ? <Clock className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{f.action.replace("_", " ")}</p>
                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}</p>
                          </div>
                          {f.notes && <p className="text-sm mt-1">{f.notes}</p>}
                          {f.next_action_date && (
                            <p className="text-xs text-accent mt-1">Next: {format(new Date(f.next_action_date), "PPP")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="add" className="space-y-3 mt-4">
                    <div>
                      <Label>Action type</Label>
                      <Select value={actionType} onValueChange={setActionType}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea className="mt-1" value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} />
                    </div>
                    <div>
                      <Label>Next action date (optional)</Label>
                      <Input type="date" className="mt-1" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
                    </div>
                    <Button onClick={() => addFollowup.mutate()} disabled={addFollowup.isPending || !noteText.trim()} className="bg-accent text-accent-foreground hover:bg-orange-light w-full">
                      <Plus className="w-4 h-4 mr-1.5" /> Log follow-up
                    </Button>
                  </TabsContent>

                  <TabsContent value="info" className="mt-4 space-y-3">
                    <InfoRow label="Phone" value={selected.phone} />
                    <InfoRow label="Email" value={selected.email ?? "—"} />
                    <InfoRow label="Property interest" value={selected.property ?? "—"} />
                    <InfoRow label="Potential" value={selected.potential} />
                    <InfoRow label="Created" value={format(new Date(selected.created_at), "PPP")} />
                    {selected.remarks && <InfoRow label="Remarks" value={selected.remarks} />}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
