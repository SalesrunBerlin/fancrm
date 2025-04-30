
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TableData {
  tableIndex: number;
  headers: string[];
  rows: string[][];
}

export function useUrlTableImport() {
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tables, setTables] = useState<TableData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTableIndex, setSelectedTableIndex] = useState<number | null>(null);

  const resetState = () => {
    setTables([]);
    setError(null);
    setSelectedTableIndex(null);
  };

  const validateUrl = (inputUrl: string): boolean => {
    try {
      new URL(inputUrl);
      return true;
    } catch {
      return false;
    }
  };

  const fetchTablesFromUrl = async (inputUrl: string) => {
    if (!validateUrl(inputUrl)) {
      setError("Please enter a valid URL");
      return false;
    }

    setIsLoading(true);
    setError(null);
    resetState();

    try {
      const { data, error } = await supabase.functions.invoke("scrape-url-tables", {
        body: { url: inputUrl }
      });

      if (error) {
        console.error("Error fetching tables:", error);
        setError(`Failed to fetch tables: ${error.message}`);
        return false;
      }

      if (!data.tables || data.tables.length === 0) {
        setError("No tables found on the page");
        return false;
      }

      console.log("Tables found:", data.tables);
      setTables(data.tables);
      
      // If only one table is found, select it automatically
      if (data.tables.length === 1) {
        setSelectedTableIndex(0);
      }
      
      return true;
    } catch (err) {
      console.error("Exception fetching tables:", err);
      setError(`An error occurred: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const selectTable = (index: number) => {
    if (index >= 0 && index < tables.length) {
      setSelectedTableIndex(index);
      return tables[index];
    }
    return null;
  };

  const getSelectedTable = () => {
    if (selectedTableIndex !== null && tables[selectedTableIndex]) {
      return tables[selectedTableIndex];
    }
    return null;
  };

  const convertToImportData = (table: TableData | null) => {
    if (!table) return null;

    return {
      headers: table.headers,
      rows: table.rows
    };
  };

  return {
    url,
    setUrl,
    isLoading,
    tables,
    error,
    selectedTableIndex,
    fetchTablesFromUrl,
    selectTable,
    getSelectedTable,
    convertToImportData,
    resetState
  };
}
