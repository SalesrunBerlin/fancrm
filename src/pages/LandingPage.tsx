
import React from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  Database, 
  Globe, 
  HeartHandshake, 
  Mail, 
  Palette, 
  Shield, 
  Smartphone, 
  Sparkles, 
  Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
          fanCRM - Ihr Beziehungs-Booster für Geschäftspartner
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Verwandeln Sie flüchtige Kontakte in treue Geschäftspartner mit unserem smarten Beziehungsmanagement.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/auth">Jetzt durchstarten</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/help">Demo ansehen <ArrowRight className="ml-2" /></Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ProblemSolutionCard 
          icon={<Users />} 
          title="Kunden verstehen wie nie zuvor" 
          isLight 
        />
        <ProblemSolutionCard 
          icon={<HeartHandshake />} 
          title="Beziehungen pflegen, nicht nur verwalten" 
        />
        <ProblemSolutionCard 
          icon={<Sparkles />} 
          title="Umsätze zaubern durch echte Verbindungen" 
          isLight 
        />
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          So bringt fanCRM Ihre Kundenbeziehungen auf die nächste Stufe
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <UseCaseCard 
            name="E-Mail-Kampagnen mit Persönlichkeit"
            description="Schluss mit unpersönlichen Massenmails! Versenden Sie maßgeschneiderte Nachrichten, die wirklich ankommen und begeistern."
            imageSrc="https://images.unsplash.com/photo-1486312339633-9f21c82918c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2072&q=80"
          />
          <UseCaseCard 
            name="Social Media ohne Kopfschmerzen"
            description="Verwalten Sie alle Ihre Social-Media-Kanäle an einem Ort und planen Sie Beiträge, die Ihre Zielgruppe wirklich erreichen."
            imageSrc="https://images.unsplash.com/photo-1611262584375-531ca3c77941?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
          />
          <UseCaseCard 
            name="Kundenbindungsprogramme, die begeistern"
            description="Belohnen Sie Ihre treuesten Kunden mit exklusiven Inhalten und Angeboten, die sie zu echten Fans machen."
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
            quote="fanCRM hat unsere Kundenansprache revolutioniert. Die Reaktionsrate ist um 40% gestiegen - das spüren wir direkt im Umsatz!"
            name="Thomas Berger"
            role="Marketingleiter"
            company="Kreativ-Werkstatt GmbH"
            imageSrc="https://images.unsplash.com/photo-1534528741702-a0cfae58b707?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1964&q=80"
            metric="40% mehr Engagement"
          />
          <TestimonialCard 
            quote="Die personalisierten E-Mail-Kampagnen waren ein Game-Changer für mein Freelance-Business. Endlich habe ich treue Kunden statt ständig neue akquirieren zu müssen."
            name="Sabine Müller"
            role="Freelance Designerin"
            company="Designstudio SM"
            imageSrc="https://images.unsplash.com/photo-1544005313-94315e28ef70?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1888&q=80"
            metric="25% höhere Öffnungsrate"
          />
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8">
          Häufig gestellte Fragen
        </h2>
        <Accordion type="single" collapsible className="w-full">
          <FAQItem 
            value="question-1"
            question="Was ist fanCRM eigentlich?"
            answer="fanCRM ist ein umfassendes Beziehungsmanagement-System, das speziell für Freelancer und mittelständische Unternehmen entwickelt wurde. Es hilft Ihnen, dauerhafte Beziehungen zu Ihren Kunden und Geschäftspartnern aufzubauen und zu pflegen."
          />
          <FAQItem 
            value="question-2"
            question="Wie hilft mir fanCRM bei der Kundenpflege?"
            answer="fanCRM bietet Tools für persönliche E-Mail-Kampagnen, Social-Media-Management und Kundenbindungsprogramme, die speziell auf Ihre Zielgruppe zugeschnitten sind. So erreichen Sie Ihre Kunden auf eine Weise, die wirklich ankommt."
          />
          <FAQItem 
            value="question-3"
            question="Ist fanCRM kompliziert zu bedienen?"
            answer="Ganz und gar nicht! fanCRM wurde mit einer benutzerfreundlichen Oberfläche entwickelt, die auch ohne IT-Kenntnisse einfach zu bedienen ist. Sie können sofort loslegen und Ihre Kundenbeziehungen verbessern."
          />
          <FAQItem 
            value="question-4"
            question="Lohnt sich fanCRM auch für Einzelunternehmer?"
            answer="Absolut! Gerade für Einzelunternehmer und Freelancer ist Zeit ein kostbares Gut. fanCRM automatisiert zeitraubende Prozesse und hilft Ihnen, sich auf das zu konzentrieren, was wirklich wichtig ist: Ihre Kernkompetenz und den Aufbau echter Kundenbeziehungen."
          />
          <FAQItem 
            value="question-5"
            question="Kann ich fanCRM an meine Branche anpassen?"
            answer="Ja, fanCRM ist hochgradig anpassbar und kann auf die spezifischen Bedürfnisse Ihrer Branche zugeschnitten werden. Egal ob Kreativwirtschaft, Handwerk oder Dienstleistungssektor - fanCRM wächst mit Ihren Anforderungen."
          />
        </Accordion>
      </section>
    </div>
  );
};

export default LandingPage;
