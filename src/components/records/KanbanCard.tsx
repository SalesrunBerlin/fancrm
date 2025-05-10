
import { useState } from "react";
import { ObjectRecord } from "@/types/ObjectFieldTypes";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Edit, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";

interface KanbanCardProps {
  record: ObjectRecord;
  objectTypeId: string;
  isDragging?: boolean;
  className?: string;
  isSelected?: boolean;
  onSelect?: (recordId: string, selected: boolean) => void;
  selectionMode?: boolean;
}

export function KanbanCard({ 
  record, 
  objectTypeId, 
  isDragging = false, 
  className = "",
  isSelected = false,
  onSelect,
  selectionMode = false
}: KanbanCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  // For the record name/title, we'll look for common naming fields
  const getRecordName = () => {
    const commonNameFields = ['name', 'title', 'subject', 'display_name'];
    
    if (record.displayName) return record.displayName;
    
    if (record.field_values) {
      // Try common name fields
      for (const field of commonNameFields) {
        if (record.field_values[field]) {
          return record.field_values[field];
        }
      }
      
      // If no common field found, use the first non-empty field
      const firstNonEmptyField = Object.entries(record.field_values)
        .find(([_, value]) => value !== null && value !== undefined && value !== '');
      
      if (firstNonEmptyField) {
        return firstNonEmptyField[1];
      }
    }
    
    // Fallback to record ID
    return `Record ${record.id.slice(0, 8)}`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If we're in selection mode or clicked on checkbox, don't navigate
    if (selectionMode || e.target instanceof HTMLInputElement) {
      return;
    }
    navigate(`/objects/${objectTypeId}/${record.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/objects/${objectTypeId}/${record.id}/edit`);
  };
  
  const handleCheckboxChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(record.id, checked);
    }
  };

  // Format record name for display with line break if it's too long
  const recordName = getRecordName();
  const formatDisplayName = (name: string) => {
    if (typeof name !== 'string') {
      return String(name);
    }
    
    if (name.length > 25) {
      return (
        <>
          {name.slice(0, 25)}…
        </>
      );
    }
    return name;
  };

  return (
    <Card 
      className={`mb-2 cursor-pointer ${isDragging ? 'shadow-lg' : ''} ${isSelected ? 'ring-2 ring-primary' : ''} ${className}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-3 relative">
        <div className="flex items-center gap-2">
          {/* Show checkbox when in selection mode or on mobile */}
          {(selectionMode || isMobile) && (
            <Checkbox 
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="mr-2"
            />
          )}
          <div className="text-sm flex-1">
            {formatDisplayName(recordName)}
          </div>
        </div>
        
        {/* Action buttons only show on hover or on mobile */}
        <div className={`absolute top-2 right-2 flex space-x-1 ${(isHovered || isMobile) ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          <Button
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={handleEditClick}
          >
            <Edit className="h-3.5 w-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleEditClick}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/objects/${objectTypeId}/${record.id}`)}>
                View details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
