
import { CardContent } from "@/components/ui/card";
import { Building, Users } from "lucide-react";

interface AccountCardContentProps {
  type: string | null;
  contactCount: number;
}

export function AccountCardContent({ type, contactCount }: AccountCardContentProps) {
  return (
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Building className="h-4 w-4 mr-2" />
          <span className="truncate">{type || "Business"}</span>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-2" />
          <span>{contactCount || 0} Contacts</span>
        </div>
      </div>
    </CardContent>
  );
}
