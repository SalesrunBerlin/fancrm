import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDealStatuses } from "@/hooks/useDealStatuses";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { StatusForm } from "@/components/settings/StatusForm";
import { StatusList } from "@/components/settings/StatusList";

export default function Settings() {
  const {
    dealStatuses,
    isLoading,
    createStatus,
    updateStatus,
    deleteStatus,
    initializeDefaultStatuses
  } = useDealStatuses();

  useEffect(() => {
    if (dealStatuses && dealStatuses.length === 0 && !isLoading) {
      console.log("No statuses found, initializing defaults");
      initializeDefaultStatuses();
    }
  }, [dealStatuses, isLoading, initializeDefaultStatuses]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Einstellungen</h1>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Deal Status Verwaltung</h2>
        <StatusForm 
          dealStatuses={dealStatuses || []} 
          createStatus={createStatus} 
          isPending={createStatus.isPending}
        />
        <StatusList 
          dealStatuses={dealStatuses || []}
          isLoading={isLoading}
          updateStatus={updateStatus}
          deleteStatus={deleteStatus}
        />
      </Card>
    </div>
  );
}
