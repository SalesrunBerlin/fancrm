
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { AppWindow, Database, PlaySquare, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Einstellungen" 
        description="Verwalten Sie Ihre Anwendungseinstellungen"
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Link to="/profile">
          <Card className="h-full hover:bg-accent/5 transition-colors border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Benutzerprofil
              </CardTitle>
              <CardDescription>
                Verwalten Sie Ihre persönlichen Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aktualisieren Sie Ihren Benutzernamen und Profildetails.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/settings/object-manager">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Objekt-Manager
              </CardTitle>
              <CardDescription>
                Definieren und passen Sie Ihre Objekte, Felder und Beziehungen an
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Erstellen und verwalten Sie benutzerdefinierte Objekte, fügen Sie Felder hinzu und definieren Sie, wie Ihre Daten strukturiert sind.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/applications">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AppWindow className="h-5 w-5" />
                Anwendungen
              </CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Anwendungen und Objektzuweisungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Erstellen und konfigurieren Sie Anwendungen und weisen Sie Objekte bestimmten Anwendungen zu.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/actions">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlaySquare className="h-5 w-5" />
                Aktionen
              </CardTitle>
              <CardDescription>
                Erstellen und verwalten Sie Aktionen für Ihre Objekte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Definieren Sie benutzerdefinierte Aktionen wie das Erstellen neuer Datensätze mit vorausgewählten Feldern und Standardwerten.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        {/* Placeholder for future setting sections */}
        <Card className="h-full opacity-60">
          <CardHeader>
            <CardTitle>Benutzerverwaltung</CardTitle>
            <CardDescription>
              Verwalten von Benutzern und Berechtigungen (in Kürze verfügbar)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Steuern Sie, wer auf Ihre Anwendung zugreifen kann und was sie tun können.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
