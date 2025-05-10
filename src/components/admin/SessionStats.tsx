
import React, { useState, useMemo } from "react";
import { useUserSessions, type SessionStats as SessionStatsType } from "@/hooks/useUserSessions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, Users, ArrowUpDown, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SessionStats() {
  const { sessionStats, isLoadingStats } = useUserSessions();
  const [filter, setFilter] = useState("");
  const [sortColumn, setSortColumn] = useState("last_login");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [timeFilter, setTimeFilter] = useState("all");
  const navigate = useNavigate();

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const filteredAndSortedStats = useMemo(() => {
    if (!sessionStats) return [];
    
    // Filter by search term
    let filtered = sessionStats.filter(
      (stat) =>
        stat.email.toLowerCase().includes(filter.toLowerCase()) ||
        `${stat.first_name || ''} ${stat.last_name || ''}`.toLowerCase().includes(filter.toLowerCase())
    );
    
    // Filter by time period
    if (timeFilter !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch(timeFilter) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(stat => new Date(stat.last_login) >= cutoffDate);
    }
    
    // Sort the data
    return [...filtered].sort((a, b) => {
      let compareA: any = a[sortColumn as keyof SessionStatsType];
      let compareB: any = b[sortColumn as keyof SessionStatsType];
      
      // Handle null values
      if (compareA === null) return sortDirection === "asc" ? -1 : 1;
      if (compareB === null) return sortDirection === "asc" ? 1 : -1;
      
      // Handle dates
      if (typeof compareA === "string" && (sortColumn === "last_login")) {
        compareA = new Date(compareA).getTime();
        compareB = new Date(compareB).getTime();
      }
      
      if (compareA < compareB) return sortDirection === "asc" ? -1 : 1;
      if (compareA > compareB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [sessionStats, filter, sortColumn, sortDirection, timeFilter]);

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "N/A";
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === "asc" ? (
      <ArrowUpDown className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowUpDown className="ml-2 h-4 w-4 text-primary rotate-180" />
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/40">
        <CardTitle className="flex items-center text-xl font-bold">
          <Users className="mr-2 h-5 w-5" />
          Benutzer Session Statistiken
        </CardTitle>
        <CardDescription>
          Übersicht der Nutzersitzungen und Aktivitätsmetriken
        </CardDescription>
        
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-4">
          <div className="flex-1">
            <Label htmlFor="filter" className="sr-only">Nach Benutzer suchen</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="filter"
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Nach E-Mail oder Namen suchen..."
                className="pl-9 w-full"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-[200px]">
            <Label htmlFor="timeFilter" className="sr-only">Zeitraum</Label>
            <Select 
              value={timeFilter} 
              onValueChange={setTimeFilter}
            >
              <SelectTrigger id="timeFilter">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Zeitraum wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Zeit</SelectItem>
                <SelectItem value="today">Heute</SelectItem>
                <SelectItem value="week">Letzte Woche</SelectItem>
                <SelectItem value="month">Letzter Monat</SelectItem>
                <SelectItem value="quarter">Letztes Quartal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {isLoadingStats ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filteredAndSortedStats?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            {filter ? "Keine Ergebnisse für diese Suche gefunden" : "Keine Sitzungsdaten gefunden"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" className="hover:bg-transparent p-2" onClick={() => handleSort("email")}>
                      Benutzer {renderSortIcon("email")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="hover:bg-transparent p-2" onClick={() => handleSort("role")}>
                      Rolle {renderSortIcon("role")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="hover:bg-transparent p-2" onClick={() => handleSort("total_sessions")}>
                      Sitzungen {renderSortIcon("total_sessions")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="hover:bg-transparent p-2" onClick={() => handleSort("total_activities")}>
                      Aktivitäten {renderSortIcon("total_activities")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="hover:bg-transparent p-2" onClick={() => handleSort("avg_session_duration")}>
                      Ø Sitzung {renderSortIcon("avg_session_duration")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="hover:bg-transparent p-2" onClick={() => handleSort("total_duration_seconds")}>
                      Gesamtzeit {renderSortIcon("total_duration_seconds")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="hover:bg-transparent p-2" onClick={() => handleSort("last_login")}>
                      Letzter Login {renderSortIcon("last_login")}
                    </Button>
                  </TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedStats.map((stat) => (
                  <TableRow key={stat.email} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{stat.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {stat.first_name} {stat.last_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium capitalize">{stat.role || "user"}</div>
                    </TableCell>
                    <TableCell>{stat.total_sessions}</TableCell>
                    <TableCell>{stat.total_activities}</TableCell>
                    <TableCell>
                      {formatDuration(stat.avg_session_duration)}
                    </TableCell>
                    <TableCell>
                      {formatDuration(stat.total_duration_seconds)}
                    </TableCell>
                    <TableCell>
                      {new Date(stat.last_login).toLocaleString('de-DE')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            ...
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/admin/users/sessions/${stat.email}`)}>
                            <Clock className="mr-2 h-4 w-4" />
                            Sitzungen anzeigen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/users/${stat.email}`)}>
                            <Users className="mr-2 h-4 w-4" />
                            Benutzerprofil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
