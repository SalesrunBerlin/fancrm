
import { Account } from "@/lib/types/database";
import { AccountCard } from "./AccountCard";
import { AccountsTable } from "./AccountsTable";
import { useNavigate } from "react-router-dom";

interface AccountsContentProps {
  accounts: Account[];
  viewMode: "grid" | "table";
}

export function AccountsContent({ accounts, viewMode }: AccountsContentProps) {
  const navigate = useNavigate();
  
  const handleAccountClick = (id: string) => {
    navigate(`/accounts/${id}`);
  };
  
  if (viewMode === "grid") {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard 
            key={account.id} 
            account={account}
            onClick={() => handleAccountClick(account.id)}
          />
        ))}
      </div>
    );
  }
  
  return <AccountsTable accounts={accounts} />;
}
