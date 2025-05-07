
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useReports } from "@/hooks/useReports";
import { useNavigate } from "react-router-dom";
import { ReportDefinition } from "@/types/report";
import { Loader } from "lucide-react";
import { toast } from "sonner";

export default function ReportExamplePage() {
  const navigate = useNavigate();
  const { objectTypes, isLoading: isLoadingObjectTypes } = useObjectTypes();
  const { createReport, updateReport, isLoading: isLoadingReports } = useReports();
  const [isCreating, setIsCreating] = useState(false);

  // Create a sample report using Contacts object
  const createSampleContactReport = async () => {
    try {
      setIsCreating(true);
      
      // Find the Contact object type
      const contactObjectType = objectTypes?.find(obj => 
        obj.name.toLowerCase() === "contact" || 
        obj.name.toLowerCase() === "contacts" ||
        obj.api_name?.toLowerCase() === "contacts"
      );
      
      if (!contactObjectType) {
        toast.error("Contact object not found in the system");
        return;
      }
      
      // Create the report with basic info
      const contactReport = await createReport(
        "Sample Contact Report",
        contactObjectType.id,
        "Report showing contact details including names, email, and phone"
      );
      
      if (!contactReport) {
        throw new Error("Failed to create contact report");
      }
      
      // Find some common contact fields to add to the report
      const defaultFields = [
        { fieldApiName: "first_name", displayName: "First Name", order: 0 },
        { fieldApiName: "last_name", displayName: "Last Name", order: 1 },
        { fieldApiName: "email", displayName: "Email", order: 2 },
        { fieldApiName: "phone", displayName: "Phone", order: 3 },
        { fieldApiName: "created_at", displayName: "Created Date", order: 4 }
      ];
      
      // Prepare field selections for the report
      const fieldSelections = defaultFields.map(field => ({
        objectTypeId: contactObjectType.id,
        fieldApiName: field.fieldApiName,
        displayName: field.displayName,
        isVisible: true,
        order: field.order
      }));
      
      // Update the report with fields
      await updateReport(contactReport.id, {
        selectedFields: fieldSelections,
        filters: [] // No filters for this sample report
      });
      
      toast.success("Sample contact report created successfully!");
      
      // Navigate to the report view
      navigate(`/reports/${contactReport.id}`);
      
    } catch (error) {
      console.error("Error creating sample report:", error);
      toast.error("Failed to create sample report");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Sample Report"
        description="Generate a sample contact report with pre-configured fields"
        backTo="/reports"
      />
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <h2 className="text-2xl font-medium">Contact Report Example</h2>
            <p className="text-muted-foreground max-w-lg">
              This will create a sample report that displays information about your contacts,
              including names, email addresses, phone numbers, and creation dates.
            </p>
            
            <Button 
              onClick={createSampleContactReport} 
              size="lg"
              className="mt-4"
              disabled={isCreating || isLoadingObjectTypes || isLoadingReports}
            >
              {isCreating ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Creating Report...
                </>
              ) : (
                "Create Sample Contact Report"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
