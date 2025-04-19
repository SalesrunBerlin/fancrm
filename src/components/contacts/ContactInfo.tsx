
import { Contact } from "@/lib/types/database";

interface ContactInfoProps {
  contact: Contact;
  ownerName: string | null;
}

export function ContactInfo({ contact, ownerName }: ContactInfoProps) {
  return (
    <div className="space-y-4">
      <div>
        <strong>Name:</strong> {contact.firstName} {contact.lastName}
      </div>
      <div>
        <strong>Email:</strong> {contact.email || '-'}
      </div>
      <div>
        <strong>Phone:</strong> {contact.phone || '-'}
      </div>
      <div>
        <strong>Account:</strong> {contact.accountName || '-'}
      </div>
      {ownerName && (
        <div>
          <strong>Owner:</strong> {ownerName}
        </div>
      )}
    </div>
  );
}
