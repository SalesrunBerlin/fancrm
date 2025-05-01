
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useImportObjectType } from "@/hooks/useImportObjectType";
import { FileUpload } from "@/components/import/FileUpload";
import { PreviewImportData } from "@/components/import/PreviewImportData";
import { BatchFieldCreation } from "@/components/import/BatchFieldCreation";
import { useImportRecords } from "@/hooks/useImportRecords";
import { toast } from "sonner";
import { DuplicateRecordsResolver } from "@/components/import/DuplicateRecordsResolver";
import { ApplicationSelector } from "@/components/import/ApplicationSelector";

// Define the steps for the import process
enum ImportStep {
  UPLOAD,
  PREVIEW,
  FIELD_CREATION,
  MATCHING_FIELDS,
  COLUMN_MAPPING,
  APPLICATION_SELECTION,
  RESOLVE_DUPLICATES,
  FINISH,
}

// Define the type for column mapping
type ColumnMapping = {
  [columnName: string]: string | null;
};

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { objectTypes } = useObjectTypes();
  const { mutate: importObjectType } = useImportObjectType();
  const { mutate: importRecords } = useImportRecords();

  // Local state for the import process
  const [currentStep, setCurrentStep] = useState<ImportStep>(ImportStep.UPLOAD);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping>({});
  const [matchingFields, setMatchingFields] = useState<string[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isRecheckingDuplicates, setIsRecheckingDuplicates] = useState(false);

  // Get the object type
  const objectType = objectTypes?.find((type) => type.id === objectTypeId);

  // Function to handle file upload
  const handleFileUpload = (file: File) => {
    setCsvFile(file);
    setCurrentStep(ImportStep.PREVIEW);
  };

  // Function to handle data preview
  const handleDataPreview = (data: any[]) => {
    setImportData(data);
    setCurrentStep(ImportStep.FIELD_CREATION);
  };

  // Function to handle field creation
  const handleFieldCreation = (fields: any[]) => {
    setFields(fields);
    setCurrentStep(ImportStep.MATCHING_FIELDS);
  };

  // Function to handle matching fields
  const handleMatchingFields = (matchingFields: string[]) => {
    setMatchingFields(matchingFields);
    setCurrentStep(ImportStep.COLUMN_MAPPING);
  };

  // Function to handle column mapping
  const handleColumnMapping = (columnMappings: ColumnMapping) => {
    setColumnMappings(columnMappings);
    setCurrentStep(ImportStep.APPLICATION_SELECTION);
  };

  // Function to handle application selection
  const handleApplicationSelection = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setCurrentStep(ImportStep.RESOLVE_DUPLICATES);
  };

  const handleSkipDuplicateResolution = () => {
    handleFinishImport();
  };

  // Function to handle back navigation
  const handleBack = () => {
    switch (currentStep) {
      case ImportStep.PREVIEW:
        setCurrentStep(ImportStep.UPLOAD);
        break;
      case ImportStep.FIELD_CREATION:
        setCurrentStep(ImportStep.PREVIEW);
        break;
      case ImportStep.MATCHING_FIELDS:
        setCurrentStep(ImportStep.FIELD_CREATION);
        break;
      case ImportStep.COLUMN_MAPPING:
        setCurrentStep(ImportStep.MATCHING_FIELDS);
        break;
      case ImportStep.APPLICATION_SELECTION:
        setCurrentStep(ImportStep.COLUMN_MAPPING);
        break;
      case ImportStep.RESOLVE_DUPLICATES:
        setCurrentStep(ImportStep.APPLICATION_SELECTION);
        break;
      default:
        navigate(`/objects/${objectTypeId}`);
    }
  };

  const recheckDuplicates = useCallback(async () => {
    if (!objectTypeId || !matchingFields || matchingFields.length === 0 || !columnMappings || Object.keys(columnMappings).length === 0 || !importData || importData.length === 0) {
      toast.error("Please configure import settings before rechecking duplicates.");
      return;
    }

    setIsRecheckingDuplicates(true);
    try {
      // Prepare the data for duplicate checking
      const records = importData.map((item) => {
        const record: { [key: string]: any } = {};
        Object.entries(columnMappings).forEach(([column, fieldApiName]) => {
          if (fieldApiName && item[column] !== undefined) {
            record[fieldApiName] = item[column];
          }
        });
        return record;
      });

      // Call the API to check for duplicates
      const response = await fetch(`/api/import/check-duplicates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          objectTypeId: objectTypeId,
          matchingFields: matchingFields,
          records: records,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to check duplicates");
      }

      const result = await response.json();
      setDuplicates(result.duplicates || []);
      toast.success("Duplicates rechecked successfully.");
    } catch (error: any) {
      console.error("Error rechecking duplicates:", error);
      toast.error(error.message || "Failed to recheck duplicates.");
    } finally {
      setIsRecheckingDuplicates(false);
    }
  }, [objectTypeId, matchingFields, columnMappings, importData]);

  // Function to handle finish import
  const handleFinishImport = async () => {
    if (!objectTypeId || !columnMappings || Object.keys(columnMappings).length === 0 || !importData || importData.length === 0) {
      toast.error("Please configure import settings before finishing import.");
      return;
    }

    // Prepare the data for import
    const records = importData.map((item) => {
      const record: { [key: string]: any } = {};
      Object.entries(columnMappings).forEach(([column, fieldApiName]) => {
        if (fieldApiName && item[column] !== undefined) {
          record[fieldApiName] = item[column];
        }
      });
      return record;
    });

    // Call the importRecords mutation
    importRecords({
      objectTypeId: objectTypeId,
      records: records,
    }, {
      onSuccess: () => {
        toast.success("Records imported successfully!");
        navigate(`/objects/${objectTypeId}`);
      },
      onError: (error: any) => {
        console.error("Error importing records:", error);
        toast.error(error.message || "Failed to import records.");
      },
    });
  };

  // Render content based on current step
  const renderContent = () => {
    switch (currentStep) {
      case ImportStep.UPLOAD:
        return (
          <FileUpload
            onFileUpload={handleFileUpload}
          />
        );
      case ImportStep.PREVIEW:
        return (
          <PreviewImportData
            csvFile={csvFile}
            onDataPreview={handleDataPreview}
            onBack={handleBack}
          />
        );
      case ImportStep.FIELD_CREATION:
        return (
          <BatchFieldCreation
            importData={importData}
            objectTypeId={objectTypeId!}
            onFieldCreation={handleFieldCreation}
            onBack={handleBack}
          />
        );
      case ImportStep.MATCHING_FIELDS:
        return (
          <div>
            <h2>Matching Fields</h2>
            {/* Implement the UI for selecting matching fields */}
            <Button onClick={() => handleMatchingFields(["id", "name"])}>Next</Button>
            <Button onClick={handleBack}>Back</Button>
          </div>
        );
      case ImportStep.COLUMN_MAPPING:
        return (
          <div>
            <h2>Column Mapping</h2>
            {/* Implement the UI for mapping columns to fields */}
            <Button onClick={() => handleColumnMapping({"id": "id", "name": "name"})}>Next</Button>
            <Button onClick={handleBack}>Back</Button>
          </div>
        );
      case ImportStep.APPLICATION_SELECTION:
        return (
          <ApplicationSelector
            objectTypeId={objectTypeId!}
            onSelect={handleApplicationSelection}
          />
        );
      case ImportStep.RESOLVE_DUPLICATES:
        return (
          <DuplicateRecordsResolver
            headers={Object.keys(importData[0] || {})}
            data={importData}
            onResolve={() => handleFinishImport()}
            onCancel={handleBack}
            objectTypeId={objectTypeId!}
          />
        );
      case ImportStep.FINISH:
        return (
          <div>
            <h2>Finish</h2>
            {/* Display a summary of the import and a button to finish */}
            <Button onClick={handleFinishImport}>Finish Import</Button>
            <Button onClick={handleBack}>Back</Button>
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div>
      <PageHeader
        title={`Import Records for ${objectType?.name || "Object"}`}
        description="Import records from a CSV file"
      />
      <Card>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
