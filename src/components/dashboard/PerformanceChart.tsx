import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { motion } from "framer-motion";
import { useState } from "react";

const weeklyData = [
  { name: "Mon", leads: 4, visits: 2, posts: 5 },
  { name: "Tue", leads: 6, visits: 3, posts: 4 },
  { name: "Wed", leads: 3, visits: 5, posts: 6 },
  { name: "Thu", leads: 8, visits: 4, posts: 3 },
  { name: "Fri", leads: 5, visits: 6, posts: 7 },
  { name: "Sat", leads: 7, visits: 3, posts: 5 },
  { name: "Sun", leads: 2, visits: 1, posts: 2 },
];

export function PerformanceChart() {
  const [view, setView] = useState<"line" | "bar">("line");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Weekly Performance</h3>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setView("line")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === "line" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setView("bar")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === "bar" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        {view === "line" ? (
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(220 13% 91%)",
                fontSize: "12px",
              }}
            />
            <Line type="monotone" dataKey="leads" stroke="#FF7A00" strokeWidth={2} dot={{ r: 4, fill: "#FF7A00" }} />
            <Line type="monotone" dataKey="visits" stroke="#0B1F3A" strokeWidth={2} dot={{ r: 4, fill: "#0B1F3A" }} />
            <Line type="monotone" dataKey="posts" stroke="#FFA94D" strokeWidth={2} dot={{ r: 4, fill: "#FFA94D" }} />
          </LineChart>
        ) : (
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(220 13% 91%)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="leads" fill="#FF7A00" radius={[4, 4, 0, 0]} />
            <Bar dataKey="visits" fill="#0B1F3A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="posts" fill="#FFA94D" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  );
}
