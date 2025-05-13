
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SprintRecord, TicketRecord } from "@/lib/types/records";

export const useSprint = (sprintId?: string) => {
  const queryClient = useQueryClient();

  // Fetch sprint details
  const {
    data: sprint,
    isLoading: isSprintLoading,
    error: sprintError,
  } = useQuery({
    queryKey: ["sprint", sprintId],
    queryFn: async () => {
      if (!sprintId) return null;

      // Find sprint object type ID
      const { data: sprintObjectType } = await supabase
        .from("object_types")
        .select("id")
        .eq("api_name", "sprint")
        .single();

      if (!sprintObjectType) {
        throw new Error("Sprint object type not found");
      }

      // Get the sprint record
      const { data: sprintRecord, error: sprintError } = await supabase
        .from("object_records")
        .select(`
          id,
          record_id,
          created_at,
          updated_at
        `)
        .eq("id", sprintId)
        .eq("object_type_id", sprintObjectType.id)
        .single();

      if (sprintError) throw new Error(sprintError.message);

      // Get field values for the sprint record
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("field_api_name, value")
        .eq("record_id", sprintId);

      if (fieldValuesError) throw new Error(fieldValuesError.message);

      // Create a record with all field values
      const fieldValuesMap: Record<string, any> = {};
      fieldValues?.forEach((fv) => {
        fieldValuesMap[fv.field_api_name] = fv.value;
      });

      return {
        ...sprintRecord,
        field_values: fieldValuesMap,
        name: fieldValuesMap.name || "Unnamed Sprint",
        start_date: fieldValuesMap.start_date,
        end_date: fieldValuesMap.end_date,
        status: fieldValuesMap.status,
        description: fieldValuesMap.description,
      } as SprintRecord;
    },
    enabled: !!sprintId,
  });

  // Fetch tickets for a sprint
  const {
    data: tickets = [],
    isLoading: isTicketsLoading,
    error: ticketsError,
  } = useQuery({
    queryKey: ["sprint-tickets", sprintId],
    queryFn: async () => {
      if (!sprintId) return [];

      // Find ticket object type ID
      const { data: ticketObjectType } = await supabase
        .from("object_types")
        .select("id")
        .eq("api_name", "ticket")
        .single();

      if (!ticketObjectType) {
        throw new Error("Ticket object type not found");
      }

      // Get all tickets with a specific sprint relation
      const { data: ticketRecords, error: ticketsError } = await supabase
        .from("object_records")
        .select(`
          id,
          record_id,
          created_at,
          updated_at
        `)
        .eq("object_type_id", ticketObjectType.id);

      if (ticketsError) throw new Error(ticketsError.message);

      if (!ticketRecords || ticketRecords.length === 0) return [];

      // Get field values for all tickets
      const ticketIds = ticketRecords.map((record) => record.id);
      const { data: allFieldValues, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("record_id, field_api_name, value")
        .in("record_id", ticketIds);

      if (fieldValuesError) throw new Error(fieldValuesError.message);

      // Group field values by record
      const fieldValuesByTicket: Record<string, Record<string, any>> = {};
      allFieldValues?.forEach((fv) => {
        if (!fieldValuesByTicket[fv.record_id]) {
          fieldValuesByTicket[fv.record_id] = {};
        }
        fieldValuesByTicket[fv.record_id][fv.field_api_name] = fv.value;
      });

      // Filter tickets to only include those linked to this sprint
      const sprintTickets = ticketRecords
        .filter((ticket) => {
          const values = fieldValuesByTicket[ticket.id] || {};
          return values.sprint_id === sprintId;
        })
        .map((ticket) => {
          const values = fieldValuesByTicket[ticket.id] || {};
          return {
            ...ticket,
            field_values: values,
            sprint_id: values.sprint_id,
            topic: values.topic || "Untitled Ticket",
            description: values.description,
            status: values.status,
            priority: values.priority,
          } as TicketRecord;
        });

      return sprintTickets;
    },
    enabled: !!sprintId,
  });

  return {
    sprint,
    tickets,
    isLoading: isSprintLoading || isTicketsLoading,
    error: sprintError || ticketsError,
  };
};
