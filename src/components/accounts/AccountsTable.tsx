
import { Account } from "@/lib/types/database";

interface AccountsTableProps {
  accounts: Account[];
  onAccountClick: (id: string) => void;
}

export function AccountsTable({ accounts, onAccountClick }: AccountsTableProps) {
  return (
    <div className="crm-table-wrapper">
      <table className="crm-table">
        <thead className="crm-table-header">
          <tr className="crm-table-row">
            <th className="crm-table-head">Name</th>
            <th className="crm-table-head">Type</th>
            <th className="crm-table-head">Contacts</th>
            <th className="crm-table-head">Tags</th>
          </tr>
        </thead>
        <tbody className="crm-table-body">
          {accounts.map((account) => (
            <tr 
              key={account.id} 
              className="crm-table-row cursor-pointer" 
              onClick={() => onAccountClick(account.id)}
            >
              <td className="crm-table-cell font-medium">{account.name}</td>
              <td className="crm-table-cell">{account.type || "Business"}</td>
              <td className="crm-table-cell">{account.contactCount || 0}</td>
              <td className="crm-table-cell">
                <div className="flex flex-wrap gap-1">
                  {account.tags?.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
