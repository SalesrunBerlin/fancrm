
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Save } from "lucide-react";
import { ActivityTypeSelect } from "@/components/activities/ActivityTypeSelect";
import { ActivityAccountSelect } from "@/components/activities/ActivityAccountSelect";
import { ActivityContactSelect } from "@/components/activities/ActivityContactSelect";
import { ActivityDealSelect } from "@/components/activities/ActivityDealSelect";

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user || !id) return;

      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

      if (error) {
        toast({
          title: "Fehler",
          description: "Aktivität nicht gefunden",
          variant: "destructive"
        });
        navigate("/activities");
      } else {
        setActivity(data);
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id, user, navigate, toast]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from("activities")
        .update({
          type: activity.type,
          subject: activity.subject,
          description: activity.description,
          scheduled_at: activity.scheduled_at,
          end_time: activity.end_time,
          outcome: activity.outcome,
          status: activity.status,
          account_id: activity.account_id,
          contact_id: activity.contact_id,
          deal_id: activity.deal_id,
        })
        .eq("id", id)
        .eq("owner_id", user.id);

      if (error) {
        toast({
          title: "Fehler",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({ 
          title: "Erfolgreich", 
          description: "Aktivität aktualisiert" 
        });
        setIsEditing(false);
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setActivity(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = () => {
    if (!activity) return;
    const newStatus = activity.status === "done" ? "open" : "done";
    handleFieldChange("status", newStatus);
  };

  if (loading) return <div>Laden...</div>;
  if (!activity) return <div>Keine Aktivität gefunden</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            Bearbeiten
          </Button>
        ) : (
          <Button type="submit" form="activity-edit-form">
            <Save className="mr-2 h-4 w-4" /> Speichern
          </Button>
        )}
      </div>

      {isEditing ? (
        <form id="activity-edit-form" onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActivityTypeSelect 
              value={activity.type} 
              onChange={(val) => handleFieldChange('type', val)}
            />
            <Input
              placeholder="Betreff*"
              value={activity.subject}
              onChange={(e) => handleFieldChange('subject', e.target.value)}
              required
            />
          </div>
          <Textarea
            placeholder="Beschreibung / Notizen"
            value={activity.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              placeholder="Startzeit"
              value={activity.scheduled_at ? new Date(activity.scheduled_at).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleFieldChange('scheduled_at', e.target.value)}
            />
            <Input
              type="datetime-local"
              placeholder="Endzeit"
              value={activity.end_time ? new Date(activity.end_time).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleFieldChange('end_time', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActivityAccountSelect
              value={activity.account_id}
              onChange={(val) => handleFieldChange('account_id', val)}
            />
            <ActivityContactSelect
              value={activity.contact_id}
              onChange={(val) => handleFieldChange('contact_id', val)}
            />
            <ActivityDealSelect
              value={activity.deal_id}
              onChange={(val) => handleFieldChange('deal_id', val)}
            />
          </div>
          <Input
            placeholder="Ergebnis"
            value={activity.outcome || ''}
            onChange={(e) => handleFieldChange('outcome', e.target.value)}
          />
          <div>
            <Button
              type="button"
              variant={activity.status === "done" ? "outline" : "default"}
              onClick={handleStatusChange}
            >
              {activity.status === "done" ? "Als offen markieren" : "Als erledigt markieren"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <strong>Betreff:</strong> {activity.subject}
          </div>
          <div>
            <strong>Beschreibung:</strong> {activity.description}
          </div>
          <div>
            <strong>Startzeit:</strong> {activity.scheduled_at ? new Date(activity.scheduled_at).toLocaleString() : 'Nicht festgelegt'}
          </div>
          {activity.end_time && (
            <div>
              <strong>Endzeit:</strong> {new Date(activity.end_time).toLocaleString()}
            </div>
          )}
          <div>
            <strong>Status:</strong> {activity.status === "done" ? "Erledigt" : "Offen"}
          </div>
          {activity.outcome && (
            <div>
              <strong>Ergebnis:</strong> {activity.outcome}
            </div>
          )}
          <div className="pt-4">
            <Button 
              onClick={handleStatusChange}
              variant={activity.status === "done" ? "outline" : "default"}
            >
              {activity.status === "done" ? "Als offen markieren" : "Als erledigt markieren"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
