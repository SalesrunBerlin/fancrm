
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, LayoutList, Kanban } from "lucide-react";

interface DealsViewToggleProps {
  viewMode: "grid" | "table" | "kanban";
  onViewChange: (value: "grid" | "table" | "kanban") => void;
}

export function DealsViewToggle({ viewMode, onViewChange }: DealsViewToggleProps) {
  return (
    <ToggleGroup type="single" value={viewMode} onValueChange={onViewChange}>
      <ToggleGroupItem value="kanban">
        <Kanban className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table">
        <LayoutList className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
