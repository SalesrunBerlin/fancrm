
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2 } from "lucide-react";
import { TicketProcessor } from "@/components/tickets/TicketProcessor";
import { toast } from "sonner";

interface Ticket {
  id: string;
  record_id: string;
  displayName?: string;
  field_values: {
    [key: string]: any;
  };
  aiStatus?: string;
  content?: string;
  description?: string;
}

export default function AutoTicketProcessorPage() {
  const [objectTypeId, setObjectTypeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [solutionPlan, setSolutionPlan] = useState<string>("");
  const [isSolutionGenerated, setIsSolutionGenerated] = useState(false);
  const navigate = useNavigate();

  // Get the ticket object type ID
  useEffect(() => {
    async function fetchTicketObjectType() {
      try {
        const { data, error } = await supabase
          .from("object_types")
          .select("id")
          .eq("name", "Ticket")
          .single();
        
        if (error) throw error;
        
        if (data) {
          setObjectTypeId(data.id);
        } else {
          console.error("Ticket object type not found");
        }
      } catch (error) {
        console.error("Error fetching ticket object type:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTicketObjectType();
  }, []);
  
  // Fetch next ticket with AI Status = "Warteschlange"
  useEffect(() => {
    if (!objectTypeId) return;
    
    fetchNextTicket();
  }, [objectTypeId]);

  const fetchNextTicket = async () => {
    setIsLoading(true);
    setSolutionPlan("");
    setIsSolutionGenerated(false);
    
    try {
      // Get tickets with object_type_id matching the Ticket object type
      const { data: recordsData, error: recordsError } = await supabase
        .from("object_records")
        .select("id, record_id, object_type_id, created_at")
        .eq("object_type_id", objectTypeId);
      
      if (recordsError) throw recordsError;
      
      if (!recordsData || recordsData.length === 0) {
        setTicket(null);
        setIsLoading(false);
        return;
      }
      
      // Get field values for all records
      const recordIds = recordsData.map(record => record.id);
      
      const { data: fieldValuesData, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("record_id, field_api_name, value")
        .in("record_id", recordIds);
      
      if (fieldValuesError) throw fieldValuesError;
      
      // Group field values by record id
      const fieldValuesByRecordId = fieldValuesData.reduce((acc, fieldValue) => {
        if (!acc[fieldValue.record_id]) {
          acc[fieldValue.record_id] = {};
        }
        acc[fieldValue.record_id][fieldValue.field_api_name] = fieldValue.value;
        return acc;
      }, {} as { [key: string]: { [key: string]: any } });
      
      // Filter records that have AI Status = "Warteschlange"
      const queueTickets = recordsData
        .filter(record => {
          const values = fieldValuesByRecordId[record.id] || {};
          return values.ai_status === "Warteschlange";
        })
        .map(record => ({
          ...record,
          field_values: fieldValuesByRecordId[record.id] || {},
          displayName: fieldValuesByRecordId[record.id]?.title || fieldValuesByRecordId[record.id]?.name || record.record_id,
          aiStatus: fieldValuesByRecordId[record.id]?.ai_status,
          content: fieldValuesByRecordId[record.id]?.content,
          description: fieldValuesByRecordId[record.id]?.description
        }))
        .sort((a, b) => {
          // Sort by created_at, with oldest first to process in FIFO order
          return new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime();
        });
      
      if (queueTickets.length > 0) {
        const nextTicket = queueTickets[0];
        setTicket(nextTicket);
        // Auto-generate solution plan based on ticket description
        generateSolutionPlan(nextTicket);
      } else {
        setTicket(null);
      }
    } catch (error) {
      console.error("Error fetching next ticket:", error);
      toast.error("Error fetching next ticket");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSolutionPlan = (ticket: Ticket) => {
    if (!ticket.description) {
      setSolutionPlan("No description provided in the ticket. Please add a description to generate a solution plan.");
      setIsSolutionGenerated(true);
      return;
    }

    // Analyze ticket description and generate a solution plan
    // This is a simple implementation - in a real AI system, this would call an AI service
    const description = ticket.description;
    let plan = `# Solution Plan for Ticket: ${ticket.displayName}\n\n`;
    
    // Parse description for key information
    plan += `## Ticket Description\n${description}\n\n`;
    
    // Generate steps based on description
    plan += `## Proposed Solution Steps\n`;
    
    if (description.toLowerCase().includes("error")) {
      plan += "1. Identify the error source mentioned in the description\n";
      plan += "2. Debug the error and trace its root cause\n";
      plan += "3. Implement a fix for the identified error\n";
      plan += "4. Test the solution to ensure the error is resolved\n";
    } 
    else if (description.toLowerCase().includes("feature")) {
      plan += "1. Analyze the feature requirements from the description\n";
      plan += "2. Design a solution architecture for the new feature\n";
      plan += "3. Implement the feature with required components\n";
      plan += "4. Add tests and documentation for the new feature\n";
    }
    else if (description.toLowerCase().includes("update")) {
      plan += "1. Identify which components need updating\n";
      plan += "2. Determine the necessary changes\n";
      plan += "3. Implement the updates carefully\n";
      plan += "4. Verify that the updates work as expected\n";
    }
    else {
      plan += "1. Analyze the ticket description to identify the core issue/request\n";
      plan += "2. Research potential solutions and best implementation approaches\n";
      plan += "3. Implement the solution with appropriate error handling\n";
      plan += "4. Test and validate the solution meets the requirements\n";
    }
    
    plan += "\n## Implementation Notes\n";
    plan += "- Estimated effort: Medium\n";
    plan += "- Suggested testing: Manual testing + unit tests\n";
    plan += "- Consider impact on: User experience and system performance\n";

    setSolutionPlan(plan);
    setIsSolutionGenerated(true);
  };

  const handleViewTicketDetails = () => {
    if (ticket && objectTypeId) {
      navigate(`/objects/${objectTypeId}/${ticket.id}`);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!ticket) return;
    
    try {
      await supabase
        .from("object_field_values")
        .upsert({
          record_id: ticket.id,
          field_api_name: "ai_status",
          value: status
        }, {
          onConflict: 'record_id,field_api_name'
        });
      
      toast.success(`Ticket status updated to ${status}`);
      
      // Fetch the next ticket
      fetchNextTicket();
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading next ticket...</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader
          title="Auto Ticket Processor"
          description="No tickets available in the queue"
        />
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <p className="mb-4">There are no tickets in the queue with AI Status "Warteschlange".</p>
            <Button onClick={() => navigate('/ticket-queue')}>View Queue</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <PageHeader
        title="Auto Ticket Processor" 
        description={`Current ticket: ${ticket.displayName}`}
        actions={
          <div className="flex gap-2">
            <Button onClick={handleViewTicketDetails}>View Details</Button>
            <Button variant="outline" onClick={() => navigate('/ticket-queue')}>
              Back to Queue
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ticket.displayName && (
                <div>
                  <h3 className="font-semibold">Title</h3>
                  <p>{ticket.displayName}</p>
                </div>
              )}
              
              {ticket.description && (
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p className="whitespace-pre-wrap">{ticket.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold">AI Status</h3>
                <p>{ticket.aiStatus || "Not set"}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Record ID</h3>
                <p>{ticket.record_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Solution Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {isSolutionGenerated ? (
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm overflow-auto">
                    {solutionPlan}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Generating solution plan...</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => handleUpdateStatus("In_Bearbeitung")} 
                  className="w-full"
                  variant="outline"
                >
                  Mark as In Bearbeitung
                </Button>
                <Button 
                  onClick={() => handleUpdateStatus("Erledigt")} 
                  className="w-full"
                  variant="success"
                >
                  Mark as Erledigt
                </Button>
                <Button 
                  onClick={() => handleUpdateStatus("Abgelehnt")} 
                  className="w-full"
                  variant="destructive"
                >
                  Mark as Abgelehnt
                </Button>
                <Button 
                  onClick={fetchNextTicket}
                  className="w-full"
                >
                  Next Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
