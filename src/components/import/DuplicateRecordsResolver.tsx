import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface DuplicateRecord {
  id: string;
  [key: string]: any;
}

interface DuplicateRecordsResolverProps {
  isOpen: boolean;
  onClose: () => void;
  primaryRecords: DuplicateRecord[];
  duplicateRecords: DuplicateRecord[];
  fields: string[];
  onResolve: (resolvedRecords: DuplicateRecord[]) => void;
}

export function DuplicateRecordsResolver({
  isOpen,
  onClose,
  primaryRecords,
  duplicateRecords,
  fields,
  onResolve,
}: DuplicateRecordsResolverProps) {
  const { toast } = useToast();
  const [resolvedRecords, setResolvedRecords] = useState<DuplicateRecord[]>(
    []
  );
  const [selectedPrimaryRecordIds, setSelectedPrimaryRecordIds] = useState<
    string[]
  >([]);
  const [showReview, setShowReview] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    // Initialize resolvedRecords with a copy of primaryRecords
    setResolvedRecords([...primaryRecords]);
    // Initialize selectedPrimaryRecordIds with the IDs of primaryRecords
    setSelectedPrimaryRecordIds(primaryRecords.map((record) => record.id));
  }, [primaryRecords]);

  const handlePrimaryRecordSelect = (recordId: string) => {
    setSelectedPrimaryRecordIds((prevSelected) => {
      if (prevSelected.includes(recordId)) {
        return prevSelected.filter((id) => id !== recordId);
      } else {
        return [...prevSelected, recordId];
      }
    });
  };

  const isPrimaryRecordSelected = (recordId: string) => {
    return selectedPrimaryRecordIds.includes(recordId);
  };

  const handleFieldValueChange = (
    recordId: string,
    field: string,
    value: any
  ) => {
    setResolvedRecords((prevResolvedRecords) => {
      return prevResolvedRecords.map((record) => {
        if (record.id === recordId) {
          return { ...record, [field]: value };
        }
        return record;
      });
    });
  };

  const handleResolve = async () => {
    try {
      setIsResolving(true);
      // Filter out records that are not selected as primary
      const finalResolvedRecords = resolvedRecords.filter((record) =>
        selectedPrimaryRecordIds.includes(record.id)
      );

      // Call the onResolve prop with the final resolved records
      onResolve(finalResolvedRecords);
      toast({
        title: "Success",
        description: "Duplicate records resolved successfully.",
      });
      onClose();
    } catch (error) {
      console.error("Error resolving duplicates:", error);
      toast({
        title: "Error",
        description: "Failed to resolve duplicate records.",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleReviewToggle = () => {
    setShowReview(!showReview);
  };

  const hasChanges = () => {
    // Compare resolvedRecords with original primaryRecords
    if (resolvedRecords.length !== primaryRecords.length) {
      return true;
    }

    for (let i = 0; i < resolvedRecords.length; i++) {
      const resolvedRecord = resolvedRecords[i];
      const primaryRecord = primaryRecords[i];

      for (const field of fields) {
        if (resolvedRecord[field] !== primaryRecord[field]) {
          return true;
        }
      }
    }

    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Resolve Duplicate Records</DialogTitle>
          <DialogDescription>
            Review and resolve duplicate records by selecting the primary
            records and editing their fields.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Select</TableHead>
                {fields.map((field) => (
                  <TableHead key={field}>{field}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {resolvedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={isPrimaryRecordSelected(record.id)}
                      onCheckedChange={() => handlePrimaryRecordSelect(record.id)}
                    />
                  </TableCell>
                  {fields.map((field) => (
                    <TableCell key={`${record.id}-${field}`}>
                      {showReview ? (
                        <Input
                          type="text"
                          value={record[field] || ""}
                          onChange={(e) =>
                            handleFieldValueChange(
                              record.id,
                              field,
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        record[field] || ""
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <Button 
          type="button"
          variant="default" // Changed from "outline" to "default" to fix the type error
          onClick={handleReviewToggle}
          className="mb-4"
        >
          {showReview ? "Hide Review" : "Review Changes"}
        </Button>
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleResolve}
            disabled={!hasChanges() || isResolving}
          >
            {isResolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resolve Duplicates
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
