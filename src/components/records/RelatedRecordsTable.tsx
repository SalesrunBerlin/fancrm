
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RelatedFieldValue } from "./RelatedFieldValue";
import { RelatedSection } from "@/hooks/useRelatedRecords";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Edit, Play, ArrowUp, ArrowDown } from "lucide-react";
import { useActions } from "@/hooks/useActions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Action } from "@/hooks/useActions";

interface RelatedRecordsTableProps {
  section: RelatedSection;
}

export function RelatedRecordsTable({ section }: RelatedRecordsTableProps) {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const { getActionsByObjectId } = useActions();
  const [recordActions, setRecordActions] = useState<{[key: string]: Action[]}>({});
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
  
  const handleRowClick = (recordId: string) => {
    navigate(`/objects/${section.objectType.id}/${recordId}`);
  };

  const handleSort = (fieldApiName: string) => {
    if (sortField === fieldApiName) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(fieldApiName);
      setSortDirection('asc');
    }
  };

  // Sort records
  let sortedRecords = [...section.records];
  if (sortField) {
    sortedRecords.sort((a, b) => {
      const aValue = sortField === 'created_at' ? a.created_at : 
                     sortField === 'updated_at' ? a.updated_at :
                     a.field_values?.[sortField];
                     
      const bValue = sortField === 'created_at' ? b.created_at :
                     sortField === 'updated_at' ? b.updated_at :
                     b.field_values?.[sortField];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

      // Date comparison for created_at and updated_at
      if (sortField === 'created_at' || sortField === 'updated_at') {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // Convert to string for comparison of other fields
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      return sortDirection === 'asc' ? aString.localeCompare(bString) : bString.localeCompare(aString);
    });
  }

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
                <TableHead 
                  key={field.api_name} 
                  className="whitespace-nowrap font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort(field.api_name)}
                >
                  <div className="flex items-center">
                    <span>{field.name}</span>
                    {sortField === field.api_name && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead 
                className="whitespace-nowrap font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  <span>Erstellt am</span>
                  {sortField === 'created_at' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="whitespace-nowrap font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('updated_at')}
              >
                <div className="flex items-center">
                  <span>Zuletzt geändert</span>
                  {sortField === 'updated_at' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRecords.map((record) => (
              <TableRow 
                key={record.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
              >
                {/* Actions Column */}
                <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => navigate(`/objects/${section.objectType.id}/${record.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    
                    <DropdownMenu open={expandedAction === record.id} onOpenChange={() => toggleActionDropdown(record.id)}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 p-0 text-blue-500 hover:text-blue-600"
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
                              className="cursor-pointer"
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
                    className="whitespace-pre-line"
                    onClick={() => handleRowClick(record.id)}
                  >
                    <RelatedFieldValue 
                      field={field} 
                      value={record.field_values?.[field.api_name]} 
                    />
                  </TableCell>
                ))}
                <TableCell 
                  className="whitespace-nowrap text-muted-foreground text-sm"
                  onClick={() => handleRowClick(record.id)}
                >
                  {format(new Date(record.created_at), "dd.MM.yyyy")}
                </TableCell>
                <TableCell 
                  className="whitespace-nowrap text-muted-foreground text-sm"
                  onClick={() => handleRowClick(record.id)}
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
