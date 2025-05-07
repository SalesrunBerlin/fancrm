
import { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useInvitationByToken } from "@/hooks/useWorkspaceInvitations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { token } = useParams<{ token: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: invitation, isLoading, error } = useInvitationByToken(token);
  const { user, signup } = useAuth();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>({
    defaultValues: {
      email: invitation?.email || ""
    }
  });

  // Update email field when invitation data is loaded
  useEffect(() => {
    if (invitation?.email) {
      register("email").onChange({
        target: { value: invitation.email, name: "email" }
      });
    }
  }, [invitation, register]);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (data.password !== data.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      
      if (!token || !invitation) {
        toast.error("Invalid or expired invitation");
        return;
      }
      
      const { success, error } = await signup(data.email, data.password);
      
      if (success) {
        toast.success("Registration successful! Please log in.");
      } else if (error) {
        toast.error(error);
      }
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const primaryColor = invitation?.workspace?.primary_color || '#3b82f6';
  const customStyles = {
    "--primary-color": primaryColor,
    "--primary-foreground-color": "#ffffff"
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link to="/auth">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4" style={customStyles}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {invitation.workspace?.name || "Register"}
          </CardTitle>
          <CardDescription>
            {invitation.workspace?.welcome_message || "Create an account to join this workspace"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                disabled={!!invitation.email}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                {...register("password", { 
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                {...register("confirmPassword", { 
                  required: "Please confirm your password",
                  validate: (val: string) => {
                    if (watch("password") !== val) {
                      return "Passwords do not match";
                    }
                  }
                })}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              style={{backgroundColor: primaryColor}}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : "Register"}
            </Button>
          </CardFooter>
        </form>
        <div className="px-8 pb-6 text-center text-sm">
          Already have an account?{" "}
          <Link to="/auth" className="underline text-primary">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
