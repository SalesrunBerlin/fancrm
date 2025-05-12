
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ImpressumData, ImpressumCandidate } from "@/hooks/useImpressumScrape";
import { FieldCandidate } from "./FieldCandidate";
import { supabase } from "@/integrations/supabase/client";

export interface FieldState {
  candidates: ImpressumCandidate[];
  selected: string;
  valid: boolean;
}

export interface ImpressumMappingProps {
  data: ImpressumData;
  confidenceScores?: {
    company: "low" | "medium" | "high";
    address: "low" | "medium" | "high";
    phone: "low" | "medium" | "high";
    email: "low" | "medium" | "high";
  };
  onSubmit: (mappedData: {
    company: string;
    address: string;
    phone: string | null;
    email: string | null;
    ceos: string[];
  }) => Promise<void>;
  isLoading?: boolean;
}

const getConfidenceLevel = (candidates: ImpressumCandidate[]): "low" | "medium" | "high" => {
  if (!candidates || candidates.length === 0) return "low";
  
  const topCandidate = candidates[0];
  if (topCandidate.conf >= 0.8) return "high";
  if (topCandidate.conf >= 0.5) return "medium";
  return "low";
};

export const ImpressumMapping: React.FC<ImpressumMappingProps> = ({
  data,
  onSubmit,
  isLoading = false,
}) => {
  // Initialize field states from data
  const [fieldStates, setFieldStates] = useState<{
    company: FieldState;
    address: FieldState;
    phone: FieldState;
    email: FieldState;
  }>({
    company: {
      candidates: data.fields.company,
      selected: data.fields.company[0]?.value || "",
      valid: true
    },
    address: {
      candidates: data.fields.address,
      selected: data.fields.address[0]?.value || "",
      valid: true
    },
    phone: {
      candidates: data.fields.phone,
      selected: data.fields.phone[0]?.value || "",
      valid: true
    },
    email: {
      candidates: data.fields.email,
      selected: data.fields.email[0]?.value || "",
      valid: true
    }
  });

  const [selectedCEOs, setSelectedCEOs] = useState<string[]>(
    data.fields.ceos.map(ceo => ceo.value)
  );

  const [formValid, setFormValid] = useState(true);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // Validate the entire form
  useEffect(() => {
    const isValid = 
      fieldStates.company.valid && 
      fieldStates.address.valid && 
      fieldStates.phone.valid && 
      fieldStates.email.valid &&
      fieldStates.company.selected.trim() !== "" &&
      fieldStates.address.selected.trim() !== "";
      
    setFormValid(isValid);
  }, [fieldStates]);

  const handleCEOToggle = (ceo: string) => {
    if (selectedCEOs.includes(ceo)) {
      setSelectedCEOs(selectedCEOs.filter((name) => name !== ceo));
    } else {
      setSelectedCEOs([...selectedCEOs, ceo]);
    }
  };

  const updateFieldState = (field: keyof typeof fieldStates, updates: Partial<FieldState>) => {
    setFieldStates(prevState => ({
      ...prevState,
      [field]: {
        ...prevState[field],
        ...updates
      }
    }));
  };

  const collectFeedback = () => {
    // Collect feedback for fields where the user selected a value different from the top candidate
    const feedback: any[] = [];

    // Helper function to prepare feedback item
    const prepareFeedbackItem = (
      fieldType: string, 
      candidates: ImpressumCandidate[], 
      selectedValue: string
    ) => {
      if (candidates.length === 0) return null;
      
      const initialCandidate = candidates[0]; // Top candidate from the extraction
      if (!initialCandidate) return null;

      // Only log feedback if the user chose a different value than the suggested one
      if (initialCandidate.value === selectedValue) return null;

      // Find which candidate was selected (if any)
      const selectedCandidate = candidates.find(c => c.value === selectedValue);

      return {
        url: data.source,
        field_type: fieldType,
        initial_value: initialCandidate.value,
        correct_value: selectedValue,
        extraction_method: initialCandidate.method,
        confidence: initialCandidate.conf,
        html_snippet: initialCandidate.context || null
      };
    };

    // Company feedback
    const companyFeedback = prepareFeedbackItem('company', fieldStates.company.candidates, fieldStates.company.selected);
    if (companyFeedback) feedback.push(companyFeedback);

    // Address feedback
    const addressFeedback = prepareFeedbackItem('address', fieldStates.address.candidates, fieldStates.address.selected);
    if (addressFeedback) feedback.push(addressFeedback);

    // Phone feedback
    const phoneFeedback = prepareFeedbackItem('phone', fieldStates.phone.candidates, fieldStates.phone.selected);
    if (phoneFeedback) feedback.push(phoneFeedback);

    // Email feedback
    const emailFeedback = prepareFeedbackItem('email', fieldStates.email.candidates, fieldStates.email.selected);
    if (emailFeedback) feedback.push(emailFeedback);

    // CEO feedback: for each CEO that was deselected
    const initialCEOs = data.fields.ceos.map(ceo => ceo.value);
    for (const ceo of initialCEOs) {
      if (!selectedCEOs.includes(ceo)) {
        const ceoCandidate = data.fields.ceos.find(c => c.value === ceo);
        if (ceoCandidate) {
          feedback.push({
            url: data.source,
            field_type: 'ceo',
            initial_value: ceo,
            correct_value: '', // User removed this CEO
            extraction_method: ceoCandidate.method,
            confidence: ceoCandidate.conf,
            html_snippet: ceoCandidate.context || null
          });
        }
      }
    }

    return feedback;
  };

  const sendFeedback = async (feedback: any[]) => {
    if (!feedback.length) return;

    setIsSendingFeedback(true);
    try {
      const { error } = await supabase.functions.invoke("log_feedback", {
        body: feedback
      });

      if (error) {
        console.error("Error logging feedback:", error);
      } else {
        console.log("Successfully logged extraction feedback");
      }
    } catch (err) {
      console.error("Failed to send feedback:", err);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValid) {
      toast({
        description: "Please fix all validation issues before submitting"
      });
      return;
    }

    if (!fieldStates.company.selected.trim()) {
      toast({
        description: "Company name is required"
      });
      return;
    }

    if (!fieldStates.address.selected.trim()) {
      toast({
        description: "Address is required"
      });
      return;
    }

    // Collect feedback before submitting
    const feedback = collectFeedback();
    
    try {
      await onSubmit({
        company: fieldStates.company.selected,
        address: fieldStates.address.selected,
        phone: fieldStates.phone.selected ? fieldStates.phone.selected : null,
        email: fieldStates.email.selected ? fieldStates.email.selected : null,
        ceos: selectedCEOs,
      });
      
      // Send feedback in a non-blocking way
      if (feedback.length > 0) {
        sendFeedback(feedback).catch(console.error);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to save company data"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <FieldCandidate
          fieldName="Company Name"
          candidates={fieldStates.company.candidates}
          value={fieldStates.company.selected}
          onChange={(value) => updateFieldState("company", { selected: value })}
          onValidationChange={(valid) => updateFieldState("company", { valid })}
          confidenceLevel={getConfidenceLevel(fieldStates.company.candidates)}
          isRequired={true}
        />

        <FieldCandidate
          fieldName="Address"
          candidates={fieldStates.address.candidates}
          value={fieldStates.address.selected}
          onChange={(value) => updateFieldState("address", { selected: value })}
          onValidationChange={(valid) => updateFieldState("address", { valid })}
          confidenceLevel={getConfidenceLevel(fieldStates.address.candidates)}
          isRequired={true}
        />

        <FieldCandidate
          fieldName="Phone"
          candidates={fieldStates.phone.candidates}
          value={fieldStates.phone.selected}
          onChange={(value) => updateFieldState("phone", { selected: value })}
          onValidationChange={(valid) => updateFieldState("phone", { valid })}
          confidenceLevel={getConfidenceLevel(fieldStates.phone.candidates)}
        />

        <FieldCandidate
          fieldName="Email"
          candidates={fieldStates.email.candidates}
          value={fieldStates.email.selected}
          onChange={(value) => updateFieldState("email", { selected: value })}
          onValidationChange={(valid) => updateFieldState("email", { valid })}
          confidenceLevel={getConfidenceLevel(fieldStates.email.candidates)}
        />

        {data.fields.ceos && data.fields.ceos.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Managing Directors / CEOs</Label>
            <div className="space-y-2 bg-gray-50 p-3 rounded-md">
              {data.fields.ceos.map((ceo, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ceo-${index}`}
                    checked={selectedCEOs.includes(ceo.value)}
                    onCheckedChange={() => handleCEOToggle(ceo.value)}
                  />
                  <Label
                    htmlFor={`ceo-${index}`}
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    {ceo.value}
                    <span className="inline-flex items-center px-2 py-1 text-xs font-normal rounded border bg-gray-50 text-gray-700 border-gray-200">
                      {ceo.method} ({Math.round(ceo.conf * 100)}%)
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={isLoading || !formValid}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Continue
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
