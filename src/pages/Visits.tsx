import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, MapPin, Building2 } from "lucide-react";
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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO } from "date-fns";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";

type Visit = Tables<"visits">;
type VisitType = Enums<"visit_type">;

const Visits = () => {
  const { role, userId, teamId } = useRBAC();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);

  // Form state
  const [formClient, setFormClient] = useState("");
  const [formType, setFormType] = useState<VisitType>("site");
  const [formProperty, setFormProperty] = useState("");
  const [formOutcome, setFormOutcome] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Fetch visits for current month
  const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ["visits", role, userId, monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visits")
        .select("*")
        .gte("visit_date", monthStart)
        .lte("visit_date", monthEnd)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data as Visit[];
    },
  });

  // Add visit mutation
  const addMutation = useMutation({
    mutationFn: async (visit: TablesInsert<"visits">) => {
      const { error } = await supabase.from("visits").insert(visit);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-visits"] });
      toast.success("Visit logged successfully!");
      resetForm();
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormClient("");
    setFormType("site");
    setFormProperty("");
    setFormOutcome("");
    setFormDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleAddVisit = () => {
    if (!formClient.trim()) {
      toast.error("Client name is required");
      return;
    }
    addMutation.mutate({
      client_name: formClient.trim(),
      visit_type: formType,
      property: formProperty || null,
      outcome: formOutcome.trim() || null,
      visit_date: formDate,
      agent_id: userId,
      team_id: teamId,
    });
  };

  // Calendar computation
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const startDayOfWeek = getDay(startOfMonth(currentMonth));

  // Map visit dates for quick lookup
  const visitsByDate = useMemo(() => {
    const map: Record<string, Visit[]> = {};
    visits.forEach((v) => {
      const key = v.visit_date;
      if (!map[key]) map[key] = [];
      map[key].push(v);
    });
    return map;
  }, [visits]);

  const selectedDayVisits = selectedDay
    ? visitsByDate[format(selectedDay, "yyyy-MM-dd")] || []
    : [];

  const roleLabel = role === "admin" ? "All visits across the system" : role === "supervisor" ? "Your team's visits" : "Your personal visits";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Visits</h1>
          <p className="text-sm text-muted-foreground">{roleLabel} · {visits.length} this month</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-orange-light btn-press">
              <Plus className="w-4 h-4 mr-1.5" /> Log Visit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Visit</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Client Name *</Label>
                <Input placeholder="Client name" className="mt-1" value={formClient} onChange={(e) => setFormClient(e.target.value)} />
              </div>
              <div>
                <Label>Visit Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as VisitType)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="site">Site Visit</SelectItem>
                    <SelectItem value="office">Office Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Property</Label>
                <Input placeholder="Property name" className="mt-1" value={formProperty} onChange={(e) => setFormProperty(e.target.value)} />
              </div>
              <div>
                <Label>Visit Date</Label>
                <Input type="date" className="mt-1" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div>
                <Label>Outcome / Notes</Label>
                <Input placeholder="What happened..." className="mt-1" value={formOutcome} onChange={(e) => setFormOutcome(e.target.value)} />
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-orange-light btn-press"
                onClick={handleAddVisit}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? "Saving..." : "Save Visit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold text-foreground">{format(currentMonth, "MMMM yyyy")}</h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {monthDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayVisits = visitsByDate[dateKey] || [];
              const hasVisits = dayVisits.length > 0;
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isToday = isSameDay(day, new Date());

              return (
                <motion.button
                  key={dateKey}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative aspect-square rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? "bg-accent text-accent-foreground shadow-md"
                      : hasVisits
                      ? "bg-orange-subtle text-accent hover:bg-accent hover:text-accent-foreground hover:shadow-md"
                      : isToday
                      ? "ring-2 ring-accent/30 text-foreground hover:bg-secondary"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  {day.getDate()}
                  {hasVisits && !isSelected && (
                    <span className="absolute bottom-1 flex gap-0.5">
                      {dayVisits.slice(0, 3).map((_, idx) => (
                        <span key={idx} className="w-1 h-1 bg-accent rounded-full" />
                      ))}
                    </span>
                  )}
                  {hasVisits && isSelected && (
                    <span className="text-[10px] font-bold">{dayVisits.length}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day visits */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-xl shadow-card p-5"
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Visits on {format(selectedDay, "MMMM d, yyyy")}
            </h3>
            {selectedDayVisits.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No visits on this day</p>
            ) : (
              <div className="space-y-2">
                {selectedDayVisits.map((v) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-orange-subtle/50 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      v.visit_type === "site" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                    }`}>
                      {v.visit_type === "site" ? <MapPin className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.visit_type === "site" ? "Site Visit" : "Office Visit"}
                        {v.property && ` · ${v.property}`}
                      </p>
                      {v.outcome && <p className="text-xs text-muted-foreground mt-0.5 italic">{v.outcome}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Visits;
