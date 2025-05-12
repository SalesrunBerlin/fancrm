
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Play,
  CheckCircle,
  Boxes,
  Users,
  Link as LinkIcon,
  LayoutKanban,
  UserCog,
  Palette,
  Star,
  MessageSquare,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ThemedButton } from "@/components/ui/themed-button";
import { cn } from "@/lib/utils";

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  const useCases = [
    {
      title: "Web-Designer",
      quote: "Ich strukturiere jedes Kunden-Projekt als eigenes Objekt – inklusive Design-Feedbacks in den Feldern.",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
    },
    {
      title: "Coach / Trainerin",
      quote: "Mit öffentlichen Links lade ich Klienten ins Portal ein, um Sitzungs­notizen sicher zu teilen.",
      image: "https://images.unsplash.com/photo-1544005313-94315e28ef70"
    },
    {
      title: "Fotograf",
      quote: "Meine Shootings laufen als Projekte, Aufgaben als Karten – so sehe ich sofort, welche Serie noch bearbeitet werden muss.",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
    },
    {
      title: "Software-Entwicklerin",
      quote: "Tickets für Bugs und Features tracke ich in einem Board, das der Kunde live einsehen kann.",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6"
    }
  ];

  const features = [
    {
      icon: <LayoutKanban />,
      title: "Kanban-Board",
      description: "Verschiebe Aufgaben per Drag & Drop von 'Offen' zu 'Erledigt'."
    },
    {
      icon: <Users />,
      title: "Kontakt- & Firmen­verwaltung",
      description: "Verknüpfe Personen, Firmen und Projekte in einem Klick."
    },
    {
      icon: <LinkIcon />,
      title: "Öffentliche Links",
      description: "Teile Angebote oder Projekt-Updates ohne Login-Zwang."
    },
    {
      icon: <MessageSquare />,
      title: "Ticket-Board",
      description: "Behalte Support-Anfragen übersichtlich nach Priorität."
    },
    {
      icon: <UserCog />,
      title: "Rollen & Arbeits­bereiche",
      description: "Gib Kunden Einblick in ihr Projekt – nur das, was sie sehen sollen."
    },
    {
      icon: <Palette />,
      title: "Branding-Tools",
      description: "Präsentiere dein CRM im eigenen Look & Feel."
    }
  ];

  const objectExamples = [
    {
      name: "Kontakt",
      fields: ["Vorname", "Nachname", "E-Mail", "Telefon"],
      benefit: "Alle Gesprächs­partner an einem Ort"
    },
    {
      name: "Firma",
      fields: ["Name", "Branche", "Standort"],
      benefit: "Mehrere Kontakte sauber gruppiert"
    },
    {
      name: "Projekt",
      fields: ["Titel", "Start-/Enddatum", "Budget"],
      benefit: "Klare Zeitleiste & Priorität"
    },
    {
      name: "Aufgabe",
      fields: ["Beschreibung", "Status", "Fällig am"],
      benefit: "To-dos mit Drag-&-Drop"
    },
    {
      name: "Ticket",
      fields: ["Kategorie", "Priorität", "Kunde"],
      benefit: "Support strukturiert abwickeln"
    }
  ];

  const testimonials = [
    {
      quote: "Endlich Schluss mit Tool-Wildwuchs – DeinCRM hat meine Projektzeit halbiert.",
      author: "Lara M.",
      role: "UX-Consultant",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330"
    },
    {
      quote: "Ich spare mir täglich 30 Minuten Sucherei. Alles liegt dort, wo ich es brauche.",
      author: "Daniel P.",
      role: "Videograf",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
    },
    {
      quote: "Meine Kunden lieben das Self-Service-Portal – weniger Mails, mehr Fokus.",
      author: "Sofia R.",
      role: "Online-Coach",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80"
    }
  ];

  const pricingPlans = [
    {
      name: "Free Trial",
      price: "0 €",
      duration: "14 Tage",
      features: ["Volle Funktionen", "keine Kreditkarte"],
      isFeatured: false
    },
    {
      name: "Pro",
      price: "19 €",
      duration: "pro Monat",
      features: [
        "Unbegrenzte Objekte & Felder",
        "Kontakt- & Projekt-Module",
        "Kanban & Tickets",
        "Öffentliche Links",
        "Kundenzugänge",
        "E-Mail-Support"
      ],
      isFeatured: true
    }
  ];
  
  const faqs = [
    {
      question: "Brauche ich Programmier­kenntnisse?",
      answer: "Nein. Objekte & Felder lassen sich per Klick konfigurieren."
    },
    {
      question: "Ist meine Kundendaten sicher?",
      answer: "Ja. Server in 🇩🇪 Deutschland, DSGVO-konform."
    },
    {
      question: "Kann ich später upgraden oder kündigen?",
      answer: "Jederzeit – monatlich kündbar, ohne Mindest­laufzeit."
    },
    {
      question: "Gibt es eine mobile App?",
      answer: "Ja, iOS & Android. Unterwegs Aufgaben abhaken und Kontakte anrufen."
    },
    {
      question: "Unterstützt ihr Datei-Uploads?",
      answer: "Klar! Lade Angebote, Bilder oder Verträge direkt an Projekte oder Tickets."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Behalte Kunden & Projekte mit einem Klick im Griff.
          </h1>
          <p className="text-xl text-muted-foreground">
            Das flexible CRM für Freelancer aller Branchen – alles an einem Ort, nichts geht verloren.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <ThemedButton asChild size="lg" variant="orange">
              <Link to="/auth">Jetzt kostenlos testen</Link>
            </ThemedButton>
            <Button variant="outline" size="lg" className="gap-2">
              <Play className="h-4 w-4" /> Video ansehen (90 Sek.)
            </Button>
          </div>
        </div>
      </section>

      {/* Problem -> Solution Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Kennst du diese Herausforderungen?</h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                {[
                  "Kontakte in Excel, Projekte in Trello, Dateien in Drive – Chaos statt Überblick.",
                  "Deadlines rücken näher, doch wichtige Infos liegen verstreut in E-Mails.",
                  "Kunden wollen Status-Updates, du suchst jede Info manuell zusammen."
                ].map((pain, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="mt-1 text-rose-500 dark:text-rose-400 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                    <p>{pain}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Die Lösung</h3>
                  <p className="text-muted-foreground">
                    Mit DeinCRM bündelst du alles in einer zentralen Plattform – übersichtlich, suchbar und sofort teilbar.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex flex-col items-center text-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <Boxes className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm">Alles an einem Ort</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <Users className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm">Übersichtliche Kontakte</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <LinkIcon className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm">Alles verknüpft</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <Star className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm">Passt zu dir</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Objects & Fields explained */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Baue dein CRM wie ein Lego-Set.</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            In DeinCRM legst du eigene Objekte an – ähnlich wie Inhalts­blöcke, die perfekt zu deinem Business passen. 
            Jedes Objekt enthält Felder, die du frei auswählst.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="p-4 text-left">Beispiel-Objekt</th>
                <th className="p-4 text-left">Typische Felder</th>
                <th className="p-4 text-left">Kurz-Benefit</th>
              </tr>
            </thead>
            <tbody>
              {objectExamples.map((object, index) => (
                <tr key={index} className="border-b border-muted">
                  <td className="p-4 font-medium">{object.name}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {object.fields.map((field, i) => (
                        <Badge key={i} variant="outline">{field}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{object.benefit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center mt-8 text-muted-foreground">
          Text, Zahl, Datum, Auswahl oder Lookup → wähle einfach die Felder, die deinem Workflow wirklich nutzen.
        </p>
      </section>

      {/* Top Features */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Top-Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border bg-card hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Carousel */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">So nutzen Freelancer DeinCRM</h2>
        
        <div className="relative">
          <div className="overflow-hidden">
            <div className="flex flex-nowrap transition-transform duration-500" style={{ transform: `translateX(-${activeTab * 100}%)` }}>
              {useCases.map((useCase, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-2xl font-semibold mb-4">{useCase.title}</h3>
                      <blockquote className="text-lg italic border-l-4 border-primary pl-4">
                        "{useCase.quote}"
                      </blockquote>
                    </div>
                    <div className="rounded-xl overflow-hidden">
                      <AspectRatio ratio={16 / 9}>
                        <img 
                          src={useCase.image} 
                          alt={useCase.title} 
                          className="w-full h-full object-cover"
                        />
                      </AspectRatio>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center mt-8 gap-2">
            {useCases.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-colors",
                  activeTab === index ? "bg-primary" : "bg-muted"
                )}
                onClick={() => setActiveTab(index)}
                aria-label={`Show use case ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Kundenstimmen</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border bg-card">
                <CardContent className="pt-6">
                  <blockquote className="text-lg italic mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      {testimonial.avatar && <AvatarImage src={testimonial.avatar} alt={testimonial.author} />}
                      <AvatarFallback>{testimonial.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Einfache Preise – jederzeit kündbar.</h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          Keine versteckten Kosten, keine Überraschungen. Starte mit unserem kostenlosen Test und entscheide dann.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={index} 
              className={cn(
                "border bg-card relative overflow-hidden",
                plan.isFeatured && "border-primary shadow-lg"
              )}
            >
              {plan.isFeatured && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-white text-xs px-3 py-1 transform rotate-45 translate-x-6 translate-y-2">
                    Empfohlen
                  </div>
                </div>
              )}
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground"> / {plan.duration}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <ThemedButton
                  className="w-full"
                  variant={plan.isFeatured ? "orange" : "outline"}
                >
                  Jetzt starten
                </ThemedButton>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Häufige Fragen</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Starte jetzt – dein CRM wartet.</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <ThemedButton asChild size="lg" variant="orange">
            <Link to="/auth">Kostenlos testen</Link>
          </ThemedButton>
          <Button variant="outline" size="lg" className="gap-2">
            <Phone className="h-4 w-4" /> Live-Demo vereinbaren
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
