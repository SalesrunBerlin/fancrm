
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublishedApplication } from "@/hooks/usePublishedApplications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share, RefreshCw, Package, FileCode, Globe, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface PublishingDetailsTabProps {
  applicationId: string;
  publishedApp: PublishedApplication | undefined;
}

export function PublishingDetailsTab({ applicationId, publishedApp }: PublishingDetailsTabProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("objects");

  // Handle publish button click
  const handlePublishClick = () => {
    navigate(`/applications/${applicationId}/publish-settings`, { 
      state: { 
        isUpdate: !!publishedApp,
        publishedAppId: publishedApp?.id,
        currentVersion: publishedApp?.version
      } 
    });
  };

  if (!publishedApp) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Not Published</CardTitle>
          <CardDescription>
            This application has not been published yet. Publishing allows you to share your application with others.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handlePublishClick} className="gap-2 mt-4">
            <Share className="h-4 w-4" />
            Publish Application
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Format the published date
  const publishedDate = new Date(publishedApp.updated_at);
  const publishedTimeAgo = formatDistanceToNow(publishedDate, { addSuffix: true });

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Publishing Details</CardTitle>
              <CardDescription className="mt-1">
                Published as: <span className="font-medium">{publishedApp.name}</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={publishedApp.is_public ? "success" : "outline"} className="flex items-center gap-1">
                {publishedApp.is_public ? (
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
              <Badge variant="outline">v{publishedApp.version || "1.0"}</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {publishedTimeAgo}
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={handlePublishClick} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Update Published App
          </Button>
        </CardContent>
      </Card>

      <div>
        <Tabs defaultValue="objects" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="objects" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span>Objects</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {publishedApp.objects?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-1">
              <FileCode className="h-4 w-4" />
              <span>Actions</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {publishedApp.actions?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="objects" className="mt-4">
            {publishedApp.objects && publishedApp.objects.length > 0 ? (
              <div className="grid gap-3">
                {publishedApp.objects.map(obj => (
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
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No objects have been published with this application.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="actions" className="mt-4">
            {publishedApp.actions && publishedApp.actions.length > 0 ? (
              <div className="grid gap-3">
                {publishedApp.actions.map(action => (
                  <Card key={action.id} className="p-3">
                    <div className="flex flex-col">
                      <div className="font-medium">{action.action?.name}</div>
                      {action.action?.description && (
                        <div className="text-sm mt-1">{action.action.description}</div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No actions have been published with this application.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
