
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProfileFormData {
  first_name: string;
  last_name: string;
  company: string | null;
  role: string | null;
  screen_name: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    company: null,
    role: null,
    screen_name: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [screenNameError, setScreenNameError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setProfile({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            company: data.company,
            role: data.role,
            screen_name: data.screen_name || user.id,
          });
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        toast.error("Could not load profile information");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear the error if user is typing in screen_name field
    if (name === "screen_name") {
      setScreenNameError("");
    }
    
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateScreenName = async () => {
    // Screen name must be at least 3 characters
    if (profile.screen_name.length < 3) {
      setScreenNameError("Screen name must be at least 3 characters");
      return false;
    }

    // Screen name should only contain letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(profile.screen_name)) {
      setScreenNameError("Screen name can only contain letters, numbers, and underscores");
      return false;
    }

    // Check if screen name is already taken (but only if it's not the user's current screen name)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("screen_name", profile.screen_name)
        .neq("id", user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setScreenNameError("This screen name is already taken");
        return false;
      }
    } catch (error) {
      console.error("Error checking screen name:", error);
      setScreenNameError("Could not validate screen name");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate screen name
    const isValid = await validateScreenName();
    if (!isValid) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          company: profile.company,
          role: profile.role,
          screen_name: profile.screen_name,
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl">
      <PageHeader 
        title="Your Profile" 
        description="Manage your personal information and preferences"
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleChange}
                  placeholder="First Name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="screen_name">
                Screen Name <span className="text-sm text-muted-foreground">(used for publishing objects)</span>
              </Label>
              <Input
                id="screen_name"
                name="screen_name"
                value={profile.screen_name}
                onChange={handleChange}
                placeholder="Screen Name"
                className={screenNameError ? "border-red-500" : ""}
              />
              {screenNameError && (
                <p className="text-sm text-red-500">{screenNameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your screen name will be visible to others when you publish objects. It must be unique.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  value={profile.company || ""}
                  onChange={handleChange}
                  placeholder="Company"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  name="role"
                  value={profile.role || ""}
                  onChange={handleChange}
                  placeholder="Role"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
