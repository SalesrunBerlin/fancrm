
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface TicketData {
  id: string;
  record_id: string;
  displayName: string;
  field_values: {
    [key: string]: any;
  };
  created_at?: string;
  description?: string;
  content?: string;
}

/**
 * Retrieves tickets with AI Status "Warteschlange" from the database
 * @param limit Optional number of tickets to retrieve
 * @returns Array of ticket data
 */
export async function getQueueTickets(limit?: number): Promise<TicketData[]> {
  try {
    // Get the Ticket object type ID
    const { data: objectTypeData, error: objectTypeError } = await supabase
      .from("object_types")
      .select("id")
      .eq("name", "Ticket")
      .single();
    
    if (objectTypeError) throw objectTypeError;
    if (!objectTypeData) {
      toast.error("Ticket object type not found");
      return [];
    }
    
    const objectTypeId = objectTypeData.id;
    
    // Get tickets
    const { data: recordsData, error: recordsError } = await supabase
      .from("object_records")
      .select("id, record_id, object_type_id, created_at")
      .eq("object_type_id", objectTypeId)
      .order('created_at', { ascending: true });
    
    if (recordsError) throw recordsError;
    
    if (!recordsData || recordsData.length === 0) {
      return [];
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
    let queueTickets = recordsData
      .filter(record => {
        const values = fieldValuesByRecordId[record.id] || {};
        return values.ai_status === "Warteschlange";
      })
      .map(record => ({
        ...record,
        field_values: fieldValuesByRecordId[record.id] || {},
        displayName: fieldValuesByRecordId[record.id]?.title || fieldValuesByRecordId[record.id]?.name || record.record_id,
        description: fieldValuesByRecordId[record.id]?.description,
        content: fieldValuesByRecordId[record.id]?.content
      }));
    
    // Apply limit if provided
    if (limit && limit > 0 && limit < queueTickets.length) {
      queueTickets = queueTickets.slice(0, limit);
    }
    
    return queueTickets;
  } catch (error) {
    console.error("Error fetching queue tickets:", error);
    toast.error("Could not fetch tickets in queue");
    return [];
  }
}

/**
 * Analyzes a collection of tickets and generates an implementation plan
 * @param tickets Array of tickets to analyze
 * @returns An implementation plan object
 */
export function analyzeTickets(tickets: TicketData[]): {
  summary: string;
  patterns: string[];
  prioritizedPlan: { priority: string; description: string }[];
  recommendations: string[];
} {
  if (!tickets || tickets.length === 0) {
    return {
      summary: "No tickets to analyze",
      patterns: [],
      prioritizedPlan: [],
      recommendations: []
    };
  }

  // Extract key information from tickets
  const ticketDescriptions = tickets.map(ticket => ticket.description || "").filter(Boolean);
  const ticketContents = tickets.map(ticket => ticket.content || "").filter(Boolean);
  const allText = [...ticketDescriptions, ...ticketContents].join(" ");
  
  // Generate summary based on number of tickets and common terms
  let summary = `Analysis of ${tickets.length} ticket${tickets.length > 1 ? 's' : ''} from the queue.`;
  
  // Identify patterns - this is a simple implementation that could be enhanced with AI
  const patterns: string[] = [];
  if (allText.toLowerCase().includes("error")) {
    patterns.push("Multiple error reports found in tickets");
  }
  if (allText.toLowerCase().includes("feature")) {
    patterns.push("Feature requests identified in multiple tickets");
  }
  if (allText.toLowerCase().includes("update") || allText.toLowerCase().includes("upgrade")) {
    patterns.push("System update/upgrade requests found");
  }
  if (patterns.length === 0) {
    patterns.push("No clear patterns identified across tickets");
  }
  
  // Create prioritized plan
  const prioritizedPlan = [
    {
      priority: "High",
      description: "Address critical issues or errors reported in tickets"
    },
    {
      priority: "Medium", 
      description: "Implement requested features after resolving critical issues"
    },
    {
      priority: "Low",
      description: "Consider usability improvements and non-urgent updates"
    }
  ];
  
  // Generate recommendations
  const recommendations = [
    "Process tickets in order of creation date (oldest first)",
    "Group similar tickets for batch processing when possible",
    "Document solutions for future reference"
  ];
  
  if (tickets.length > 5) {
    recommendations.push("Consider assigning tickets to multiple team members to reduce backlog");
  }
  
  return {
    summary,
    patterns,
    prioritizedPlan,
    recommendations
  };
}
