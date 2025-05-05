
import React from "react";
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
import { Loader2 } from "lucide-react";
import { ThemedButton } from "@/components/ui/themed-button";

export interface DeleteDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  deleteButtonText?: string | React.ReactNode;
  cancelButtonText?: string;
  isDeleting?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  children?: React.ReactNode;
}

export function DeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  deleteButtonText = "Delete",
  cancelButtonText = "Cancel",
  isDeleting = false,
  onCancel,
  onConfirm,
  onDelete,
  children,
}: DeleteDialogProps) {
  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onOpenChange) onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (onConfirm) await onConfirm();
    if (onDelete) await onDelete();
  };

  // Ensure the deleteButtonText is always a React node (string or element)
  const buttonText = typeof deleteButtonText === 'string' 
    ? deleteButtonText 
    : deleteButtonText;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
            {cancelButtonText}
          </AlertDialogCancel>
          <ThemedButton
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : buttonText}
            {children}
          </ThemedButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
