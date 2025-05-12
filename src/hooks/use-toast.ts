
// This file re-exports the toast from sonner and provides a useToast hook
import { toast } from "sonner";

// Create a useToast hook that returns the toast function for compatibility with components
// that expect this pattern
export const useToast = () => {
  return { toast };
};

// Also export toast directly for components that import it directly
export { toast };
