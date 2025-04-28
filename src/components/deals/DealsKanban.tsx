
// Import the necessary components and hooks
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Deal } from "@/types";

interface DealsKanbanProps {
  deals: Deal[];
  isLoading: boolean;
  groupByField: string;
  onDealClick: (id: string) => void;
}

export function DealsKanban({ deals, isLoading, groupByField, onDealClick }: DealsKanbanProps) {
  // Group deals by the specified field (e.g. status)
  const [grouped, setGrouped] = useState<Record<string, Deal[]>>(() => {
    return deals.reduce((acc: Record<string, Deal[]>, deal) => {
      const groupKey = deal[groupByField as keyof Deal]?.toString() || 'Unknown';
      
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      
      acc[groupKey].push(deal);
      return acc;
    }, {});
  });

  // Function to handle the end of a drag operation
  const onDragEnd = (result: any) => {
    // Implement drag-and-drop logic here if needed
    console.log('Drag ended', result);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If there are no deals, show a message
  if (deals.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Keine Deals gefunden.</p>
        </CardContent>
      </Card>
    );
  }

  // Get all unique group values and sort them
  const groupKeys = Object.keys(grouped).sort((a, b) => {
    // Add custom sorting logic if needed
    return a.localeCompare(b);
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groupKeys.map((groupKey) => (
          <Card key={groupKey} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                {groupKey}
                <Badge variant="outline">{grouped[groupKey].length}</Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0 flex-grow">
              <Droppable droppableId={groupKey}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 min-h-[100px]"
                  >
                    {grouped[groupKey]
                      .sort((a, b) => {
                        return a.name.localeCompare(b.name);
                      })
                      .map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onDealClick(deal.id)}
                              className="p-3 bg-card border rounded-md cursor-pointer hover:border-primary transition-colors"
                            >
                              <h3 className="font-medium">{deal.name}</h3>
                              {deal.accountName && (
                                <p className="text-sm text-muted-foreground mt-1">{deal.accountName}</p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <div className="text-sm font-medium">
                                  {deal.amount ? `${deal.amount} €` : 'Kein Betrag'}
                                </div>
                                <Link to={`/deals/${deal.id}`} className="text-xs text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>
                                  Details
                                </Link>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
        ))}
      </div>
    </DragDropContext>
  );
}
