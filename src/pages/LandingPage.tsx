
import React from "react";
import { Link } from "react-router-dom";
import { 
  ChevronRight, 
  Wrench, 
  LayoutGrid, 
  Shield, 
  Mail, 
  ArrowRight,
  RefreshCw,
  Mobile,
  LayoutDashboard
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { ProblemSolutionCard } from "@/components/landing/ProblemSolutionCard";
import { TestimonialCard } from "@/components/landing/TestimonialCard";
import { UseCaseCard } from "@/components/landing/UseCaseCard";
import { FAQItem } from "@/components/landing/FAQItem";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
            <Link to="#probleme" className="text-sm font-medium hover:text-primary transition-colors">
              Probleme & Lösungen
            </Link>
            <Link to="#funktionen" className="text-sm font-medium hover:text-primary transition-colors">
              Funktionen
            </Link>
            <Link to="#anwendungsfaelle" className="text-sm font-medium hover:text-primary transition-colors">
              Anwendungsfälle
            </Link>
            <Link to="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQs
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
      <section className="relative bg-gradient-to-br from-background via-background to-muted/30">
        <div className="container px-4 md:px-6 py-12 md:py-24 lg:py-32">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <Badge className="mb-2 inline-block">Neu: Version 2.0</Badge>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Ihr digitaler Akkuschrauber für's Beauty-Business
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Machen Sie Schluss mit chaotischer Organisation – mit dem Beauty CRM haben Sie endlich alle Kunden, Termine und Aktionen übersichtlich an einem Ort.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link to={isLoggedIn ? "/dashboard" : "/auth"}>
                    Jetzt Probeschrauben
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg">
                  <Link to="#demo">5-Minuten-Demo ansehen</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-xl border shadow-xl">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full w-full flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-xl md:text-3xl font-bold">Smarte Terminverwaltung</div>
                  </div>
                  {/* Placeholder for GIF/screenshot - in a real implementation, you'd use an image here */}
                  <div className="bg-gradient-to-r from-purple-500/50 to-blue-500/50 absolute inset-0 animate-pulse"></div>
                </div>
              </AspectRatio>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-3 text-sm font-medium">
                <span className="text-primary">Alles in einem System</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Problem-Solution Block */}
      <section id="probleme" className="bg-muted/30 py-16">
        <div className="container space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Schluss mit dem Papierkram!</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Die typischen Probleme der Beauty-Branche sind uns bekannt – und wir haben die passenden Lösungen
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Die Probleme:</h3>
              <div className="grid gap-4">
                <ProblemSolutionCard 
                  icon={<Wrench className="rotate-45" />}
                  title="Termine verschwinden wie der letzte Nagellack-Tropfen"
                />
                <ProblemSolutionCard 
                  icon={<Shield />}
                  title="Kundendaten verstreut wie Glitzer nach einer Maniküre"
                />
                <ProblemSolutionCard 
                  icon={<LayoutGrid />}
                  title="Mehr Software-Chaos als Produkte im Lager"
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Unsere Lösung:</h3>
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="text-lg font-medium">Alles zentral in einem System</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Wrench className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="text-lg font-medium">Individuelle No-Code Objekte</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="text-lg font-medium">Ein-Klick Actions</h4>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature Grid */}
      <section id="funktionen" className="py-16">
        <div className="container space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Funktionen, die begeistern</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Alle Tools, die Sie für Ihr Beauty-Business brauchen
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Wrench />}
              title="Objekt-Designer"
              description="Erstellen Sie eigene Datenstrukturen wie Behandlungen, Kunden oder Produkte – so einfach wie Lego-Steine stapeln."
            />
            <FeatureCard
              icon={<LayoutGrid />}
              title="Flexible Layouts"
              description="Gestalten Sie Ihre Ansichten so übersichtlich wie Ihren Arbeitsplatz nach der Grundreinigung."
            />
            <FeatureCard
              icon={<RefreshCw />}
              title="Automatisierte Actions"
              description="Lassen Sie wiederkehrende Aufgaben mit einem Klick erledigen – wie ein Roboter-Assistent für Ihr Büro."
            />
            <FeatureCard
              icon={<Mobile />}
              title="Mobile Optimiert"
              description="Nutzen Sie das System unterwegs auf allen Geräten – so handlich wie Ihr Lieblings-Pinselset."
            />
            <FeatureCard
              icon={<LayoutDashboard />}
              title="Intuitive Bedienung"
              description="Genauso einfach wie Ihre Lieblingsbehandlung – aber ohne jahrelange Ausbildung."
            />
            <FeatureCard
              icon={<Shield />}
              title="DSGVO-konform"
              description="Kundendaten so sicher aufbewahrt wie Ihre wertvollsten Produkte im Tresor."
            />
          </div>
        </div>
      </section>
      
      {/* Use Cases */}
      <section id="anwendungsfaelle" className="bg-muted/30 py-16">
        <div className="container space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Von Profis für Profis</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Wie Beauty CRM im Alltag unserer Kunden hilft
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <UseCaseCard 
              name="Schreinermeisterin Sabine"
              description="»Mit Beauty CRM habe ich meine Buchungen endlich im Griff und kann mich auf das Wesentliche konzentrieren: meine Kundinnen.«"
            />
            <UseCaseCard 
              name="IT-Freelancer Jens"
              description="»Als Technikfan war ich skeptisch, aber das System ist so intuitiv, dass sogar meine technisch unbedarften Kollegen es lieben!«"
            />
            <UseCaseCard 
              name="Haustechnik-GmbH Muster & Co."
              description="»Früher war unsere Terminplanung ein Albtraum. Heute koordinieren wir fünf Techniker ohne Schweißausbrüche.«"
            />
          </div>
        </div>
      </section>
      
      {/* Live Demo Teaser */}
      <section id="demo" className="py-16">
        <div className="container space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Sehen Sie es in Aktion</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Ein Bild sagt mehr als tausend Worte – ein Video zeigt mehr als tausend Bilder
            </p>
          </div>
          
          <div className="mx-auto max-w-4xl">
            <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-xl border shadow-xl">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/30 dark:to-purple-950/30 h-full w-full flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white/90 dark:bg-gray-900/90 p-8 rounded-xl shadow-lg backdrop-blur">
                  <h3 className="text-2xl font-bold mb-4">Beauty CRM in 5 Minuten erklärt</h3>
                  <p className="text-muted-foreground mb-6">Sehen Sie, wie einfach die Verwaltung Ihres Beauty-Business sein kann</p>
                  <Button size="lg" className="gap-2">
                    <span>Video starten</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AspectRatio>
          </div>
        </div>
      </section>
      
      {/* Social Proof */}
      <section className="bg-muted/30 py-16">
        <div className="container space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Das sagen unsere Kunden</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Beauty-Profis lieben unser CRM
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="Das Beauty CRM hat meine Arbeitsabläufe revolutioniert! Ich spare täglich mindestens eine Stunde Verwaltungsarbeit."
              name="Laura Müller"
              role="Inhaberin"
              company="Nagelstudio Glanz"
              metric="60+ min/Tag gespart"
            />
            <TestimonialCard 
              quote="Endlich ein System, das auch bei hohem Kundenaufkommen nicht ins Schwitzen gerät. Die Bedienung ist ein Traum!"
              name="Thomas Weber"
              role="Geschäftsführer"
              company="Kosmetik Weber GmbH"
              metric="35% mehr Buchungen"
            />
            <TestimonialCard 
              quote="Die mobilen Funktionen sind Gold wert. Ich kann Termine bestätigen, während ich im Laden bin – ohne zum PC zu rennen."
              name="Melanie Schmidt"
              role="Kosmetikerin"
              company="Beauty Lounge"
              metric="100% mobil arbeiten"
            />
          </div>
          
          <div className="pt-8 border-t border-border">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 grayscale opacity-70">
              <div className="h-12 flex items-center justify-center">
                <div className="text-2xl font-bold">BeautyBrands</div>
              </div>
              <div className="h-12 flex items-center justify-center">
                <div className="text-2xl font-bold">SalonPro</div>
              </div>
              <div className="h-12 flex items-center justify-center">
                <div className="text-2xl font-bold">StyleMasters</div>
              </div>
              <div className="h-12 flex items-center justify-center">
                <div className="text-2xl font-bold">BeautyTech</div>
              </div>
              <div className="h-12 flex items-center justify-center">
                <div className="text-2xl font-bold">GlamourStudios</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trust & Security */}
      <section className="py-16">
        <div className="container">
          <div className="bg-muted/20 border rounded-xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left">
                <h2 className="text-2xl font-bold">Ihre Daten sind bei uns sicher</h2>
                <p className="text-muted-foreground max-w-lg">
                  Wir nehmen Datenschutz genauso ernst wie Sie die Qualität Ihrer Arbeit. Unser System erfüllt alle Anforderungen und speichert Ihre wertvollen Daten sicher in der EU.
                </p>
              </div>
              <div className="flex flex-wrap gap-6 justify-center">
                <div className="flex flex-col items-center gap-2 p-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-medium">DSGVO-konform</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <LayoutGrid className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-medium">EU-Hosting</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-medium">Ende-zu-Ende verschlüsselt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section id="faq" className="bg-muted/30 py-16">
        <div className="container space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Häufige Fragen</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Alles, was Sie über Beauty CRM wissen sollten
            </p>
          </div>
          
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <FAQItem 
                value="item-1"
                question="Ist Beauty CRM wirklich für Anfänger geeignet?"
                answer="Absolut! Unser System wurde so konzipiert, dass es genauso einfach zu bedienen ist wie Ihre professionellen Tools. Keine IT-Kenntnisse nötig – versprochen!"
              />
              <FAQItem 
                value="item-2"
                question="Kann ich meine bestehenden Kundendaten importieren?"
                answer="Ja, Sie können Ihre Daten ganz einfach aus Excel oder anderen Systemen importieren. Unser Assistent führt Sie Schritt für Schritt durch den Prozess – schmerzfreier als eine Express-Maniküre!"
              />
              <FAQItem 
                value="item-3"
                question="Funktioniert das System auch auf meinem Tablet?"
                answer="Aber sicher! Beauty CRM ist für alle Geräte optimiert – vom Desktop im Salon bis zum Smartphone unterwegs. So flexibel wie Ihr Arbeitsalltag!"
              />
              <FAQItem 
                value="item-4"
                question="Wie lange dauert die Einrichtung?"
                answer="Schneller als eine Expresspediküre! Die Grundeinrichtung dauert nur wenige Minuten. Mit unseren vorgefertigten Vorlagen für Beauty-Businesses können Sie sofort loslegen."
              />
              <FAQItem 
                value="item-5"
                question="Werden regelmäßig neue Funktionen hinzugefügt?"
                answer="Unser System wächst ständig – wie Ihre Kundenkartei! Wir erweitern Beauty CRM regelmäßig um neue Funktionen, basierend auf dem Feedback unserer Nutzer. Ihre Wünsche sind unser Auftrag!"
              />
            </Accordion>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="bg-gradient-to-br from-primary to-primary-foreground/90 text-primary-foreground py-16">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
            Bereit für Ihr digitales Upgrade?
          </h2>
          <p className="mx-auto max-w-[600px] text-primary-foreground/90 md:text-xl/relaxed">
            Verwalten Sie Ihr Beauty-Business effizient und machen Sie Schluss mit dem Papierchaos
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-4 gap-2">
            <Link to={isLoggedIn ? "/dashboard" : "/auth"}>
              Jetzt kostenlos starten
              <ArrowRight className="h-4 w-4" />
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
                Weniger Papierkram – Mehr Feierabend. Die moderne Plattform für das Beauty-Management.
              </p>
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" asChild>
                  <Link to="#">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="#">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                    </svg>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="#">
                    <span className="sr-only">YouTube</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.418-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-4">Features</h4>
              <nav className="flex flex-col gap-2">
                <Link to="#funktionen" className="text-sm text-muted-foreground hover:text-foreground">Übersicht</Link>
                <Link to="#probleme" className="text-sm text-muted-foreground hover:text-foreground">Probleme & Lösungen</Link>
                <Link to="#anwendungsfaelle" className="text-sm text-muted-foreground hover:text-foreground">Anwendungsfälle</Link>
                <Link to="#demo" className="text-sm text-muted-foreground hover:text-foreground">Demo</Link>
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
            <div className="max-w-xs">
              <h4 className="font-medium text-sm mb-4">Newsletter</h4>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Beauty-News und Tipps für mehr Effizienz im Salon</p>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="email" 
                      placeholder="Ihre E-Mail-Adresse" 
                      className="w-full pl-10 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <Button type="submit" size="sm">Abonnieren</Button>
                </div>
              </div>
              <div className="mt-6">
                <Button variant="outline" className="gap-2" asChild>
                  <Link to="#">
                    Community-Slack beitreten
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Beauty CRM. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
