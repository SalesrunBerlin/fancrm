
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { Skeleton } from "@/components/ui/skeleton";

export function SprintAnalysis() {
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const { record, isLoading } = useRecordDetail(objectTypeId, recordId);
  const [tickets, setTickets] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Fetch tickets related to this sprint
  const { records: ticketRecords, isLoading: isLoadingTickets } = 
    useObjectRecords("tickets", { filter: `sprint_id=${recordId}` });
    
  useEffect(() => {
    if (ticketRecords && !isLoadingTickets) {
      setTickets(ticketRecords);
    }
  }, [ticketRecords, isLoadingTickets]);

  useEffect(() => {
    if (tickets.length > 0 && !isAnalyzing) {
      generateAnalysis();
    }
  }, [tickets]);

  const generateAnalysis = () => {
    setIsAnalyzing(true);
    // In a real app, you might call an API to analyze the tickets
    // For now, we'll just generate a simple analysis
    setTimeout(() => {
      const analysisText = `
        ## Sprint Analysis
        
        This sprint contains ${tickets.length} tickets.
        
        ### Key Observations
        - ${tickets.length} tickets need to be addressed
        - Priority focus should be on addressing critical issues first
        - Recommend allocating resources based on complexity
        
        ### Action Plan
        1. Categorize tickets by priority
        2. Assign resources based on expertise
        3. Schedule daily check-ins to track progress
        4. Address blockers immediately
        
        ### Expected Outcomes
        - Improved sprint velocity
        - Better resource utilization
        - Higher quality deliverables
      `;
      
      setAnalysis(analysisText);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sprint Ticket Analysis</CardTitle>
          <CardDescription>
            Analyzing {tickets.length} tickets for sprint: {record?.displayName || 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || isLoadingTickets || isAnalyzing ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              {analysis}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
