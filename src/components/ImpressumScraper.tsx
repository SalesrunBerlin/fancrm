
import React, { useState } from "react";
import { useImpressumScrape } from "@/hooks/useImpressumScrape";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ImpressumScraper() {
  const [url, setUrl] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  
  const { data, error, isLoading, refetch } = useImpressumScrape(targetUrl);
  
  const handleScrape = () => {
    if (url) {
      setTargetUrl(url);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScrape();
    }
  };
  
  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Impressum Scraper</CardTitle>
          <CardDescription>
            Enter a website URL to fetch and parse its Impressum/Imprint page
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
              {isLoading ? "Loading..." : "Scrape"}
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 border border-red-200 bg-red-50 text-red-600 rounded">
              {error.message}
            </div>
          )}
          
          {data && (
            <div className="mt-6">
              <h3 className="font-medium text-lg">Results</h3>
              <Separator className="my-2" />
              
              <div className="space-y-4">
                <div>
                  <span className="font-medium">Company:</span>
                  <p>{data.fields.company[0]?.value || "Not found"}</p>
                </div>
                
                <div>
                  <span className="font-medium">Address:</span>
                  <p>{data.fields.address[0]?.value || "Not found"}</p>
                </div>
                
                {data.fields.phone && data.fields.phone.length > 0 && (
                  <div>
                    <span className="font-medium">Phone:</span>
                    <p>{data.fields.phone[0]?.value || "Not found"}</p>
                  </div>
                )}
                
                {data.fields.email && data.fields.email.length > 0 && (
                  <div>
                    <span className="font-medium">Email:</span>
                    <p>{data.fields.email[0]?.value || "Not found"}</p>
                  </div>
                )}
                
                {data.fields.ceos && data.fields.ceos.length > 0 && (
                  <div>
                    <span className="font-medium">CEOs/Managing Directors:</span>
                    <ul className="list-disc list-inside">
                      {data.fields.ceos.map((ceo, index) => (
                        <li key={index}>{ceo.value}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <span className="font-medium">Source:</span>
                  <p>
                    <a 
                      href={data.source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {data.source}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-gray-500">
          Limited to 10 requests per minute per IP address
        </CardFooter>
      </Card>
    </div>
  );
}
