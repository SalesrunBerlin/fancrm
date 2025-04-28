import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useObjectRecords } from "@/hooks/useObjectRecords";

const accountFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  type: z.string().optional(),
  website: z.string().url("Ungültige Website-URL").optional().or(z.literal("")),
  industry: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface CreateAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAccountForm({ isOpen, onClose }: CreateAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { createRecord } = useObjectRecords("account_object_type_id");
  
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "",
      type: "",
      website: "",
      industry: "",
    },
  });

  const onSubmit = async (data: AccountFormValues) => {
    if (!user) {
      toast({
        title: "Fehler",
        description: "Sie müssen angemeldet sein, um einen Account zu erstellen.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createRecord.mutateAsync({
        name: data.name,
        type: data.type || null,
        website: data.website || null,
        industry: data.industry || null,
      });

      toast({
        title: "Account erstellt",
        description: `${data.name} wurde erfolgreich erstellt.`,
      });
      
      form.reset();
      onClose();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Account erstellen</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Account Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Kunde, Partner, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branche</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Technologie, Gesundheit, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Wird erstellt..." : "Account erstellen"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
