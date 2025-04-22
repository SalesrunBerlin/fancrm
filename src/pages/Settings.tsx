
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDealStatuses } from "@/hooks/useDealStatuses";
import { StatusForm } from "@/components/settings/StatusForm";
import { StatusList } from "@/components/settings/StatusList";
import { useTheme } from "@/hooks/useTheme";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { ColorSettings } from "@/components/settings/ColorSettings";

export default function Settings() {
  const {
    dealStatuses,
    isLoading,
    createStatus,
    updateStatus,
    deleteStatus,
    initializeDefaultStatuses
  } = useDealStatuses();

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(false);

  useEffect(() => {
    if (dealStatuses && dealStatuses.length === 0 && !isLoading) {
      initializeDefaultStatuses();
    }
  }, [dealStatuses, isLoading, initializeDefaultStatuses]);

  // Theme Toggle
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Einstellungen</h1>
      <Card className="p-6 space-y-6">
        <div className="flex items-center mb-6">
          <span className="font-semibold text-lg mr-4">Dark Mode</span>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>

        {/* Color Settings Section */}
        <Collapsible open={isColorOpen} onOpenChange={setIsColorOpen}>
          <div className="flex items-center space-x-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                <ChevronRight className={`h-4 w-4 transition-transform ${isColorOpen ? 'rotate-90' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <h2 className="text-xl font-semibold">Farben</h2>
          </div>
          <CollapsibleContent className="mt-4">
            <ColorSettings />
          </CollapsibleContent>
        </Collapsible>
        
        <div className="border-t my-4" />

        {/* Deal Status Management Section */}
        <Collapsible open={isStatusOpen} onOpenChange={setIsStatusOpen}>
          <div className="flex items-center space-x-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                <ChevronRight className={`h-4 w-4 transition-transform ${isStatusOpen ? 'rotate-90' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <h2 className="text-xl font-semibold">Deal Status Verwaltung</h2>
          </div>
          <CollapsibleContent className="mt-4">
            <StatusForm 
              dealStatuses={dealStatuses || []} 
              createStatus={createStatus} 
              isPending={createStatus.isPending}
            />
            <StatusList 
              dealStatuses={dealStatuses || []}
              isLoading={isLoading}
              updateStatus={updateStatus}
              deleteStatus={deleteStatus}
            />
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
