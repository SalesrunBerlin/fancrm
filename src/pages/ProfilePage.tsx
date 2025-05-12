
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
import { Loader2, Check, Plus, Pencil, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DeleteIconDialog } from "@/components/icons/DeleteIconDialog";
import { ThemeCustomizer } from "@/components/theme/ThemeCustomizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  const { user, isSuperAdmin } = useAuth();
  const { favoriteColor, updateColorPreference, loading: colorLoading } = useColorPreference();
  const [activeTab, setActiveTab] = useState("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [screenName, setScreenName] = useState("");
  const [saving, setSaving] = useState(false);
  
  // User initials for avatar
  const getInitials = () => {
    if (screenName) {
      return screenName.charAt(0).toUpperCase();
    }
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
            .select('first_name, last_name, email, screen_name')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error("Error fetching profile:", error);
            return;
          }
          
          if (data) {
            setFirstName(data.first_name || "");
            setLastName(data.last_name || "");
            setScreenName(data.screen_name || "");
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
          screen_name: screenName,
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

  // Fetch user's custom icons
  const { data: customIcons, isLoading: loadingIcons, refetch: refetchIcons } = useQuery({
    queryKey: ["user-custom-icons"],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_custom_icons")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching custom icons:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });

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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">Profil</TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1">Erscheinungsbild</TabsTrigger>
          <TabsTrigger value="icons" className="flex-1">Icons</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profilinformationen</CardTitle>
              <CardDescription>Aktualisieren Sie Ihre persönlichen Daten.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/avatar.png" alt={screenName || email || "User"} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{screenName || email}</p>
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
                    <Label htmlFor="screen-name">Anzeigename</Label>
                    <Input
                      id="screen-name"
                      type="text"
                      placeholder="Geben Sie Ihren Anzeigenamen ein"
                      value={screenName}
                      onChange={(e) => setScreenName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-Mail-Adresse</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@beispiel.de"
                      value={email}
                      readOnly
                      disabled
                      className="bg-gray-100"
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
        </TabsContent>
        
        <TabsContent value="appearance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Legacy Color Preference Card - can be removed later */}
            <Card>
              <CardHeader>
                <CardTitle>Legacy Farbpräferenz</CardTitle>
                <CardDescription>Alte Farbeinstellung (wird bald ersetzt).</CardDescription>
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
            
            {/* New Theme Customizer */}
            <div className="lg:col-span-2">
              <ThemeCustomizer />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="icons">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Benutzerdefinierte Symbole</CardTitle>
                <CardDescription>Verwalten Sie Ihre hochgeladenen und erstellten Symbole.</CardDescription>
              </div>
              <Button asChild>
                <Link to="/settings/icons/upload">
                  <Plus className="h-4 w-4 mr-2" />
                  Symbol hochladen
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingIcons ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : customIcons && customIcons.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {customIcons.map(icon => (
                    <div key={icon.id} className="border rounded-md p-3 flex flex-col items-center">
                      <div className="bg-gray-50 p-4 rounded-md w-full h-24 flex items-center justify-center mb-2">
                        {/* Directly inject the SVG content with the specified color */}
                        <div 
                          className="w-16 h-16"
                          dangerouslySetInnerHTML={{ 
                            __html: icon.svg_content ? 
                              icon.svg_content.replace(/fill="([^"]*)"/, `fill="${icon.color}"`) : 
                              '<svg viewBox="0 0 64 64"><rect width="64" height="64" /></svg>' 
                          }} 
                        />
                      </div>
                      <p className="text-sm font-medium text-center truncate w-full" title={icon.name}>
                        {icon.name}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link to={`/settings/icons/edit/${icon.id}`}>
                            <Pencil className="h-3 w-3" />
                            <span className="sr-only">Bearbeiten</span>
                          </Link>
                        </Button>
                        <DeleteIconDialog 
                          iconId={icon.id} 
                          iconName={icon.name} 
                          onDeleted={refetchIcons} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md bg-gray-50">
                  <p className="text-muted-foreground mb-4">Sie haben noch keine benutzerdefinierten Symbole erstellt.</p>
                  <Button asChild>
                    <Link to="/settings/icons/upload">
                      <Plus className="h-4 w-4 mr-2" />
                      Erstellen Sie Ihr erstes Symbol
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
