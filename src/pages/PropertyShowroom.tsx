import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, MapPin, ChevronLeft, ChevronRight, Maximize2, Bed, Bath, Ruler, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const typeLabels: Record<string, string> = { plot: "Plots", villa: "Villas", shop: "Shops", flat: "Flats" };
const typeEmojis: Record<string, string> = { plot: "🏗️", villa: "🏡", shop: "🏪", flat: "🏢" };
const statusStyles: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  sold: "bg-red-100 text-red-700",
  reserved: "bg-yellow-100 text-yellow-700",
};

const PropertyShowroom = () => {
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["showroom-properties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").order("type").order("block").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Group by type -> block
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, any[]>> = {};
    for (const p of properties) {
      if (!map[p.type]) map[p.type] = {};
      const block = p.block || "General";
      if (!map[p.type][block]) map[p.type][block] = [];
      map[p.type][block].push(p);
    }
    return map;
  }, [properties]);

  const types = Object.keys(grouped);

  // Gallery placeholder images based on property type
  const getGalleryImages = (prop: any) => {
    const galleries = prop.gallery_images && (prop.gallery_images as string[]).length > 0 
      ? (prop.gallery_images as string[]) 
      : [];
    // If no real images, create placeholder slides
    if (galleries.length === 0) {
      return [
        { type: "exterior", label: "Exterior View" },
        { type: "interior", label: "Interior View" },
        { type: "plan", label: "Floor Plan" },
        { type: "location", label: "Location Map" },
      ];
    }
    return galleries.map((url: string, i: number) => ({ type: "image", label: `Image ${i + 1}`, url }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Property Showroom</h1>
        <p className="text-sm text-muted-foreground">Browse properties by type, block, and location</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-secondary rounded w-32 mb-4" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(j => <div key={j} className="h-48 bg-secondary rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : types.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No properties available</p>
        </div>
      ) : (
        <Tabs defaultValue={types[0]} className="space-y-6">
          <TabsList className="bg-secondary">
            {types.map(t => (
              <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <span className="mr-1.5">{typeEmojis[t]}</span> {typeLabels[t] || t}
              </TabsTrigger>
            ))}
          </TabsList>

          {types.map(t => (
            <TabsContent key={t} value={t} className="space-y-6">
              {Object.entries(grouped[t]).map(([block, props]) => (
                <motion.div key={block} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    <h3 className="text-base font-semibold text-foreground">{block}</h3>
                    <span className="text-xs text-muted-foreground">({props.length} properties)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {props.map((prop: any, i: number) => (
                      <motion.div
                        key={prop.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                        onClick={() => { setSelectedProperty(prop); setGalleryIndex(0); }}
                        className="bg-card rounded-xl shadow-card overflow-hidden cursor-pointer group"
                      >
                        {/* Preview image area */}
                        <div className="h-40 bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative">
                          <span className="text-5xl">{typeEmojis[prop.type]}</span>
                          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                            <Maximize2 className="w-6 h-6 text-primary-foreground opacity-0 group-hover:opacity-70 transition-opacity" />
                          </div>
                          <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusStyles[prop.status]}`}>
                            {prop.status}
                          </span>
                        </div>
                        <div className="p-4">
                          <h4 className="text-sm font-semibold text-foreground mb-1">{prop.name}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{prop.location}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            {prop.area_sqft && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{prop.area_sqft} sqft</span>}
                            {prop.bedrooms && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{prop.bedrooms}</span>}
                            {prop.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{prop.bathrooms}</span>}
                          </div>
                          <p className="text-lg font-bold text-accent">{prop.price_label}</p>
                          {prop.features && (prop.features as string[]).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(prop.features as string[]).slice(0, 3).map(f => (
                                <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{f}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
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
              {/* Gallery slider */}
              <div className="relative h-64 sm:h-80 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                {(() => {
                  const slides = getGalleryImages(selectedProperty);
                  const slide = slides[galleryIndex];
                  return (
                    <>
                      <div className="text-center">
                        {slide.url ? (
                          <img src={slide.url} alt={slide.label} className="max-h-72 object-contain" />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-6xl">{typeEmojis[selectedProperty.type]}</span>
                            <span className="text-sm text-muted-foreground font-medium">{slide.label}</span>
                          </div>
                        )}
                      </div>
                      {slides.length > 1 && (
                        <>
                          <button
                            onClick={() => setGalleryIndex((galleryIndex - 1 + slides.length) % slides.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 hover:bg-card shadow transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setGalleryIndex((galleryIndex + 1) % slides.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 hover:bg-card shadow transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {slides.map((_: any, idx: number) => (
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
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedProperty.name}</h2>
                    <p className="text-sm text-muted-foreground capitalize">{selectedProperty.type} • {selectedProperty.location} • {selectedProperty.block}</p>
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

export default PropertyShowroom;
