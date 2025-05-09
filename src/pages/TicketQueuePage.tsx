
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useObjectType } from "@/hooks/useObjectType";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

interface Ticket {
  id: string;
  record_id: string;
  displayName?: string;
  field_values: {
    [key: string]: any;
  };
}

export default function TicketQueuePage() {
  // Get the ticket object type ID (this should be the ID for the Ticket object)
  const [objectTypeId, setObjectTypeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  
  // Fetch the Ticket object type ID by name
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
          toast.error("Ticket object type not found");
        }
      } catch (error) {
        console.error("Error fetching ticket object type:", error);
        toast.error("Could not fetch ticket object type");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTicketObjectType();
  }, []);
  
  // Fetch tickets with AI Status = "Warteschlange"
  const fetchQueueTickets = async () => {
    if (!objectTypeId) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("object_records")
        .select("id, record_id, object_type_id, created_at")
        .eq("object_type_id", objectTypeId);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setTickets([]);
        setIsLoading(false);
        return;
      }
      
      // Get field values for all records
      const recordIds = data.map(record => record.id);
      
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
      const queueTickets = data
        .filter(record => {
          const values = fieldValuesByRecordId[record.id] || {};
          return values.ai_status === "Warteschlange";
        })
        .map(record => ({
          ...record,
          field_values: fieldValuesByRecordId[record.id] || {},
          displayName: fieldValuesByRecordId[record.id]?.title || fieldValuesByRecordId[record.id]?.name || record.record_id
        }));
      
      setTickets(queueTickets);
    } catch (error) {
      console.error("Error fetching queue tickets:", error);
      toast.error("Could not fetch tickets in queue");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (objectTypeId) {
      fetchQueueTickets();
    }
  }, [objectTypeId]);
  
  const handleProcessTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    
    // Navigate to the ticket detail page
    navigate(`/objects/${objectTypeId}/${ticket.id}`);
  };
  
  const handleRefresh = () => {
    fetchQueueTickets();
    toast.success("Queue refreshed");
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading ticket queue...</span>
        </div>
      </div>
    );
  }
  
  // Show message if no tickets found
  if (!isLoading && tickets.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader
          title="Ticket Queue"
          description="View and process tickets in the queue"
          actions={
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Queue
            </Button>
          }
        />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-lg text-center">No tickets in the queue.</p>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <PageHeader
        title="Ticket Queue"
        description="View and process tickets in the queue"
        actions={
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Queue
          </Button>
        }
      />
      
      <div className="grid gap-6 mt-6">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex justify-between items-center">
                <div>{ticket.displayName}</div>
                <Button 
                  onClick={() => handleProcessTicket(ticket)} 
                  disabled={isProcessing}
                >
                  Process Ticket
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                {Object.entries(ticket.field_values)
                  .filter(([key]) => key !== "ai_status" && key !== "title" && key !== "name")
                  .map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-medium w-1/3">{key.replace(/_/g, ' ')}: </span>
                      <span>{value}</span>
                    </div>
                  ))}
                <div className="flex">
                  <span className="font-medium w-1/3">AI Status: </span>
                  <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                    {ticket.field_values.ai_status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
