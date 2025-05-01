
import { toast } from "sonner";

// Re-export toast from sonner for backward compatibility
export { toast };

// For backward compatibility, provide a stub implementation of useToast
export function useToast() {
  return {
    toast,
    dismiss: () => {},
  };
}
