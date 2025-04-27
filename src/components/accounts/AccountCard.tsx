
import { Card } from "@/components/ui/card";
import { Account } from "@/lib/types/database";
import { AccountCardHeader } from "./AccountCardHeader";
import { AccountCardContent } from "./AccountCardContent";

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  return (
    <Card 
      className="h-full transition-all hover:shadow-md cursor-pointer" 
      onClick={onClick}
    >
      <AccountCardHeader name={account.name} />
      <AccountCardContent 
        type={account.type} 
        contactCount={account.contactCount || 0} 
      />
    </Card>
  );
}
