
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUserCreated: () => void;
  workspaceId?: string;
}

interface FormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  metadataAccess: boolean;
  dataAccess: boolean;
}

export function CreateUserDialog({ 
  open, 
  onClose, 
  onUserCreated,
  workspaceId
}: CreateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    defaultValues: {
      email: '',
      password: 'StandardPasswort!123', // Standardpasswort
      firstName: '',
      lastName: '',
      metadataAccess: true,
      dataAccess: false
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Call Supabase function to create user
      const { data: userData, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: data.email,
          password: data.password,
          first_name: data.firstName,
          last_name: data.lastName,
          workspace_id: workspaceId,
          metadata_access: data.metadataAccess,
          data_access: data.dataAccess
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success(`Benutzer ${data.email} wurde erfolgreich erstellt`);
      reset();
      onUserCreated();
      onClose();
    } catch (error: any) {
      console.error('Fehler beim Erstellen des Benutzers:', error);
      toast.error(error.message || 'Fehler beim Erstellen des Benutzers');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Benutzer für die Plattform. Das Standardpasswort wird dem Benutzer zugewiesen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                E-Mail
              </Label>
              <Input
                id="email"
                className="col-span-3"
                {...register('email', { 
                  required: 'E-Mail ist erforderlich',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Ungültige E-Mail-Adresse'
                  }
                })}
              />
              {errors.email && (
                <p className="col-span-3 col-start-2 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                Vorname
              </Label>
              <Input
                id="firstName"
                className="col-span-3"
                {...register('firstName')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Nachname
              </Label>
              <Input
                id="lastName"
                className="col-span-3"
                {...register('lastName')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 flex items-center space-x-2">
                <Checkbox 
                  id="metadataAccess" 
                  {...register('metadataAccess')} 
                  defaultChecked 
                />
                <Label htmlFor="metadataAccess">Metadatenzugriff erlauben</Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 flex items-center space-x-2">
                <Checkbox 
                  id="dataAccess" 
                  {...register('dataAccess')} 
                />
                <Label htmlFor="dataAccess">Datenzugriff erlauben</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                'Benutzer erstellen'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
