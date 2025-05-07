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
import { ColorPicker } from "@/components/ui/color-picker";
import { supabase } from "@/integrations/supabase/client";

export default function ProfilePage() {
  const { user, isSuperAdmin } = useAuth();
  const { favoriteColor, updateColorPreference, loading: colorLoading } = useColorPreference();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
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
      // Set email from authenticated user
      if (user.email) {
        setEmail(user.email);
      }
      
      // Fetch profile data from profiles table
      const fetchProfileData = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error("Error fetching profile:", error);
            return;
          }
          
          if (data) {
            setFirstName(data.first_name || "");
            setLastName(data.last_name || "");
            // If profile has an email, use it, otherwise keep the one from auth
            if (data.email) {
              setEmail(data.email);
            }
          }
        } catch (err) {
          console.error("Error in profile fetch:", err);
        }
      };
      
      fetchProfileData();
    }
  }, [user]);

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (!user) {
        throw new Error("No authenticated user");
      }
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          email: email,
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast.success("Profil erfolgreich aktualisiert");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(`Fehler beim Aktualisieren des Profils: ${error.message}`);
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
      <PageHeader title="Profil" description="Verwalten Sie Ihre Profileinstellungen" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profilinformationen</CardTitle>
            <CardDescription>Aktualisieren Sie Ihre persönlichen Daten.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/avatar.png" alt={email || "User"} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">{email}</p>
                {isSuperAdmin && (
                  <p className="text-xs text-muted-foreground">Super Admin</p>
                )}
              </div>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">Vorname</Label>
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="Geben Sie Ihren Vornamen ein"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Nachname</Label>
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Geben Sie Ihren Nachnamen ein"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="mt-4">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    Änderungen speichern
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
            <CardTitle>Farbpräferenz</CardTitle>
            <CardDescription>Passen Sie das Erscheinungsbild Ihrer Anwendung an.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="color-picker">Wählen Sie Ihre Themenfarbe</Label>
                <div className="mt-2">
                  {colorLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Lade Farbpräferenzen...
                    </div>
                  ) : (
                    <ColorPicker 
                      value={favoriteColor} 
                      onChange={handleColorChange} 
                      className="max-w-md"
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
