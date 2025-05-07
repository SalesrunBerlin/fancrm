import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useColorPreference } from "@/hooks/useColorPreference";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

export default function ProfilePage() {
  const { user, isSuperAdmin } = useAuth();
  const { favoriteColor, updateColorPreference, loading: colorLoading } = useColorPreference();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  
  // User initials for avatar
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };
  
  // Set initial form values from user data
  useEffect(() => {
    if (user) {
      // This is just a placeholder - in a real app, you'd fetch profile data
      // You might already have this data in user.user_metadata or you'd fetch it
    }
  }, [user]);

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Save profile changes to your database
      // Placeholder for profile update logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Handle color preference change
  const handleColorChange = async (color: string) => {
    await updateColorPreference(color);
  };

  // If no user, or still loading auth state
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <PageHeader heading="Profile" text="Manage your profile settings" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/avatar.png" alt={user.email || "User"} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">{user.email}</p>
                {isSuperAdmin && (
                  <p className="text-xs text-muted-foreground">Super Admin</p>
                )}
              </div>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={saving} className="mt-4">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Changes
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Color Preference Card */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Preference</CardTitle>
            <CardDescription>Customize the look of your application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label>Favorite Color</Label>
                <div className="flex items-center space-x-3">
                  <Button
                    variant={favoriteColor === "default" ? "default" : "outline"}
                    onClick={() => handleColorChange("default")}
                    disabled={colorLoading}
                  >
                    {colorLoading && favoriteColor === "default" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : favoriteColor === "default" ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : null}
                    Default
                  </Button>
                  <Button
                    variant={favoriteColor === "secondary" ? "secondary" : "outline"}
                    onClick={() => handleColorChange("secondary")}
                    disabled={colorLoading}
                  >
                    {colorLoading && favoriteColor === "secondary" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : favoriteColor === "secondary" ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : null}
                    Secondary
                  </Button>
                  <Button
                    variant={favoriteColor === "destructive" ? "destructive" : "outline"}
                    onClick={() => handleColorChange("destructive")}
                    disabled={colorLoading}
                  >
                    {colorLoading && favoriteColor === "destructive" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : favoriteColor === "destructive" ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : null}
                    Destructive
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
