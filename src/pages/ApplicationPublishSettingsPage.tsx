
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { ArrowLeft, Loader2, Share, RefreshCw } from "lucide-react";
import { useApplications, Application } from "@/hooks/useApplications";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { usePublishedApplications } from "@/hooks/usePublishedApplications";

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
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<Application | null>(null);
  const { applications, isLoading: isLoadingApplications } = useApplications();
  const { publishedApplications, isLoading: isLoadingPublished } = usePublishedApplications();
  
  // Get information from location state
  const isUpdate = location.state?.isUpdate || false;
  const publishedAppId = location.state?.publishedAppId;
  const currentVersion = location.state?.currentVersion || "1.0";
  
  // Find the published application if it exists
  const publishedApp = publishedApplications?.find(app => app.id === publishedAppId);

  // Calculate next version number if updating
  const getNextVersion = () => {
    if (!currentVersion) return "1.1";
    const versionParts = currentVersion.split(".");
    const majorVersion = parseInt(versionParts[0] || "1");
    const minorVersion = parseInt(versionParts[1] || "0") + 1;
    return `${majorVersion}.${minorVersion}`;
  };
  
  const form = useForm<PublishFormValues>({
    resolver: zodResolver(publishFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
      version: isUpdate ? getNextVersion() : "1.0"
    }
  });

  // Find the current application when loaded
  useEffect(() => {
    if (applications && applicationId) {
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        setCurrentApplication(app);
        // If updating an existing published app, use its values
        if (isUpdate && publishedApp) {
          form.reset({
            name: publishedApp.name,
            description: publishedApp.description || "",
            isPublic: publishedApp.is_public,
            version: getNextVersion()
          });
        } else {
          // For new publications, use application values
          form.reset({
            name: app.name,
            description: app.description || "",
            isPublic: false,
            version: "1.0"
          });
        }
      } else {
        // Application not found, redirect to applications list
        navigate("/applications");
        toast.error("Application not found");
      }
    }
  }, [applications, applicationId, navigate, form, isUpdate, publishedApp]);

  const onSubmit = async (values: PublishFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Store the publishing parameters in the history state
      navigate(`/applications/${applicationId}/publish`, { 
        state: { 
          publishingParams: values,
          isUpdate,
          publishedAppId
        } 
      });
    } catch (error) {
      console.error("Error preparing publication:", error);
      toast.error("Failed to prepare publication");
      setIsSubmitting(false);
    }
  };

  if (isLoadingApplications || !currentApplication || isLoadingPublished) {
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
          title={isUpdate ? `Update Published Application: ${currentApplication.name}` : `Publish Application: ${currentApplication.name}`}
          description={isUpdate ? "Update settings for your published application" : "Configure publication settings for your application"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isUpdate ? "Update Publication Details" : "Publication Details"}</CardTitle>
          <CardDescription>
            {isUpdate 
              ? "Update the details for your published application. You'll be able to select which objects, fields, and actions to include."
              : "Configure how this application will be published. You'll be able to select which objects, fields, and actions to include."
            }
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
                      <Input placeholder={isUpdate ? getNextVersion() : "1.0"} {...field} />
                    </FormControl>
                    <FormDescription>
                      {isUpdate 
                        ? `Current version is ${currentVersion}. Specify a new version number for this update.`
                        : "Optional version number or name for this publication."
                      }
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
            {isUpdate ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Continue to Update
              </>
            ) : (
              'Continue to Selection'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
