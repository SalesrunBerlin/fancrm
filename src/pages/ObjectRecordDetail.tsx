
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useObjectType } from "@/hooks/useObjectType";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { RecordDetailForm } from "@/components/records/RecordDetailForm";
import { ObjectActionsSection } from "@/components/actions/ObjectActionsSection";
import { RelatedRecordsList } from "@/components/records/RelatedRecordsList";
import { ThemedButton } from '@/components/ui/themed-button';
import { PageHeader } from '@/components/ui/page-header';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { TicketProcessor } from '@/components/tickets/TicketProcessor';
import { LayoutSelector } from "@/components/records/LayoutSelector";

export default function ObjectRecordDetail() {
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const { objectType, isLoading: isLoadingObjectType } = useObjectType(objectTypeId || "");
  const { record, isLoading: isLoadingRecord } = useRecordDetail(objectTypeId || "", recordId || "");
  const [isTicket, setIsTicket] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!objectTypeId || !recordId) {
      toast.error("Object Type ID or Record ID is missing.");
      return;
    }
  }, [objectTypeId, recordId]);

  // Check if this is a ticket object and get AI status if available
  useEffect(() => {
    if (objectType && record) {
      // Check if this is the Ticket object type
      setIsTicket(objectType.name === "Ticket");
      
      // Get AI status if available
      if (record.field_values && record.field_values.ai_status) {
        setAiStatus(record.field_values.ai_status);
      }
    }
  }, [objectType, record]);

  const handleSaveRecord = (updatedRecord: any) => {
    setIsEditing(false);
    toast.success("Record updated successfully!");
    // Optionally, refresh the record data here
  };

  const handleStatusChange = (newStatus: string) => {
    setAiStatus(newStatus);
  };

  const handleLayoutChange = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
  };

  if (isLoadingObjectType || isLoadingRecord) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!objectType) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold">Object Type not found</h2>
          <p className="mt-2 text-muted-foreground">The requested object type could not be found.</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold">Record not found</h2>
          <p className="mt-2 text-muted-foreground">The requested record could not be found.</p>
        </div>
      </div>
    );
  }

  // Get the record's display name, which comes from the default field
  const recordTitle = record.displayName || record.id;

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{recordTitle}</h1>
            <p className="text-gray-500">{objectType.name}</p>
            {isTicket && aiStatus && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  AI Status: {aiStatus}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Layout Selector */}
            <LayoutSelector
              objectTypeId={objectTypeId || ""}
              selectedLayoutId={selectedLayoutId}
              onLayoutChange={handleLayoutChange}
            />
            
            {isEditing ? (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ThemedButton
                        variant="success"
                        onClick={() => {
                          handleSaveRecord(record);
                        }}
                        className="mr-2"
                        size="icon"
                      >
                        <Save className="h-4 w-4" />
                      </ThemedButton>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Save changes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ThemedButton
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        size="icon"
                      >
                        <X className="h-4 w-4" />
                      </ThemedButton>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Cancel editing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ThemedButton
                      onClick={() => setIsEditing(true)}
                      size="icon"
                    >
                      <Edit className="h-4 w-4" />
                    </ThemedButton>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Edit record</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Action buttons section - now with flex-wrap to display side by side */}
        <div className="mb-6">
          <ObjectActionsSection 
            objectTypeId={objectTypeId || ""} 
            objectTypeName={objectType.name}
            recordId={recordId || ""}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
          {isTicket && aiStatus === "Warteschlange" && (
            <TabsTrigger value="process">Process Ticket</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="details">
          <Card>
            <CardContent className="p-0">
              <RecordDetailForm
                objectTypeId={objectTypeId || ""}
                recordId={recordId || ""}
                isEditMode={isEditing}
                onSave={handleSaveRecord}
                onCancel={() => setIsEditing(false)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="related">
          <Card>
            <CardContent className="p-4">
              <RelatedRecordsList
                objectTypeId={objectTypeId || ""}
                recordId={recordId || ""}
              />
            </CardContent>
          </Card>
        </TabsContent>
        {isTicket && aiStatus === "Warteschlange" && (
          <TabsContent value="process">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-4">
                  <TicketProcessor
                    objectTypeId={objectTypeId || ""}
                    recordId={recordId || ""}
                    onStatusChange={handleStatusChange}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
