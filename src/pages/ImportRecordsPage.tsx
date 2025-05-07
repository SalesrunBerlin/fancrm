
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useObjectType } from "@/hooks/useObjectTypes";
import { useImportRecords, ColumnMapping } from "@/hooks/useImportRecords";
import { useObjectFields } from "@/hooks/useObjectFields";
import { PreviewImportData } from "@/components/import/PreviewImportData";
import { DuplicateRecordsResolver } from "@/components/import/DuplicateRecordsResolver";
import { ApplicationSelector } from "@/components/import/ApplicationSelector";
import { findDuplicateRecords } from "@/utils/importDuplicateUtils";
import { DuplicateRecord } from "@/types";
import { convertColumnMappingsToRecord } from "@/hooks/useImportRecords";
import { ImportDataType, parseImportText, createInitialColumnMappings } from "@/utils/importDataUtils";

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { objectType, isLoading: isLoadingObjectType } = useObjectType(objectTypeId || "");
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId || "");
  
  const [importStep, setImportStep] = useState<"upload" | "map" | "resolve" | "complete">("upload");
  const [importText, setImportText] = useState<string>("");
  const [importData, setImportData] = useState<ImportDataType | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [duplicateRecords, setDuplicateRecords] = useState<DuplicateRecord[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("");
  
  const {
    importRecords,
    isImporting,
    importResult,
    importError
  } = useImportRecords();
  
  // Process the imported text data
  const handleProcessImport = () => {
    const parsed = parseImportText(importText);
    if (!parsed) {
      toast({
        title: "Fehler bei der Verarbeitung",
        description: "Die importierten Daten konnten nicht verarbeitet werden. Bitte überprüfen Sie das Format.",
        variant: "destructive",
      });
      return;
    }
    
    setImportData(parsed);
    
    if (fields) {
      const initialMappings = createInitialColumnMappings(parsed, fields);
      setColumnMappings(initialMappings);
    }
    
    setImportStep("map");
  };
  
  // Check for duplicates and move to next step
  const handleCheckDuplicates = async () => {
    if (!importData || !objectTypeId) return;
    
    try {
      const mappingsRecord = convertColumnMappingsToRecord(columnMappings);
      const matchingFields = columnMappings
        .filter(m => m.targetField && m.targetField.api_name)
        .map(m => m.targetField!.api_name);
      
      const duplicates = await findDuplicateRecords(
        objectTypeId,
        importData,
        mappingsRecord,
        matchingFields,
        'medium'
      );
      
      setDuplicateRecords(duplicates);
      setImportStep("resolve");
    } catch (error) {
      console.error("Error checking duplicates:", error);
      toast({
        title: "Fehler bei der Überprüfung auf Duplikate",
        description: "Es gab ein Problem bei der Überprüfung auf doppelte Datensätze.",
        variant: "destructive",
      });
    }
  };
  
  // Final import processing
  const handleImportRecords = async () => {
    if (!importData || !objectTypeId) return;
    
    try {
      // Convert mappings to format expected by importRecords
      const mappingsForImport: Record<string, string> = {};
      columnMappings.forEach(mapping => {
        if (mapping.sourceColumnName && mapping.targetField?.api_name) {
          mappingsForImport[mapping.sourceColumnName] = mapping.targetField.api_name;
        }
      });
      
      // Create a map of duplicate actions by row index
      const duplicateActions: Record<number, 'skip' | 'update' | 'create'> = {};
      duplicateRecords.forEach(dup => {
        duplicateActions[dup.importRowIndex] = dup.action as 'skip' | 'update' | 'create';
      });
      
      const result = await importRecords({
        objectTypeId,
        applicationId: selectedApplicationId,
        data: importData,
        columnMappings: mappingsForImport,
        duplicateActions
      });
      
      if (result.success) {
        setImportStep("complete");
        toast({
          title: "Import erfolgreich",
          description: `${result.createdCount} Datensätze erstellt, ${result.updatedCount} aktualisiert, ${result.skippedCount} übersprungen.`,
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Fehler beim Import",
        description: "Es gab ein Problem beim Importieren der Datensätze.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateActionChange = (recordId: string, action: string) => {
    setDuplicateRecords(prevRecords => 
      prevRecords.map(record => 
        record.id === recordId 
          ? { ...record, action: action as 'skip' | 'update' | 'create' } 
          : record
      )
    );
  };
  
  if (isLoadingObjectType || isLoadingFields) {
    return <div className="py-10 text-center">Laden...</div>;
  }
  
  if (!objectType) {
    return <div className="py-10 text-center">Objekttyp nicht gefunden</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(`/objects/${objectTypeId}`)}
          className="mb-4"
        >
          Zurück zu {objectType.name}
        </Button>
        <h1 className="text-3xl font-bold">{objectType.name} importieren</h1>
        <p className="text-muted-foreground">
          Importieren Sie Datensätze aus CSV oder tabellarischem Text
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Datensätze importieren</CardTitle>
          <CardDescription>
            Importieren Sie Datensätze für {objectType.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={importStep} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="upload" disabled={importStep !== "upload"}>
                1. Daten hochladen
              </TabsTrigger>
              <TabsTrigger value="map" disabled={importStep !== "map" && importStep !== "upload"}>
                2. Feldzuordnung
              </TabsTrigger>
              <TabsTrigger value="resolve" disabled={importStep !== "resolve" && importStep !== "map" && importStep !== "upload"}>
                3. Duplikate prüfen
              </TabsTrigger>
              <TabsTrigger value="complete" disabled={importStep !== "complete"}>
                4. Abschluss
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              {/* Application selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Anwendung auswählen</h3>
                <ApplicationSelector
                  selectedApplicationId={selectedApplicationId}
                  onSelect={setSelectedApplicationId}
                />
              </div>
              
              {/* Data upload textarea */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Daten einfügen</h3>
                <textarea
                  className="w-full h-64 p-4 border rounded-md font-mono text-sm"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Kopieren Sie Ihre Daten aus Excel, Google Sheets oder einer CSV-Datei hier hinein..."
                />
              </div>
              
              <Button 
                onClick={handleProcessImport} 
                disabled={!importText.trim() || !selectedApplicationId}
              >
                Weiter zur Feldzuordnung
              </Button>
            </TabsContent>
            
            <TabsContent value="map">
              <PreviewImportData
                importData={importData}
                columnMappings={columnMappings}
                fields={fields || []}
                onMappingChange={(mappings) => setColumnMappings(mappings)}
                onNext={handleCheckDuplicates}
                onBack={() => setImportStep("upload")}
              />
            </TabsContent>
            
            <TabsContent value="resolve">
              <DuplicateRecordsResolver
                duplicateRecords={duplicateRecords}
                onActionChange={handleDuplicateActionChange}
                onNext={handleImportRecords}
                onBack={() => setImportStep("map")}
                isLoading={isImporting}
              />
            </TabsContent>
            
            <TabsContent value="complete">
              <div className="text-center py-10">
                <div className="mb-6">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold mb-2">Import abgeschlossen!</h2>
                <p className="mb-6 text-muted-foreground">
                  Ihre Datensätze wurden erfolgreich importiert.
                </p>
                
                {importResult && (
                  <div className="flex justify-center gap-6 mb-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{importResult.createdCount}</p>
                      <p>Erstellt</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{importResult.updatedCount}</p>
                      <p>Aktualisiert</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-600">{importResult.skippedCount}</p>
                      <p>Übersprungen</p>
                    </div>
                  </div>
                )}
                
                <Button onClick={() => navigate(`/objects/${objectTypeId}/records`)}>
                  Zu den Datensätzen
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
