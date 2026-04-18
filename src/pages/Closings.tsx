import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FileText, Upload, Download, X, CheckCircle2, Clock, FileSignature,
  DollarSign, Calendar, User, Building2, Trash2, ChevronRight, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRBAC } from "@/contexts/RBACContext";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Closing = Tables<"closings">;
type ClosingStatus = Enums<"closing_status">;

const statusStyles: Record<ClosingStatus, { bg: string; label: string; icon: any }> = {
  draft: { bg: "bg-gray-100 text-gray-700 border-gray-300", label: "Draft", icon: FileText },
  pending: { bg: "bg-yellow-100 text-yellow-700 border-yellow-300", label: "Pending", icon: Clock },
  completed: { bg: "bg-green-100 text-green-700 border-green-300", label: "Completed", icon: CheckCircle2 },
  cancelled: { bg: "bg-red-100 text-red-700 border-red-300", label: "Cancelled", icon: X },
};

export default function Closings() {
  const { userId, role } = useRBAC();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Closing | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    property_id: "", property_name: "", buyer_name: "", buyer_email: "", buyer_phone: "", buyer_id_number: "",
    seller_name: "", seller_phone: "", deal_price: "", commission_amount: "", commission_percent: "",
    deal_length_months: "", payment_method: "cash", terms: "", notes: "", signed_date: "",
  });

  const { data: closings = [], isLoading } = useQuery({
    queryKey: ["closings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("closings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Closing[];
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["properties-for-closing"],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, name, price").eq("status", "available");
      return data ?? [];
    },
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["closing-docs", selected?.id],
    queryFn: async () => {
      if (!selected) return [];
      const { data } = await supabase.from("closing_documents").select("*").eq("closing_id", selected.id);
      return data ?? [];
    },
    enabled: !!selected,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.property_name || !form.buyer_name) throw new Error("Property and buyer required");
      const { error } = await supabase.from("closings").insert({
        agent_id: userId,
        property_id: form.property_id || null,
        property_name: form.property_name,
        buyer_name: form.buyer_name,
        buyer_email: form.buyer_email || null,
        buyer_phone: form.buyer_phone || null,
        buyer_id_number: form.buyer_id_number || null,
        seller_name: form.seller_name || null,
        seller_phone: form.seller_phone || null,
        deal_price: Number(form.deal_price) || 0,
        commission_amount: Number(form.commission_amount) || 0,
        commission_percent: Number(form.commission_percent) || 0,
        deal_length_months: form.deal_length_months ? Number(form.deal_length_months) : null,
        payment_method: form.payment_method,
        terms: form.terms || null,
        notes: form.notes || null,
        signed_date: form.signed_date || null,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closings"] });
      toast.success("Closing created");
      setAddOpen(false);
      setForm({ property_id: "", property_name: "", buyer_name: "", buyer_email: "", buyer_phone: "", buyer_id_number: "",
        seller_name: "", seller_phone: "", deal_price: "", commission_amount: "", commission_percent: "",
        deal_length_months: "", payment_method: "cash", terms: "", notes: "", signed_date: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ClosingStatus }) => {
      const { error } = await supabase.from("closings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closings"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteClose = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("closings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closings"] });
      setDetailOpen(false);
      toast.success("Closing deleted");
    },
  });

  const uploadDoc = async (file: File, docType: string, label: string) => {
    if (!selected) return;
    try {
      const ext = file.name.split(".").pop();
      const bucket = docType === "signature" ? "signatures" : "closing-documents";
      const path = `${userId}/${selected.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("closing_documents").insert({
        closing_id: selected.id,
        uploaded_by: userId,
        doc_type: docType,
        label,
        file_path: `${bucket}/${path}`,
        file_size: file.size,
      });
      if (dbErr) throw dbErr;
      qc.invalidateQueries({ queryKey: ["closing-docs"] });
      toast.success("Document uploaded");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const downloadDoc = async (filePath: string, label: string) => {
    const [bucket, ...rest] = filePath.split("/");
    const path = rest.join("/");
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  // KPI cards
  const total = closings.length;
  const completed = closings.filter(c => c.status === "completed").length;
  const totalRevenue = closings.filter(c => c.status === "completed").reduce((s, c) => s + Number(c.deal_price), 0);
  const totalCommission = closings.filter(c => c.status === "completed").reduce((s, c) => s + Number(c.commission_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Deal Closings</h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" ? "All closings" : role === "supervisor" ? "Team closings" : "Your closings"} · {total} deals
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-accent text-accent-foreground hover:bg-orange-light">
          <Plus className="w-4 h-4 mr-1.5" /> New Closing
        </Button>
      </div>

      {/* KPI Cards (interactive) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<FileSignature className="w-5 h-5" />} label="Total Deals" value={total} />
        <KpiCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed" value={completed} accent />
        <KpiCard icon={<DollarSign className="w-5 h-5" />} label="Revenue" value={`ETB ${(totalRevenue / 1000000).toFixed(1)}M`} />
        <KpiCard icon={<DollarSign className="w-5 h-5" />} label="Commission" value={`ETB ${(totalCommission / 1000).toFixed(0)}K`} accent />
      </div>

      {/* Closings table */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Property</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Buyer</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Price</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Commission</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Date</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
                </tr>
              )) : closings.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">No closings yet — create your first deal!</td></tr>
              ) : closings.map((c, i) => {
                const Icon = statusStyles[c.status].icon;
                return (
                  <motion.tr key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => { setSelected(c); setDetailOpen(true); }}
                    className="border-b border-border last:border-0 hover:bg-orange-subtle/40 cursor-pointer transition">
                    <td className="px-4 py-3 text-sm font-medium">{c.property_name}</td>
                    <td className="px-4 py-3 text-sm">{c.buyer_name}</td>
                    <td className="px-4 py-3 text-sm">ETB {Number(c.deal_price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-accent font-medium">ETB {Number(c.commission_amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[c.status].bg}`}>
                        <Icon className="w-3 h-3" /> {statusStyles[c.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(c.created_at), "PP")}</td>
                    <td className="px-4 py-3 text-right"><Eye className="w-4 h-4 inline text-muted-foreground" /></td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Closing</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <div className="md:col-span-2">
              <Label>Property *</Label>
              <Select value={form.property_id} onValueChange={(v) => {
                const p = properties.find((x: any) => x.id === v);
                setForm({ ...form, property_id: v, property_name: p?.name ?? "", deal_price: p?.price?.toString() ?? form.deal_price });
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Field label="Buyer name *" value={form.buyer_name} onChange={(v) => setForm({ ...form, buyer_name: v })} />
            <Field label="Buyer phone" value={form.buyer_phone} onChange={(v) => setForm({ ...form, buyer_phone: v })} />
            <Field label="Buyer email" value={form.buyer_email} onChange={(v) => setForm({ ...form, buyer_email: v })} />
            <Field label="Buyer ID/CNIC" value={form.buyer_id_number} onChange={(v) => setForm({ ...form, buyer_id_number: v })} />
            <Field label="Seller name" value={form.seller_name} onChange={(v) => setForm({ ...form, seller_name: v })} />
            <Field label="Seller phone" value={form.seller_phone} onChange={(v) => setForm({ ...form, seller_phone: v })} />
            <Field label="Deal price (ETB) *" type="number" value={form.deal_price} onChange={(v) => setForm({ ...form, deal_price: v })} />
            <Field label="Commission %" type="number" value={form.commission_percent} onChange={(v) => {
              const pct = Number(v); const price = Number(form.deal_price);
              setForm({ ...form, commission_percent: v, commission_amount: price && pct ? ((price * pct) / 100).toString() : form.commission_amount });
            }} />
            <Field label="Commission amount" type="number" value={form.commission_amount} onChange={(v) => setForm({ ...form, commission_amount: v })} />
            <Field label="Deal length (months)" type="number" value={form.deal_length_months} onChange={(v) => setForm({ ...form, deal_length_months: v })} />
            <div>
              <Label>Payment method</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                  <SelectItem value="installments">Installments</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Signed date" type="date" value={form.signed_date} onChange={(v) => setForm({ ...form, signed_date: v })} />
            <div className="md:col-span-2">
              <Label>Terms</Label>
              <Textarea className="mt-1" rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea className="mt-1" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button onClick={() => create.mutate()} disabled={create.isPending} className="md:col-span-2 bg-accent text-accent-foreground hover:bg-orange-light">
              {create.isPending ? "Saving..." : "Create closing"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between gap-2">
                  <span>{selected.property_name}</span>
                  <Select value={selected.status} onValueChange={(v) => updateStatus.mutate({ id: selected.id, status: v as ClosingStatus })}>
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(statusStyles) as ClosingStatus[]).map(s => <SelectItem key={s} value={s}>{statusStyles[s].label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </SheetTitle>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                  <TabsTrigger value="parties" className="flex-1">Parties</TabsTrigger>
                  <TabsTrigger value="docs" className="flex-1">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-3 mt-4">
                  <DetailRow icon={<Building2 className="w-4 h-4" />} label="Property" value={selected.property_name} />
                  <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Deal price" value={`ETB ${Number(selected.deal_price).toLocaleString()}`} />
                  <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Commission" value={`ETB ${Number(selected.commission_amount).toLocaleString()} (${selected.commission_percent}%)`} />
                  <DetailRow icon={<Calendar className="w-4 h-4" />} label="Deal length" value={selected.deal_length_months ? `${selected.deal_length_months} months` : "—"} />
                  <DetailRow icon={<FileText className="w-4 h-4" />} label="Payment" value={selected.payment_method ?? "—"} />
                  <DetailRow icon={<Calendar className="w-4 h-4" />} label="Signed" value={selected.signed_date ? format(new Date(selected.signed_date), "PPP") : "—"} />
                  {selected.terms && <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Terms</p><p className="text-sm">{selected.terms}</p></div>}
                  {selected.notes && <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notes</p><p className="text-sm">{selected.notes}</p></div>}
                  {role === "admin" && (
                    <Button variant="destructive" size="sm" onClick={() => deleteClose.mutate(selected.id)}>
                      <Trash2 className="w-4 h-4 mr-1.5" /> Delete closing
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="parties" className="space-y-3 mt-4">
                  <Card><CardContent className="p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buyer</p>
                    <DetailRow icon={<User className="w-4 h-4" />} label="Name" value={selected.buyer_name} />
                    <DetailRow icon={<User className="w-4 h-4" />} label="Phone" value={selected.buyer_phone ?? "—"} />
                    <DetailRow icon={<User className="w-4 h-4" />} label="Email" value={selected.buyer_email ?? "—"} />
                    <DetailRow icon={<User className="w-4 h-4" />} label="CNIC" value={selected.buyer_id_number ?? "—"} />
                  </CardContent></Card>
                  <Card><CardContent className="p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seller</p>
                    <DetailRow icon={<User className="w-4 h-4" />} label="Name" value={selected.seller_name ?? "—"} />
                    <DetailRow icon={<User className="w-4 h-4" />} label="Phone" value={selected.seller_phone ?? "—"} />
                  </CardContent></Card>
                </TabsContent>

                <TabsContent value="docs" className="space-y-3 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <UploadButton label="Contract" docType="contract" onUpload={uploadDoc} />
                    <UploadButton label="Signature" docType="signature" onUpload={uploadDoc} />
                    <UploadButton label="ID copy" docType="id_copy" onUpload={uploadDoc} />
                    <UploadButton label="Other" docType="other" onUpload={uploadDoc} />
                  </div>
                  <div className="space-y-2 mt-4">
                    {docs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded</p>
                    ) : docs.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between p-3 bg-secondary/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-accent" />
                          <div>
                            <p className="text-sm font-medium">{d.label}</p>
                            <p className="text-xs text-muted-foreground capitalize">{d.doc_type.replace("_", " ")} · {d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : ""}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => downloadDoc(d.file_path, d.label)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card className="cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className={accent ? "text-accent" : "text-muted-foreground"}>{icon}</div>
          </div>
          <p className={`text-2xl font-bold mt-2 ${accent ? "text-accent" : ""}`}>{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="text-muted-foreground">{icon}</div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground w-24">{label}</p>
      <p className="text-sm font-medium flex-1">{value}</p>
    </div>
  );
}

function UploadButton({ label, docType, onUpload }: { label: string; docType: string; onUpload: (f: File, t: string, l: string) => void }) {
  return (
    <label className="cursor-pointer">
      <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-accent hover:bg-orange-subtle/30 transition">
        <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], docType, label)} />
    </label>
  );
}
