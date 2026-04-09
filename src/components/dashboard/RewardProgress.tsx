import { motion } from "framer-motion";
import { Award, Star, Target } from "lucide-react";

const badges = [
  { name: "First Closer", icon: Award, unlocked: true },
  { name: "10 Visits", icon: Target, unlocked: true },
  { name: "Top Poster", icon: Star, unlocked: false },
];

export function RewardProgress() {
  return (
    <div className="bg-card rounded-xl p-5 shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">Rewards Progress</h3>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Monthly Points</span>
          <span>1,890 / 3,000</span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "63%" }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="h-full bg-accent rounded-full"
          />
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-3">
        {badges.map((badge) => (
          <motion.div
            key={badge.name}
            whileHover={badge.unlocked ? { scale: 1.1 } : {}}
            className={`flex flex-col items-center gap-1 ${
              badge.unlocked ? "" : "opacity-40"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                badge.unlocked
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <badge.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium text-center">
              {badge.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
