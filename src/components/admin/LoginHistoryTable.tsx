
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LoginHistoryTableProps {
  loginHistory: Array<{
    timestamp: string;
    event_message: string;
  }>;
}

export function LoginHistoryTable({ loginHistory }: LoginHistoryTableProps) {
  const parseEventMessage = (message: string) => {
    try {
      const data = JSON.parse(message);
      return {
        event: data.msg || 'Event',
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loginHistory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                No login history available
              </TableCell>
            </TableRow>
          ) : (
            loginHistory.map((item, index) => {
              const event = parseEventMessage(item.event_message);
              return (
                <TableRow key={index}>
                  <TableCell>
                    {new Date(item.timestamp / 1000).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.success ? "default" : "destructive"}>
                      {event.event}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.status}</TableCell>
                  <TableCell>{event.ipAddress}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
