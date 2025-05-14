
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  [key: string]: any;
}

export function SprintAnalysis() {
  const { objectTypeId, recordId } = useParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch tickets related to this sprint
  useEffect(() => {
    if (!recordId) return;
    
    const fetchTickets = async () => {
      try {
        setIsLoading(true);
        
        // First, get the sprint record to confirm it's a sprint
        const { data: sprintRecord, error: sprintError } = await supabase
          .from('object_records')
          .select('*')
          .eq('id', recordId)
          .single();
          
        if (sprintError) throw sprintError;
        
        // Find tickets related to this sprint
        const { data: fieldValues, error: fieldError } = await supabase
          .from('object_field_values')
          .select('*')
          .eq('value', recordId);
          
        if (fieldError) throw fieldError;
        
        // Get the ticket records
        if (fieldValues && fieldValues.length > 0) {
          const ticketIds = fieldValues.map(fv => fv.record_id);
          
          const { data: ticketRecords, error: ticketsError } = await supabase
            .from('object_records')
            .select('*')
            .in('id', ticketIds);
            
          if (ticketsError) throw ticketsError;
          
          // For each ticket, get its field values
          const ticketsWithDetails = await Promise.all(
            ticketRecords.map(async (ticket) => {
              const { data: ticketFields, error: ticketFieldsError } = await supabase
                .from('object_field_values')
                .select('*')
                .eq('record_id', ticket.id);
                
              if (ticketFieldsError) throw ticketFieldsError;
              
              // Convert field values to an object
              const fieldValueObj: {[key: string]: any} = {};
              ticketFields.forEach(field => {
                fieldValueObj[field.field_api_name] = field.value;
              });
              
              return {
                id: ticket.id,
                title: fieldValueObj.title || fieldValueObj.name || 'Untitled Ticket',
                description: fieldValueObj.description || '',
                status: fieldValueObj.status || 'Unknown',
                ...fieldValueObj
              };
            })
          );
          
          setTickets(ticketsWithDetails);
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
        toast.error('Failed to fetch tickets for this sprint');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTickets();
  }, [recordId]);
  
  const generateAnalysis = () => {
    setIsGenerating(true);
    setAnalysis('');
    
    // In a real implementation, this would call an AI service
    // For now, we'll simulate a response after a delay
    setTimeout(() => {
      const ticketSummary = tickets.map(ticket => `- ${ticket.title}: ${ticket.status}`).join('\n');
      
      const mockAnalysis = `
## Sprint Analysis

This sprint contains ${tickets.length} tickets.

### Ticket Summary:
${ticketSummary}

### Recommended Implementation Plan:
1. Start by addressing the highest priority tickets first
2. Group related tickets to maximize development efficiency
3. Consider technical dependencies between tickets
4. Schedule regular check-ins to track progress

### Risk Assessment:
Medium risk - Some tickets require further clarification before implementation.
      `;
      
      setAnalysis(mockAnalysis);
      setIsGenerating(false);
    }, 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sprint Tickets ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-muted-foreground">No tickets found for this sprint</div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="font-medium">{ticket.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Status: {ticket.status}
                    </div>
                    {ticket.description && (
                      <div className="mt-2 text-sm">
                        {ticket.description.length > 100
                          ? `${ticket.description.substring(0, 100)}...`
                          : ticket.description}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {tickets.length > 0 && !analysis && (
                <Button 
                  onClick={generateAnalysis}
                  disabled={isGenerating}
                  className="mt-4"
                >
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isGenerating ? "Analyzing Sprint Tickets..." : "Analyze Tickets"}
                </Button>
              )}
            </div>
          )}
          
          {analysis && (
            <div className="mt-6 p-4 border rounded-md bg-muted/20">
              <pre className="whitespace-pre-wrap text-sm">{analysis}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
