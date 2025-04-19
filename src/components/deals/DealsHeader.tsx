
import { Button } from "@/components/ui/button";
import { Briefcase, Plus } from "lucide-react";

interface DealsHeaderProps {
  onCreateClick: () => void;
}

export function DealsHeader({ onCreateClick }: DealsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center">
        <Briefcase className="mr-2 h-6 w-6 text-beauty" />
        <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
      </div>
      <Button onClick={onCreateClick} className="bg-beauty hover:bg-beauty-dark">
        <Plus className="mr-2 h-4 w-4" />
        Add Deal
      </Button>
    </div>
  );
}
