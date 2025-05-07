
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { EditorStep } from "@/types/icon-editor";

interface StepNavigationProps {
  step: EditorStep;
  handlePrevStep: () => void;
  handleNextStep: () => void;
  handleSubmit?: () => void;
  uploading?: boolean;
  canProceed: boolean;
  navigate: (path: string) => void;
}

export function StepNavigation({
  step,
  handlePrevStep,
  handleNextStep,
  handleSubmit,
  uploading = false,
  canProceed,
  navigate
}: StepNavigationProps) {
  return (
    <div className="flex justify-between pt-4">
      {step !== "upload" ? (
        <Button 
          type="button" 
          variant="outline"
          onClick={handlePrevStep}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
      ) : (
        <Button 
          type="button" 
          variant="outline"
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Abbrechen
        </Button>
      )}
      
      {step !== "save" ? (
        <Button 
          type="button" 
          onClick={handleNextStep}
          disabled={!canProceed}
        >
          Weiter
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button 
          type="button"
          onClick={handleSubmit}
          disabled={!canProceed || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Wird hochgeladen...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Icon speichern
            </>
          )}
        </Button>
      )}
    </div>
  );
}
