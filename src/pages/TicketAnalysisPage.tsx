
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, ArrowLeft, BarChart2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { getQueueTickets, analyzeTickets, TicketData } from "@/utils/ticketAnalysis";
import { Badge } from "@/components/ui/badge";

export default function TicketAnalysisPage() {
  const { ticketCount } = useParams<{ ticketCount?: string }>();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<{
    summary: string;
    patterns: string[];
    prioritizedPlan: { priority: string; description: string }[];
    recommendations: string[];
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAndAnalyzeTickets() {
      setIsLoading(true);
      try {
        const limit = ticketCount ? parseInt(ticketCount) : undefined;
        const fetchedTickets = await getQueueTickets(limit);
        setTickets(fetchedTickets);
        
        if (fetchedTickets.length > 0) {
          const ticketAnalysis = analyzeTickets(fetchedTickets);
          setAnalysis(ticketAnalysis);
        } else {
          toast.info("No tickets found in queue");
        }
      } catch (error) {
        console.error("Error analyzing tickets:", error);
        toast.error("Failed to analyze tickets");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAndAnalyzeTickets();
  }, [ticketCount]);
  
  const handleGoBackToQueue = () => {
    navigate('/ticket-queue');
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return "bg-red-500 text-white";
      case 'medium': return "bg-yellow-500 text-white";
      case 'low': return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Analyzing tickets...</span>
        </div>
      </div>
    );
  }

  if (!analysis || tickets.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader
          title="Ticket Analysis"
          description="No tickets available to analyze"
        />
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <p className="mb-4">There are no tickets in the queue with AI Status "Warteschlange".</p>
            <Button onClick={handleGoBackToQueue}>View Queue</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <PageHeader
        title="Next! Implementation Plan" 
        description={`Analysis of ${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} in queue`}
        actions={
          <Button variant="outline" onClick={handleGoBackToQueue}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Queue
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Implementation Plan Summary
            </CardTitle>
            <CardDescription>
              Based on the analysis of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} with status "Warteschlange"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Analyzed Tickets</h3>
                <div className="space-y-2">
                  {tickets.map((ticket, index) => (
                    <div key={ticket.id} className="p-3 bg-muted rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{ticket.displayName}</p>
                          {ticket.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-md">
                              {ticket.description.length > 100 
                                ? `${ticket.description.substring(0, 100)}...` 
                                : ticket.description}
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/objects/${ticket.object_type_id}/${ticket.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Identified Patterns</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {analysis.patterns.map((pattern, index) => (
                    <li key={index}>{pattern}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Prioritized Action Plan</h3>
                <div className="space-y-2">
                  {analysis.prioritizedPlan.map((plan, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge className={getPriorityColor(plan.priority)}>
                        {plan.priority}
                      </Badge>
                      <span>{plan.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={handleGoBackToQueue}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Queue
                  </Button>
                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/process-ticket')}>
                      <Clock className="h-4 w-4 mr-2" />
                      Process Manually
                    </Button>
                    <Button 
                      variant="success"
                      onClick={() => navigate('/auto-process-ticket')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Auto Process
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
