import { motion } from "framer-motion";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRBAC } from "@/contexts/RBACContext";

const properties = [
  { id: 1, name: "Plot 24 - Phase 2", type: "Plot", price: "PKR 45L", status: "Available", img: "🏗️" },
  { id: 2, name: "Villa Royale - Block A", type: "Villa", price: "PKR 2.5Cr", status: "Available", img: "🏡" },
  { id: 3, name: "Shop 12 - Commercial", type: "Shop", price: "PKR 85L", status: "Sold", img: "🏪" },
  { id: 4, name: "Flat 3B - Luxury Tower", type: "Flat", price: "PKR 1.2Cr", status: "Reserved", img: "🏢" },
  { id: 5, name: "Plot 8 - Phase 1", type: "Plot", price: "PKR 38L", status: "Sold", img: "🏗️" },
  { id: 6, name: "Villa 7 - Garden City", type: "Villa", price: "PKR 3.1Cr", status: "Available", img: "🏡" },
  { id: 7, name: "Shop 5 - Mall Road", type: "Shop", price: "PKR 1.1Cr", status: "Available", img: "🏪" },
  { id: 8, name: "Plot 15 - Phase 3", type: "Plot", price: "PKR 52L", status: "Reserved", img: "🏗️" },
];

const statusStyles: Record<string, string> = {
  Available: "bg-green-100 text-green-700 border-green-200",
  Sold: "bg-red-100 text-red-700 border-red-200",
  Reserved: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const Inventory = () => {
  const { role } = useRBAC();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">Property listings and status</p>
        </div>
        {role === "admin" && (
          <Button className="bg-accent text-accent-foreground hover:bg-orange-light btn-press">
            <Plus className="w-4 h-4 mr-1.5" /> Add Property
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {properties.map((prop, i) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl shadow-card card-hover overflow-hidden"
          >
            <div className="h-32 bg-secondary flex items-center justify-center text-4xl">
              {prop.img}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground leading-tight">{prop.name}</h3>
                <span className={`shrink-0 ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusStyles[prop.status]}`}>
                  {prop.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{prop.type}</p>
              <p className="text-lg font-bold text-accent">{prop.price}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
