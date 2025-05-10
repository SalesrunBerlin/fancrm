
import { useState, useEffect, useRef } from "react";
import { ObjectRecord } from "@/types/ObjectFieldTypes";
import { ObjectField } from "@/hooks/useObjectTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DragDropContext, Droppable, Draggable, DropResult, DragStart, DragUpdate } from "@hello-pangea/dnd";
import { KanbanCard } from "./KanbanCard";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, MoveVertical, MoveHorizontal, ArrowLeft, ArrowRight } from "lucide-react";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { useKanbanViewSettings } from "@/hooks/useKanbanViewSettings";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface KanbanViewProps {
  records: ObjectRecord[];
  fields: ObjectField[];
  objectTypeId: string;
  onUpdateRecord?: (recordId: string, fieldValues: Record<string, any>) => Promise<void>;
}

export function KanbanView({ records, fields, objectTypeId, onUpdateRecord }: KanbanViewProps) {
  // Check if we're on mobile
  const isMobile = useIsMobile();
  
  // Find all picklist fields
  const picklistFields = fields.filter(field => field.data_type === "picklist");
  
  // Use the kanban view settings hook to persist state
  const { settings, updateFieldApiName, toggleColumnExpansion } = useKanbanViewSettings(objectTypeId);
  
  // State for selected picklist field
  const [selectedFieldApiName, setSelectedFieldApiName] = useState<string>(
    settings.fieldApiName || (picklistFields.length > 0 ? picklistFields[0].api_name : "")
  );

  // Update the persisted settings when field changes
  useEffect(() => {
    if (selectedFieldApiName) {
      updateFieldApiName(selectedFieldApiName);
    }
  }, [selectedFieldApiName, updateFieldApiName]);

  // Selected field object
  const selectedField = fields.find(field => field.api_name === selectedFieldApiName);
  
  // Get field ID for picklist values query
  const selectedFieldId = selectedField?.id || "";
  
  // Get picklist values from database using the hook
  const { picklistValues, isLoading: isLoadingPicklistValues } = useFieldPicklistValues(selectedFieldId);
  
  // Group records by picklist value
  const [groupedRecords, setGroupedRecords] = useState<Record<string, ObjectRecord[]>>({});

  // Active accordion item for mobile view
  const [activeColumn, setActiveColumn] = useState<string | null>(settings.expandedColumns[0] || null);
  
  // Get field values from our hook
  const { updateRecord } = useObjectRecords(objectTypeId);

  // Refs for auto-scrolling during drag
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrolling = useRef<boolean>(false);
  const scrollSpeed = useRef<number>(0);
  const scrollDirection = useRef<'left' | 'right' | 'up' | 'down' | null>(null);
  const autoScrollIntervalRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartPositionY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggedItemRef = useRef<HTMLElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  // The dragged element's clone to maintain visibility
  const [draggedElement, setDraggedElement] = useState<{
    id: string;
    element: JSX.Element | null;
    position: {x: number, y: number} | null;
  }>({id: '', element: null, position: null});

  // State to track which button is currently being dragged over
  const [dragOverButtonId, setDragOverButtonId] = useState<string | null>(null);

  // State to track mouse/touch position during drag
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);

  // Group records by the selected picklist value
  useEffect(() => {
    if (!selectedFieldApiName || !records.length) {
      setGroupedRecords({});
      return;
    }

    const grouped: Record<string, ObjectRecord[]> = {};
    
    // Initialize groups for all picklist values from database
    if (picklistValues && picklistValues.length > 0) {
      picklistValues.forEach(option => {
        grouped[option.value] = [];
      });
    } else {
      // If no picklist values, create a default "none" group
      grouped["none"] = [];
    }

    // Group records
    records.forEach(record => {
      const fieldValue = record.field_values?.[selectedFieldApiName];
      
      if (fieldValue && grouped[fieldValue]) {
        grouped[fieldValue].push(record);
      } else {
        // If the value doesn't match a known option, create a group for it
        // This ensures data integrity when values exist in records but not in picklist options
        if (fieldValue) {
          if (!grouped[fieldValue]) {
            grouped[fieldValue] = [];
          }
          grouped[fieldValue].push(record);
        } else {
          // If no value, put in "none" group
          if (!grouped["none"]) {
            grouped["none"] = [];
          }
          grouped["none"].push(record);
        }
      }
    });
    
    setGroupedRecords(grouped);
    
    // Set first column as active on mobile if none is active yet
    if (isMobile && !activeColumn && Object.keys(grouped).length > 0) {
      // Find first column with records
      const firstColumnWithRecords = Object.keys(grouped).find(key => grouped[key].length > 0) || Object.keys(grouped)[0];
      setActiveColumn(firstColumnWithRecords);
      toggleColumnExpansion(firstColumnWithRecords, true);
    }
  }, [records, selectedFieldApiName, picklistValues, isMobile, activeColumn, toggleColumnExpansion]);

  // Set up event listeners to capture and control touch events during drag
  useEffect(() => {
    // Only add these listeners when dragging is active
    if (!isDraggingRef.current) return;
    
    // Prevent default browser touch behaviors during drag
    const preventDefaultTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
      }
    };

    // Track mouse/touch position for ghost card
    const trackMousePosition = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      
      if ('touches' in e && e.touches.length > 0) {
        setMousePosition({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        });
      } else if ('clientX' in e) {
        setMousePosition({
          x: e.clientX,
          y: e.clientY
        });
      }
    };

    // Add the event listeners
    document.addEventListener('touchmove', preventDefaultTouchMove, { passive: false });
    document.addEventListener('mousemove', trackMousePosition as any);
    document.addEventListener('touchmove', trackMousePosition as any);
    
    // Reference to the main page element
    if (!pageRef.current) {
      pageRef.current = document.querySelector('main');
    }
    
    // When dragging starts, disable normal page scrolling
    if (pageRef.current) {
      pageRef.current.style.overflow = isDraggingRef.current ? 'hidden' : '';
    }
    
    // Hide original dragged element
    if (draggedItemRef.current) {
      draggedItemRef.current.style.opacity = '0.05';
    }
    
    return () => {
      // Clean up listeners when component unmounts or drag ends
      document.removeEventListener('touchmove', preventDefaultTouchMove);
      document.removeEventListener('mousemove', trackMousePosition as any);
      document.removeEventListener('touchmove', trackMousePosition as any);
      
      // Re-enable normal page scrolling
      if (pageRef.current) {
        pageRef.current.style.overflow = '';
      }
      
      // Show original dragged element again
      if (draggedItemRef.current) {
        draggedItemRef.current.style.opacity = '1';
      }
    };
  }, [isDraggingRef.current]);

  // Auto-scroll function that runs during drag operations
  const autoScroll = () => {
    if (!scrolling.current || !scrollDirection.current) return;
    
    if (scrollDirection.current === 'left' || scrollDirection.current === 'right') {
      // Horizontal scrolling for the ScrollArea
      if (!scrollAreaRef.current) return;
      
      const scrollContainer = scrollAreaRef.current;
      const currentScrollLeft = scrollContainer.scrollLeft;
      
      if (scrollDirection.current === 'right') {
        scrollContainer.scrollTo({
          left: currentScrollLeft + scrollSpeed.current,
          behavior: 'auto'
        });
      } else if (scrollDirection.current === 'left') {
        scrollContainer.scrollTo({
          left: currentScrollLeft - scrollSpeed.current,
          behavior: 'auto'
        });
      }
    } else if (scrollDirection.current === 'up' || scrollDirection.current === 'down') {
      // Vertical scrolling for the page
      const currentScrollTop = window.scrollY;
      
      if (scrollDirection.current === 'up') {
        window.scrollTo({
          top: Math.max(0, currentScrollTop - scrollSpeed.current),
          behavior: 'auto'
        });
      } else if (scrollDirection.current === 'down') {
        window.scrollTo({
          top: currentScrollTop + scrollSpeed.current,
          behavior: 'auto'
        });
      }
    }
  };

  // Setup auto-scroll interval when dragging starts
  useEffect(() => {
    if (isDraggingRef.current && !autoScrollIntervalRef.current) {
      autoScrollIntervalRef.current = window.setInterval(autoScroll, 16); // ~60fps
    }
    
    return () => {
      if (autoScrollIntervalRef.current) {
        window.clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [isDraggingRef.current]);

  // Update auto-scroll based on mouse position
  useEffect(() => {
    if (!isDraggingRef.current || !mousePosition || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Define scroll hotspots
    // Horizontal scroll thresholds (25% of container width on each edge)
    const horizontalScrollThreshold = containerRect.width * 0.25;
    const leftEdge = containerRect.left + horizontalScrollThreshold;
    const rightEdge = containerRect.right - horizontalScrollThreshold;
    
    // Vertical scroll thresholds (15% of viewport height on each edge)
    const verticalScrollThreshold = window.innerHeight * 0.15;
    const topEdge = verticalScrollThreshold;
    const bottomEdge = window.innerHeight - verticalScrollThreshold;
    
    // Check if dragging upward from starting point (initial Y position)
    const isDraggingUpward = dragStartPositionY.current !== null && mousePosition.y < dragStartPositionY.current;
    
    // Find all column buttons to check if we're near any
    const columnButtons = document.querySelectorAll('[data-kanban-column-button]');
    let isNearColumnButton = false;
    
    columnButtons.forEach(button => {
      if (button instanceof HTMLElement) {
        const buttonRect = button.getBoundingClientRect();
        // Extended hit area for buttons - make it easier to drop on them
        const extendedRect = {
          left: buttonRect.left - 40, // Much larger area on sides
          right: buttonRect.right + 40,
          top: buttonRect.top - 60, // Much larger area above
          bottom: buttonRect.bottom + 40
        };
        
        if (mousePosition.x >= extendedRect.left && mousePosition.x <= extendedRect.right && 
            mousePosition.y >= extendedRect.top && mousePosition.y <= extendedRect.bottom) {
          isNearColumnButton = true;
          // Highlight the button with stronger visual feedback
          button.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'scale-110');
          setDragOverButtonId(button.getAttribute('data-kanban-column-button') || null);
        } else {
          button.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'scale-110');
        }
      }
    });
    
    if (!isNearColumnButton) {
      setDragOverButtonId(null);
    }
    
    // Reset all scrolling directions first
    scrolling.current = false;
    scrollDirection.current = null;
    
    // Prioritize scrolling up when near buttons at the top
    // or when explicitly dragging upward
    if (mousePosition.y < topEdge || (isDraggingUpward && isNearColumnButton)) {
      scrollDirection.current = 'up';
      scrollSpeed.current = Math.min(20, (topEdge - mousePosition.y) / 8 + 8);
      scrolling.current = true;
      return; // Exit early to prevent competing scroll directions
    }
    
    // Check horizontal edges for scrolling
    if (mousePosition.x < leftEdge) {
      const distance = leftEdge - mousePosition.x;
      scrollDirection.current = 'left';
      scrollSpeed.current = Math.min(20, distance / 10 + 5); 
      scrolling.current = true;
    } else if (mousePosition.x > rightEdge) {
      const distance = mousePosition.x - rightEdge;
      scrollDirection.current = 'right';
      scrollSpeed.current = Math.min(20, distance / 10 + 5);
      scrolling.current = true;
    }
    // Only allow bottom scrolling if NOT dragging upward and NOT near column buttons
    else if (mousePosition.y > bottomEdge && !isDraggingUpward && !isNearColumnButton) {
      const distance = mousePosition.y - bottomEdge;
      scrollDirection.current = 'down';
      scrollSpeed.current = Math.min(15, distance / 10 + 5);
      scrolling.current = true;
    } else {
      scrolling.current = false;
      scrollDirection.current = null;
    }
  }, [mousePosition, isDraggingRef.current]);

  // Handle drag start event
  const handleDragStart = (initial: DragStart) => {
    console.log("Drag started", initial);
    isDraggingRef.current = true;
    setDragOverButtonId(null); // Reset drag over state
    
    // Save the record ID of the dragged item
    const draggedId = initial.draggableId;
    
    // Find the record by ID
    let draggedRecord: ObjectRecord | undefined;
    Object.values(groupedRecords).forEach(records => {
      const found = records.find(r => r.id === draggedId);
      if (found) draggedRecord = found;
    });
    
    // Store initial Y position through event handlers
    const handleInitialPosition = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
        dragStartPositionY.current = e.touches[0].clientY;
        setMousePosition({ 
          x: e.touches[0].clientX, 
          y: e.touches[0].clientY 
        });
      } else if ('clientY' in e) {
        dragStartPositionY.current = e.clientY;
        setMousePosition({ 
          x: e.clientX, 
          y: e.clientY 
        });
      }
      
      // Save dragged element reference
      const draggedElement = document.querySelector(`[data-rbd-draggable-id="${draggedId}"]`);
      if (draggedElement instanceof HTMLElement) {
        draggedItemRef.current = draggedElement;
        
        // Apply styles to make drag and drop more touch-friendly
        draggedElement.style.touchAction = 'none';
        draggedElement.style.webkitUserSelect = 'none';
        draggedElement.style.userSelect = 'none';
        draggedElement.style.zIndex = '100';
        
        // Create ghost element for persistent visibility
        if (draggedRecord) {
          setDraggedElement({
            id: draggedId,
            element: <KanbanCard record={draggedRecord} objectTypeId={objectTypeId} isDragging={true} className="shadow-xl border-primary" />,
            position: mousePosition
          });
        }
      }
      
      // Only need this once
      window.removeEventListener('mousedown', handleInitialPosition);
      window.removeEventListener('touchstart', handleInitialPosition);
    };
    
    // Add these listeners to capture the initial position
    window.addEventListener('mousedown', handleInitialPosition);
    window.addEventListener('touchstart', handleInitialPosition, { passive: false });
    
    // Make buttons more visible during dragging
    document.querySelectorAll('[data-kanban-column-button]').forEach((button) => {
      if (button instanceof HTMLElement) {
        button.style.zIndex = '50';
        button.style.transform = 'scale(1.05)';
      }
    });

    // Disable body scrolling during drag
    document.body.style.overflow = 'hidden';
    if (pageRef.current) {
      pageRef.current.style.overflow = 'hidden';
    }
  };

  // Handle drag update to detect if we need to auto-scroll
  const handleDragUpdate = (update: DragUpdate) => {
    // Everything is already handled in the useEffect that watches mousePosition
    console.log("Drag update position:", mousePosition);
  };

  // Handle drag end - update record with new status
  const handleDragEnd = async (result: DropResult) => {
    console.log("Drag ended", result);
    
    // Reset drag-related refs
    isDraggingRef.current = false;
    scrolling.current = false;
    scrollDirection.current = null;
    dragStartPositionY.current = null;
    draggedItemRef.current = null;
    setDragOverButtonId(null);
    setMousePosition(null);
    setDraggedElement({id: '', element: null, position: null});
    
    // Reset button styles
    document.querySelectorAll('[data-kanban-column-button]').forEach((button) => {
      if (button instanceof HTMLElement) {
        button.style.zIndex = '';
        button.style.transform = '';
        button.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'scale-110');
      }
    });
    
    // Re-enable scrolling
    document.body.style.overflow = '';
    if (pageRef.current) {
      pageRef.current.style.overflow = '';
    }
    
    if (!result.destination || !selectedFieldApiName || !onUpdateRecord) return;
    
    const { draggableId, destination } = result;
    const recordId = draggableId;
    const newValue = destination.droppableId === "none" ? null : destination.droppableId;
    
    // Update record
    try {
      // Call the update function
      await updateRecord.mutateAsync({
        id: recordId,
        field_values: {
          [selectedFieldApiName]: newValue
        }
      });

      // When on mobile, activate the destination column
      if (isMobile) {
        setActiveColumn(destination.droppableId);
        toggleColumnExpansion(destination.droppableId, true);
      }
    } catch (error) {
      console.error("Error updating record:", error);
    }
  };

  // Function to get the display label for a column value
  const getColumnLabel = (columnValue: string) => {
    if (columnValue === "none") return "Not assigned";
    
    // Find the matching picklist value for this column
    const picklistOption = picklistValues?.find(pv => pv.value === columnValue);
    return picklistOption?.label || columnValue;
  };

  // Calculate total records across all columns
  const totalRecords = Object.values(groupedRecords).reduce(
    (total, records) => total + records.length, 
    0
  );

  // Helper function to scroll container to a column
  const scrollToColumn = (columnId: string) => {
    if (!scrollAreaRef.current) return;
    
    const columnElement = document.getElementById(`kanban-column-${columnId}`);
    if (columnElement) {
      const containerLeft = scrollAreaRef.current.getBoundingClientRect().left;
      const columnLeft = columnElement.getBoundingClientRect().left;
      const offset = columnLeft - containerLeft - 16; // 16px padding
      
      scrollAreaRef.current.scrollTo({
        left: scrollAreaRef.current.scrollLeft + offset,
        behavior: 'smooth'
      });
    }
  };

  // Handler for when a droppable button is dragged over
  const handleDragEnterButton = (columnId: string) => {
    setDragOverButtonId(columnId);
  };
  
  // Handler for when drag leaves a droppable button
  const handleDragLeaveButton = () => {
    setDragOverButtonId(null);
  };

  if (isLoadingPicklistValues) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading Kanban columns...
      </div>
    );
  }

  if (picklistFields.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No picklist fields available for Kanban view. Please create a picklist field for this object.
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Ghost card that follows cursor when dragging - with improved visibility */}
      {isDraggingRef.current && draggedElement.element && mousePosition && (
        <div 
          className="fixed pointer-events-none z-[9999]"
          style={{
            top: mousePosition.y - 30, // Offset slightly above finger/cursor
            left: mousePosition.x - 100, // Center horizontally
            width: '220px',
            opacity: 0.95,
            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))'
          }}
        >
          {draggedElement.element}
        </div>
      )}
      
      <div className="flex items-center space-x-4 mb-4">
        <div className="grid gap-2 w-64">
          <Label htmlFor="kanban-field">Group by</Label>
          <Select
            value={selectedFieldApiName}
            onValueChange={(value) => {
              setSelectedFieldApiName(value);
              setActiveColumn(null); // Reset active column when changing field
            }}
          >
            <SelectTrigger id="kanban-field">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {picklistFields.map((field) => (
                <SelectItem key={field.id} value={field.api_name}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board - Desktop view (horizontal columns) */}
      {!isMobile && (
        <DragDropContext 
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
            {Object.entries(groupedRecords).map(([columnValue, columnRecords]) => {
              const columnLabel = getColumnLabel(columnValue);
              
              return (
                <div key={columnValue} className="flex flex-col min-w-[250px]">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <h3 className="font-medium text-sm">{columnLabel}</h3>
                    <span className="text-xs text-muted-foreground">{columnRecords.length}</span>
                  </div>
                  <Droppable droppableId={columnValue}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 rounded-md min-h-[200px] flex flex-col gap-2 ${snapshot.isDraggingOver ? 'bg-muted/80' : 'bg-muted/40'}`}
                      >
                        {columnRecords.map((record, index) => (
                          <Draggable key={record.id} draggableId={record.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                data-rbd-draggable-id={record.id}
                              >
                                <KanbanCard 
                                  record={record} 
                                  objectTypeId={objectTypeId} 
                                  isDragging={snapshot.isDragging}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {columnRecords.length === 0 && (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No records
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Mobile view - Horizontal scrollable Kanban board with droppable buttons */}
      {isMobile && (
        <div className="mb-4">
          <DragDropContext 
            onDragStart={handleDragStart}
            onDragUpdate={handleDragUpdate}
            onDragEnd={handleDragEnd}
          >
            {/* Status buttons row - improved droppable targets */}
            <div className="flex flex-wrap gap-2 mb-3 sticky top-0 z-10 pb-2 pt-1 bg-background">
              {Object.entries(groupedRecords).map(([columnValue, columnRecords]) => {
                const columnLabel = getColumnLabel(columnValue);
                const isActive = activeColumn === columnValue;
                const isDraggedOver = dragOverButtonId === columnValue;
                
                return (
                  <Droppable 
                    droppableId={columnValue} 
                    key={`button-${columnValue}`}
                    direction="horizontal"
                    isDropDisabled={false}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="relative"
                        onMouseEnter={() => handleDragEnterButton(columnValue)}
                        onMouseLeave={handleDragLeaveButton}
                        data-column={columnValue}
                      >
                        <Button
                          variant={isActive ? "default" : isDraggedOver ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            setActiveColumn(columnValue);
                            toggleColumnExpansion(columnValue, true);
                            scrollToColumn(columnValue);
                          }}
                          className={`flex items-center gap-1 transition-all relative 
                            ${isDraggedOver ? 'ring-4 ring-primary ring-offset-1 z-50 scale-110' : ''} 
                            ${snapshot.isDraggingOver ? 'bg-primary text-primary-foreground scale-110' : ''}
                          `}
                          data-kanban-column-button={columnValue}
                        >
                          {columnLabel} 
                          <Badge variant="outline" className="ml-1">
                            {columnRecords.length}
                          </Badge>
                        </Button>
                        
                        {/* Larger drop target area for better touch accessibility */}
                        <div 
                          className={`absolute -top-10 -left-5 -right-5 -bottom-5 ${
                            isDraggingRef.current ? 
                              'bg-primary/5 border-2 border-dashed border-primary/40 rounded-md' : 
                              'opacity-0'
                          }`}
                          style={{ 
                            height: isDraggingRef.current ? '400%' : '100%', 
                            zIndex: isDraggedOver ? 5 : -1,
                          }}
                        >
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
            
            <div className="flex items-center justify-center space-x-2 mb-3 text-xs text-muted-foreground">
              <MoveVertical className="h-4 w-4" />
              <span>Drag cards to buttons above or columns below to change status</span>
            </div>
            
            {/* Scrollable columns */}
            <ScrollArea 
              className="w-full pb-6 touch-pan-y" 
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div 
                ref={(el) => { scrollAreaRef.current = el as HTMLDivElement; }}  
                className="flex gap-3 min-w-full px-1 pb-4" 
              >
                {Object.entries(groupedRecords).map(([columnValue, columnRecords]) => {
                  const columnLabel = getColumnLabel(columnValue);
                  const recordCount = columnRecords.length;
                  
                  return (
                    <div 
                      key={columnValue}
                      id={`kanban-column-${columnValue}`}
                      className="flex-shrink-0 w-[85%] max-w-[300px] min-w-[250px]"
                    >
                      <Card className="h-full border shadow-sm flex flex-col">
                        <div 
                          className={`px-3 py-2 border-b flex justify-between items-center ${
                            activeColumn === columnValue ? 'bg-primary/10' : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="font-medium text-sm mr-2">{columnLabel}</span>
                            <Badge variant="outline">{recordCount}</Badge>
                          </div>
                          <MoveHorizontal className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-grow overflow-hidden">
                          <Droppable droppableId={columnValue}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`h-full p-2 rounded-md min-h-[300px] flex flex-col gap-2 overflow-y-auto ${
                                  snapshot.isDraggingOver ? 'bg-primary/5 border-primary/20 border-dashed border-2' : ''
                                }`}
                                style={{ touchAction: isDraggingRef.current ? 'none' : 'pan-y' }}
                              >
                                {columnRecords.length === 0 ? (
                                  <div className="text-center py-8 text-sm text-muted-foreground">
                                    No records in this status
                                  </div>
                                ) : (
                                  columnRecords.map((record, index) => (
                                    <Draggable key={record.id} draggableId={record.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          style={{
                                            ...provided.draggableProps.style,
                                            touchAction: 'none', // Prevent browser touch actions
                                          }}
                                          className={snapshot.isDragging ? 'z-50' : ''}
                                          data-rbd-draggable-id={record.id}
                                        >
                                          <KanbanCard
                                            record={record}
                                            objectTypeId={objectTypeId}
                                            isDragging={snapshot.isDragging}
                                          />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DragDropContext>
          
          <div className="flex items-center justify-center mt-3 text-xs text-muted-foreground">
            <MoveHorizontal className="h-4 w-4 mr-2" />
            <span>Drag cards between columns to change status</span>
          </div>
        </div>
      )}
    </div>
  );
}
