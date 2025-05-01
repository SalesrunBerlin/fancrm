
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { useApplications } from "@/hooks/useApplications";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppWindow, Plus, Settings } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function ApplicationsPage() {
  const [open, setOpen] = useState(false);
  const { applications, isLoading, createApplication, setDefaultApplication } = useApplications();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createApplication.mutateAsync({
        name: values.name,
        description: values.description
      });
      
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating application:", error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultApplication.mutateAsync(id);
      toast.success("Default application set successfully");
    } catch (error) {
      console.error("Error setting default application:", error);
      toast.error("Failed to set default application");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Manage your applications and object assignments"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Application
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Application</DialogTitle>
                <DialogDescription>
                  Add a new application to organize your objects.
                </DialogDescription>
              </DialogHeader>
              
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
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe what this application is for" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createApplication.isPending}>
                      {createApplication.isPending ? "Creating..." : "Create Application"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
              
            </DialogContent>
          </Dialog>
        }
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-full">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))
        ) : applications && applications.length > 0 ? (
          applications.map((app) => (
            <Card key={app.id} className={`h-full ${app.is_default ? 'border-primary border-2' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AppWindow className="h-5 w-5" />
                  {app.name}
                  {app.is_default && <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full text-primary">Default</span>}
                </CardTitle>
                <CardDescription>
                  {app.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(app.created_at).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Link to={`/applications/${app.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                </Link>
                {!app.is_default && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleSetDefault(app.id)}
                    disabled={setDefaultApplication.isPending}
                  >
                    Set Default
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No Applications Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Create your first application to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
