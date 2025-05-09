
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
  object_type_id?: string;
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
        content: fieldValuesByRecordId[record.id]?.content,
        object_type_id: record.object_type_id  // Make sure object_type_id is included in the mapped result
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
  featureRequests: { id: string; title: string; description: string }[];
} {
  if (!tickets || tickets.length === 0) {
    return {
      summary: "No tickets to analyze",
      patterns: [],
      prioritizedPlan: [],
      recommendations: [],
      featureRequests: []
    };
  }

  // Extract key information from tickets
  const ticketDescriptions = tickets.map(ticket => ticket.description || "").filter(Boolean);
  const ticketContents = tickets.map(ticket => ticket.content || "").filter(Boolean);
  const allText = [...ticketDescriptions, ...ticketContents].join(" ");
  
  // Generate summary based on number of tickets and common terms
  let summary = `Analysis of ${tickets.length} ticket${tickets.length > 1 ? 's' : ''} from the queue.`;
  
  // Identify feature requests
  const featureRequests = tickets
    .filter(ticket => {
      const description = ticket.description?.toLowerCase() || '';
      const content = ticket.content?.toLowerCase() || '';
      return description.includes('feature') || 
             description.includes('enhancement') || 
             description.includes('add') || 
             content.includes('feature') || 
             content.includes('enhancement') || 
             content.includes('add');
    })
    .map(ticket => ({
      id: ticket.id,
      title: ticket.displayName,
      description: ticket.description || ''
    }));
    
  // If we have feature requests, update the summary
  if (featureRequests.length > 0) {
    summary += ` Found ${featureRequests.length} feature request${featureRequests.length > 1 ? 's' : ''}.`;
  }
  
  // Identify patterns - enhanced to catch more patterns
  const patterns: string[] = [];
  if (allText.toLowerCase().includes("error") || allText.toLowerCase().includes("bug") || allText.toLowerCase().includes("fix")) {
    patterns.push("Error reports or bug fixes needed");
  }
  if (allText.toLowerCase().includes("feature") || allText.toLowerCase().includes("enhancement") || allText.toLowerCase().includes("improvement")) {
    patterns.push("Feature requests identified in tickets");
  }
  if (allText.toLowerCase().includes("update") || allText.toLowerCase().includes("upgrade") || allText.toLowerCase().includes("version")) {
    patterns.push("System update/upgrade requests found");
  }
  if (allText.toLowerCase().includes("field") || allText.toLowerCase().includes("lookup")) {
    patterns.push("Field management improvements requested");
  }
  if (allText.toLowerCase().includes("ui") || allText.toLowerCase().includes("interface") || allText.toLowerCase().includes("design")) {
    patterns.push("UI/UX improvements requested");
  }
  if (patterns.length === 0) {
    patterns.push("No clear patterns identified across tickets");
  }
  
  // Create prioritized plan - enhanced with better descriptions
  const prioritizedPlan = [
    {
      priority: "High",
      description: "Implement inline field creation functionality to streamline object configuration"
    }
  ];
  
  if (featureRequests.length > 0) {
    prioritizedPlan.push({
      priority: "High",
      description: "Enhance lookup fields with quick-create functionality to improve data entry workflow"
    });
  }
  
  if (allText.toLowerCase().includes("error") || allText.toLowerCase().includes("bug")) {
    prioritizedPlan.push({
      priority: "High", 
      description: "Fix reported errors and bugs to ensure system stability"
    });
  } else {
    prioritizedPlan.push({
      priority: "Medium", 
      description: "Improve existing field management interfaces for better usability"
    });
  }
  
  prioritizedPlan.push({
    priority: "Low",
    description: "Add documentation for new field creation and lookup features"
  });
  
  // Generate recommendations - enhanced with more specific advice
  const recommendations = [
    "Implement both inline field creation and quick-create for lookup fields simultaneously as they complement each other",
    "Ensure new field creation triggers appropriate UI refreshes to show the new fields immediately",
    "Add visual indicators when field creation is successful to improve user experience",
    "Consider adding field templates to speed up common field creation scenarios"
  ];
  
  if (tickets.length > 5) {
    recommendations.push("Consider assigning tickets to multiple team members to reduce backlog");
  }
  
  return {
    summary,
    patterns,
    prioritizedPlan,
    recommendations,
    featureRequests
  };
}
