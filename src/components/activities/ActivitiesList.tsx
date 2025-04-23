
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, Mail, CalendarDays, MessageCircle } from "lucide-react";

type Activity = {
  id: string;
  type: string;
  subject: string;
  description?: string | null;
  scheduled_at?: string | null;
  outcome?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const iconMap: Record<string, JSX.Element> = {
  call: <Phone className="w-4 h-4 text-beauty" />,
  meeting: <CalendarDays className="w-4 h-4 text-beauty" />,
  email: <Mail className="w-4 h-4 text-beauty" />,
  task: <MessageCircle className="w-4 h-4 text-beauty" />,
};

export function ActivitiesList() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) return;
    setLoading(true);

    supabase
      .from("activities")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (active) {
          setActivities(data || []);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;
  if (loading) return <div>Lade Aktivitäten...</div>;
  if (activities.length === 0)
    return <div>Keine Aktivitäten gefunden.</div>;

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div
          key={a.id}
          className="p-4 border rounded-md flex flex-col gap-2 bg-card"
        >
          <div className="flex items-center gap-2">
            {iconMap[a.type] || (
              <Clock className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="font-semibold text-base">{a.subject}</span>
            <Badge
              variant={a.status === "done" ? "secondary" : "default"}
              className={a.status === "done" ? "text-green-600" : ""}
            >
              {a.status === "done" ? "Erledigt" : "Offen"}
            </Badge>
            {a.scheduled_at && (
              <span className="text-xs pl-2 text-muted-foreground">
                {new Date(a.scheduled_at).toLocaleString()}
              </span>
            )}
          </div>
          {a.description && (
            <div className="pl-6 text-sm text-muted-foreground">
              {a.description}
            </div>
          )}
          {a.outcome && (
            <div className="pl-6 text-xs text-muted-foreground">
              Ergebnis: {a.outcome}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
