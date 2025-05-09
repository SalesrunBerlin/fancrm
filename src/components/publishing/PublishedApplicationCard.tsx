
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublishedApplication } from "@/hooks/usePublishedApplications";
import { Calendar, Users, Package, FileCode, ArrowDownToLine, Eye, Globe, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface PublishedApplicationCardProps {
  application: PublishedApplication;
  onImport?: (applicationId: string) => void;
  showImportButton?: boolean;
}

export function PublishedApplicationCard({ 
  application, 
  onImport, 
  showImportButton = true 
}: PublishedApplicationCardProps) {
  // Count objects and actions if they exist
  const objectsCount = application.objects?.length || 0;
  const actionsCount = application.actions?.length || 0;
  
  // Format the published date
  const publishedDate = new Date(application.created_at);
  const publishedTimeAgo = formatDistanceToNow(publishedDate, { addSuffix: true });
  
  // Get publisher name - handle potentially missing publisher data
  const publisherName = application.publisher?.user_metadata?.full_name || 
                        application.publisher?.email || 
                        'Unknown user';

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <CardTitle className="break-words">{application.name}</CardTitle>
            {application.version && (
              <div className="text-xs text-muted-foreground mt-1">
                Version {application.version}
              </div>
            )}
          </div>
          <div>
            <Badge 
              variant={application.is_public ? "success" : "outline"} 
              className="flex items-center gap-1"
            >
              {application.is_public ? (
                <>
                  <Globe className="h-3 w-3" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Private</span>
                </>
              )}
            </Badge>
          </div>
        </div>
        <CardDescription className="mt-2">
          {application.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Published {publishedTimeAgo}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>By {publisherName}</span>
          </div>
          
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{objectsCount} Objects</span>
            </div>
            
            <div className="flex items-center gap-1">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{actionsCount} Actions</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex gap-2">
        {showImportButton && (
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onImport?.(application.id)}
          >
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            Import
          </Button>
        )}
        <Link to={`/applications/import/${application.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
