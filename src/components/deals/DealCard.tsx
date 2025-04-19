
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar } from "lucide-react";
import { DealType } from "@/types";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

interface DealCardProps {
  deal: DealType;
  onClick: (id: string) => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  // Calculate deal progress based on status
  const getProgressValue = () => {
    switch (deal.status) {
      case "Prospect": return 20;
      case "Qualification": return 40;
      case "Proposal": return 60;
      case "Negotiation": return 80;
      case "Closed Won": return 100;
      case "Closed Lost": return 0;
      default: return 0;
    }
  };

  // Get color based on status
  const getStatusColor = () => {
    switch (deal.status) {
      case "Closed Won": return "bg-green-500";
      case "Closed Lost": return "bg-red-500";
      default: return "bg-beauty";
    }
  };

  return (
    <Card className="h-full transition-all hover:shadow-md cursor-pointer" onClick={() => onClick(deal.id)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{deal.name}</CardTitle>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-xl font-semibold">{formatCurrency(deal.amount)}</span>
            <Badge 
              variant="outline" 
              className={deal.status === "Closed Won" ? "bg-green-100 text-green-800 border-green-300" : 
                         deal.status === "Closed Lost" ? "bg-red-100 text-red-800 border-red-300" : 
                         "bg-beauty-light text-beauty-dark border-beauty"}
            >
              {deal.status}
            </Badge>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{getProgressValue()}%</span>
            </div>
            <Progress 
              value={getProgressValue()} 
              className="h-2" 
              indicatorClassName={getStatusColor()}
            />
          </div>
          
          {deal.closeDate && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Closes: {new Date(deal.closeDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 border-t mt-2">
        <div className="text-sm text-muted-foreground w-full pt-2">
          {deal.accountName && (
            <div className="flex justify-between">
              <span>Account:</span>
              <span className="font-medium">{deal.accountName}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
