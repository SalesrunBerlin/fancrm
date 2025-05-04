
import { Loader2 } from "lucide-react";

export function RecordLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Datensatz wird geladen...</p>
    </div>
  );
}
