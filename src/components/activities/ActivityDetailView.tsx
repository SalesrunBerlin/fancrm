
import { Button } from "@/components/ui/button";

interface Activity {
  subject: string;
  description?: string | null;
  scheduled_at?: string | null;
  end_time?: string | null;
  status: string;
  outcome?: string | null;
}

interface ActivityDetailViewProps {
  activity: Activity;
  onStatusChange: () => void;
}

export function ActivityDetailView({ activity, onStatusChange }: ActivityDetailViewProps) {
  return (
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
          onClick={onStatusChange}
          variant={activity.status === "done" ? "outline" : "default"}
        >
          {activity.status === "done" ? "Als offen markieren" : "Als erledigt markieren"}
        </Button>
      </div>
    </div>
  );
}
