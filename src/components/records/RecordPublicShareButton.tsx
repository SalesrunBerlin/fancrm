
import { Button } from "@/components/ui/button";
import { PublicShareDialog } from "@/components/sharing/PublicShareDialog";
import { Globe } from "lucide-react";

interface RecordPublicShareButtonProps {
  recordId: string;
  objectTypeId: string;
  recordName?: string;
}

export function RecordPublicShareButton({ recordId, objectTypeId, recordName }: RecordPublicShareButtonProps) {
  return (
    <PublicShareDialog 
      recordId={recordId} 
      objectTypeId={objectTypeId} 
      recordName={recordName} 
    />
  );
}
