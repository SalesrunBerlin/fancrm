
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteIconDialogProps {
  iconId: string;
  iconName: string;
  onDeleted: () => void;
}

export function DeleteIconDialog({ iconId, iconName, onDeleted }: DeleteIconDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Delete the icon from the database
      const { error } = await supabase
        .from("user_custom_icons")
        .delete()
        .eq("id", iconId);
      
      if (error) throw error;
      
      toast.success("Icon erfolgreich gelöscht");
      setOpen(false);
      onDeleted();
    } catch (error: any) {
      console.error("Fehler beim Löschen des Icons:", error);
      toast.error(`Fehler beim Löschen: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
        iconOnly
        icon={<Trash className="h-3 w-3" />}
      />

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Icon "{iconName}" wird dauerhaft aus Ihrem Konto gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird gelöscht...
                </>
              ) : (
                'Ja, löschen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
