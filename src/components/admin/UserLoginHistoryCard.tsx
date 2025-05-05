
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginHistoryTable } from "@/components/admin/LoginHistoryTable";

interface UserLoginHistoryCardProps {
  loginHistory: Array<{
    log_timestamp: number | string;
    event_message: string;
  }>;
}

export function UserLoginHistoryCard({ loginHistory }: UserLoginHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login History</CardTitle>
        <CardDescription>Recent login activity for this user</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginHistoryTable loginHistory={loginHistory} />
      </CardContent>
    </Card>
  );
}
