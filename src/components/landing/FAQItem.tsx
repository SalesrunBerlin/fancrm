
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
  value: string;
}

export const FAQItem = ({ question, answer, value }: FAQItemProps) => {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-left font-medium text-lg">{question}</AccordionTrigger>
      <AccordionContent className="text-muted-foreground text-base">{answer}</AccordionContent>
    </AccordionItem>
  );
};
