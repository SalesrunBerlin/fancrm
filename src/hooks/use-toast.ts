
import { toast as sonnerToast, ToastT, type ToastOptions } from "sonner";

// Custom toast function that wraps sonner's toast
export const toast = (message: string, options?: ToastOptions) => {
  return sonnerToast(message, {
    ...options,
    style: {
      background: 'var(--color-popover)',
      color: 'var(--color-popover-foreground)',
      border: '1px solid var(--color-border)',
      ...options?.style,
    },
  });
};

// Re-export toast variants and hooks from sonner
toast.success = (message: string, options?: ToastOptions) => sonnerToast.success(message, options);
toast.error = (message: string, options?: ToastOptions) => sonnerToast.error(message, options);
toast.warning = (message: string, options?: ToastOptions) => sonnerToast.warning(message, options);
toast.info = (message: string, options?: ToastOptions) => sonnerToast.info(message, options);
toast.loading = (message: string, options?: ToastOptions) => sonnerToast.loading(message, options);
toast.dismiss = sonnerToast.dismiss;
toast.promise = sonnerToast.promise;

// Compatibility with shadcn/ui toast component
export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss
  };
}
