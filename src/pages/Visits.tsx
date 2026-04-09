import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const visitDays = [
  { day: 3, visits: [{ client: "Ahmad Raza", type: "Site", property: "Plot 24" }] },
  { day: 7, visits: [{ client: "Fatima Noor", type: "Office", property: "Villa 7" }] },
  { day: 12, visits: [{ client: "Hassan Ali", type: "Site", property: "Shop 12" }, { client: "Bilal Khan", type: "Site", property: "Plot 8" }] },
  { day: 18, visits: [{ client: "Sana Javed", type: "Office", property: "Villa 12" }] },
  { day: 22, visits: [{ client: "Usman Shah", type: "Site", property: "Flat 3B" }] },
  { day: 27, visits: [{ client: "Nadia Hussain", type: "Site", property: "Plot 15" }] },
];

const daysInMonth = 30;
const monthName = "April 2026";

const Visits = () => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const getVisitsForDay = (day: number) => visitDays.find((d) => d.day === day)?.visits || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Visits</h1>
          <p className="text-sm text-muted-foreground">Track site and office visits</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-orange-light btn-press">
              <Plus className="w-4 h-4 mr-1.5" /> Log Visit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Visit</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Client</Label><Input placeholder="Client name" className="mt-1" /></div>
              <div>
                <Label>Visit Type</Label>
                <Select>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="site">Site Visit</SelectItem>
                    <SelectItem value="office">Office Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Property</Label><Input placeholder="Property name" className="mt-1" /></div>
              <div><Label>Outcome</Label><Input placeholder="Notes..." className="mt-1" /></div>
              <Button className="w-full bg-accent text-accent-foreground hover:bg-orange-light" onClick={() => setOpen(false)}>Save Visit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <button className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft className="w-4 h-4" /></button>
          <h3 className="text-sm font-semibold text-foreground">{monthName}</h3>
          <button className="p-1.5 rounded-lg hover:bg-secondary"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* offset for Wednesday start */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const visits = getVisitsForDay(day);
            const hasVisits = visits.length > 0;
            const isSelected = selectedDay === day;

            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`relative aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  isSelected
                    ? "bg-accent text-accent-foreground"
                    : hasVisits
                    ? "bg-orange-subtle text-accent hover:bg-accent hover:text-accent-foreground"
                    : "hover:bg-secondary text-foreground"
                }`}
              >
                {day}
                {hasVisits && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 bg-accent rounded-full" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected day visits */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Visits on {monthName.split(" ")[0]} {selectedDay}
          </h3>
          {getVisitsForDay(selectedDay).length === 0 ? (
            <p className="text-sm text-muted-foreground">No visits on this day</p>
          ) : (
            <div className="space-y-2">
              {getVisitsForDay(selectedDay).map((v, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <div className={`w-2 h-2 rounded-full ${v.type === "Site" ? "bg-accent" : "bg-primary"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{v.client}</p>
                    <p className="text-xs text-muted-foreground">{v.type} · {v.property}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Visits;
