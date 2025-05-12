
// Re-export the toast from sonner for consistent usage across the app
import { toast } from "sonner";

export type ToastProps = {
  title?: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
};

// Create a useToast hook that returns the toast function
export const useToast = () => {
  return {
    toast
  };
};

// Export the toast function directly
export { toast };
