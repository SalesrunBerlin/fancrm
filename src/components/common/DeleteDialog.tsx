
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
  confirmText?: string;
  confirmVariant?: string;
  isDeleting?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export function DeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  deleteButtonText = "Delete",
  cancelButtonText = "Cancel",
  confirmText,
  confirmVariant = "destructive",
  isDeleting = false,
  onCancel,
  onConfirm,
  onDelete,
  children,
  icon,
}: DeleteDialogProps) {
  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onOpenChange) onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (onConfirm) await onConfirm();
    if (onDelete) await onDelete();
    if (onOpenChange) onOpenChange(false);
  };

  // Use confirmText if provided, otherwise use deleteButtonText
  const buttonText = confirmText || deleteButtonText;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {icon && <div className="mx-auto mb-4">{icon}</div>}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
            {cancelButtonText}
          </AlertDialogCancel>
          <ThemedButton
            variant={confirmVariant as any}
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              buttonText
            )}
            {children}
          </ThemedButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
