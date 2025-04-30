
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface ScreenNameRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScreenNameRequiredDialog({ isOpen, onClose }: ScreenNameRequiredDialogProps) {
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    navigate("/profile");
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Screen Name Required</AlertDialogTitle>
          <AlertDialogDescription>
            You need to set a custom screen name in your profile before publishing objects.
            Your screen name will be visible to other users when they view your published objects.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleGoToProfile}>
            Go to Profile
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
