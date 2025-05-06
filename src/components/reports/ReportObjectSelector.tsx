
import { useState, useMemo } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Check, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useObjectRelationships } from "@/hooks/useObjectRelationships";

interface ReportObjectSelectorProps {
  selectedObjects: string[];
  onChange: (objectIds: string[]) => void;
}

export function ReportObjectSelector({ selectedObjects, onChange }: ReportObjectSelectorProps) {
  const { objectTypes, isLoading } = useObjectTypes();
  const [search, setSearch] = useState("");
  
  // Filter objects based on search query
  const availableObjects = useMemo(() => {
    return objectTypes?.filter(obj => 
      !obj.is_archived && obj.is_active &&
      (obj.name.toLowerCase().includes(search.toLowerCase()) ||
       obj.api_name.toLowerCase().includes(search.toLowerCase()))
    ) || [];
  }, [objectTypes, search]);
  
  const handleToggleObject = (objectId: string) => {
    if (selectedObjects.includes(objectId)) {
      onChange(selectedObjects.filter(id => id !== objectId));
    } else {
      onChange([...selectedObjects, objectId]);
    }
  };
  
  const renderRelationshipInfo = () => {
    if (selectedObjects.length < 2) return null;
    
    // For each pair of selected objects, check if there's a relationship
    const relationshipsByObject: Record<string, string[]> = {};
    
    selectedObjects.forEach(objId => {
      const { relationships } = useObjectRelationships(objId);
      
      // Find relationships with other selected objects
      const relatedObjects = relationships?.filter(rel => 
        selectedObjects.includes(rel.from_object_id) && 
        selectedObjects.includes(rel.to_object_id)
      );
      
      if (relatedObjects && relatedObjects.length > 0) {
        relationshipsByObject[objId] = relatedObjects.map(r => r.name);
      }
    });
    
    if (Object.keys(relationshipsByObject).length === 0) {
      return (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          No relationships found between selected objects. Reports work best when objects are related.
        </div>
      );
    }
    
    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
        {Object.entries(relationshipsByObject).map(([objId, relations]) => {
          const objName = objectTypes?.find(o => o.id === objId)?.name || objId;
          return (
            <div key={objId}>
              {objName} has relationships: {relations.join(", ")}
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search objects..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableObjects.map(object => (
          <Card
            key={object.id}
            className={cn(
              "cursor-pointer transition-colors hover:bg-accent/5",
              selectedObjects.includes(object.id) && "border-primary bg-primary/10"
            )}
            onClick={() => handleToggleObject(object.id)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <span className="text-lg">{object.icon || "📋"}</span>
                </div>
                <div>
                  <h3 className="font-medium">{object.name}</h3>
                  <p className="text-xs text-muted-foreground">{object.api_name}</p>
                </div>
              </div>
              
              {selectedObjects.includes(object.id) && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {availableObjects.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          No matching objects found.
        </div>
      )}
      
      {renderRelationshipInfo()}
    </div>
  );
}
