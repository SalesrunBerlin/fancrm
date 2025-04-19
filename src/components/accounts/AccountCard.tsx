
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Edit } from "lucide-react";
import { AccountType } from "@/types";

interface AccountCardProps {
  account: AccountType;
  onClick: (id: string) => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  return (
    <Card className="h-full transition-all hover:shadow-md cursor-pointer" onClick={() => onClick(account.id)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{account.name}</CardTitle>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Building className="h-4 w-4 mr-2" />
            <span className="truncate">{account.type || "Business"}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <span>{account.contactCount || 0} Contacts</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {account.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
