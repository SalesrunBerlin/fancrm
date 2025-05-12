// Importing react related libraries
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, Outlet } from "react-router-dom";

// Importing UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useApplications } from "@/hooks/useApplications";
import { useApplicationObjects } from "@/hooks/useApplicationObjects";
import { usePublishedApplications } from "@/hooks/usePublishedApplications";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PublishingDetailsTab } from "@/components/applications/PublishingDetailsTab";
import { Loader2, AlignJustify, Trash2, Archive, ExternalLink, Download } from "lucide-react";
import { ObjectCard } from "@/components/structures/ObjectCard";
import { DeleteDialog } from "@/components/common/DeleteDialog";

export default function ApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [selectedObjectTypeId, setSelectedObjectTypeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("objects");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { useApplicationDetails, removeApplication } = useApplications();
  const { data: application, isLoading, error } = useApplicationDetails(applicationId || "");
  
  const { useApplicationObjectsList } = useApplicationObjects();
  const { data: objects = [], isLoading: isObjectsLoading } = useApplicationObjectsList(applicationId || "");
  
  const { useApplicationPublishingStats } = usePublishedApplications();
  const { data: publishingStats, isLoading: isStatsLoading } = useApplicationPublishingStats(applicationId || "");

  const handleDeleteApplication = async () => {
    if (!applicationId) return;
    
    try {
      await removeApplication(applicationId);
      toast({
        title: "Success",
        description: "Application deleted successfully"
      });
      navigate("/applications");
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive"
      });
      console.error(err);
    }
  };

  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={application ? application.name : "Loading..."}
          description={application ? application.description : "Loading application details..."}
        />
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link to={`/applications/${applicationId}/edit`}>
              <AlignJustify className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="objects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="objects">Objects</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
        </TabsList>
        <TabsContent value="objects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Objects</CardTitle>
              <CardDescription>
                Manage objects associated with this application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {objects.map((object) => (
                    <ObjectCard key={object.object_type_id} object={object} />
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link to={`/applications/${applicationId}/objects/new`}>
                  Create New Object
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="publishing" className="space-y-4">
          <PublishingDetailsTab applicationId={applicationId || ""} />
        </TabsContent>
      </Tabs>

      <DeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteApplication}
        itemType="application"
        itemName={application?.name || "this application"}
      />
    </div>
  );
}
