
import { useState } from "react";
import { ObjectRecord } from "@/types/ObjectFieldTypes";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

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
          {/* Show checkbox when in selection mode (regardless of device type) */}
          {selectionMode && (
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
        
        {/* Action buttons have been removed as requested */}
      </CardContent>
    </Card>
  );
}
