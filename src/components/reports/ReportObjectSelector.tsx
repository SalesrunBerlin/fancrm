
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReportObjectSelectorProps {
  selectedObjects: string[];
  onChange: (objectIds: string[]) => void;
}

export function ReportObjectSelector({ selectedObjects, onChange }: ReportObjectSelectorProps) {
  const { objectTypes, isLoading } = useObjectTypes();
  
  const handleToggleObject = (objectTypeId: string) => {
    let updatedSelection: string[];
    
    if (selectedObjects.includes(objectTypeId)) {
      updatedSelection = selectedObjects.filter(id => id !== objectTypeId);
    } else {
      updatedSelection = [...selectedObjects, objectTypeId];
    }
    
    onChange(updatedSelection);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 rounded-full border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!objectTypes || objectTypes.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-center text-muted-foreground">
            No object types available. Please create some objects first.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Filter out archived objects
  const availableObjects = objectTypes.filter(obj => !obj.is_archived);
  
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-4">Select Objects</h3>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {availableObjects.map(objectType => (
              <div key={objectType.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`object-${objectType.id}`}
                  checked={selectedObjects.includes(objectType.id)}
                  onCheckedChange={() => handleToggleObject(objectType.id)}
                />
                <Label
                  htmlFor={`object-${objectType.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {objectType.name}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
