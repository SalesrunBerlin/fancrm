
import { useParams } from "react-router-dom";
import { PublicRecordView } from "@/components/records/PublicRecordView";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function PublicRecordPage() {
  const { token, recordId } = useParams<{ token: string; recordId: string }>();
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token || !recordId) {
        setIsTokenValid(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if this record is publicly accessible with this token
        const { data, error } = await supabase
          .from("public_record_shares")
          .select("id")
          .eq("token", token)
          .eq("record_id", recordId)
          .eq("is_active", true)
          .single();

        if (error || !data) {
          console.error("Token validation error:", error);
          setIsTokenValid(false);
        } else {
          setIsTokenValid(true);
        }
      } catch (err) {
        console.error("Error validating token:", err);
        setIsTokenValid(false);
      } finally {
        // Short delay to prevent flashing
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    validateToken();
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
