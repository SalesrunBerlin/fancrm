
import { formatCurrency } from "@/lib/utils";
import { DealType } from "@/types";

interface DealsTableProps {
  deals: DealType[];
  onDealClick: (id: string) => void;
}

export function DealsTable({ deals, onDealClick }: DealsTableProps) {
  return (
    <div className="crm-table-wrapper">
      <table className="crm-table">
        <thead className="crm-table-header">
          <tr className="crm-table-row">
            <th className="crm-table-head">Name</th>
            <th className="crm-table-head">Amount</th>
            <th className="crm-table-head">Status</th>
            <th className="crm-table-head">Account</th>
            <th className="crm-table-head">Close Date</th>
          </tr>
        </thead>
        <tbody className="crm-table-body">
          {deals.map((deal) => (
            <tr 
              key={deal.id} 
              className="crm-table-row cursor-pointer" 
              onClick={() => onDealClick(deal.id)}
            >
              <td className="crm-table-cell font-medium">
                {deal.name}
              </td>
              <td className="crm-table-cell">{formatCurrency(deal.amount)}</td>
              <td className="crm-table-cell">
                <span className={
                  deal.status === "Closed Won" ? "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" : 
                  deal.status === "Closed Lost" ? "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" : 
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-beauty-light text-beauty-dark"
                }>
                  {deal.status}
                </span>
              </td>
              <td className="crm-table-cell">{deal.accountName || "-"}</td>
              <td className="crm-table-cell">
                {deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
