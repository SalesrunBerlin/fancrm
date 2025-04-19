
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Edit } from "lucide-react";
import { Contact } from "@/lib/types/database";

interface ContactCardProps {
  contact: Contact;
  onClick: (id: string) => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  return (
    <Card className="h-full transition-all hover:shadow-md cursor-pointer" onClick={() => onClick(contact.id)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{contact.firstName} {contact.lastName}</CardTitle>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="h-4 w-4 mr-2" />
            <span className="truncate">{contact.email}</span>
          </div>
          
          {contact.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="h-4 w-4 mr-2" />
              <span>{contact.phone}</span>
            </div>
          )}
          
          {contact.accountName && (
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="bg-beauty-light text-beauty-dark border-beauty">
                {contact.accountName}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
