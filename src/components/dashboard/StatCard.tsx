import { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  subtitle?: string;
  index?: number;
}

export function StatCard({ title, value, icon: Icon, subtitle, index = 0 }: StatCardProps) {
  const countRef = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-card rounded-xl p-5 shadow-card card-hover cursor-default"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-accent mt-1">
            <span ref={countRef}>0</span>
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-orange-subtle flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent" />
        </div>
      </div>
    </motion.div>
  );
}
