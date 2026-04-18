import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadFollowup from "./pages/LeadFollowup";
import Visits from "./pages/Visits";
import SocialMedia from "./pages/SocialMedia";
import Inventory from "./pages/Inventory";
import PropertyShowroom from "./pages/PropertyShowroom";
import Closings from "./pages/Closings";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import Profile from "./pages/Profile";
import TeamOverview from "./pages/TeamOverview";
import AgentDetail from "./pages/AgentDetail";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <RBACProvider>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/leads" element={<Leads />} />
                        <Route path="/followup" element={<LeadFollowup />} />
                        <Route path="/visits" element={<Visits />} />
                        <Route path="/social" element={<SocialMedia />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/showroom" element={<PropertyShowroom />} />
                        <Route path="/closings" element={<Closings />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/rewards" element={<Rewards />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route
                          path="/team"
                          element={
                            <ProtectedRoute allowedRoles={["supervisor", "admin"]}>
                              <TeamOverview />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/team/:id"
                          element={
                            <ProtectedRoute allowedRoles={["supervisor", "admin"]}>
                              <AgentDetail />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminPanel />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </RBACProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
