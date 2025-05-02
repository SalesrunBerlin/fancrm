
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useApplications } from "@/hooks/useApplications";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ApplicationObjectsPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { applications, isLoading: isLoadingApps } = useApplications();
  const { objectTypes, isLoading: isLoadingObjects } = useObjectTypes();
  const [currentApplication, setCurrentApplication] = useState<any>(null);
  const [assignedObjectIds, setAssignedObjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  // Find the current application
  useEffect(() => {
    if (applications && applicationId) {
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        setCurrentApplication(app);
      } else {
        // Application not found, redirect to applications list
        navigate("/applications");
        toast.error("Application not found");
      }
    }
  }, [applications, applicationId, navigate]);

  // Fetch already assigned objects
  useEffect(() => {
    if (applicationId) {
      fetchAssignedObjects();
    }
  }, [applicationId]);

  const fetchAssignedObjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("object_application_assignments")
        .select("object_type_id")
        .eq("application_id", applicationId);
        
      if (error) throw error;
      
      setAssignedObjectIds(data.map(item => item.object_type_id) || []);
    } catch (error) {
      console.error("Error fetching assigned objects:", error);
      toast.error("Failed to load assigned objects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignObject = async (objectTypeId: string) => {
    if (!user) return;
    
    try {
      setIsAssigning(true);
      
      const { error } = await supabase
        .from("object_application_assignments")
        .insert({
          application_id: applicationId,
          object_type_id: objectTypeId,
          owner_id: user.id
        });
        
      if (error) throw error;
      
      // Update local state
      setAssignedObjectIds(prev => [...prev, objectTypeId]);
      toast.success("Object assigned to application");
    } catch (error) {
      console.error("Error assigning object:", error);
      toast.error("Failed to assign object");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveObject = async (objectTypeId: string) => {
    try {
      setIsAssigning(true);
      
      const { error } = await supabase
        .from("object_application_assignments")
        .delete()
        .eq("application_id", applicationId)
        .eq("object_type_id", objectTypeId);
        
      if (error) throw error;
      
      // Update local state
      setAssignedObjectIds(prev => prev.filter(id => id !== objectTypeId));
      toast.success("Object removed from application");
    } catch (error) {
      console.error("Error removing object:", error);
      toast.error("Failed to remove object");
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter objects to show objects that the user has access to
  const availableObjects = objectTypes?.filter(obj => 
    (obj.owner_id === user?.id || obj.is_system) && 
    !obj.is_archived
  ) || [];

  if (isLoadingApps || (isLoading && !currentApplication)) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentApplication) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Application not found.</p>
        <Button variant="outline" onClick={() => navigate("/applications")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applications
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-4 md:px-6 md:py-6 space-y-4 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(`/applications/${applicationId}`)} 
            className="mr-2 md:mr-4 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader 
            title={`Manage Objects for ${currentApplication.name}`}
            description="Assign or remove objects from this application"
            className="min-w-0"
          />
        </div>
      </div>

      {isLoading || isLoadingObjects ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <ScrollArea className="w-full">
            <div className="min-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Object Name</TableHead>
                    <TableHead className="min-w-[150px]">API Name</TableHead>
                    <TableHead className="min-w-[100px]">Type</TableHead>
                    <TableHead className="text-right min-w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableObjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No available objects found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    availableObjects.map((obj) => {
                      const isAssigned = assignedObjectIds.includes(obj.id);
                      
                      return (
                        <TableRow key={obj.id}>
                          <TableCell className="font-medium">{obj.name}</TableCell>
                          <TableCell className="text-sm break-all">{obj.api_name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {obj.is_system && (
                                <Badge variant="secondary" className="text-xs whitespace-nowrap">System</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={isAssigned ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => isAssigned ? handleRemoveObject(obj.id) : handleAssignObject(obj.id)}
                              disabled={isAssigning}
                              className="whitespace-nowrap"
                            >
                              {isAssigning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isAssigned ? (
                                "Remove"
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Assign
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
