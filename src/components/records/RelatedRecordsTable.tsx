
import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RelatedFieldValue } from "./RelatedFieldValue";
import { RelatedSection } from "@/hooks/useRelatedRecords";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Edit, Play } from "lucide-react";
import { useActions } from "@/hooks/useActions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Action } from "@/hooks/useActions";

interface RelatedRecordsTableProps {
  section: RelatedSection;
}

export function RelatedRecordsTable({ section }: RelatedRecordsTableProps) {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const { getActionsByObjectId } = useActions();
  const [recordActions, setRecordActions] = useState<{[key: string]: Action[]}>({});
  const navigate = useNavigate();

  // Function to toggle the action dropdown for a specific record
  const toggleActionDropdown = async (recordId: string) => {
    if (expandedAction === recordId) {
      setExpandedAction(null);
      return;
    }
    
    setExpandedAction(recordId);
    
    // Load actions for this record if not already loaded
    if (!recordActions[recordId]) {
      try {
        const actions = await getActionsByObjectId(section.objectType.id);
        setRecordActions(prev => ({
          ...prev,
          [recordId]: actions
        }));
      } catch (error) {
        console.error("Error loading actions:", error);
      }
    }
  };

  const handleExecuteAction = (action: Action, recordId: string) => {
    if (action.action_type === "linked_record" && recordId) {
      // For linked records, navigate to the new route format with "from" parameter
      navigate(`/actions/execute/${action.id}/from/${recordId}`);
    } else {
      // For global actions, just pass the actionId
      navigate(`/actions/execute/${action.id}`);
    }
    setExpandedAction(null); // Close dropdown after action is selected
  };

  return (
    <div className="overflow-hidden rounded-md border w-full max-w-full">
      {/* Add a container with horizontal scroll for mobile */}
      <div className="overflow-x-auto max-w-[calc(100vw-2rem)]">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Actions Column - First Column */}
              <TableHead className="whitespace-nowrap font-medium">Actions</TableHead>
              
              {/* Original Fields */}
              {section.fields.map((field) => (
                <TableHead key={field.api_name} className="whitespace-nowrap font-medium">{field.name}</TableHead>
              ))}
              <TableHead className="whitespace-nowrap font-medium">Erstellt am</TableHead>
              <TableHead className="whitespace-nowrap font-medium">Zuletzt geändert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {section.records.map((record) => (
              <TableRow 
                key={record.id}
                className="hover:bg-muted/50 transition-colors"
              >
                {/* Actions Column */}
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0"
                      onClick={() => window.location.href = `/objects/${section.objectType.id}/${record.id}`}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    
                    <DropdownMenu open={expandedAction === record.id} onOpenChange={() => toggleActionDropdown(record.id)}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600"
                        >
                          <Play className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="start" 
                        className="w-48 bg-white" 
                        sideOffset={5}
                      >
                        {recordActions[record.id]?.length ? (
                          recordActions[record.id].map((action) => (
                            <DropdownMenuItem 
                              key={action.id}
                              onClick={() => handleExecuteAction(action, record.id)}
                              className={`text-${action.color}-500 hover:bg-${action.color}-50`}
                            >
                              {action.name}
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
                
                {/* Original Fields */}
                {section.fields.map((field) => (
                  <TableCell 
                    key={`${record.id}-${field.api_name}`} 
                    className="whitespace-nowrap"
                    onClick={() => window.location.href = `/objects/${section.objectType.id}/${record.id}`}
                  >
                    <RelatedFieldValue 
                      field={field} 
                      value={record.field_values?.[field.api_name]} 
                    />
                  </TableCell>
                ))}
                <TableCell 
                  className="whitespace-nowrap text-muted-foreground text-sm"
                  onClick={() => window.location.href = `/objects/${section.objectType.id}/${record.id}`}
                >
                  {format(new Date(record.created_at), "dd.MM.yyyy")}
                </TableCell>
                <TableCell 
                  className="whitespace-nowrap text-muted-foreground text-sm"
                  onClick={() => window.location.href = `/objects/${section.objectType.id}/${record.id}`}
                >
                  {format(new Date(record.updated_at), "dd.MM.yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
