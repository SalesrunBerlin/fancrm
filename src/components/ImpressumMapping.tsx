
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { ImpressumData, ImpressumCandidate } from "@/hooks/useImpressumScrape";
import { FieldCandidate } from "./FieldCandidate";
import { supabase } from "@/integrations/supabase/client";

export interface FieldState {
  candidates: ImpressumCandidate[];
  selected: string;
  valid: boolean;
  isValidated: boolean;
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
      valid: true,
      isValidated: false
    },
    address: {
      candidates: data.fields.address,
      selected: data.fields.address[0]?.value || "",
      valid: true,
      isValidated: false
    },
    phone: {
      candidates: data.fields.phone,
      selected: data.fields.phone[0]?.value || "",
      valid: true,
      isValidated: false
    },
    email: {
      candidates: data.fields.email,
      selected: data.fields.email[0]?.value || "",
      valid: true,
      isValidated: false
    }
  });

  const [selectedCEOs, setSelectedCEOs] = useState<string[]>(
    data.fields.ceos.map(ceo => ceo.value)
  );

  const [formValid, setFormValid] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [validatedCEOs, setValidatedCEOs] = useState<Record<string, boolean>>({});

  // Validate the entire form
  useEffect(() => {
    const isValid = 
      fieldStates.company.valid && 
      fieldStates.address.valid && 
      fieldStates.phone.valid && 
      fieldStates.email.valid &&
      fieldStates.company.selected.trim() !== "" &&
      fieldStates.address.selected.trim() !== "";
      
    const isFullyValidated = 
      fieldStates.company.isValidated && 
      fieldStates.address.isValidated && 
      (fieldStates.phone.selected === "" || fieldStates.phone.isValidated) && 
      (fieldStates.email.selected === "" || fieldStates.email.isValidated);

    setFormValid(isValid && isFullyValidated);
  }, [fieldStates]);

  const handleCEOToggle = (ceo: string) => {
    if (selectedCEOs.includes(ceo)) {
      setSelectedCEOs(selectedCEOs.filter((name) => name !== ceo));
      // Mark this CEO as validated (by removing)
      setValidatedCEOs({...validatedCEOs, [ceo]: true});
    } else {
      setSelectedCEOs([...selectedCEOs, ceo]);
      // Mark this CEO as validated (by adding)
      setValidatedCEOs({...validatedCEOs, [ceo]: true});
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

  const collectFeedback = async () => {
    // Collect feedback for fields where the user selected a value different from the top candidate
    const feedback: any[] = [];

    // Helper function to prepare feedback item
    const prepareFeedbackItem = async (
      fieldType: string, 
      candidates: ImpressumCandidate[], 
      selectedValue: string,
      isValidField: boolean
    ) => {
      if (candidates.length === 0) return null;
      
      const initialCandidate = candidates[0]; // Top candidate from the extraction
      if (!initialCandidate) return null;

      // Only log feedback if the user's validation decision is available
      if (fieldType === 'company' && !fieldStates.company.isValidated) return null;
      if (fieldType === 'address' && !fieldStates.address.isValidated) return null;
      if (fieldType === 'phone' && selectedValue && !fieldStates.phone.isValidated) return null;
      if (fieldType === 'email' && selectedValue && !fieldStates.email.isValidated) return null;

      // Create a feedback item when:
      // 1. Initial value was marked as invalid, OR
      // 2. User chose a different value than the suggested one
      const initialValueWasRejected = !isValidField;
      const valueWasChanged = initialCandidate.value !== selectedValue;
      
      if (!initialValueWasRejected && !valueWasChanged) return null;

      // Find which candidate was selected (if any) or get the HTML context
      let contextHtml = initialCandidate.context || null;
      const selectedCandidate = candidates.find(c => c.value === selectedValue);
      
      // If the user entered a custom value and the initial value was rejected,
      // try to find where this value appears in the original HTML
      if (valueWasChanged && !selectedCandidate && selectedValue) {
        try {
          // Make a call to fetch the HTML and search for the corrected value
          const { data: htmlData } = await supabase.functions.invoke("scrape-impressum", {
            body: { 
              url: data.source,
              searchValue: selectedValue
            }
          });
          
          if (htmlData && htmlData.htmlContext) {
            contextHtml = htmlData.htmlContext;
          }
        } catch (error) {
          console.error("Failed to fetch HTML context for corrected value:", error);
        }
      }

      return {
        url: data.source,
        field_type: fieldType,
        initial_value: initialCandidate.value,
        correct_value: selectedValue,
        extraction_method: initialCandidate.method,
        confidence: initialCandidate.conf,
        html_snippet: contextHtml,
        validated: true,
        validation_result: isValidField ? "valid" : "invalid"
      };
    };

    // Company feedback
    const companyFeedback = await prepareFeedbackItem(
      'company', 
      fieldStates.company.candidates, 
      fieldStates.company.selected,
      fieldStates.company.valid
    );
    if (companyFeedback) feedback.push(companyFeedback);

    // Address feedback
    const addressFeedback = await prepareFeedbackItem(
      'address', 
      fieldStates.address.candidates, 
      fieldStates.address.selected,
      fieldStates.address.valid
    );
    if (addressFeedback) feedback.push(addressFeedback);

    // Phone feedback
    const phoneFeedback = await prepareFeedbackItem(
      'phone', 
      fieldStates.phone.candidates, 
      fieldStates.phone.selected,
      fieldStates.phone.valid
    );
    if (phoneFeedback) feedback.push(phoneFeedback);

    // Email feedback
    const emailFeedback = await prepareFeedbackItem(
      'email', 
      fieldStates.email.candidates, 
      fieldStates.email.selected,
      fieldStates.email.valid
    );
    if (emailFeedback) feedback.push(emailFeedback);

    // CEO feedback: for each CEO that was deselected
    const initialCEOs = data.fields.ceos.map(ceo => ceo.value);
    for (const ceo of initialCEOs) {
      // Only consider CEOs that have been explicitly validated (checked/unchecked)
      if (validatedCEOs[ceo]) {
        const isValidCEO = selectedCEOs.includes(ceo);
        const ceoCandidate = data.fields.ceos.find(c => c.value === ceo);
        if (ceoCandidate) {
          feedback.push({
            url: data.source,
            field_type: 'ceo',
            initial_value: ceo,
            correct_value: isValidCEO ? ceo : '', // User removed this CEO
            extraction_method: ceoCandidate.method,
            confidence: ceoCandidate.conf,
            html_snippet: ceoCandidate.context || null,
            validated: true,
            validation_result: isValidCEO ? "valid" : "invalid"
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
    
    // Check if all required fields are validated
    if (!fieldStates.company.isValidated) {
      toast({
        description: "Please validate the company name before continuing"
      });
      return;
    }
    
    if (!fieldStates.address.isValidated) {
      toast({
        description: "Please validate the address before continuing"
      });
      return;
    }
    
    if (fieldStates.phone.selected && !fieldStates.phone.isValidated) {
      toast({
        description: "Please validate the phone number before continuing"
      });
      return;
    }
    
    if (fieldStates.email.selected && !fieldStates.email.isValidated) {
      toast({
        description: "Please validate the email address before continuing"
      });
      return;
    }

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
    const feedback = await collectFeedback();
    
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
      console.error("Error in onSubmit:", error);
      toast({
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
          onValidationChange={(valid, isExplicitlyValidated) => 
            updateFieldState("company", { valid, isValidated: isExplicitlyValidated })
          }
          confidenceLevel={getConfidenceLevel(fieldStates.company.candidates)}
          isRequired={true}
          isValidated={fieldStates.company.isValidated}
          setIsValidated={(validated) => updateFieldState("company", { isValidated: validated })}
        />

        <FieldCandidate
          fieldName="Address"
          candidates={fieldStates.address.candidates}
          value={fieldStates.address.selected}
          onChange={(value) => updateFieldState("address", { selected: value })}
          onValidationChange={(valid, isExplicitlyValidated) => 
            updateFieldState("address", { valid, isValidated: isExplicitlyValidated })
          }
          confidenceLevel={getConfidenceLevel(fieldStates.address.candidates)}
          isRequired={true}
          isValidated={fieldStates.address.isValidated}
          setIsValidated={(validated) => updateFieldState("address", { isValidated: validated })}
        />

        <FieldCandidate
          fieldName="Phone"
          candidates={fieldStates.phone.candidates}
          value={fieldStates.phone.selected}
          onChange={(value) => updateFieldState("phone", { selected: value })}
          onValidationChange={(valid, isExplicitlyValidated) => 
            updateFieldState("phone", { valid, isValidated: isExplicitlyValidated })
          }
          confidenceLevel={getConfidenceLevel(fieldStates.phone.candidates)}
          isValidated={fieldStates.phone.isValidated}
          setIsValidated={(validated) => updateFieldState("phone", { isValidated: validated })}
        />

        <FieldCandidate
          fieldName="Email"
          candidates={fieldStates.email.candidates}
          value={fieldStates.email.selected}
          onChange={(value) => updateFieldState("email", { selected: value })}
          onValidationChange={(valid, isExplicitlyValidated) => 
            updateFieldState("email", { valid, isValidated: isExplicitlyValidated })
          }
          confidenceLevel={getConfidenceLevel(fieldStates.email.candidates)}
          isValidated={fieldStates.email.isValidated}
          setIsValidated={(validated) => updateFieldState("email", { isValidated: validated })}
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
          
          {!formValid && !Object.values(fieldStates).every(state => state.isValidated) && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Please validate all fields before continuing</span>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
