
import { Contact } from "@/lib/types/database";
import { AddressMap } from "@/components/common/AddressMap";

interface ContactInfoProps {
  contact: Contact;
  ownerName: string | null;
}

export function ContactInfo({ contact, ownerName }: ContactInfoProps) {
  // Adresstext für direkte Geokodierung, falls Koordinaten fehlen
  const fullAddress = contact.street && contact.city && contact.postal_code
    ? `${contact.street}, ${contact.postal_code} ${contact.city}, ${contact.country || 'Germany'}`
    : null;

  const hasAddressData = !!(contact.street || contact.city || contact.postal_code || contact.country);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        {hasAddressData && (
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Address</h3>
            <div className="space-y-2">
              <div>
                <strong>Street:</strong> {contact.street || '-'}
              </div>
              <div>
                <strong>City:</strong> {contact.city || '-'}
              </div>
              <div>
                <strong>Postal Code:</strong> {contact.postal_code || '-'}
              </div>
              <div>
                <strong>Country:</strong> {contact.country || 'Germany'}
              </div>
            </div>
          </div>
        )}
      </div>
      {hasAddressData && (
        <div className="relative" style={{ minHeight: "200px", zIndex: 30 }}>
          <h3 className="text-lg font-semibold mb-2">Location</h3>
          <AddressMap 
            latitude={contact.latitude} 
            longitude={contact.longitude}
            address={fullAddress || undefined}
            className="h-[200px] w-full"
          />
        </div>
      )}
    </div>
  );
}
