
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Briefcase, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps { 
  contactCount: number;
  accountCount: number;
  openDealsCount: number;
  upcomingActivities: number;
  isLoading?: boolean;
}

export function DashboardStats({ 
  contactCount, 
  accountCount, 
  openDealsCount,
  upcomingActivities,
  isLoading = false
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Kontakte
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{contactCount}</div>
              <p className="text-xs text-muted-foreground">
                Gesamtanzahl Kontakte
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Accounts
          </CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{accountCount}</div>
              <p className="text-xs text-muted-foreground">
                Gesamtanzahl Accounts
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Offene Deals
          </CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{openDealsCount}</div>
              <p className="text-xs text-muted-foreground">
                Aktive Verkaufschancen
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Anstehende Aktivitäten
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{upcomingActivities}</div>
              <p className="text-xs text-muted-foreground">
                Nächste: Keine geplant
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
