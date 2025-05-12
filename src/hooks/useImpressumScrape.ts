
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ImpressumData {
  company: string;
  address: string;
  phone: string | null;
  email: string | null;
  ceos: string[];
  source: string;
}

export interface ImpressumError {
  error: string;
}

export async function scrapeImpressum(url: string): Promise<ImpressumData> {
  const { data, error } = await supabase.functions.invoke("scrape-impressum", {
    body: { url }
  });

  if (error) {
    throw new Error(`Failed to scrape Impressum: ${error.message}`);
  }

  if ("error" in data) {
    throw new Error((data as ImpressumError).error);
  }

  return data as ImpressumData;
}

export function useImpressumScrape(url: string | null, options?: Omit<UseQueryOptions<ImpressumData, Error>, "queryKey" | "queryFn">) {
  return useQuery<ImpressumData, Error>({
    queryKey: ["impressum", url],
    queryFn: () => {
      if (!url) throw new Error("URL is required");
      return scrapeImpressum(url);
    },
    enabled: !!url,
    ...options
  });
}
