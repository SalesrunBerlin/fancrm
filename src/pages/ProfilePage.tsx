
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Settings } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<{
    screen_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null>(null);
  const [screenName, setScreenName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('screen_name, first_name, last_name')
        .eq('id', user?.id)
        .single();
        
      if (error) {
        toast.error("Fehler beim Laden der Profildaten");
        console.error("Error fetching profile data:", error);
        return;
      }
      
      setProfileData(data);
      setScreenName(data?.screen_name || "");
    } catch (error) {
      console.error("Error in fetchProfileData:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ screen_name: screenName })
        .eq('id', user?.id);
        
      if (error) {
        toast.error("Fehler beim Aktualisieren des Profilnamens");
        console.error("Error updating profile:", error);
        return;
      }
      
      setProfileData(prev => prev ? {...prev, screen_name: screenName} : null);
      toast.success("Profilname erfolgreich aktualisiert");
      setIsEditing(false);
    } catch (error) {
      console.error("Error in handleUpdateProfile:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profilseite"
        description="Hier können Sie Ihre Profileinstellungen verwalten"
        icon={<User className="h-6 w-6" />}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Profilinformationen
            </CardTitle>
            <CardDescription>
              Ihre persönlichen Daten und Einstellungen
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/avatar.png" alt={user?.email || "User"} />
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-medium text-xl">
                  {profileData?.screen_name || user?.email?.split('@')[0] || "Benutzer"}
                </h3>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="username">Benutzername</Label>
                  {!isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                    >
                      Bearbeiten
                    </Button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      id="username"
                      value={screenName}
                      onChange={(e) => setScreenName(e.target.value)}
                      placeholder="Benutzername eingeben"
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                      >
                        Speichern
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setScreenName(profileData?.screen_name || "");
                          setIsEditing(false);
                        }}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-muted rounded-md">
                    {profileData?.screen_name || "Kein Benutzername festgelegt"}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <div className="p-2 bg-muted rounded-md">
                  {user?.email || "Keine E-Mail Adresse"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Account Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" /> Kontoeinstellungen
            </CardTitle>
            <CardDescription>
              Verwalten Sie Ihre Kontoeinstellungen
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/settings">
                <Settings className="mr-2 h-4 w-4" /> Allgemeine Einstellungen
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
