
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Workspace, useWorkspaces } from "@/hooks/useWorkspaces";
import { Loader2 } from "lucide-react";

interface WorkspaceSettingsProps {
  workspace: Workspace;
}

export function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
  const { updateWorkspace } = useWorkspaces();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, watch, formState: { isDirty } } = useForm({
    defaultValues: {
      name: workspace.name,
      description: workspace.description || "",
      welcome_message: workspace.welcome_message,
      primary_color: workspace.primary_color,
      registration_enabled: workspace.registration_enabled,
    }
  });

  const primaryColor = watch('primary_color');

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await updateWorkspace.mutateAsync({ id: workspace.id, ...data });
    } catch (error) {
      console.error("Error updating workspace:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Settings</CardTitle>
        <CardDescription>
          Customize your workspace appearance and registration settings
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input 
              id="name"
              {...register("name", { required: true })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              {...register("description")}
              placeholder="Describe your workspace"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="welcome_message">Welcome Message</Label>
            <Textarea 
              id="welcome_message"
              {...register("welcome_message")}
              placeholder="Welcome message for new users"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-4 items-center">
              <Input 
                id="primary_color"
                type="color"
                className="w-12 h-12 p-1 cursor-pointer"
                {...register("primary_color")}
              />
              <Input 
                value={primaryColor}
                onChange={(e) => register("primary_color").onChange(e)}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="registration_enabled" className="flex-1">
                Registration Enabled
                <p className="text-sm text-muted-foreground">
                  Allow users to register through invitation links
                </p>
              </Label>
              <Switch 
                id="registration_enabled"
                {...register("registration_enabled")}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
