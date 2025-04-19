
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface DealsFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function DealsFilter({ searchQuery, onSearchChange }: DealsFilterProps) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search deals..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-8 w-full sm:w-64"
      />
    </div>
  );
}
