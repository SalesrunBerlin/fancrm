// src/pages/ObjectRecordDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useObjectType } from "@/hooks/useObjectType";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { RecordDetailForm } from "@/components/records/RecordDetailForm";
import { Link } from 'react-router-dom';
import { ThemedButton } from '@/components/ui/themed-button';

export default function ObjectRecordDetail() {
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const { objectType, isLoading: isLoadingObjectType } = useObjectType(objectTypeId || "");
  const { record, isLoading: isLoadingRecord } = useRecordDetail(objectTypeId || "", recordId || "");

  useEffect(() => {
    if (!objectTypeId || !recordId) {
      toast.error("Object Type ID or Record ID is missing.");
      return;
    }
  }, [objectTypeId, recordId]);

  const handleSaveRecord = (updatedRecord: any) => {
    setIsEditing(false);
    toast.success("Record updated successfully!");
    // Optionally, refresh the record data here
  };

  if (isLoadingObjectType || isLoadingRecord) {
    return <div>Loading...</div>;
  }

  if (!objectType) {
    return <div>Object Type not found.</div>;
  }

  if (!record) {
    return <div>Record not found.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{objectType.name} Record</h1>
          <p className="text-gray-500">Viewing record details for {recordId}</p>
        </div>
        <div>
          {isEditing ? (
            <>
              <ThemedButton
                variant="success"
                onClick={() => {
                  // Implement save functionality here
                  handleSaveRecord(record);
                }}
                className="mr-2"
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </ThemedButton>
              <ThemedButton
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </ThemedButton>
            </>
          ) : (
            <ThemedButton
              onClick={() => setIsEditing(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </ThemedButton>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {/* Add more tabs here if needed */}
        </TabsList>
        <TabsContent value="details">
          <Card>
            <CardContent className="p-0">
              <RecordDetailForm
                objectTypeId={objectTypeId}
                recordId={recordId}
                isEditMode={isEditing}
                onSave={handleSaveRecord}
                onCancel={() => setIsEditing(false)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        {/* Add more TabsContent here if needed */}
      </Tabs>
    </div>
  );
}
