
import { Account } from "@/lib/types/database";
import { AccountCard } from "./AccountCard";
import { AccountsTable } from "./AccountsTable";

interface AccountsContentProps {
  accounts: Account[];
  viewMode: "grid" | "table";
  onAccountClick: (id: string) => void;
}

export function AccountsContent({ accounts, viewMode, onAccountClick }: AccountsContentProps) {
  if (viewMode === "grid") {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard 
            key={account.id} 
            account={account} 
            onClick={onAccountClick}
          />
        ))}
      </div>
    );
  }
  
  return <AccountsTable accounts={accounts} onAccountClick={onAccountClick} />;
}
