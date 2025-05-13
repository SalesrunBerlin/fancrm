
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useRelatedRecords } from "@/hooks/useRelatedRecords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SprintAnalysisProps {
  objectTypeId?: string;
  recordId?: string;
}

export function SprintAnalysis({ objectTypeId, recordId }: SprintAnalysisProps) {
  const params = useParams();
  const actualObjectTypeId = objectTypeId || params.objectTypeId;
  const actualRecordId = recordId || params.recordId;
  
  const [solutionPlan, setSolutionPlan] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch Sprint details
  const { record: sprintRecord, isLoading: isLoadingSprintDetails, refetch: refetchSprintDetails } = 
    useRecordDetail(actualObjectTypeId, actualRecordId);

  // Fetch related ticket records
  const { data: relatedSections, isLoading: isLoadingRelated } = 
    useRelatedRecords(actualObjectTypeId!, actualRecordId!);
  
  // Find the tickets section
  const ticketsSection = relatedSections?.find(section => 
    section.objectType.name.toLowerCase().includes('ticket'));
  
  const generateSolutionPlan = () => {
    if (!ticketsSection || ticketsSection.records.length === 0) {
      toast({
        title: "No tickets found",
        description: "This Sprint doesn't have any associated tickets to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // For demonstration, generate a simple solution plan based on tickets
    setTimeout(() => {
      const tickets = ticketsSection.records;
      let plan = `# Solution Plan for Sprint: ${sprintRecord?.fieldValues?.name || 'Unknown Sprint'}\n\n`;
      
      plan += `## Overview\nThis sprint contains ${tickets.length} tickets that need to be addressed.\n\n`;
      
      plan += `## Ticket Analysis\n`;
      tickets.forEach((ticket, index) => {
        const topic = ticket.field_values?.topic || 'Untitled';
        const description = ticket.field_values?.description || 'No description provided';
        const priority = ticket.field_values?.priority || 'Not set';
        
        plan += `### ${index + 1}. ${topic}\n`;
        plan += `**Priority:** ${priority}\n\n`;
        plan += `**Description:** ${description}\n\n`;
        plan += `**Proposed Solution:** ${generateTicketSolution(description)}\n\n`;
      });
      
      plan += `## Implementation Timeline\n`;
      plan += `1. Start with high-priority tickets\n`;
      plan += `2. Address dependencies between tickets\n`;
      plan += `3. Allocate resources based on ticket complexity\n\n`;
      
      plan += `## Resources Required\n`;
      plan += `- Frontend developers: ${Math.ceil(tickets.length * 0.3)}\n`;
      plan += `- Backend developers: ${Math.ceil(tickets.length * 0.4)}\n`;
      plan += `- QA engineers: ${Math.ceil(tickets.length * 0.2)}\n`;
      
      setSolutionPlan(plan);
      setIsGenerating(false);
    }, 1500);
  };
  
  // Helper function to generate a simple solution for a ticket
  const generateTicketSolution = (description: string) => {
    if (!description) return "Insufficient information to propose a solution.";
    
    // Simple solution generator based on keywords in description
    if (description.toLowerCase().includes('bug')) {
      return "Debug the issue, identify root cause, and apply a fix. Add appropriate test cases to prevent regression.";
    } else if (description.toLowerCase().includes('feature')) {
      return "Design and implement the feature according to specifications. Create unit and integration tests.";
    } else if (description.toLowerCase().includes('improvement')) {
      return "Analyze current implementation, identify optimization points, and implement improvements.";
    } else if (description.toLowerCase().includes('performance')) {
      return "Profile the application, identify bottlenecks, and optimize the relevant components.";
    } else {
      return "Analyze requirements, design a solution, implement, and test thoroughly.";
    }
  };
  
  if (isLoadingSprintDetails || isLoadingRelated) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sprint Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Sprint Analysis: {sprintRecord?.fieldValues?.name || 'Loading...'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            {ticketsSection?.records?.length || 0} tickets associated with this Sprint
          </p>
          
          <Button 
            onClick={generateSolutionPlan} 
            disabled={isGenerating || !ticketsSection?.records?.length}
          >
            {isGenerating ? 'Generating Plan...' : 'Generate Solution Plan'}
          </Button>
        </div>

        {/* Ticket list */}
        {ticketsSection?.records?.length > 0 ? (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Associated Tickets</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ticketsSection.records.map((ticket) => (
                <div key={ticket.id} className="border rounded p-2">
                  <p className="font-medium">
                    {ticket.field_values?.topic || 'Untitled Ticket'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Priority: {ticket.field_values?.priority || 'Not set'}
                  </p>
                  <p className="text-sm truncate">
                    {ticket.field_values?.description?.substring(0, 100) || 'No description'} 
                    {ticket.field_values?.description?.length > 100 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No tickets associated with this Sprint</p>
        )}

        {/* Solution Plan */}
        {solutionPlan && (
          <div>
            <h3 className="text-lg font-medium mb-2">Solution Plan</h3>
            <ScrollArea className="h-96 border rounded p-3">
              <div className="whitespace-pre-line">
                {solutionPlan}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
