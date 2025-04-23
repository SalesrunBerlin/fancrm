
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";

interface ActivityDetailHeaderProps {
  isEditing: boolean;
  onBack: () => void;
  onEdit: () => void;
}

export function ActivityDetailHeader({ isEditing, onBack, onEdit }: ActivityDetailHeaderProps) {
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
        <Button type="submit" form="activity-edit-form">
          <Save className="mr-2 h-4 w-4" /> Speichern
        </Button>
      )}
    </div>
  );
}
