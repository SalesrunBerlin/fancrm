
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, Activity, Settings, BarChart2, User, FileText } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader 
        title="Admin Dashboard"
        description="Verwaltungsfunktionen und System-Analytics"
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Users className="mr-2 h-5 w-5" />
              Benutzer-Verwaltung
            </CardTitle>
            <CardDescription>
              Benutzer und Berechtigungen verwalten
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              Benutzer hinzufügen, bearbeiten und Zugriffsrechte verwalten
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/admin/users")}
            >
              Zur Benutzerverwaltung
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Activity className="mr-2 h-5 w-5" />
              Benutzer-Analysen
            </CardTitle>
            <CardDescription>
              Aktivitäten und Nutzungsstatistiken
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              Sitzungen, Aktivitäten und Nutzungsmuster einsehen
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/admin/analytics")}
            >
              Zu den Benutzer-Analysen
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Settings className="mr-2 h-5 w-5" />
              Workspace-Verwaltung
            </CardTitle>
            <CardDescription>
              Workspace-Einstellungen verwalten
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              Workspace-Konfiguration und Einstellungen anpassen
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/admin/workspace")}
            >
              Zur Workspace-Verwaltung
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <FileText className="mr-2 h-5 w-5" />
              Hilfe-Inhalte
            </CardTitle>
            <CardDescription>
              Hilfe und Dokumentation bearbeiten
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              System-Dokumentation und Hilfeseiten verwalten
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/admin/help-content")}
            >
              Hilfe-Inhalte bearbeiten
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
