
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useColorPreference } from "@/hooks/useColorPreference";
import { ColorPicker } from "@/components/ui/color-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.name || "");
  const { favoriteColor, updateColorPreference, loading: colorLoading } = useColorPreference();
  
  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };
  
  const handleSaveProfile = () => {
    // In a real application, you would update the user profile here
    // For now, we'll just show a toast message
    toast.success("Profile updated successfully");
    setIsEditing(false);
  };

  const handleColorChange = async (color: string) => {
    await updateColorPreference(color);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Your Profile" 
        description="View and manage your profile information"
      />
      
      <div className="grid gap-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/avatar.png" alt={user?.email || "User"} />
                  <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <Button variant="outline" disabled>Change Avatar</Button>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={user?.email || ""} 
                    disabled 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Personalisierung</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="colors">
              <TabsList className="mb-4">
                <TabsTrigger value="colors">Farben</TabsTrigger>
              </TabsList>
              
              <TabsContent value="colors" className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Wähle deine Lieblingsfarbe</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Diese Farbe wird für Buttons und Aktionselemente in der Anwendung verwendet.
                  </p>
                  
                  <ColorPicker 
                    value={favoriteColor} 
                    onChange={handleColorChange} 
                    className="mt-2" 
                  />
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Vorschau</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button>Standard Button</Button>
                      <Button variant="outline">Outline Button</Button>
                      <Button variant="secondary">Secondary Button</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Change Password</h3>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Notification Preferences</h3>
                  <p className="text-sm text-muted-foreground">Configure how you receive notifications</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
