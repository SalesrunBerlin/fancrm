
import { useEffect, useState } from "react";
import { useApplications } from "@/hooks/useApplications";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ApplicationOption {
  id: string;
  name: string;
  description?: string | null;
  is_default?: boolean;
}

interface ApplicationCheckboxListProps {
  selectedApplications: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function ApplicationCheckboxList({
  selectedApplications,
  onSelectionChange
}: ApplicationCheckboxListProps) {
  const { applications, isLoading } = useApplications();
  
  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedApplications, id]);
    } else {
      onSelectionChange(selectedApplications.filter(appId => appId !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return <p className="text-muted-foreground text-sm py-2">No applications available</p>;
  }

  return (
    <ScrollArea className="max-h-[300px] border rounded-md p-2">
      <div className="space-y-2">
        {applications.map((app) => (
          <div key={app.id} className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-md">
            <Checkbox
              id={`app-${app.id}`}
              checked={selectedApplications.includes(app.id)}
              onCheckedChange={(checked) => handleCheckboxChange(app.id, checked === true)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <label
                htmlFor={`app-${app.id}`}
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                {app.name}
                {app.is_default && (
                  <Badge variant="outline" className="text-xs">Default</Badge>
                )}
              </label>
              {app.description && (
                <p className="text-xs text-muted-foreground">{app.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
