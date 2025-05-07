
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Image, PaintBucket, Square, Save } from "lucide-react";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Icon-Editor Hilfe</DialogTitle>
          <DialogDescription>
            So erstellen Sie ein benutzerdefiniertes Icon
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium flex items-center">
              <Image className="w-4 h-4 mr-2" />
              1. Bild hochladen
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Laden Sie ein Bild hoch, das als Grundlage für Ihr Icon dienen soll.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium flex items-center">
              <Square className="w-4 h-4 mr-2" />
              2. Zuschneiden
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Positionieren und skalieren Sie das blaue Rechteck zum Ausschneiden des gewünschten Bereichs. Klicken Sie dann auf "Freistellen".
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">3. Schwarz-Weiß-Konvertierung</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Wählen Sie eine der fünf Stufenoptionen, um zu bestimmen, welche Bereiche schwarz und welche weiß werden.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium flex items-center">
              <PaintBucket className="w-4 h-4 mr-2" />
              4. Einfärben
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Wählen Sie eine Farbe für Ihr Icon aus und sehen Sie eine Vorschau des Ergebnisses.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium flex items-center">
              <Save className="w-4 h-4 mr-2" />
              5. Speichern
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Überprüfen Sie die Einstellungen und speichern Sie Ihr neues Icon.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
