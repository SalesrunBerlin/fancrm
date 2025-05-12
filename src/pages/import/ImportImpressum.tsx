
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImpressumMapping } from "@/components/ImpressumMapping";
import { useImpressumScrape, ImpressumData } from "@/hooks/useImpressumScrape";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useCrudResource } from "@/hooks/useCrudResource";

export default function ImportImpressum() {
  const [url, setUrl] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const { data, error, isLoading, refetch } = useImpressumScrape(targetUrl);
  const [isSaving, setIsSaving] = useState(false);
  
  // Use existing CRUD hooks for companies and persons
  const companiesResource = useCrudResource('companies');
  const personsResource = useCrudResource('persons');

  const handleScrape = () => {
    if (!url) return;
    
    // Basic URL validation
    try {
      new URL(url); // Will throw if invalid URL
      setTargetUrl(url);
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScrape();
    }
  };
  
  const handleCreateCompany = async (mappedData: {
    company: string;
    address: string;
    phone: string | null;
    email: string | null;
    ceos: string[];
  }) => {
    setIsSaving(true);
    try {
      // Create company record first
      const companyData = {
        name: mappedData.company,
        address: mappedData.address,
        phone: mappedData.phone,
        email: mappedData.email,
        source_url: data?.source || url,
      };
      
      const { id } = await companiesResource.create(companyData);
      
      // Create person records for each selected CEO
      if (mappedData.ceos.length > 0) {
        await Promise.all(
          mappedData.ceos.map(name => 
            personsResource.create({ 
              full_name: name, 
              company_id: id,
              position: "Managing Director" 
            })
          )
        );
      }
      
      toast({
        title: "Success",
        description: `Company "${mappedData.company}" created successfully`,
        variant: "success",
      });
      
      // Reset the form
      setUrl("");
      setTargetUrl(null);
    } catch (error) {
      console.error("Error saving company data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save company data",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Determine confidence levels based on data quality
  const getConfidenceScores = (data: ImpressumData) => {
    return {
      company: data.company.length > 3 ? "high" : "low",
      address: data.address.includes(" ") ? "high" : "medium",
      phone: data.phone && /\+\d/.test(data.phone) ? "high" : "medium",
      email: data.email && /@/.test(data.email) ? "high" : "low",
    } as const;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Impressum Import</h1>
      
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
      
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Company Data</CardTitle>
            <CardDescription>
              Verify and edit the extracted information before saving
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImpressumMapping
              data={data}
              confidenceScores={getConfidenceScores(data)}
              onSubmit={handleCreateCompany}
              isLoading={isSaving}
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
      )}
    </div>
  );
}
