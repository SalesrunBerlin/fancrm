
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ObjectType } from "@/hooks/useObjectTypes";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, AppWindow } from "lucide-react";
import { ThemedButton } from "@/components/ui/themed-button";

interface ObjectCardProps {
  objectType: ObjectType;
  onPublish?: (objectId: string) => void;
  showPublishButton?: boolean;
}

export function ObjectCard({ objectType, onPublish, showPublishButton = false }: ObjectCardProps) {
  const [applications, setApplications] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("object_application_assignments")
          .select(`
            application_id,
            application:applications(name, is_default)
          `)
          .eq("object_type_id", objectType.id);
          
        if (error) throw error;
        
        if (data) {
          const appNames = data.map(item => {
            const app = item.application as { name: string, is_default: boolean };
            return app.is_default ? `${app.name} (Default)` : app.name;
          });
          
          setApplications(appNames);
        }
      } catch (error) {
        console.error("Error fetching application assignments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApplications();
  }, [objectType.id]);

  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <Eye className="h-5 w-5" />;
      case 'building': return <Eye className="h-5 w-5" />;
      case 'briefcase': return <Eye className="h-5 w-5" />;
      case 'calendar': return <Eye className="h-5 w-5" />;
      default: return <Eye className="h-5 w-5" />;
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            {getIconComponent(objectType.icon)}
            <CardTitle className="break-words">{objectType.name}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-1">
            {objectType.is_system && (
              <Badge variant="secondary">System</Badge>
            )}
            {objectType.is_published && (
              <Badge variant="outline">Published</Badge>
            )}
            {objectType.is_template && (
              <Badge variant="outline" className="bg-purple-100">Imported</Badge>
            )}
          </div>
        </div>
        <CardDescription className="break-words">
          {objectType.description || `API Name: ${objectType.api_name}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
          {objectType.is_active ? "Active" : "Inactive"}
        </p>
        
        {applications.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AppWindow className="h-3 w-3" />
              <span>Applications:</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {applications.map((appName, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {appName}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 mt-auto flex flex-col gap-2">
        <div className="flex w-full gap-2">
          <Link to={`/settings/objects/${objectType.id}`} className="flex-1">
            <ThemedButton variant="outline" className="w-full">
              Manage
            </ThemedButton>
          </Link>
          {showPublishButton && !objectType.is_published && !objectType.is_template && (
            <ThemedButton 
              variant="outline" 
              className="flex-1"
              onClick={() => onPublish?.(objectType.id)}
            >
              Publish
            </ThemedButton>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
