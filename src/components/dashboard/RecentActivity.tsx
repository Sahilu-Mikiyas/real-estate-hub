import { motion } from "framer-motion";
import { Eye, FileText, Phone, CheckCircle } from "lucide-react";

const activities = [
  { icon: Phone, text: "Called lead: Ahmad Raza", time: "10 min ago", color: "text-blue-500" },
  { icon: Eye, text: "Site visit: Plot 24, Phase 2", time: "1 hour ago", color: "text-accent" },
  { icon: FileText, text: "Posted on Facebook: Villa Royale", time: "3 hours ago", color: "text-purple-500" },
  { icon: CheckCircle, text: "Closed deal: Shop 12, Block A", time: "Yesterday", color: "text-status-available" },
  { icon: Phone, text: "Follow-up: Fatima Noor", time: "Yesterday", color: "text-blue-500" },
];

export function RecentActivity() {
  return (
    <div className="bg-card rounded-xl p-5 shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-2">
        {activities.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          >
            <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
            <p className="text-sm text-foreground flex-1 truncate">{item.text}</p>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
