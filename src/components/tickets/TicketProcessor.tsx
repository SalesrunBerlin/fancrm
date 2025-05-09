
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { toast } from "sonner";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { updateRecord } = useObjectRecords(objectTypeId);
  
  const handleStatusChange = async () => {
    if (!recordId) return;
    
    setIsProcessing(true);
    
    try {
      await updateRecord.mutateAsync({
        id: recordId,
        field_values: {
          ai_status: selectedStatus
        }
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
    <Card>
      <CardHeader>
        <CardTitle>Process Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Update AI Status:</label>
            <Select 
              value={selectedStatus} 
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In_Bearbeitung">In Bearbeitung</SelectItem>
                <SelectItem value="Erledigt">Erledigt</SelectItem>
                <SelectItem value="Abgelehnt">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleStatusChange}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? "Updating..." : "Update Status"}
        </Button>
      </CardFooter>
    </Card>
  );
}
