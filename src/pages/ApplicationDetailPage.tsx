
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApplications } from "@/hooks/useApplications";
import { useApplicationObjects } from "@/hooks/useApplicationObjects";
import { usePublishedApplications } from "@/hooks/usePublishedApplications";
import { ArrowLeft, Share, User, Settings, Eye, Globe, Plus, Loader2, RefreshCw } from "lucide-react";
import { PublishingDetailsTab } from "@/components/applications/PublishingDetailsTab";

export default function ApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { applications, deleteApplication, updateApplication, setDefaultApplication, isLoading: isLoadingApps } = useApplications();
  const { applicationObjects, isLoading: isLoadingObjects } = useApplicationObjects(applicationId);
  const { publishedApplications, isLoading: isLoadingPublishedApps } = usePublishedApplications();
  const { toast } = useToast();
  
  const application = applications?.find(app => app.id === applicationId);
  const publishedApp = publishedApplications?.find(app => app.application_id === applicationId);
  
  // Handle publish button click
  const handlePublishClick = () => {
    if (!applicationId) return;
    navigate(`/applications/${applicationId}/publish-settings`, { 
      state: { 
        isUpdate: !!publishedApp,
        publishedAppId: publishedApp?.id,
        currentVersion: publishedApp?.version
      } 
    });
  };
  
  if (isLoadingApps || isLoadingPublishedApps) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <h2 className="text-2xl font-semibold">Application not found</h2>
        <Button asChild>
          <Link to="/applications">Back to Applications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => navigate('/applications')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader 
            title={application.name}
            description={application.description || "No description provided"}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePublishClick} className="gap-2">
            {publishedApp ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Update Published App
              </>
            ) : (
              <>
                <Share className="h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {publishedApp && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 pb-2">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">Published as: {publishedApp.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Version: {publishedApp.version || "1.0"} · 
                  {publishedApp.is_public ? " Public" : " Private"} ·
                  Last updated: {new Date(publishedApp.updated_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="secondary">Published</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="objects">
        <TabsList>
          <TabsTrigger value="objects">Objects</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="objects">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Application Objects</CardTitle>
                  <CardDescription>
                    Manage objects associated with this application
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => navigate(`/applications/${applicationId}/objects`)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Manage Objects
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingObjects ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : applicationObjects && applicationObjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {applicationObjects.map(object => (
                      <Card key={object.id} className="border hover:shadow-md transition-shadow">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            {object.name}
                            {object.is_system && (
                              <Badge variant="outline" className="ml-2">System</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs truncate">
                            {object.api_name}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="py-3 flex justify-between">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/objects/${object.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Records
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <h3 className="text-lg font-medium text-gray-600">No objects assigned</h3>
                    <p className="text-gray-500 mt-1 mb-4">
                      Add objects to this application to get started
                    </p>
                    <Button 
                      onClick={() => navigate(`/applications/${applicationId}/objects`)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Objects
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="publishing">
          <PublishingDetailsTab 
            applicationId={applicationId || ""}
            publishedApp={publishedApp}
          />
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Manage application details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-1">Set as Default Application</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  When enabled, this will be your default application when logging in
                </p>
                <Button
                  onClick={() => setDefaultApplication.mutateAsync(applicationId || '')}
                  variant={application.is_default ? "secondary" : "outline"}
                  disabled={application.is_default}
                  className="gap-2"
                >
                  {application.is_default ? "Default Application" : "Set as Default"}
                </Button>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-destructive mb-1">Delete Application</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Permanently remove this application and all its settings
                </p>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
                      deleteApplication.mutateAsync(applicationId || '')
                        .then(() => {
                          toast({
                            title: "Application deleted",
                            description: "The application has been deleted successfully.",
                          });
                          navigate("/applications");
                        })
                        .catch((error) => {
                          console.error("Failed to delete application:", error);
                          toast({
                            variant: "destructive",
                            title: "Failed to delete application",
                            description: "An error occurred while deleting the application.",
                          });
                        });
                    }
                  }}
                >
                  Delete Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
