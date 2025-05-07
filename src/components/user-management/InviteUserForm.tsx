
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspaceUsers } from "@/hooks/useWorkspaceUsers";
import { Loader2 } from "lucide-react";

interface InviteUserFormProps {
  workspaceId: string;
  onSuccess?: () => void;
}

interface InviteFormData {
  email: string;
  metadata_access: boolean;
  data_access: boolean;
  expiry_days: number;
}

export function InviteUserForm({ workspaceId, onSuccess }: InviteUserFormProps) {
  const { createInvitation } = useWorkspaceUsers(workspaceId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<InviteFormData>({
    defaultValues: {
      metadata_access: true,
      data_access: false,
      expiry_days: 7
    }
  });
  
  const expiryDays = watch('expiry_days');

  const onSubmit = async (data: InviteFormData) => {
    try {
      setIsSubmitting(true);
      
      await createInvitation.mutateAsync({
        email: data.email,
        metadata_access: data.metadata_access,
        data_access: data.data_access,
        expiry_days: data.expiry_days
      });
      
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error inviting user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite User</CardTitle>
        <CardDescription>
          Send an invitation to join your workspace
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
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
            <Label htmlFor="expiry_days">Invitation Expires In</Label>
            <Select 
              value={expiryDays.toString()} 
              onValueChange={(value) => setValue('expiry_days', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expiration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
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
                Creating Invitation...
              </>
            ) : "Send Invitation"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
