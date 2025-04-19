
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface AccountCardHeaderProps {
  name: string;
}

export function AccountCardHeader({ name }: AccountCardHeaderProps) {
  return (
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg font-medium">{name}</CardTitle>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
  );
}
