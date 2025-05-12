
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ImpressumData } from "@/hooks/useImpressumScrape";

interface ConfidenceBadgeProps {
  level: "low" | "medium" | "high";
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ level }) => {
  const colors = {
    low: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

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

export const ImpressumMapping: React.FC<ImpressumMappingProps> = ({
  data,
  confidenceScores = {
    company: "medium",
    address: "medium",
    phone: "medium",
    email: "high",
  },
  onSubmit,
  isLoading = false,
}) => {
  const [companyName, setCompanyName] = useState(data.company);
  const [address, setAddress] = useState(data.address);
  const [phone, setPhone] = useState(data.phone || "");
  const [email, setEmail] = useState(data.email || "");
  const [selectedCEOs, setSelectedCEOs] = useState<string[]>(data.ceos || []);

  const handleCEOToggle = (ceo: string) => {
    if (selectedCEOs.includes(ceo)) {
      setSelectedCEOs(selectedCEOs.filter((name) => name !== ceo));
    } else {
      setSelectedCEOs([...selectedCEOs, ceo]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    if (!address.trim()) {
      toast({
        title: "Validation Error",
        description: "Address is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit({
        company: companyName,
        address,
        phone: phone ? phone : null,
        email: email ? email : null,
        ceos: selectedCEOs,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save company data",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="company-name" className="text-sm font-medium">
              Company Name
            </Label>
            <ConfidenceBadge level={confidenceScores.company} />
          </div>
          <Input
            id="company-name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="address" className="text-sm font-medium">
              Address
            </Label>
            <ConfidenceBadge level={confidenceScores.address} />
          </div>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone
            </Label>
            <ConfidenceBadge level={confidenceScores.phone} />
          </div>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <ConfidenceBadge level={confidenceScores.email} />
          </div>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full"
          />
        </div>

        {data.ceos && data.ceos.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Managing Directors / CEOs</Label>
            <div className="space-y-2 bg-gray-50 p-3 rounded-md">
              {data.ceos.map((ceo, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ceo-${index}`}
                    checked={selectedCEOs.includes(ceo)}
                    onCheckedChange={() => handleCEOToggle(ceo)}
                  />
                  <Label
                    htmlFor={`ceo-${index}`}
                    className="text-sm cursor-pointer"
                  >
                    {ceo}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={isLoading || !companyName || !address}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Company
          </Button>
        </div>
      </div>
    </form>
  );
};
