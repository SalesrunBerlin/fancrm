import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApplications } from "@/hooks/useApplications";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { 
  ArrowLeft, 
  Loader2, 
  Trash, 
  Save, 
  Plus, 
  X, 
  Star,
  StarOff
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import * as z from "zod";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ObjectAssignmentDialog } from "@/components/settings/ObjectAssignmentDialog";
import { useApplicationObjects } from "@/hooks/useApplicationObjects";

const applicationFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export default function ApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { 
    applications, 
    isLoading, 
    updateApplication, 
    deleteApplication, 
    setDefaultApplication 
  } = useApplications();
  const [currentApplication, setCurrentApplication] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showObjectAssignmentDialog, setShowObjectAssignmentDialog] = useState(false);
  
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Find the current application
  useEffect(() => {
    if (applications && applicationId) {
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        setCurrentApplication(app);
        form.reset({
          name: app.name,
          description: app.description || "",
        });
      } else {
        // Application not found, redirect to applications list
        navigate("/applications");
      }
    }
  }, [applications, applicationId, navigate]);

  const onSubmit = async (values: ApplicationFormValues) => {
    if (!applicationId) return;
    
    try {
      await updateApplication.mutateAsync({
        id: applicationId,
        formData: values,
      });
      toast.success("Application updated successfully");
    } catch (error) {
      console.error("Error updating application:", error);
    }
  };

  const handleDelete = async () => {
    if (!applicationId) return;
    
    try {
      await deleteApplication.mutateAsync(applicationId);
      navigate("/applications");
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete application");
    }
  };

  const handleSetDefault = async () => {
    if (!applicationId) return;
    
    try {
      await setDefaultApplication.mutateAsync(applicationId);
    } catch (error) {
      console.error("Error setting default application:", error);
    }
  };

  if (isLoading) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => navigate("/applications")} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader 
            title={currentApplication.name}
            description={currentApplication.is_default ? "Default Application" : ""}
          />
          {currentApplication.is_default && (
            <Badge variant="secondary" className="ml-2 flex items-center gap-1">
              <Star className="h-3 w-3" />
              Default
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!currentApplication.is_default && (
            <Button variant="outline" onClick={handleSetDefault}>
              <Star className="mr-2 h-4 w-4" />
              Make Default
            </Button>
          )}
          {!currentApplication.is_default && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Application Details</TabsTrigger>
          <TabsTrigger value="objects">Objects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Application name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Application description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={updateApplication.isPending}>
                    {updateApplication.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="objects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assigned Objects</CardTitle>
              <Button onClick={() => navigate(`/applications/${applicationId}/objects`)}>
                <Plus className="h-4 w-4 mr-2" />
                Manage Objects
              </Button>
            </CardHeader>
            <CardContent>
              <AssignedObjectsList applicationId={applicationId!} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Application"
        description="Are you sure you want to delete this application? This action cannot be undone."
        deleteButtonText="Delete Application"
      />
    </div>
  );
}

// Component for displaying assigned objects
function AssignedObjectsList({ applicationId }: { applicationId: string }) {
  const { applicationObjects, isLoading } = useApplicationObjects(applicationId);
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!applicationObjects || applicationObjects.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No objects assigned to this application.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Object Name</TableHead>
          <TableHead>API Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applicationObjects.map(obj => (
          <TableRow key={obj.id}>
            <TableCell>{obj.name}</TableCell>
            <TableCell>{obj.api_name}</TableCell>
            <TableCell>
              {obj.is_active ? (
                <Badge variant="outline" className="bg-green-50">Active</Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50">Inactive</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
