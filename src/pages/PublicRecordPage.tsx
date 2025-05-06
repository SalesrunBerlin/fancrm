
import { useParams } from "react-router-dom";
import PublicRecordView from "@/components/records/PublicRecordView";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

export default function PublicRecordPage() {
  const { token, recordId } = useParams<{ token: string; recordId: string }>();
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validate token format first to avoid unnecessary checks
    if (token && recordId) {
      // Simple token validation (could be enhanced)
      const isTokenFormatValid = token.length >= 10;
      
      if (isTokenFormatValid) {
        setIsTokenValid(true);
      } else {
        setIsTokenValid(false);
      }
    } else {
      setIsTokenValid(false);
    }
    
    // Simulate loading to allow smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [token, recordId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-12 w-2/3 mb-6" />
          <Skeleton className="h-32 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isTokenValid || !token || !recordId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className={`${getAlertVariantClass("destructive")} max-w-lg mx-auto`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invalid link. This record doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <PublicRecordView token={token} recordId={recordId} />;
}
