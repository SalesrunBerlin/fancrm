
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReportObjectSelector } from "@/components/reports/ReportObjectSelector";
import { ReportFieldSelector } from "@/components/reports/ReportFieldSelector";
import { ReportFilterBuilder } from "@/components/reports/ReportFilterBuilder";
import { ReportPreview } from "@/components/reports/ReportPreview";
import { useReports } from "@/hooks/useReports";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ReportDefinition } from "@/types/report";

interface ReportBuilderProps {
  reportId?: string | null;
  onClose: () => void;
}

export function ReportBuilder({ reportId, onClose }: ReportBuilderProps) {
  const { getReportById, createReport, updateReport } = useReports();
  const navigate = useNavigate();
  
  // State for the report being edited
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<any[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("info");
  const [originalReport, setOriginalReport] = useState<ReportDefinition | null>(null);
  
  // Load existing report data if editing
  useEffect(() => {
    if (reportId) {
      const report = getReportById(reportId);
      if (report) {
        console.log("Loading existing report for editing:", report);
        setName(report.name);
        setDescription(report.description || '');
        setSelectedObjects(report.objectIds || []);
        setSelectedFields(report.selectedFields || []);
        setFilters(report.filters || []);
        setOriginalReport(report);
      } else {
        toast.error(`Could not find report with ID ${reportId}`);
        navigate('/reports');
      }
    }
  }, [reportId, getReportById, navigate]);
  
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Report name is required");
      return;
    }
    
    if (selectedObjects.length === 0) {
      toast.error("Please select at least one object");
      setActiveTab("objects");
      return;
    }
    
    if (selectedFields.length === 0) {
      toast.error("Please select at least one field to display");
      setActiveTab("fields");
      return;
    }
    
    try {
      if (reportId && originalReport) {
        // Update existing report
        console.log("Updating existing report:", reportId);
        await updateReport(reportId, {
          name,
          description,
          objectIds: selectedObjects,
          selectedFields,
          filters
        });
        toast.success("Report updated successfully");
        navigate(`/reports/${reportId}`);
      } else {
        // Create new report
        console.log("Creating new report with first object:", selectedObjects[0]);
        const newReport = await createReport(name, selectedObjects[0], description);
        
        // Update with complete data (all selected objects, fields, filters)
        if (newReport) {
          await updateReport(newReport.id, {
            objectIds: selectedObjects,
            selectedFields,
            filters
          });
          
          toast.success("New report created successfully");
          navigate(`/reports/${newReport.id}`);
        }
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Failed to save report");
    }
  };
  
  const handleObjectsChange = (objectIds: string[]) => {
    console.log("Selected objects changed:", objectIds);
    setSelectedObjects(objectIds);
    
    // If objects change, we need to update selected fields
    // to only include fields from the selected objects
    setSelectedFields(prevFields => 
      prevFields.filter(field => objectIds.includes(field.objectTypeId))
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">
          {reportId ? "Edit Report" : "Create New Report"}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="objects">Objects</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="py-4 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-name">Report Name</Label>
                <Input 
                  id="report-name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Enter report name"
                  className="w-full" 
                />
              </div>
              <div>
                <Label htmlFor="report-description">Description (optional)</Label>
                <Textarea 
                  id="report-description" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Enter description"
                  className="w-full" 
                  rows={4}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="objects" className="py-4">
            <ReportObjectSelector 
              selectedObjects={selectedObjects}
              onChange={handleObjectsChange}
            />
          </TabsContent>
          
          <TabsContent value="fields" className="py-4">
            <ReportFieldSelector 
              objectIds={selectedObjects}
              selectedFields={selectedFields} 
              onChange={setSelectedFields}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="py-4">
            <ReportFilterBuilder
              objectIds={selectedObjects}
              filters={filters}
              onChange={setFilters}
            />
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Preview</h3>
              <ReportPreview
                name={name}
                objectIds={selectedObjects}
                selectedFields={selectedFields}
                filters={filters}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
