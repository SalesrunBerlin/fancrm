
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Check token validity and get invitation data
  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      navigate("/dashboard");
      return;
    }

    const validateToken = async () => {
      if (!token) {
        setError("Invalid invitation link.");
        setLoading(false);
        return;
      }

      try {
        // Fetch invitation data using the token
        const { data, error } = await supabase
          .from("workspace_invitations")
          .select("*, workspaces:workspace_id(*)")
          .eq("token", token)
          .single();

        if (error || !data) {
          console.error("Error fetching invitation:", error);
          setError("Invalid or expired invitation link.");
        } else if (data.is_used) {
          setError("This invitation has already been used.");
        } else if (new Date(data.expires_at) < new Date()) {
          setError("This invitation has expired.");
        } else {
          setInvitationData(data);
          setEmail(data.email);
        }
      } catch (err) {
        console.error("Error validating invitation:", err);
        setError("An error occurred while validating your invitation.");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    
    try {
      // Sign up the user
      const { success, error } = await signup(email, password);
      
      if (!success) {
        throw new Error(error || "Failed to register");
      }

      // Update the invitation to mark as used
      const { error: updateError } = await supabase
        .from("workspace_invitations")
        .update({ is_used: true })
        .eq("token", token);

      if (updateError) {
        console.error("Error updating invitation:", updateError);
      }

      toast.success("Registration successful! You can now log in.");
      navigate("/auth");
      
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>There was a problem with your invitation link.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">{error}</p>
            <Button asChild className="w-full">
              <Link to="/auth">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
          <CardDescription>
            You've been invited to join {invitationData?.workspaces?.name || "the workspace"}.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">This email is associated with your invitation.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : "Complete Registration"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
