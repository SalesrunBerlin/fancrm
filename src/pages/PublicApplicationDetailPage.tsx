
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePublishedApplications } from "@/hooks/usePublishedApplications";
import { ArrowLeft, Package, FileCode, Calendar, Users, ArrowDownToLine, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PublicApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { usePublishedApplicationDetails } = usePublishedApplications();
  const { data: application, isLoading } = usePublishedApplicationDetails(applicationId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate("/structures")} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader 
            title="Loading..." 
            description="Loading application details" 
          />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-36 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Application Not Found" 
          description="The requested public application could not be found" 
        />
        <Button onClick={() => navigate("/structures")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Structures
        </Button>
      </div>
    );
  }

  // Format the published date
  const publishedDate = new Date(application.created_at);
  const publishedTimeAgo = formatDistanceToNow(publishedDate, { addSuffix: true });
  
  // Get publisher name
  const publisherName = application.publisher?.user_metadata?.full_name || 
                        application.publisher?.email || 
                        'Unknown user';

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate("/structures")} 
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader 
          title={application.name} 
          description="Public application details"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{application.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Public
              </Badge>
              {application.version && (
                <Badge variant="outline">v{application.version}</Badge>
              )}
            </div>
          </div>
          <CardDescription className="mt-2">
            {application.description || "No description provided"}
          </CardDescription>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Published {publishedTimeAgo}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">By {publisherName}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="objects">
            <TabsList>
              <TabsTrigger value="objects">
                <Package className="h-4 w-4 mr-2" />
                Objects ({application.objects?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="actions">
                <FileCode className="h-4 w-4 mr-2" />
                Actions ({application.actions?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="objects" className="mt-4">
              <div className="grid gap-3">
                {application.objects?.length > 0 ? (
                  application.objects.map(obj => (
                    <Card key={obj.id} className="p-3">
                      <div className="flex flex-col">
                        <div className="font-medium">{obj.object_type?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {obj.object_type?.api_name}
                        </div>
                        {obj.object_type?.description && (
                          <div className="text-sm mt-1">{obj.object_type.description}</div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No objects included in this application
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="actions" className="mt-4">
              <div className="grid gap-3">
                {application.actions?.length > 0 ? (
                  application.actions.map(action => (
                    <Card key={action.id} className="p-3">
                      <div className="flex flex-col">
                        <div className="font-medium">{action.action?.name}</div>
                        {action.action?.description && (
                          <div className="text-sm mt-1">{action.action.description}</div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No actions included in this application
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full"
            onClick={() => navigate(`/applications/import/${application.id}`)}
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Import Application
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
