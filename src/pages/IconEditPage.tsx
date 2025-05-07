
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, AlertTriangle } from "lucide-react";

export default function IconEditPage() {
  const { iconId } = useParams<{ iconId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#000000");
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadIcon() {
      if (!iconId || !user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("user_custom_icons")
          .select("*")
          .eq("id", iconId)
          .eq("user_id", user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setName(data.name);
          setDescription(data.description || "");
          setColor(data.color || "#000000");
          setSvgContent(data.svg_content);
        } else {
          setError("Icon nicht gefunden");
        }
      } catch (err: any) {
        console.error("Fehler beim Laden des Icons:", err);
        setError(err.message || "Fehler beim Laden des Icons");
        toast.error(`Fehler beim Laden des Icons: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    loadIcon();
  }, [iconId, user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !iconId) {
      toast.error("Nicht autorisiert");
      return;
    }
    
    if (!name) {
      toast.error("Bitte geben Sie einen Namen für das Icon ein");
      return;
    }
    
    try {
      setSaving(true);
      
      // Update the icon in the database
      const { error } = await supabase
        .from("user_custom_icons")
        .update({
          name,
          description,
          color,
          updated_at: new Date().toISOString()
        })
        .eq("id", iconId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      toast.success("Icon erfolgreich aktualisiert");
      navigate("/profile");
      
    } catch (error: any) {
      console.error("Fehler beim Speichern:", error);
      toast.error(`Fehler beim Speichern: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Create a preview of the SVG with the selected color
  const coloredSvg = svgContent ? 
    svgContent.replace(/fill="([^"]*)"/, `fill="${color}"`) : 
    null;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h2 className="text-2xl font-bold">Fehler</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate("/profile")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Profil
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <PageHeader
        title="Icon bearbeiten"
        description="Bearbeiten Sie Ihr benutzerdefiniertes Icon"
        backTo="/profile"
      />
      
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="icon-name">Name*</Label>
              <Input
                id="icon-name"
                placeholder="Geben Sie einen Namen für das Icon ein"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="icon-description">Beschreibung</Label>
              <Textarea
                id="icon-description"
                placeholder="Fügen Sie eine optionale Beschreibung hinzu"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="icon-color">Farbe</Label>
              <div className="flex gap-4 items-center">
                <Input
                  id="icon-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-24"
                />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>
            
            <div>
              <Label>Vorschau</Label>
              <div className="mt-2 border rounded-md p-6 bg-gray-50 flex items-center justify-center">
                {coloredSvg ? (
                  <div className="w-32 h-32 flex items-center justify-center">
                    <div dangerouslySetInnerHTML={{ __html: coloredSvg }} />
                  </div>
                ) : (
                  <div className="text-muted-foreground">Keine Vorschau verfügbar</div>
                )}
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate("/profile")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
              <Button 
                type="submit"
                disabled={!name || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Änderungen speichern
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
