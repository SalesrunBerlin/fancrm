
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApplications } from "@/hooks/useApplications";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ApplicationSelectorProps {
  objectTypeId: string;
  onSelect: (applicationId: string | null) => void;
}

export function ApplicationSelector({ objectTypeId, onSelect }: ApplicationSelectorProps) {
  const { applications, isLoading } = useApplications();
  const [recommendedAppIds, setRecommendedAppIds] = useState<string[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  // Fetch recommended applications for this object type
  useEffect(() => {
    const fetchRecommendedApplications = async () => {
      if (!objectTypeId) return;
      
      try {
        setIsLoadingRecommendations(true);
        
        const { data, error } = await supabase
          .from("object_application_assignments")
          .select("application_id")
          .eq("object_type_id", objectTypeId);
          
        if (error) throw error;
        
        const appIds = data?.map(item => item.application_id) || [];
        setRecommendedAppIds(appIds);
        
        // If there's a recommended default app, select it
        if (applications && appIds.length > 0) {
          const defaultApp = applications.find(app => app.is_default && appIds.includes(app.id));
          if (defaultApp) {
            setSelectedApplicationId(defaultApp.id);
            onSelect(defaultApp.id);
          }
        }
      } catch (error) {
        console.error("Error fetching recommended applications:", error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };
    
    fetchRecommendedApplications();
  }, [objectTypeId, applications]);
  
  // Select default application if no recommended apps
  useEffect(() => {
    if (applications && applications.length > 0 && !selectedApplicationId) {
      // If there are no recommendations or they failed to load, select user's default app
      const defaultApp = applications.find(app => app.is_default);
      if (defaultApp) {
        setSelectedApplicationId(defaultApp.id);
        onSelect(defaultApp.id);
      }
    }
  }, [applications, selectedApplicationId, recommendedAppIds]);
  
  const handleApplicationChange = (value: string) => {
    setSelectedApplicationId(value);
    onSelect(value);
  };
  
  const isLoaderShown = isLoading || isLoadingRecommendations;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assign to Application</CardTitle>
        <CardDescription>
          Select which application this object should be assigned to
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoaderShown ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              value={selectedApplicationId || ""}
              onValueChange={handleApplicationChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an application" />
              </SelectTrigger>
              <SelectContent>
                {applications?.map(app => (
                  <SelectItem 
                    key={app.id} 
                    value={app.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {app.name}
                      {app.is_default && " (Default)"}
                      {recommendedAppIds.includes(app.id) && (
                        <Badge variant="secondary" className="ml-2 text-xs">Recommended</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {recommendedAppIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Applications marked as "Recommended" were suggested by the publisher of this object.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
