import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ImpressumCandidate {
  value: string;
  conf: number;
  method: string;
  context?: string; // HTML context where this value was found
  isValidated?: boolean; // Whether this field has been explicitly validated
  isValid?: boolean; // Whether the value was marked as valid or invalid
}

export interface ImpressumData {
  fields: {
    company: ImpressumCandidate[];
    address: ImpressumCandidate[];
    phone: ImpressumCandidate[];
    email: ImpressumCandidate[];
    ceos: ImpressumCandidate[];
  };
  source: string;
}

export function useImpressumScrape(url: string | null) {
  return useQuery({
    queryKey: ["impressum", url],
    queryFn: async () => {
      if (!url) {
        return null;
      }

      const { data, error } = await supabase.functions.invoke("scrape-impressum", {
        body: { url },
      });

      if (error) {
        console.error("Error scraping impressum:", error);
        throw new Error(error.message);
      }

      return data as ImpressumData;
    },
    enabled: !!url, // Only run the query if URL is set
    retry: false, // Do not retry on error, as the content might not be there
  });
}
