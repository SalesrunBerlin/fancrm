
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps {
  isLoading: boolean;
  text: string;
  loadingText: string;
  className?: string;
}

export function LoadingButton({ 
  isLoading, 
  text, 
  loadingText,
  className = "" 
}: LoadingButtonProps) {
  return (
    <Button type="submit" className={`w-full ${className}`} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        text
      )}
    </Button>
  );
}
