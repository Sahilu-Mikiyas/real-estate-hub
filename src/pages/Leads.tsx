import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, MoreHorizontal, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const leadsData = [
  { id: 1, name: "Ahmad Raza", phone: "+92 300 1234567", status: "New", potential: "High", property: "Plot 24" },
  { id: 2, name: "Fatima Noor", phone: "+92 312 9876543", status: "Contacted", potential: "Medium", property: "Villa 7" },
  { id: 3, name: "Hassan Ali", phone: "+92 321 5551234", status: "Negotiating", potential: "High", property: "Shop 12" },
  { id: 4, name: "Aisha Malik", phone: "+92 333 7654321", status: "Potential", potential: "Low", property: "Flat 3B" },
  { id: 5, name: "Usman Shah", phone: "+92 345 8887777", status: "Closed", potential: "High", property: "Plot 8" },
  { id: 6, name: "Sana Javed", phone: "+92 300 1112233", status: "New", potential: "Medium", property: "Villa 12" },
  { id: 7, name: "Bilal Khan", phone: "+92 311 4445566", status: "Contacted", potential: "High", property: "Shop 5" },
  { id: 8, name: "Nadia Hussain", phone: "+92 322 7778899", status: "Potential", potential: "Medium", property: "Plot 15" },
];

const statusColors: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  Potential: "bg-purple-100 text-purple-700",
  Negotiating: "bg-orange-subtle text-accent",
  Closed: "bg-green-100 text-green-700",
};

const potentialColors: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-gray-100 text-gray-500",
};

const Leads = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = leadsData.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">Manage your contacts and prospects</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
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
              <div>
                <Label>Full Name</Label>
                <Input placeholder="Enter name" className="mt-1" />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input placeholder="+92 3XX XXXXXXX" className="mt-1" />
              </div>
              <div>
                <Label>Property Interest</Label>
                <Select>
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
                <Select>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select potential" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Remarks</Label>
                <Input placeholder="Optional notes..." className="mt-1" />
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-orange-light btn-press"
                onClick={() => setOpen(false)}
              >
                Save Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-1.5">
          <Filter className="w-4 h-4" /> Filter
        </Button>
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
            {filtered.map((lead, i) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border last:border-0 hover:bg-orange-subtle/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 text-sm font-medium text-foreground">{lead.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{lead.phone}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${potentialColors[lead.potential]}`}>
                    {lead.potential}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{lead.property}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leads;
