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
import { PublishApplicationDialog } from "@/components/publishing/PublishApplicationDialog";
import { ArrowLeft, Share, Share2, User, Settings, Eye, Globe, Plus, Loader2 } from "lucide-react";

export default function ApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { applications, deleteApplication, updateApplication, setDefaultApplication, isLoading: isLoadingApps } = useApplications();
  const { applicationObjects, isLoading: isLoadingObjects } = useApplicationObjects(applicationId);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const { toast } = useToast();
  
  const application = applications?.find(app => app.id === applicationId);

  // Handle publish button click
  const handlePublishClick = () => {
    if (!applicationId) return;
    navigate(`/applications/${applicationId}/publish-settings`);
  };
  
  // Other handler functions remain the same...
  
  if (isLoadingApps) {
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
            <Share className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      {/* Rest of the component remains the same */}
    </div>
  );
}
