
import { Button } from "@/components/ui/button";

interface DealsViewToggleProps {
  viewMode: "grid" | "table";
  onViewChange: (mode: "grid" | "table") => void;
}

export function DealsViewToggle({ viewMode, onViewChange }: DealsViewToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={viewMode === "grid" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewChange("grid")}
        className={viewMode === "grid" ? "bg-beauty hover:bg-beauty-dark" : ""}
      >
        Grid
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewChange("table")}
        className={viewMode === "table" ? "bg-beauty hover:bg-beauty-dark" : ""}
      >
        Table
      </Button>
    </div>
  );
}
