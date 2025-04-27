import { Account } from "@/lib/types/database";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface AccountsTableProps {
  accounts: Account[];
}

export function AccountsTable({ accounts }: AccountsTableProps) {
  const navigate = useNavigate();

  const handleAccountClick = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Navigating to account:", id);
    navigate(`/accounts/${id}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Contacts</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow 
              key={account.id} 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={(e) => handleAccountClick(account.id, e)}
            >
              <TableCell className="font-medium">{account.name}</TableCell>
              <TableCell>{account.type || "Business"}</TableCell>
              <TableCell>{account.contactCount || 0}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {account.tags?.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {accounts.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                Keine Accounts gefunden
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
