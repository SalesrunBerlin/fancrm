
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2 } from "lucide-react";
import { TicketProcessor } from "@/components/tickets/TicketProcessor";
import { useObjectType } from "@/hooks/useObjectType";
import { useIsMobile } from "@/hooks/use-mobile";

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

export default function TicketProcessorPage() {
  const [objectTypeId, setObjectTypeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
  
  // Fetch tickets with AI Status = "Warteschlange"
  useEffect(() => {
    if (!objectTypeId) return;
    
    async function fetchTickets() {
      setIsLoading(true);
      
      try {
        // Get tickets with object_type_id matching the Ticket object type
        const { data: recordsData, error: recordsError } = await supabase
          .from("object_records")
          .select("id, record_id, object_type_id")
          .eq("object_type_id", objectTypeId);
        
        if (recordsError) throw recordsError;
        
        if (!recordsData || recordsData.length === 0) {
          setTickets([]);
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
          }));
        
        setTickets(queueTickets);
        
        // Select the first ticket automatically
        if (queueTickets.length > 0) {
          setSelectedTicket(queueTickets[0]);
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTickets();
  }, [objectTypeId]);

  const handleStatusChange = (newStatus: string) => {
    setProcessingComplete(true);
    if (selectedTicket) {
      // Update the selected ticket's status in our local state
      setSelectedTicket({
        ...selectedTicket,
        aiStatus: newStatus
      });
    }
  };

  const handleViewDetails = (ticketId: string) => {
    navigate(`/objects/${objectTypeId}/${ticketId}`);
  };

  const handleNextTicket = () => {
    // Find the index of the currently selected ticket
    const currentIndex = tickets.findIndex(t => t.id === selectedTicket?.id);
    
    // If there's a next ticket, select it
    if (currentIndex < tickets.length - 1) {
      setSelectedTicket(tickets[currentIndex + 1]);
      setProcessingComplete(false);
    }
  };

  const goToQueue = () => {
    navigate('/ticket-queue');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading tickets...</span>
        </div>
      </div>
    );
  }

  if (!selectedTicket) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader
          title="Ticket Processing"
          description="No tickets in queue to process"
        />
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <p className="mb-4">There are no tickets in the queue with AI Status "Warteschlange".</p>
            <Button onClick={goToQueue}>View Queue</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <PageHeader
        title="Process First Ticket in Queue" 
        description={`Processing ticket: ${selectedTicket.displayName}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={goToQueue}>
              Back to Queue
            </Button>
            <Button onClick={() => handleViewDetails(selectedTicket.id)}>
              View Details
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedTicket.displayName && (
                <div>
                  <h3 className="font-semibold">Title</h3>
                  <p>{selectedTicket.displayName}</p>
                </div>
              )}
              
              {selectedTicket.description && (
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              )}
              
              {selectedTicket.content && (
                <div>
                  <h3 className="font-semibold">Content</h3>
                  <p className="whitespace-pre-wrap">{selectedTicket.content}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold">AI Status</h3>
                <p>{selectedTicket.aiStatus || "Not set"}</p>
              </div>
              
              {/* Display other relevant fields */}
              {Object.entries(selectedTicket.field_values || {})
                .filter(([key]) => !['ai_status', 'title', 'name', 'description', 'content'].includes(key))
                .map(([key, value]) => (
                  <div key={key}>
                    <h3 className="font-semibold">{key}</h3>
                    <p>{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Process Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              {processingComplete ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <h3 className="font-bold text-green-700 dark:text-green-300 mb-2">
                      Processing Complete
                    </h3>
                    <p>The ticket status has been updated to {selectedTicket.aiStatus}.</p>
                  </div>
                  
                  <div className="pt-2">
                    <h3 className="font-bold mb-2">Recommendation</h3>
                    <p className="mb-4">
                      Based on the ticket description:{" "}
                      <span className="italic">{selectedTicket.description?.substring(0, 100)}
                      {selectedTicket.description && selectedTicket.description.length > 100 ? "..." : ""}</span>
                    </p>
                    <p>
                      I recommend addressing this ticket by reviewing the content and ensuring all required information is present.
                      This ticket has been processed and marked as {selectedTicket.aiStatus}.
                    </p>
                  </div>

                  {tickets.length > 1 && (
                    <Button onClick={handleNextTicket} className="w-full mt-4">
                      Process Next Ticket
                    </Button>
                  )}
                </div>
              ) : (
                <TicketProcessor
                  objectTypeId={objectTypeId || ""}
                  recordId={selectedTicket.id}
                  onStatusChange={handleStatusChange}
                />
              )}
            </CardContent>
          </Card>
          
          {processingComplete && (
            <Card>
              <CardHeader>
                <CardTitle>Solution Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="font-medium">Based on the ticket information, here's a suggested solution:</p>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <h3 className="font-bold mb-2">Suggested Action</h3>
                    <p>
                      The ticket requires {selectedTicket.field_values?.type || "attention"}. 
                      Consider following up with the user to confirm resolution.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 dark:bg-amber-900/20 rounded-md">
                    <h3 className="font-bold mb-2">Next Steps</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Review all provided information</li>
                      <li>Document the resolution in your system</li>
                      <li>Follow up with the customer if needed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
