
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TicketProcessorProps {
  objectTypeId: string;
  recordId: string;
  onStatusChange?: (newStatus: string) => void;
}

export function TicketProcessor({ 
  objectTypeId, 
  recordId,
  onStatusChange
}: TicketProcessorProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("In_Bearbeitung");
  const [notes, setNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { updateRecord } = useObjectRecords(objectTypeId);
  
  const handleStatusChange = async () => {
    if (!recordId) return;
    
    setIsProcessing(true);
    
    try {
      // Create field values object with status and notes if provided
      const field_values: Record<string, any> = {
        ai_status: selectedStatus
      };
      
      // Add notes if provided
      if (notes.trim()) {
        field_values.ai_notes = notes;
      }
      
      await updateRecord.mutateAsync({
        id: recordId,
        field_values
      });
      
      toast.success(`Ticket status updated to ${selectedStatus}`);
      
      if (onStatusChange) {
        onStatusChange(selectedStatus);
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">Update AI Status:</Label>
        <Select 
          value={selectedStatus} 
          onValueChange={setSelectedStatus}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Select new status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="In_Bearbeitung">In Bearbeitung</SelectItem>
            <SelectItem value="Erledigt">Erledigt</SelectItem>
            <SelectItem value="Abgelehnt">Abgelehnt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">Processing Notes:</Label>
        <Textarea
          id="notes"
          placeholder="Add processing notes or solution details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <Button 
        onClick={handleStatusChange}
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? "Updating..." : "Update Status"}
      </Button>
    </div>
  );
}
