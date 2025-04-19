
import { Card } from "@/components/ui/card";
import { Account } from "@/lib/types/database";
import { AccountCardHeader } from "./AccountCardHeader";
import { AccountCardContent } from "./AccountCardContent";
import { useNavigate } from "react-router-dom";

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="h-full transition-all hover:shadow-md cursor-pointer" 
      onClick={() => navigate(`/accounts/${account.id}`)}
    >
      <AccountCardHeader name={account.name} />
      <AccountCardContent 
        type={account.type} 
        contactCount={account.contactCount || 0} 
      />
    </Card>
  );
}
