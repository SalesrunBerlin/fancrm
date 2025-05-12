
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImpressumMapping } from "@/components/ImpressumMapping";
import { useImpressumScrape } from "@/hooks/useImpressumScrape";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useCrudResource } from "@/hooks/useCrudResource";
import { FieldMappingConfirmation, FieldMappingItem, CustomField } from "@/components/FieldMappingConfirmation";

// Define the workflow steps
type WorkflowStep = "input" | "validation" | "mapping";

export default function ImportImpressum() {
  const [url, setUrl] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const { data, error, isLoading, refetch } = useImpressumScrape(targetUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("input");
  const [validatedData, setValidatedData] = useState<{
    company: string;
    address: string;
    phone: string | null;
    email: string | null;
    ceos: string[];
    source?: string;
  } | null>(null);
  
  // Use existing CRUD hooks for companies and persons
  const companiesResource = useCrudResource('companies');
  const personsResource = useCrudResource('persons');

  const handleScrape = () => {
    if (!url) return;
    
    // Basic URL validation
    try {
      new URL(url); // Will throw if invalid URL
      setTargetUrl(url);
      setCurrentStep("validation");
    } catch (e) {
      toast({
        title: "Error",
        description: "Please enter a valid website URL"
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScrape();
    }
  };
  
  const handleValidationComplete = async (mappedData: {
    company: string;
    address: string;
    phone: string | null;
    email: string | null;
    ceos: string[];
  }) => {
    // Store the validated data and move to the mapping step
    setValidatedData({
      ...mappedData,
      source: data?.source || url
    });
    setCurrentStep("mapping");
  };
  
  const handleBackToValidation = () => {
    setCurrentStep("validation");
  };
  
  const handleMappingComplete = async (mappings: FieldMappingItem[], customFields: CustomField[]) => {
    if (!validatedData) return;
    
    setIsSaving(true);
    try {
      // Process company mappings first
      const companyMappings = mappings.filter(m => m.targetObject === "companies");
      const personMappings = mappings.filter(m => m.targetObject === "persons");
      
      // Add custom fields
      const companyCustomFields = customFields.filter(f => f.targetObject === "companies");
      const personCustomFields = customFields.filter(f => f.targetObject === "persons");
      
      // Create company record if there are company mappings
      let companyId: string | undefined;
      
      if (companyMappings.length > 0 || companyCustomFields.length > 0) {
        // Build company data object
        const companyData: Record<string, any> = {};
        
        companyMappings.forEach(mapping => {
          companyData[mapping.targetField] = mapping.sourceValue;
        });
        
        companyCustomFields.forEach(field => {
          companyData[field.targetField] = field.value;
        });
        
        // Add source URL if not already included
        if (!companyData.source_url && validatedData.source) {
          companyData.source_url = validatedData.source;
        }
        
        // Create company
        const { id } = await companiesResource.create(companyData);
        companyId = id;
        
        console.log("Created company:", id);
      }
      
      // Create person records if there are person mappings
      for (const personMapping of personMappings) {
        // Build person data object
        const personData: Record<string, any> = {
          [personMapping.targetField]: personMapping.sourceValue,
        };
        
        // Link to company if we created one
        if (companyId) {
          personData.company_id = companyId;
        }
        
        // Add any custom fields for this person
        personCustomFields.forEach(field => {
          personData[field.targetField] = field.value;
        });
        
        // Add position as "Managing Director" if not specified and it's coming from CEOs
        if (!personData.position && personMapping.sourceField.startsWith('ceo')) {
          personData.position = "Managing Director";
        }
        
        // Create person
        await personsResource.create(personData);
      }
      
      toast({
        title: "Success",
        description: `Created ${companyMappings.length > 0 ? "1 company" : "0 companies"} and ${personMappings.length} person records`
      });
      
      // Reset the form
      setUrl("");
      setTargetUrl(null);
      setCurrentStep("input");
      setValidatedData(null);
    } catch (error) {
      console.error("Error saving data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save data",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "input":
        return (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Website URL</CardTitle>
              <CardDescription>
                Enter the URL of a website to scrape its Impressum/Imprint page for company information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://example.com"
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button onClick={handleScrape} disabled={!url || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Scrape"
                  )}
                </Button>
              </div>
              
              {error && (
                <div className="mt-4 p-3 border border-red-200 bg-red-50 text-red-600 rounded">
                  {error.message}
                </div>
              )}
            </CardContent>
          </Card>
        );
      
      case "validation":
        return data ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Validate Extracted Data</CardTitle>
                  <CardDescription>
                    Review and edit the extracted information before proceeding
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentStep("input")}
                >
                  <ArrowLeft className="mr-2 h-3 w-3" />
                  Back
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ImpressumMapping
                data={data}
                onSubmit={handleValidationComplete}
                isLoading={false}
              />
              <div className="mt-4 text-sm text-gray-500">
                <strong>Source:</strong>{" "}
                <a
                  href={data.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {data.source}
                </a>
              </div>
            </CardContent>
          </Card>
        ) : null;
        
      case "mapping":
        return validatedData ? (
          <FieldMappingConfirmation
            data={validatedData}
            onBack={handleBackToValidation}
            onSubmit={handleMappingComplete}
            isLoading={isSaving}
          />
        ) : null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Impressum Import</h1>
      
      {renderCurrentStep()}
    </div>
  );
}
