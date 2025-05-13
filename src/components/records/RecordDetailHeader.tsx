
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface RecordDetailHeaderProps {
  displayName: string | null;
  objectName: string;
  isLoading: boolean;
}

export function RecordDetailHeader({ displayName, objectName, isLoading }: RecordDetailHeaderProps) {
  const navigate = useNavigate();
  const { objectTypeId, recordId } = useParams();
  
  const isSprintObject = objectName.toLowerCase().includes('sprint');
  
  const navigateToAnalysis = () => {
    navigate(`/objects/${objectTypeId}/${recordId}/analysis`);
  };
  
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h1 className="text-2xl font-bold">
          {isLoading ? 'Loading...' : displayName || 'Unnamed Record'}
        </h1>
        <p className="text-gray-500">{objectName}</p>
      </div>
      
      {isSprintObject && (
        <Button 
          onClick={navigateToAnalysis}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileText size={16} />
          Analyze Sprint Tickets
        </Button>
      )}
    </div>
  );
}
