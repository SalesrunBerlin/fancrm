
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Loader2, Share } from "lucide-react";
import { useApplications, Application } from "@/hooks/useApplications";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const publishFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  version: z.string().optional()
});

type PublishFormValues = z.infer<typeof publishFormSchema>;

export default function ApplicationPublishSettingsPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<Application | null>(null);
  const { applications, isLoading: isLoadingApplications } = useApplications();
  
  const form = useForm<PublishFormValues>({
    resolver: zodResolver(publishFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
      version: "1.0"
    }
  });

  // Find the current application when loaded
  useEffect(() => {
    if (applications && applicationId) {
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        setCurrentApplication(app);
        form.reset({
          name: app.name,
          description: app.description || "",
          isPublic: false,
          version: "1.0"
        });
      } else {
        // Application not found, redirect to applications list
        navigate("/applications");
        toast.error("Application not found");
      }
    }
  }, [applications, applicationId, navigate, form]);

  const onSubmit = async (values: PublishFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Store the publishing parameters in the history state
      navigate(`/applications/${applicationId}/publish`, { 
        state: { 
          publishingParams: values 
        } 
      });
    } catch (error) {
      console.error("Error preparing publication:", error);
      toast.error("Failed to prepare publication");
      setIsSubmitting(false);
    }
  };

  if (isLoadingApplications || !currentApplication) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(`/applications/${applicationId}`)} 
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader 
          title={`Publish Application: ${currentApplication.name}`}
          description="Configure publication settings for your application"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publication Details</CardTitle>
          <CardDescription>
            Configure how this application will be published. You'll be able to select which objects and actions to include.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="publish-form" className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publication Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name for the published application" {...field} />
                    </FormControl>
                    <FormDescription>
                      This name will be visible to others when they browse published applications.
                    </FormDescription>
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
                      <Textarea 
                        placeholder="Describe what this application does and what it includes" 
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input placeholder="1.0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional version number or name for this publication.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Make Public</FormLabel>
                      <FormDescription>
                        Allow other users to discover and import your application.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/applications/${applicationId}`)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="publish-form" 
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue to Selection
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
