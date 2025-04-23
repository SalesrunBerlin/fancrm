
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X } from "lucide-react";

interface ActivityDetailHeaderProps {
  isEditing: boolean;
  onBack: () => void;
  onEdit: () => void;
  onCancel?: () => void;
}

export function ActivityDetailHeader({ isEditing, onBack, onEdit, onCancel }: ActivityDetailHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück
      </Button>
      {!isEditing ? (
        <Button onClick={onEdit}>
          Bearbeiten
        </Button>
      ) : (
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} type="button">
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
          )}
          <Button type="submit" form="activity-edit-form">
            <Save className="mr-2 h-4 w-4" /> Speichern
          </Button>
        </div>
      )}
    </div>
  );
}
