
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";
import { Badge } from "@/components/ui/badge";

interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
}

export function ProductsTable({ products, isLoading }: ProductsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Produktfamilie</TableHead>
          <TableHead>Preis</TableHead>
          <TableHead>Turnus</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>{product.productFamily?.name || "-"}</TableCell>
            <TableCell>{formatCurrency(product.price)}</TableCell>
            <TableCell>
              <Badge variant="secondary">
                {product.recurrence === "once" ? "Einmalig" :
                 product.recurrence === "monthly" ? "Monatlich" : "Jährlich"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
        {products.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              Keine Produkte gefunden
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
