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
          Welcome to fanCRM - Your All-in-One Fan Management System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Connect with your fans like never before. fanCRM provides the tools you need to build lasting relationships.
        </p>
        <div className="flex justify-center">
          <Button asChild size="lg" className="mr-4">
            <Link to="/auth">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/help">Learn More <ArrowRight className="ml-2" /></Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ProblemSolutionCard 
          icon={<Users />} 
          title="Understand Your Audience" 
          isLight 
        />
        <ProblemSolutionCard 
          icon={<HeartHandshake />} 
          title="Personalize Interactions" 
        />
        <ProblemSolutionCard 
          icon={<Sparkles />} 
          title="Boost Engagement" 
          isLight 
        />
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          How fanCRM Can Help You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <UseCaseCard 
            name="Email Marketing"
            description="Send targeted emails to your fans based on their interests and behaviors."
            imageSrc="https://images.unsplash.com/photo-1486312339633-9f21c782918c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2072&q=80"
          />
          <UseCaseCard 
            name="Social Media Management"
            description="Manage all your social media accounts in one place and schedule posts in advance."
            imageSrc="https://images.unsplash.com/photo-1611262584375-531ca3c77941?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
          />
          <UseCaseCard 
            name="Fan Loyalty Programs"
            description="Reward your most loyal fans with exclusive content, discounts, and experiences."
            imageSrc="https://images.unsplash.com/photo-1519389950473-47a04ca018e0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
          />
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          What Our Users Are Saying
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TestimonialCard 
            quote="fanCRM has transformed the way we interact with our fans. Engagement is up 40%!"
            name="Alex Johnson"
            role="Marketing Manager"
            company="Music Co."
            imageSrc="https://images.unsplash.com/photo-1534528741702-a0cfae58b707?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1964&q=80"
            metric="40% Increase"
          />
          <TestimonialCard 
            quote="The personalized email campaigns have been a game-changer. We're seeing a much higher open rate."
            name="Sarah Lee"
            role="Community Director"
            company="Art Collective"
            imageSrc="https://images.unsplash.com/photo-1544005313-94315e28ef70?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1888&q=80"
            metric="25% Higher"
          />
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          <FAQItem 
            value="question-1"
            question="What is fanCRM?"
            answer="fanCRM is a comprehensive fan management system designed to help you build and maintain strong relationships with your fans."
          />
          <FAQItem 
            value="question-2"
            question="How does fanCRM help me engage with my fans?"
            answer="fanCRM provides tools for personalized email campaigns, social media management, and fan loyalty programs to boost engagement."
          />
          <FAQItem 
            value="question-3"
            question="Is fanCRM easy to use?"
            answer="Yes, fanCRM is designed with a user-friendly interface that makes it easy to manage your fan relationships."
          />
        </Accordion>
      </section>
    </div>
  );
};

export default LandingPage;
