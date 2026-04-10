import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, MoreHorizontal, Phone, Mail, ChevronLeft, ChevronRight,
  Trash2, Edit, Eye, X, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useRBAC } from "@/contexts/RBACContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;
type LeadStatus = Enums<"lead_status">;
type LeadPotential = Enums<"lead_potential">;

const ROWS_PER_PAGE = 10;

const statusColors: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  potential: "bg-purple-100 text-purple-700",
  negotiating: "bg-orange-100 text-orange-700",
  closed: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

const potentialColors: Record<LeadPotential, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<LeadStatus, string> = {
  new: "New", contacted: "Contacted", potential: "Potential",
  negotiating: "Negotiating", closed: "Closed", lost: "Lost",
};

const Leads = () => {
  const { role, userId } = useRBAC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formProperty, setFormProperty] = useState("");
  const [formPotential, setFormPotential] = useState<LeadPotential>("medium");
  const [formRemarks, setFormRemarks] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Edit state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editStatus, setEditStatus] = useState<LeadStatus>("new");

  // Fetch leads — RLS handles role filtering
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", role, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  // Add lead mutation
  const addMutation = useMutation({
    mutationFn: async (lead: TablesInsert<"leads">) => {
      const { error } = await supabase.from("leads").insert(lead);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-leads"] });
      toast.success("Lead added successfully!");
      resetForm();
      setAddOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Update lead mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      const { error } = await supabase.from("leads").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated!");
      setEditingLead(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete lead mutation (admin only)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-leads"] });
      toast.success("Lead deleted");
      setDetailOpen(false);
      setSelectedLead(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormName(""); setFormPhone(""); setFormEmail("");
    setFormProperty(""); setFormPotential("medium"); setFormRemarks("");
    setDuplicateWarning(null);
  };

  // Duplicate detection
  const checkDuplicates = (name: string, phone: string) => {
    if (!name && !phone) { setDuplicateWarning(null); return; }
    const phoneDup = phone && leads.find(l => l.phone === phone);
    if (phoneDup) {
      setDuplicateWarning(`Phone number matches existing lead: ${phoneDup.name}`);
      return;
    }
    const nameDup = name && leads.find(l =>
      l.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(l.name.toLowerCase())
    );
    if (nameDup && name.length > 2) {
      setDuplicateWarning(`Similar name found: ${nameDup.name} (${nameDup.phone})`);
      return;
    }
    setDuplicateWarning(null);
  };

  const handleAddLead = () => {
    if (!formName.trim() || !formPhone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    addMutation.mutate({
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim() || null,
      property: formProperty || null,
      potential: formPotential,
      remarks: formRemarks.trim() || null,
      agent_id: userId,
    });
  };

  // Filter & search
  const filtered = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" ? "All leads across the system" : role === "supervisor" ? "Your team's leads" : "Your personal leads"}
            {" · "}{filtered.length} total
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-orange-light btn-press">
              <Plus className="w-4 h-4 mr-1.5" /> Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {duplicateWarning && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {duplicateWarning}
                </div>
              )}
              <div>
                <Label>Full Name *</Label>
                <Input
                  placeholder="Enter name"
                  className="mt-1"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); checkDuplicates(e.target.value, formPhone); }}
                />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input
                  placeholder="+92 3XX XXXXXXX"
                  className="mt-1"
                  value={formPhone}
                  onChange={(e) => { setFormPhone(e.target.value); checkDuplicates(formName, e.target.value); }}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input placeholder="email@example.com" className="mt-1" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
              </div>
              <div>
                <Label>Property Interest</Label>
                <Select value={formProperty} onValueChange={setFormProperty}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plot">Plot</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="shop">Shop</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Potential</Label>
                <Select value={formPotential} onValueChange={(v) => setFormPotential(v as LeadPotential)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Remarks</Label>
                <Input placeholder="Optional notes..." className="mt-1" value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)} />
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-orange-light btn-press"
                onClick={handleAddLead}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? "Saving..." : "Save Lead"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {(Object.keys(statusLabels) as LeadStatus[]).map(s => (
              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Phone</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Potential</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Property</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  {search || statusFilter !== "all" ? "No leads match your filters" : "No leads yet — add your first one!"}
                </td>
              </tr>
            ) : (
              paginated.map((lead, i) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border last:border-0 hover:bg-orange-subtle/50 transition-colors cursor-pointer"
                  onClick={() => { setSelectedLead(lead); setDetailOpen(true); }}
                >
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{lead.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{lead.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${potentialColors[lead.potential]}`}>
                      {lead.potential.charAt(0).toUpperCase() + lead.potential.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{lead.property ?? "—"}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        </a>
                      )}
                      <button
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                        onClick={() => { setSelectedLead(lead); setDetailOpen(true); }}
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
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
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} · {filtered.length} leads
            </p>
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

      {/* Lead Detail Panel */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>{selectedLead.name}</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedLead.status]}`}>
                    {statusLabels[selectedLead.status]}
                  </span>
                </SheetTitle>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                  <TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{selectedLead.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{selectedLead.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Property</p>
                      <p className="text-sm font-medium">{selectedLead.property || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Potential</p>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${potentialColors[selectedLead.potential]}`}>
                        {selectedLead.potential.charAt(0).toUpperCase() + selectedLead.potential.slice(1)}
                      </span>
                    </div>
                  </div>
                  {selectedLead.remarks && (
                    <div>
                      <p className="text-xs text-muted-foreground">Remarks</p>
                      <p className="text-sm mt-1">{selectedLead.remarks}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm">{new Date(selectedLead.created_at).toLocaleDateString()}</p>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Visit history, closings, and posts will appear here in Phase 4+
                  </p>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-4">
                  {/* Inline status edit */}
                  <div>
                    <Label>Update Status</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Select
                        value={editStatus}
                        onValueChange={(v) => setEditStatus(v as LeadStatus)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(statusLabels) as LeadStatus[]).map(s => (
                            <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="bg-accent text-accent-foreground hover:bg-orange-light"
                        onClick={() => {
                          updateMutation.mutate({
                            id: selectedLead.id,
                            updates: { status: editStatus },
                          });
                          setSelectedLead({ ...selectedLead, status: editStatus });
                        }}
                        disabled={updateMutation.isPending}
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  {/* Admin delete */}
                  {role === "admin" && (
                    <Button
                      variant="destructive"
                      className="w-full mt-4"
                      onClick={() => {
                        if (confirm("Delete this lead permanently?")) {
                          deleteMutation.mutate(selectedLead.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      {deleteMutation.isPending ? "Deleting..." : "Delete Lead"}
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Leads;
