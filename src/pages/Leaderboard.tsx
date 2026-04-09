import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

const leaderboardData = [
  { rank: 1, name: "Sara Khan", points: 2450, leads: 32, closings: 5, visits: 18 },
  { rank: 2, name: "Omar Farooq", points: 2100, leads: 28, closings: 4, visits: 15 },
  { rank: 3, name: "Ahmed Ali", points: 1890, leads: 24, closings: 3, visits: 14 },
  { rank: 4, name: "Zain Ul Abdin", points: 1720, leads: 22, closings: 3, visits: 12 },
  { rank: 5, name: "Hira Bashir", points: 1550, leads: 20, closings: 2, visits: 11 },
  { rank: 6, name: "Ali Hassan", points: 1400, leads: 18, closings: 2, visits: 10 },
  { rank: 7, name: "Maryam Akram", points: 1280, leads: 16, closings: 1, visits: 9 },
  { rank: 8, name: "Tariq Mehmood", points: 1100, leads: 14, closings: 1, visits: 7 },
];

const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];

const Leaderboard = () => {
  const top3 = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Monthly agent rankings</p>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {top3.map((agent, i) => (
          <motion.div
            key={agent.rank}
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, type: "spring", stiffness: 300, damping: 20 }}
            className={`bg-card rounded-xl shadow-card p-6 text-center ${
              agent.name === "Ahmed Ali" ? "ring-2 ring-accent" : ""
            }`}
          >
            <div className="flex justify-center mb-3">
              <Trophy className={`w-8 h-8 ${medalColors[i]}`} />
            </div>
            <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xl font-bold mx-auto mb-2">
              {agent.name.charAt(0)}
            </div>
            <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
            <p className="text-2xl font-bold text-accent mt-1">{agent.points.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">points</p>
            <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>{agent.leads} leads</span>
              <span>{agent.closings} closings</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Rank</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Agent</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Points</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Leads</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Closings</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Visits</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((agent, i) => (
              <motion.tr
                key={agent.rank}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={`border-b border-border last:border-0 transition-colors ${
                  agent.name === "Ahmed Ali" ? "bg-orange-subtle" : "hover:bg-secondary"
                }`}
              >
                <td className="px-4 py-3">
                  <span className={`text-sm font-bold ${i < 3 ? medalColors[i] : "text-muted-foreground"}`}>
                    #{agent.rank}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{agent.name}</td>
                <td className="px-4 py-3 text-sm font-semibold text-accent">{agent.points.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{agent.leads}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{agent.closings}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{agent.visits}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
