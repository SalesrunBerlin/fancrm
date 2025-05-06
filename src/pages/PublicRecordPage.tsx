
import { useParams } from "react-router-dom";
import PublicRecordView from "@/components/records/PublicRecordView";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";

export default function PublicRecordPage() {
  const { token, recordId } = useParams<{ token: string; recordId: string }>();

  if (!token || !recordId) {
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
