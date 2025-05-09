import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { TabsContent, TabsList, TabsTrigger, Tabs } from "@/components/ui/tabs";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { ObjectCard } from "@/components/structures/ObjectCard";
import { PublishedApplicationCard } from "@/components/publishing/PublishedApplicationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PublishedObjectDetail } from "@/components/structures/PublishedObjectDetail";
import { PublishingConfigDialog } from "@/components/settings/PublishingConfigDialog";
import { useQueryClient } from "@tanstack/react-query";
import { AppWindow } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePublishedApplications } from "@/hooks/usePublishedApplications";

export default function Structures() {
  const [open, setOpen] = useState(false);
  const { objectTypes, isLoading, publishObjectType } = useObjectTypes();
  const { 
    publishedApplications,
    isLoading: isLoadingPublished 
  } = usePublishedApplications();
  const queryClient = useQueryClient();
  const [selectedObject, setSelectedObject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["objectTypes"] });
    queryClient.invalidateQueries({ queryKey: ["published-applications"] });
  }, [queryClient]);

  const handlePublish = async (objectId: string) => {
    try {
      await publishObjectType.mutateAsync(objectId);
      queryClient.invalidateQueries({ queryKey: ["objectTypes"] });
    } catch (error) {
      console.error("Error publishing object type:", error);
    }
  };

  const handleImportApplication = (applicationId: string) => {
    navigate(`/applications/import/${applicationId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Structures"
        description="Define and customize your data structures"
      />

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="public-applications">Public Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : objectTypes && objectTypes.filter(obj => obj.is_active && !obj.is_published).length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {objectTypes
                .filter(obj => obj.is_active && !obj.is_published)
                .map(objectType => (
                  <ObjectCard
                    key={objectType.id}
                    objectType={objectType}
                    onPublish={handlePublish}
                    showPublishButton
                  />
                ))}
            </div>
          ) : (
            <Alert>
              <AlertTitle>No Active Objects</AlertTitle>
              <AlertDescription>
                There are no active objects to display. Create a new object or activate an existing one.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : objectTypes && objectTypes.filter(obj => !obj.is_active).length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {objectTypes
                .filter(obj => !obj.is_active)
                .map(objectType => (
                  <ObjectCard key={objectType.id} objectType={objectType} />
                ))}
            </div>
          ) : (
            <Alert>
              <AlertTitle>No Inactive Objects</AlertTitle>
              <AlertDescription>
                There are no inactive objects to display.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : objectTypes && objectTypes.filter(obj => obj.is_published).length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {objectTypes
                .filter(obj => obj.is_published)
                .map(objectType => (
                  <ObjectCard key={objectType.id} objectType={objectType} />
                ))}
            </div>
          ) : (
            <Alert>
              <AlertTitle>No Published Objects</AlertTitle>
              <AlertDescription>
                There are no published objects to display.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="public-applications" className="space-y-4">
          {isLoadingPublished ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : publishedApplications && publishedApplications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publishedApplications.map(application => (
                <PublishedApplicationCard
                  key={application.id}
                  application={application}
                  onImport={handleImportApplication}
                />
              ))}
            </div>
          ) : (
            <Alert>
              <AlertTitle>No Public Applications</AlertTitle>
              <AlertDescription>
                There are no published applications to display. Publish an application to see it here.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
