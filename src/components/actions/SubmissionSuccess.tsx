
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmissionSuccessProps {
  onSubmitAnother: () => void;
}

export function SubmissionSuccess({ onSubmitAnother }: SubmissionSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="rounded-full bg-green-100 p-3">
        <Check className="h-10 w-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Thank You!</h2>
      <p className="text-center text-muted-foreground">Your submission has been received successfully.</p>
      <Button 
        onClick={onSubmitAnother}
        className="mt-4"
      >
        Submit another response
      </Button>
    </div>
  );
}
