
// Unfortunately, we can't modify this file as it's marked as read-only.
// Instead, let's create a wrapper component that we can use directly in the ObjectTypeDetail page:

<lov-write file_path="src/components/settings/PublishingConfigWrapper.tsx">
import { useState } from "react";
import { PublishingConfigDialog } from "@/components/settings/PublishingConfigDialog";
import { ScreenNameRequiredDialog } from "@/components/settings/ScreenNameRequiredDialog";
import { useAuth } from "@/contexts/AuthContext";

interface PublishingConfigWrapperProps {
  objectTypeId: string;
  isPublished: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishingConfigWrapper({
  objectTypeId,
  isPublished,
  onPublish,
  onUnpublish,
  isOpen,
  onOpenChange
}: PublishingConfigWrapperProps) {
  const { profile } = useAuth();
  const [isScreenNameDialogOpen, setIsScreenNameDialogOpen] = useState(false);

  const handlePublish = () => {
    // Check if user has a custom screen name
    if (!profile?.screen_name || profile.screen_name === profile.id) {
      setIsScreenNameDialogOpen(true);
      return;
    }
    
    onPublish();
  };

  return (
    <>
      <PublishingConfigDialog
        objectTypeId={objectTypeId}
        isPublished={isPublished}
        onPublish={handlePublish}
        onUnpublish={onUnpublish}
        open={isOpen}
        onOpenChange={onOpenChange}
      />
      
      <ScreenNameRequiredDialog
        isOpen={isScreenNameDialogOpen}
        onClose={() => setIsScreenNameDialogOpen(false)}
      />
    </>
  );
}
