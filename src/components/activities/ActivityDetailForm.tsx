
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActivityTypeSelect } from "./ActivityTypeSelect";
import { LookupField } from "@/components/records/LookupField";
import { Save } from "lucide-react";

interface Activity {
  type: string;
  subject: string;
  description?: string | null;
  scheduled_at?: string | null;
  end_time?: string | null;
  outcome?: string | null;
  status: string;
  account_id?: string | null;
  contact_id?: string | null;
  deal_id?: string | null;
}

interface ActivityDetailFormProps {
  activity: Activity;
  onFieldChange: (field: string, value: any) => void;
  onStatusChange: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saving?: boolean;
}

export function ActivityDetailForm({ 
  activity, 
  onFieldChange, 
  onStatusChange, 
  onSubmit,
  saving = false
}: ActivityDetailFormProps) {
  return (
    <form id="activity-edit-form" onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActivityTypeSelect 
          value={activity.type} 
          onChange={(val) => onFieldChange('type', val)}
          disabled={saving}
        />
        <Input
          placeholder="Betreff*"
          value={activity.subject}
          onChange={(e) => onFieldChange('subject', e.target.value)}
          required
          disabled={saving}
        />
      </div>
      <Textarea
        placeholder="Beschreibung / Notizen"
        value={activity.description || ''}
        onChange={(e) => onFieldChange('description', e.target.value)}
        disabled={saving}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="datetime-local"
          placeholder="Startzeit"
          value={activity.scheduled_at ? new Date(activity.scheduled_at).toISOString().slice(0, 16) : ''}
          onChange={(e) => onFieldChange('scheduled_at', e.target.value)}
          disabled={saving}
        />
        <Input
          type="datetime-local"
          placeholder="Endzeit"
          value={activity.end_time ? new Date(activity.end_time).toISOString().slice(0, 16) : ''}
          onChange={(e) => onFieldChange('end_time', e.target.value)}
          disabled={saving}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LookupField
          targetObjectTypeId="account_object_type_id"
          value={activity.account_id}
          onChange={(val) => onFieldChange('account_id', val)}
          disabled={saving}
        />
        <LookupField
          targetObjectTypeId="contact_object_type_id"
          value={activity.contact_id}
          onChange={(val) => onFieldChange('contact_id', val)}
          disabled={saving}
        />
        <LookupField
          targetObjectTypeId="deal_object_type_id"
          value={activity.deal_id}
          onChange={(val) => onFieldChange('deal_id', val)}
          disabled={saving}
        />
      </div>
      <Input
        placeholder="Ergebnis"
        value={activity.outcome || ''}
        onChange={(e) => onFieldChange('outcome', e.target.value)}
        disabled={saving}
      />
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant={activity.status === "done" ? "outline" : "default"}
          onClick={onStatusChange}
          disabled={saving}
        >
          {activity.status === "done" ? "Als offen markieren" : "Als erledigt markieren"}
        </Button>
        <Button
          type="submit"
          disabled={saving}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Wird gespeichert..." : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
