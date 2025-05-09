
import React from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Database, 
  Link as LinkIcon, 
  Palette, 
  Users, 
  Settings, 
  BarChart, 
  Smartphone, 
  Shield, 
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProblemSolutionCard } from "@/components/landing/ProblemSolutionCard";
import { UseCaseCard } from "@/components/landing/UseCaseCard";
import { TestimonialCard } from "@/components/landing/TestimonialCard";
import { FAQItem } from "@/components/landing/FAQItem";
import { Accordion } from "@/components/ui/accordion";

const LandingPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">
          fanCRM – Das Daten-Multitool für Mittelstand, Handwerk & Freelancer
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Verbinde Aufträge, Kontakte und Projekte wie Steckdosen im Verteiler – alles läuft auf einer Leitung.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/auth">Jetzt verkabeln</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/help">Live-Demo starten <ArrowRight className="ml-2" /></Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <ProblemSolutionCard 
          icon={<Database />} 
          title="Objekte & Felder nach Maß" 
          description="Baue dir eigene Datenkisten – von „Bohrmaschine" bis „Wartungsvertrag". Kein Code, nur Klicks."
          isLight 
        />
        <ProblemSolutionCard 
          icon={<LinkIcon />} 
          title="Relationship-Builder" 
          description="Ziehe eine Leitung von Kunde zu Auftrag zu Rechnung – Querverbindungen inklusive. Nie wieder Daten-Inseln."
        />
        <ProblemSolutionCard 
          icon={<Palette />} 
          title="Layout-Designer" 
          description="Jedes Team bekommt sein eigenes Cockpit: Vertrieb will Pipeline, Service will Checkliste – alles im selben Datensilo."
          isLight 
        />
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Das Daten-Multitool für Ihren Arbeitsalltag
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <UseCaseCard 
            name="Schreinermeisterin Sabine"
            description="Erstellt vor Ort ein Angebot → Relationship zum Kunden verknüpft → Action legt Auftrag & Materialliste an. Feierabend früher."
            imageSrc="https://images.unsplash.com/photo-1486312339633-9f21c82918c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2072&q=80"
          />
          <UseCaseCard 
            name="IT-Freelancer Jens"
            description="Baut Bug-Tracker als eigenes Objekt → Tickets hängen automatisch am Kunden → Zeiten werden per Action verbucht."
            imageSrc="https://images.unsplash.com/photo-1611262584375-531ca3c77941?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
          />
          <UseCaseCard 
            name="Haustechnik-GmbH Muster & Co."
            description="Service, Vertrieb, Lager arbeiten in einer Datenwolke – Ersatzteil kennt Auftrag, Auftrag kennt Kunde, alles vernetzt."
            imageSrc="https://images.unsplash.com/photo-1519389950473-47a04ca018e0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
          />
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Das sagen unsere Nutzer
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TestimonialCard 
            quote="fanCRM spart uns pro Woche einen Tag Sucherei. Alles verlinkt – nix vergeigt."
            name="Thomas Berger"
            role="Marketingleiter"
            company="Kreativ-Werkstatt GmbH"
            imageSrc="https://images.unsplash.com/photo-1534528741702-a0cfae58b707?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1964&q=80"
            metric="1 Tag/Woche gespart"
          />
          <TestimonialCard 
            quote="Beziehungen zwischen Projekten, Kunden und Rechnungen? Ein Klick. Mehr brauche ich nicht."
            name="Sabine Müller"
            role="Freelance Designerin"
            company="Designstudio SM"
            imageSrc="https://images.unsplash.com/photo-1544005313-94315e28ef70?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1888&q=80"
            metric="Alle Daten mit einem Klick"
          />
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Häufig gestellte Fragen
        </h2>
        <Accordion type="single" collapsible className="w-full">
          <FAQItem 
            value="question-1"
            question="Was genau macht fanCRM?"
            answer="Ein zentrales Daten-Multitool: Objekte erstellen, Beziehungen verdrahten, Prozesse automatisieren."
          />
          <FAQItem 
            value="question-2"
            question="Brauche ich Programmierkenntnisse?"
            answer="Nein. Drag-and-drop reicht."
          />
          <FAQItem 
            value="question-3"
            question="Lohnt sich das auch für Einzelkämpfer?"
            answer="Ja. Endlich alle Infos in einem Netz statt fünf Apps."
          />
          <FAQItem 
            value="question-4"
            question="Kann ich fanCRM an meine Branche anpassen?"
            answer="Klar. Feld reinschrauben, Layout anpassen, los."
          />
        </Accordion>
      </section>

      <section className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-6">
          Daten entwirren, Prozesse verkürzen – jetzt fanCRM testen!
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/auth">Jetzt verkabeln</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/help">Live-Demo starten <ArrowRight className="ml-2" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
