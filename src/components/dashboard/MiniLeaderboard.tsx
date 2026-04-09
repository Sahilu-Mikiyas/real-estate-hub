import { motion } from "framer-motion";

const topAgents = [
  { rank: 1, name: "Sara Khan", points: 2450, color: "text-yellow-500" },
  { rank: 2, name: "Omar Farooq", points: 2100, color: "text-gray-400" },
  { rank: 3, name: "Ahmed Ali", points: 1890, color: "text-amber-700" },
];

export function MiniLeaderboard() {
  return (
    <div className="bg-card rounded-xl p-5 shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">Top Agents</h3>
      <div className="space-y-3">
        {topAgents.map((agent, i) => (
          <motion.div
            key={agent.rank}
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 300, damping: 20 }}
            className={`flex items-center gap-3 p-2.5 rounded-lg ${
              agent.name === "Ahmed Ali" ? "bg-orange-subtle" : "bg-secondary"
            }`}
          >
            <span className={`text-lg font-bold w-6 text-center ${agent.color}`}>
              {agent.rank}
            </span>
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
              {agent.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
            </div>
            <span className="text-sm font-semibold text-accent">{agent.points}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
