
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
      // Handle case where the message is not valid JSON
      return {
        event: typeof message === 'string' ? message.substring(0, 20) : 'Unknown Event',
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
    
    try {
      // Stellen Sie sicher, dass timestamp als Zahl oder gültiges Datumsstring vorliegt
      const date = new Date(typeof timestamp === 'number' ? timestamp : parseInt(String(timestamp)));
      
      // Prüfen Sie, ob das Datum gültig ist
      if (isNaN(date.getTime())) {
        return String(timestamp).substring(0, 20); // Geben Sie einen Teil des Originalstrings zurück, wenn kein gültiges Datum
      }
      
      // Formatieren Sie das Datum als DD.MM.YYYY, HH:MM:SS (mit richtiger Nullpolsterung)
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return String(timestamp).substring(0, 20); // Geben Sie einen Teil des Originalstrings bei Fehler zurück
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
