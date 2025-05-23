
import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from "@/components/ui/page-header";
import { SprintAnalysis } from "@/components/sprint/SprintAnalysis";

export default function SprintAnalysisPage() {
  const { objectTypeId, recordId } = useParams();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        heading="Sprint Analysis" 
        description="Analysis of sprint tickets and proposed solutions" 
        backTo={`/objects/${objectTypeId}/${recordId}`}
      />
      
      <SprintAnalysis />
    </div>
  );
}
