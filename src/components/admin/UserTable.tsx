
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ThemedButton } from "@/components/ui/themed-button";
import { UserSummary } from "@/pages/admin/UserManagementPage";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface UserTableProps {
  users: UserSummary[];
  onCreateUser: () => void;
}

export function UserTable({ users, onCreateUser }: UserTableProps) {
  const { user: currentUser } = useAuth();
  
  const columns: ColumnDef<UserSummary>[] = [
    {
      accessorKey: "profile.screen_name",
      header: "Username",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "profile.role",
      header: "Role",
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at") as string);
        return date.toLocaleDateString();
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const createdByCurrentUser = row.original.created_by === currentUser?.id;
        return createdByCurrentUser ? (
          <Badge className="bg-green-500">Created by you</Badge>
        ) : null;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ThemedButton asChild useUserColor={false}>
          <Link to={`/admin/users/${row.original.id}`}>Details</Link>
        </ThemedButton>
      ),
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full">
      <div className="pb-4">
        <Button onClick={onCreateUser}>Create User</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
