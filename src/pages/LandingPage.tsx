
import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Layout, Database, Package, FileText, LayoutDashboard } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";

const LandingPage = () => {
  const { isLoggedIn } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Beauty CRM</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Funktionen
            </Link>
            <Link to="#applications" className="text-sm font-medium hover:text-primary transition-colors">
              Anwendungen
            </Link>
            <Link to="#layouts" className="text-sm font-medium hover:text-primary transition-colors">
              Layouts
            </Link>
            <Link to="#records" className="text-sm font-medium hover:text-primary transition-colors">
              Datenmanagement
            </Link>
            {isLoggedIn ? (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth">Anmelden</Link>
              </Button>
            )}
          </nav>
          <div className="flex md:hidden">
            {isLoggedIn ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Anmelden</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {/* Hero */}
      <section className="relative">
        <div className="container px-4 md:px-6 py-12 md:py-24 lg:py-32">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Beauty CRM Bloom
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Eine moderne Plattform für das Beauty-Management mit flexiblen Anwendungen, anpassbaren Objekten und intuitiven Layouts.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link to={isLoggedIn ? "/dashboard" : "/auth"}>
                    Jetzt starten
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg">
                  <Link to="#features">Mehr erfahren</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <AspectRatio ratio={16 / 9}>
                <div className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 h-full w-full flex items-center justify-center">
                  <div className="text-white text-xl md:text-3xl font-bold">Beauty CRM Dashboard</div>
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section id="features" className="bg-muted/50 py-16">
        <div className="container space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Funktionen</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Leistungsstarke Tools für Ihr Beauty-Business
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Package />}
              title="Anwendungen verwalten"
              description="Erstellen und verwalten Sie Anwendungen mit spezifischen Objekten und Aktionen."
            />
            <FeatureCard
              icon={<Layout />}
              title="Anpassbare Layouts"
              description="Gestalten Sie benutzerdefinierte Ansichten und Layouts für Ihre Objekte."
            />
            <FeatureCard
              icon={<Database />}
              title="Objekt-Modellierung"
              description="Definieren Sie Ihre Geschäftsobjekte mit beliebigen Feldern und Beziehungen."
            />
            <FeatureCard
              icon={<FileText />}
              title="Datensatzverwaltung"
              description="Verwalten, importieren und exportieren Sie Ihre Datensätze effizient."
            />
            <FeatureCard 
              icon={<Layout />}
              title="Benutzerfreundliche Oberfläche"
              description="Intuitive Bedienung für alle Benutzerebenen."
            />
            <FeatureCard
              icon={<Database />}
              title="Datenintegration"
              description="Verbinden Sie Ihre Daten nahtlos mit anderen Systemen."
            />
          </div>
        </div>
      </section>
      
      {/* Application Publishing */}
      <section id="applications" className="py-16">
        <div className="container">
          <FeatureShowcase 
            title="Anwendungen veröffentlichen & importieren"
            description="Erstellen Sie Anwendungen mit spezifischen Objekten und Aktionen, veröffentlichen Sie sie und importieren Sie sie in andere Workspaces."
            imageContent={
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-950/30 dark:to-blue-950/30 rounded-xl p-6 h-full">
                <div className="space-y-4">
                  <div className="bg-background rounded-lg p-4 shadow-sm border">
                    <h4 className="font-semibold mb-2">Anwendung veröffentlichen</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-500"></div>
                        <span>Name: CRM-Basis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                        <span>4 Objekte ausgewählt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-purple-500"></div>
                        <span>2 Aktionen ausgewählt</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background rounded-lg p-4 shadow-sm border">
                      <h4 className="font-semibold mb-2 text-sm">Kunden</h4>
                      <div className="text-xs text-muted-foreground">8 Felder</div>
                    </div>
                    <div className="bg-background rounded-lg p-4 shadow-sm border">
                      <h4 className="font-semibold mb-2 text-sm">Termine</h4>
                      <div className="text-xs text-muted-foreground">6 Felder</div>
                    </div>
                  </div>
                </div>
              </div>
            }
            reversed={false}
          />
        </div>
      </section>
      
      {/* Layout Management */}
      <section id="layouts" className="bg-muted/50 py-16">
        <div className="container">
          <FeatureShowcase 
            title="Layout Management"
            description="Gestalten Sie benutzerdefinierte Ansichten und Layouts für Ihre Objekte, um die relevanten Informationen optimal darzustellen."
            imageContent={
              <div className="bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-950/30 dark:to-green-950/30 rounded-xl p-6 h-full">
                <div className="bg-background rounded-lg p-4 shadow-sm border">
                  <h4 className="font-semibold mb-4">Kundendetails Layout</h4>
                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded p-2 flex items-center justify-between">
                      <span>Name</span>
                      <div className="flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-green-500"></div>
                        <span className="text-sm">Sichtbar</span>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded p-2 flex items-center justify-between">
                      <span>Email</span>
                      <div className="flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-green-500"></div>
                        <span className="text-sm">Sichtbar</span>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded p-2 flex items-center justify-between">
                      <span>Telefon</span>
                      <div className="flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-green-500"></div>
                        <span className="text-sm">Sichtbar</span>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded p-2 flex items-center justify-between opacity-60">
                      <span>Interne Notiz</span>
                      <div className="flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                        <span className="text-sm">Ausgeblendet</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
            reversed={true}
          />
        </div>
      </section>
      
      {/* Records Management */}
      <section id="records" className="py-16">
        <div className="container">
          <FeatureShowcase 
            title="Datensatzverwaltung"
            description="Verwalten, importieren und exportieren Sie Ihre Datensätze effizient mit einer intuitiven Benutzeroberfläche."
            imageContent={
              <div className="bg-gradient-to-br from-amber-100 to-pink-100 dark:from-amber-950/30 dark:to-pink-950/30 rounded-xl p-6 h-full">
                <div className="bg-background rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-4 border-b">
                    <h4 className="font-semibold">Kundendatensätze</h4>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-4 p-3 text-sm font-medium">
                      <div>Name</div>
                      <div>Email</div>
                      <div>Telefon</div>
                      <div>Status</div>
                    </div>
                    <div className="grid grid-cols-4 p-3 text-sm hover:bg-muted/50">
                      <div>Maria Schmidt</div>
                      <div>maria@example.com</div>
                      <div>+49 123 456789</div>
                      <div><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Aktiv</span></div>
                    </div>
                    <div className="grid grid-cols-4 p-3 text-sm hover:bg-muted/50">
                      <div>Thomas Müller</div>
                      <div>thomas@example.com</div>
                      <div>+49 987 654321</div>
                      <div><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Neu</span></div>
                    </div>
                    <div className="grid grid-cols-4 p-3 text-sm hover:bg-muted/50">
                      <div>Lisa Weber</div>
                      <div>lisa@example.com</div>
                      <div>+49 555 123456</div>
                      <div><span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">Wartend</span></div>
                    </div>
                  </div>
                </div>
              </div>
            }
            reversed={false}
          />
        </div>
      </section>
      
      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Starten Sie jetzt mit Beauty CRM
          </h2>
          <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl/relaxed">
            Verwalten Sie Ihr Beauty-Business effizient mit unserer leistungsstarken Plattform
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-4">
            <Link to={isLoggedIn ? "/dashboard" : "/auth"}>
              Kostenlos testen
            </Link>
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4 max-w-xs">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Beauty CRM</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Eine moderne Plattform für das Beauty-Management mit flexiblen Anwendungen, anpassbaren Objekten und intuitiven Layouts.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-4">Funktionen</h4>
              <nav className="flex flex-col gap-2">
                <Link to="#features" className="text-sm text-muted-foreground hover:text-foreground">Übersicht</Link>
                <Link to="#applications" className="text-sm text-muted-foreground hover:text-foreground">Anwendungen</Link>
                <Link to="#layouts" className="text-sm text-muted-foreground hover:text-foreground">Layouts</Link>
                <Link to="#records" className="text-sm text-muted-foreground hover:text-foreground">Datensätze</Link>
              </nav>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-4">Rechtliches</h4>
              <nav className="flex flex-col gap-2">
                <Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Datenschutz</Link>
                <Link to="#" className="text-sm text-muted-foreground hover:text-foreground">AGB</Link>
                <Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Impressum</Link>
              </nav>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Beauty CRM Bloom. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
