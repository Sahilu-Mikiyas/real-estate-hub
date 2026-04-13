import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Pencil, Trash2, Search, Filter, X, Bed, Bath, Ruler, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRBAC } from "@/contexts/RBACContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getPropertyImage, getPropertyImages } from "@/lib/propertyImages";

const statusStyles: Record<string, string> = {
  available: "bg-green-100 text-green-700 border-green-200",
  sold: "bg-red-100 text-red-700 border-red-200",
  reserved: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

type PropertyForm = {
  name: string;
  type: "plot" | "villa" | "shop" | "flat";
  location: string;
  block: string;
  price: number;
  price_label: string;
  status: "available" | "sold" | "reserved";
  description: string;
  area_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  features: string;
};

const emptyForm: PropertyForm = {
  name: "", type: "plot", location: "", block: "", price: 0, price_label: "",
  status: "available", description: "", area_sqft: null, bedrooms: null, bathrooms: null, features: "",
};

const Inventory = () => {
  const { role } = useRBAC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: PropertyForm) => {
      const payload = {
        name: f.name, type: f.type as any, location: f.location, block: f.block,
        price: f.price, price_label: f.price_label, status: f.status as any,
        description: f.description || null, area_sqft: f.area_sqft, bedrooms: f.bedrooms, bathrooms: f.bathrooms,
        features: f.features ? f.features.split(",").map(s => s.trim()) : [],
      };
      if (editingId) {
        const { error } = await supabase.from("properties").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("properties").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success(editingId ? "Property updated" : "Property added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Property deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = properties.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const openEdit = (prop: any) => {
    setEditingId(prop.id);
    setForm({
      name: prop.name, type: prop.type, location: prop.location, block: prop.block,
      price: prop.price, price_label: prop.price_label, status: prop.status,
      description: prop.description || "", area_sqft: prop.area_sqft, bedrooms: prop.bedrooms, bathrooms: prop.bathrooms,
      features: (prop.features || []).join(", "),
    });
    setModalOpen(true);
  };

  const openDetail = (prop: any) => {
    setSelectedProperty(prop);
    setGalleryIndex(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} properties</p>
        </div>
        {role === "admin" && (
          <Dialog open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-orange-light btn-press">
                <Plus className="w-4 h-4 mr-1.5" /> Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Property" : "Add Property"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plot">Plot</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="shop">Shop</SelectItem>
                        <SelectItem value="flat">Flat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                  </div>
                  <div>
                    <Label>Block</Label>
                    <Input value={form.block} onChange={e => setForm({ ...form, block: e.target.value })} />
                  </div>
                  <div>
                    <Label>Price (PKR)</Label>
                    <Input type="number" value={form.price || ""} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Price Label</Label>
                    <Input placeholder="PKR 45L" value={form.price_label} onChange={e => setForm({ ...form, price_label: e.target.value })} />
                  </div>
                  <div>
                    <Label>Area (sqft)</Label>
                    <Input type="number" value={form.area_sqft ?? ""} onChange={e => setForm({ ...form, area_sqft: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label>Bedrooms</Label>
                    <Input type="number" value={form.bedrooms ?? ""} onChange={e => setForm({ ...form, bedrooms: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label>Bathrooms</Label>
                    <Input type="number" value={form.bathrooms ?? ""} onChange={e => setForm({ ...form, bathrooms: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div className="col-span-2">
                    <Label>Features (comma-separated)</Label>
                    <Input placeholder="Corner, Park Facing, Pool" value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-orange-light" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editingId ? "Update Property" : "Add Property"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search properties..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]"><Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="plot">Plot</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="shop">Shop</SelectItem>
            <SelectItem value="flat">Flat</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl shadow-card animate-pulse">
              <div className="h-40 bg-secondary rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-1/2" />
                <div className="h-6 bg-secondary rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((prop, i) => (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                onClick={() => openDetail(prop)}
                className="bg-card rounded-xl shadow-card overflow-hidden group cursor-pointer"
              >
                <div className="h-40 relative overflow-hidden">
                  <img
                    src={getPropertyImage(prop.type, i)}
                    alt={prop.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusStyles[prop.status]}`}>
                    {prop.status}
                  </span>
                  {role === "admin" && (
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(prop); }} className="p-1.5 bg-card/90 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this property?")) deleteMutation.mutate(prop.id); }} className="p-1.5 bg-card/90 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{prop.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1 capitalize flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {prop.location} • {prop.block}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                    {prop.area_sqft && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{prop.area_sqft} sqft</span>}
                    {prop.bedrooms && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{prop.bedrooms}</span>}
                    {prop.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{prop.bathrooms}</span>}
                  </div>
                  <p className="text-lg font-bold text-accent">{prop.price_label || `PKR ${(prop.price / 100000).toFixed(0)}L`}</p>
                  {prop.features && prop.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(prop.features as string[]).slice(0, 3).map((f) => (
                        <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No properties found</p>
        </div>
      )}

      {/* Property Detail Modal */}
      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setSelectedProperty(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Image gallery */}
              <div className="relative h-64 sm:h-80 overflow-hidden rounded-t-2xl">
                {(() => {
                  const images = getPropertyImages(selectedProperty.type);
                  const img = images[galleryIndex % images.length];
                  return (
                    <>
                      <img src={img} alt={selectedProperty.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={() => setGalleryIndex((galleryIndex - 1 + images.length) % images.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 hover:bg-card shadow transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setGalleryIndex((galleryIndex + 1) % images.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 hover:bg-card shadow transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {images.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setGalleryIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-colors ${idx === galleryIndex ? "bg-accent" : "bg-card/60"}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-card/80 hover:bg-card shadow transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[selectedProperty.status]}`}>
                  {selectedProperty.status}
                </span>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedProperty.name}</h2>
                    <p className="text-sm text-muted-foreground capitalize flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {selectedProperty.type} • {selectedProperty.location} • {selectedProperty.block}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-accent">{selectedProperty.price_label}</p>
                </div>

                {selectedProperty.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedProperty.description}</p>
                )}

                {/* Specs */}
                <div className="grid grid-cols-3 gap-3">
                  {selectedProperty.area_sqft && (
                    <div className="bg-secondary rounded-xl p-3 text-center">
                      <Ruler className="w-5 h-5 mx-auto text-accent mb-1" />
                      <p className="text-sm font-semibold text-foreground">{selectedProperty.area_sqft} sqft</p>
                      <p className="text-[10px] text-muted-foreground">Area</p>
                    </div>
                  )}
                  {selectedProperty.bedrooms && (
                    <div className="bg-secondary rounded-xl p-3 text-center">
                      <Bed className="w-5 h-5 mx-auto text-accent mb-1" />
                      <p className="text-sm font-semibold text-foreground">{selectedProperty.bedrooms}</p>
                      <p className="text-[10px] text-muted-foreground">Bedrooms</p>
                    </div>
                  )}
                  {selectedProperty.bathrooms && (
                    <div className="bg-secondary rounded-xl p-3 text-center">
                      <Bath className="w-5 h-5 mx-auto text-accent mb-1" />
                      <p className="text-sm font-semibold text-foreground">{selectedProperty.bathrooms}</p>
                      <p className="text-[10px] text-muted-foreground">Bathrooms</p>
                    </div>
                  )}
                </div>

                {/* Features */}
                {selectedProperty.features && (selectedProperty.features as string[]).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedProperty.features as string[]).map((f: string) => (
                        <span key={f} className="text-xs px-2.5 py-1 rounded-lg bg-accent/10 text-accent font-medium">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
