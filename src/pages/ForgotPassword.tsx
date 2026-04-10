import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">We'll send you a reset link</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card space-y-5">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">✉️</span>
              </div>
              <p className="text-sm text-foreground font-medium">Check your email</p>
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to <strong>{email}</strong>
              </p>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline mt-4">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-foreground hover:bg-orange-light btn-press"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
