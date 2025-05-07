
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWorkspaceUsers, CreateUserPayload } from "@/hooks/useWorkspaceUsers";
import { Loader2 } from "lucide-react";

interface CreateUserFormProps {
  workspaceId: string;
  onSuccess?: () => void;
}

export function CreateUserForm({ workspaceId, onSuccess }: CreateUserFormProps) {
  const { createUser } = useWorkspaceUsers(workspaceId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserPayload>({
    defaultValues: {
      workspace_id: workspaceId,
      metadata_access: true,
      data_access: false,
    }
  });

  const onSubmit = async (data: CreateUserPayload) => {
    try {
      setIsSubmitting(true);
      
      if (data.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      await createUser.mutateAsync({
        ...data,
        workspace_id: workspaceId,
      });
      
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
        <CardDescription>
          Create a new user for your workspace
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input 
                id="first_name"
                {...register("first_name")}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input 
                id="last_name"
                {...register("last_name")}
                placeholder="Last name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email"
              type="email"
              {...register("email", { 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              type="password"
              {...register("password", { 
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters"
                }
              })}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="metadata_access" className="flex-1">
                Metadata Access
                <p className="text-sm text-muted-foreground">
                  Can access objects, fields, and actions, but not records
                </p>
              </Label>
              <Switch 
                id="metadata_access"
                {...register("metadata_access")}
                defaultChecked={true}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="data_access" className="flex-1">
                Data Access
                <p className="text-sm text-muted-foreground">
                  Can access records and data
                </p>
              </Label>
              <Switch 
                id="data_access"
                {...register("data_access")}
                defaultChecked={false}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating User...
              </>
            ) : "Create User"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
