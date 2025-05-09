
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useObjectType } from "@/hooks/useObjectType";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Ticket {
  id: string;
  record_id: string;
  displayName?: string;
  field_values: {
    [key: string]: any;
  };
  created_at?: string;
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
        }))
        .sort((a, b) => {
          // Sort by created_at, with most recent first
          return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
        });
      
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
  
  const handleProcessAllTickets = () => {
    navigate('/process-ticket');
  }
  
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
        description={`${tickets.length} tickets in the queue with AI Status: Warteschlange`}
        actions={
          <div className="flex gap-2">
            {tickets.length > 0 && (
              <Button onClick={handleProcessAllTickets}>
                Process All Tickets
              </Button>
            )}
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Queue
            </Button>
          </div>
        }
      />
      
      <div className="grid gap-6 mt-6">
        {tickets.map((ticket, index) => (
          <Card key={ticket.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {ticket.displayName}
                    <Badge className="bg-yellow-500">Warteschlange</Badge>
                  </CardTitle>
                  <CardDescription>
                    Ticket #{index + 1} • Created: {new Date(ticket.created_at || "").toLocaleString()}
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => handleProcessTicket(ticket)} 
                  disabled={isProcessing}
                >
                  Process <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                {Object.entries(ticket.field_values)
                  .filter(([key]) => !['ai_status', 'title', 'name'].includes(key))
                  .slice(0, 5) // Show only first 5 fields to keep the cards compact
                  .map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-medium w-1/3 capitalize">{key.replace(/_/g, ' ')}: </span>
                      <span className="truncate">{
                        typeof value === 'string' && value.length > 100 
                          ? `${value.substring(0, 100)}...` 
                          : value
                      }</span>
                    </div>
                  ))}
                {Object.keys(ticket.field_values).filter(key => !['ai_status', 'title', 'name'].includes(key)).length > 5 && (
                  <p className="text-sm text-muted-foreground italic">
                    And {Object.keys(ticket.field_values).filter(key => !['ai_status', 'title', 'name'].includes(key)).length - 5} more fields...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
