
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { ShareRecordSheet } from './ShareRecordSheet';

interface ShareButtonProps {
  recordId: string;
  objectTypeId: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function ShareButton({
  recordId,
  objectTypeId,
  variant = "outline"
}: ShareButtonProps) {
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);

  return (
    <>
      <Button 
        variant={variant} 
        onClick={() => setIsShareSheetOpen(true)}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      
      <ShareRecordSheet 
        open={isShareSheetOpen}
        onOpenChange={setIsShareSheetOpen}
        recordId={recordId}
        objectTypeId={objectTypeId}
      />
    </>
  );
}
