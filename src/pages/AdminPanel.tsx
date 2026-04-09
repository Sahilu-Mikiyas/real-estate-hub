import { motion } from "framer-motion";
import { Users, Settings, Shield, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

const users = [
  { id: 1, name: "Ahmed Ali", role: "Agent", team: "Team Alpha", status: "Active" },
  { id: 2, name: "Sara Khan", role: "Agent", team: "Team Alpha", status: "Active" },
  { id: 3, name: "Omar Farooq", role: "Agent", team: "Team Beta", status: "Active" },
  { id: 4, name: "Rashid Mehmood", role: "Supervisor", team: "Team Alpha", status: "Active" },
  { id: 5, name: "Hira Bashir", role: "Agent", team: "Team Beta", status: "Inactive" },
];

const logs = [
  { action: "Lead merged", user: "Admin", time: "2 min ago" },
  { action: "Scoring rules updated", user: "Admin", time: "1 hour ago" },
  { action: "New agent added: Bilal Khan", user: "Admin", time: "3 hours ago" },
  { action: "Property status override: Shop 12", user: "Admin", time: "Yesterday" },
];

const AdminPanel = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage users, settings, and audit logs</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: "24", icon: Users },
          { label: "Active Agents", value: "18", icon: Shield },
          { label: "Actions Today", value: "47", icon: Activity },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl shadow-card p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-subtle flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* User management */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">User Management</h3>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-orange-light btn-press">
            Add User
          </Button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Role</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Team</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border last:border-0 hover:bg-secondary transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-foreground">{user.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{user.role}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{user.team}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    user.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {user.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit logs */}
      <div className="bg-card rounded-xl shadow-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Audit Logs</h3>
        <div className="space-y-2">
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="flex items-center justify-between p-2.5 rounded-lg bg-secondary"
            >
              <span className="text-sm text-foreground">{log.action}</span>
              <span className="text-xs text-muted-foreground">{log.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
