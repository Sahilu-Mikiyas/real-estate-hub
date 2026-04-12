import { motion } from "framer-motion";
import { Award, Star, Target, Zap, Trophy, Medal, Sparkles } from "lucide-react";
import { useRBAC } from "@/contexts/RBACContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const iconMap: Record<string, any> = { star: Star, award: Award, target: Target, zap: Zap, trophy: Trophy, medal: Medal };

const Rewards = () => {
  const { userId } = useRBAC();

  // Fetch badges definitions
  const { data: badges = [] } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data } = await supabase.from("badges").select("*").order("threshold_value");
      return data || [];
    },
  });

  // Fetch user's unlocked badges
  const { data: unlockedIds = [] } = useQuery({
    queryKey: ["agent-badges", userId],
    queryFn: async () => {
      const { data } = await supabase.from("agent_badges").select("badge_id").eq("agent_id", userId);
      return (data || []).map(d => d.badge_id);
    },
  });

  // Fetch rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data } = await supabase.from("rewards").select("*").order("threshold_points");
      return data || [];
    },
  });

  // Fetch scoring rules for points calc
  const { data: scoringRules = [] } = useQuery({
    queryKey: ["scoring-rules"],
    queryFn: async () => {
      const { data } = await supabase.from("scoring_rules").select("*");
      return data || [];
    },
  });

  // Calculate total points for current user
  const { data: myPoints = 0 } = useQuery({
    queryKey: ["my-points", userId],
    queryFn: async () => {
      const [{ count: leads }, { count: closings }, { count: visits }, { count: posts }] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("agent_id", userId),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("agent_id", userId).eq("status", "closed"),
        supabase.from("visits").select("id", { count: "exact", head: true }).eq("agent_id", userId),
        supabase.from("social_posts").select("id", { count: "exact", head: true }).eq("agent_id", userId),
      ]);
      const leadPts = scoringRules.find(r => r.rule_name === "lead_added")?.points_per_action || 10;
      const closePts = scoringRules.find(r => r.rule_name === "lead_closed")?.points_per_action || 100;
      const visitPts = scoringRules.find(r => r.rule_name === "visit_logged")?.points_per_action || 15;
      const postPts = scoringRules.find(r => r.rule_name === "social_post")?.points_per_action || 5;
      return (leads || 0) * leadPts + (closings || 0) * closePts + (visits || 0) * visitPts + (posts || 0) * postPts;
    },
    enabled: scoringRules.length > 0,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Rewards & Badges</h1>
        <p className="text-sm text-muted-foreground">Track your achievements and unlock rewards</p>
      </div>

      {/* Points overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
            <Trophy className="w-8 h-8 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Points</p>
            <motion.p
              key={myPoints}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-accent"
            >
              {myPoints.toLocaleString()}
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {badges.map((badge, i) => {
            const unlocked = unlockedIds.includes(badge.id);
            const IconComp = iconMap[badge.icon] || Star;
            return (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={unlocked ? { scale: 1.08 } : {}}
                    className={`bg-card rounded-xl shadow-card p-4 text-center relative ${unlocked ? "" : "opacity-40"}`}
                  >
                    {unlocked && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute top-2 right-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                      </motion.div>
                    )}
                    <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 ${
                      unlocked ? "bg-accent text-accent-foreground shadow-md shadow-accent/30" : "bg-secondary text-muted-foreground"
                    }`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">+{badge.points_awarded} pts</p>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{badge.description || badge.name}</p>
                  <p className="text-[10px] text-muted-foreground">{badge.threshold_value} {badge.threshold_type} required</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Reward progress */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Rewards</h2>
        <div className="space-y-3">
          {rewards.map((reward, i) => {
            const pct = Math.min((myPoints / reward.threshold_points) * 100, 100);
            const remaining = Math.max(reward.threshold_points - myPoints, 0);
            return (
              <Tooltip key={reward.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-card rounded-xl shadow-card p-4 cursor-default"
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <div>
                        <span className="font-medium text-foreground">{reward.name}</span>
                        {reward.description && <p className="text-[10px] text-muted-foreground">{reward.description}</p>}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {myPoints.toLocaleString()} / {reward.threshold_points.toLocaleString()}
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
                </TooltipTrigger>
                <TooltipContent>
                  {remaining > 0 ? (
                    <p className="text-xs">{remaining.toLocaleString()} points to unlock</p>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">🎉 Unlocked!</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Rewards;
