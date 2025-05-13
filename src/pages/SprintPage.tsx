
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSprint } from '@/hooks/useSprint';
import { useTicketAnalysis } from '@/hooks/useTicketAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  List, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileText, 
  ArrowRight,
  ThumbsUp
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { TicketRecord } from '@/lib/types/records';

export default function SprintPage() {
  const { sprintId } = useParams<{ sprintId: string }>();
  const { sprint, tickets, isLoading, error } = useSprint(sprintId);
  const { generateResolutionPlan, currentPlan, isAnalyzing, clearPlan } = useTicketAnalysis();
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !sprint) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        <h2 className="font-medium text-lg">Error Loading Sprint</h2>
        <p>{error instanceof Error ? error.message : "Failed to load sprint data"}</p>
      </div>
    );
  }

  // Calculate sprint statistics
  const completedTickets = tickets.filter(t => t.status === 'completed' || t.status === 'done').length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'to-do' || t.status === 'in-progress').length;
  const blockedTickets = tickets.filter(t => t.status === 'blocked').length;
  const progressPercentage = tickets.length > 0 ? (completedTickets / tickets.length) * 100 : 0;

  const handleAnalyzeTicket = async (ticket: TicketRecord) => {
    setSelectedTicket(ticket);
    await generateResolutionPlan(ticket);
  };

  const getStatusBadgeVariant = (status: string) => {
    status = status.toLowerCase();
    if (status === 'completed' || status === 'done') return 'success';
    if (status === 'in-progress') return 'warning';
    if (status === 'blocked') return 'destructive';
    return 'outline';
  };

  const getPriorityBadgeVariant = (priority: string) => {
    priority = priority.toLowerCase();
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'warning';
    if (priority === 'low') return 'outline';
    return 'secondary';
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader
        title={sprint.name}
        description={sprint.description || "No description provided"}
        actions={
          <>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
            </Badge>
            <Badge variant={sprint.status === 'active' ? 'default' : 'secondary'}>
              {sprint.status}
            </Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sprint statistics */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <List className="h-5 w-5" />
                Sprint Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress className="mt-2" value={progressPercentage} />
              </div>
              
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Completed</span>
                  </div>
                  <Badge variant="outline" className="bg-green-100">{completedTickets}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>Open</span>
                  </div>
                  <Badge variant="outline" className="bg-amber-100">{openTickets}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>Blocked</span>
                  </div>
                  <Badge variant="outline" className="bg-red-100">{blockedTickets}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Total tickets</span>
                  </div>
                  <Badge variant="outline">{tickets.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Sprint Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tickets found for this sprint
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      className={`border rounded-md p-4 hover:bg-muted/20 transition-colors cursor-pointer ${selectedTicket?.id === ticket.id ? 'ring-1 ring-primary' : ''}`}
                      onClick={() => handleAnalyzeTicket(ticket)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{ticket.topic}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {ticket.description || "No description provided"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resolution plan */}
        {(selectedTicket || isAnalyzing) && (
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing ticket...
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="h-5 w-5" />
                      Resolution Plan
                    </>
                  )}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={clearPlan}>Close</Button>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="min-h-[300px] flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p>Analyzing ticket and generating resolution plan...</p>
                    </div>
                  </div>
                ) : currentPlan ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg">{currentPlan.ticket.topic}</h3>
                      <p className="text-muted-foreground mt-1">{currentPlan.ticket.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Resolution Steps</h4>
                      <div className="space-y-2">
                        {currentPlan.steps.map((step, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="bg-primary/10 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-medium">{step.order}</span>
                            </div>
                            <div>
                              <p>{step.description}</p>
                              {step.estimatedTime && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {step.estimatedTime}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Dependencies</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          {currentPlan.dependencies.map((dep, index) => (
                            <li key={index}>{dep}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Potential Risks</h4>
                        <div className="space-y-3">
                          {currentPlan.risks.map((risk, index) => (
                            <div key={index} className="space-y-1">
                              <p className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                                <span>{risk.description}</span>
                              </p>
                              {risk.mitigation && (
                                <p className="ml-6 text-sm text-muted-foreground flex items-center gap-1">
                                  <ArrowRight className="h-3 w-3" /> 
                                  {risk.mitigation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
