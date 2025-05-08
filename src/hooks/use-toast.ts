
import { useToast as useToastOriginal } from "@/components/ui/use-toast";

export type ToastProps = {
  title?: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
};

export const useToast = () => {
  const originalToast = useToastOriginal();

  return {
    ...originalToast,
    toast: (props: ToastProps) => {
      return originalToast.toast(props);
    }
  };
};

export { ToastProps };
export { toast } from "@/components/ui/use-toast";
