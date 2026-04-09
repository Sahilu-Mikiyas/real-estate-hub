import { motion } from "framer-motion";
import { Award, Star, Target, Zap, Trophy, Medal } from "lucide-react";

const badges = [
  { name: "First Lead", icon: Star, unlocked: true, points: 10 },
  { name: "10 Leads", icon: Star, unlocked: true, points: 50 },
  { name: "First Closer", icon: Award, unlocked: true, points: 100 },
  { name: "10 Visits", icon: Target, unlocked: true, points: 75 },
  { name: "Social Star", icon: Zap, unlocked: true, points: 60 },
  { name: "Top 3 Monthly", icon: Trophy, unlocked: false, points: 200 },
  { name: "50 Leads", icon: Star, unlocked: false, points: 150 },
  { name: "Deal Master", icon: Medal, unlocked: false, points: 300 },
];

const rewards = [
  { name: "Gift Card PKR 5,000", threshold: 2000, current: 1890 },
  { name: "Weekend Trip", threshold: 5000, current: 1890 },
  { name: "iPhone 16", threshold: 10000, current: 1890 },
];

const Rewards = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Rewards & Badges</h1>
        <p className="text-sm text-muted-foreground">Track your achievements and unlock rewards</p>
      </div>

      {/* Points overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl shadow-card p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
            <Trophy className="w-8 h-8 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Points</p>
            <p className="text-4xl font-bold text-accent">1,890</p>
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileHover={badge.unlocked ? { scale: 1.08 } : {}}
              className={`bg-card rounded-xl shadow-card p-4 text-center ${
                badge.unlocked ? "" : "opacity-40"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 ${
                  badge.unlocked
                    ? "bg-accent text-accent-foreground shadow-md"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <badge.icon className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-foreground">{badge.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">+{badge.points} pts</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reward progress */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Rewards</h2>
        <div className="space-y-3">
          {rewards.map((reward, i) => {
            const pct = Math.min((reward.current / reward.threshold) * 100, 100);
            return (
              <motion.div
                key={reward.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-card rounded-xl shadow-card p-4 card-hover"
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-foreground">{reward.name}</span>
                  <span className="text-muted-foreground">
                    {reward.current.toLocaleString()} / {reward.threshold.toLocaleString()}
                  </span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                    className="h-full bg-accent rounded-full"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Rewards;
