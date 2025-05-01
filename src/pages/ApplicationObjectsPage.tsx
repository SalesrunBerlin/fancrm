
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useApplications } from "@/hooks/useApplications";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ApplicationObjectsPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { applications, isLoading: isLoadingApps } = useApplications();
  const { objectTypes, isLoading: isLoadingObjects } = useObjectTypes();
  const [currentApplication, setCurrentApplication] = useState<any>(null);
  const [assignedObjectIds, setAssignedObjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingToggles, setPendingToggles] = useState<{ [key: string]: boolean }>({});

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

  const handleToggleObject = async (objectTypeId: string, isCurrentlyAssigned: boolean) => {
    if (!user) return;
    
    // Set pending state for this toggle
    setPendingToggles(prev => ({ ...prev, [objectTypeId]: true }));
    
    try {
      if (isCurrentlyAssigned) {
        // Remove object from application
        const { error } = await supabase
          .from("object_application_assignments")
          .delete()
          .eq("application_id", applicationId)
          .eq("object_type_id", objectTypeId);
          
        if (error) throw error;
        
        // Update local state
        setAssignedObjectIds(prev => prev.filter(id => id !== objectTypeId));
        toast.success("Object removed from application");
      } else {
        // Assign object to application
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
      }
    } catch (error) {
      console.error("Error toggling object assignment:", error);
      toast.error("Failed to update object assignment");
    } finally {
      // Clear pending state for this toggle
      setPendingToggles(prev => ({ ...prev, [objectTypeId]: false }));
    }
  };

  // Filter objects to show only active ones that the user has access to
  const availableObjects = objectTypes?.filter(obj => 
    (obj.owner_id === user?.id || obj.is_system) && 
    obj.is_active && 
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => navigate(`/applications/${applicationId}`)} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader 
            title={`Manage Objects for ${currentApplication.name}`}
            description="Turn on objects to add them to this application"
          />
        </div>
      </div>

      {isLoading || isLoadingObjects ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Object Name</TableHead>
                <TableHead>API Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[100px]">Assigned</TableHead>
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
                  const isPending = pendingToggles[obj.id] || false;
                  
                  return (
                    <TableRow key={obj.id}>
                      <TableCell className="font-medium">{obj.name}</TableCell>
                      <TableCell className="text-muted-foreground">{obj.api_name}</TableCell>
                      <TableCell>
                        {obj.is_system && (
                          <Badge variant="secondary" className="mr-1">System</Badge>
                        )}
                        {obj.is_active ? (
                          <Badge variant="outline" className="bg-green-50">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                        ) : (
                          <Switch
                            checked={isAssigned}
                            onCheckedChange={() => handleToggleObject(obj.id, isAssigned)}
                            disabled={isPending}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
