
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LoginHistoryTableProps {
  loginHistory: Array<{
    timestamp: number | string;
    event_message: string;
  }>;
}

export function LoginHistoryTable({ loginHistory }: LoginHistoryTableProps) {
  const parseEventMessage = (message: string) => {
    try {
      const data = JSON.parse(message);
      return {
        event: data.msg || data.action || 'Event',
        status: data.status || '-',
        path: data.path || '-',
        ipAddress: data.remote_addr || '-',
        timestamp: data.time || '-',
        success: !data.error,
      };
    } catch (e) {
      return {
        event: 'Unknown Event',
        status: '-',
        path: '-',
        ipAddress: '-',
        timestamp: '-',
        success: false,
      };
    }
  };

  const formatDate = (timestamp: number | string) => {
    if (!timestamp) return '-';
    const date = new Date(typeof timestamp === 'number' ? timestamp : parseInt(timestamp as string));
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}, ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loginHistory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                No login history available
              </TableCell>
            </TableRow>
          ) : (
            loginHistory.map((item, index) => {
              const event = parseEventMessage(item.event_message);
              return (
                <TableRow key={index}>
                  <TableCell>{formatDate(item.timestamp)}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-400 hover:bg-blue-500">
                      {event.event}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.status}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
