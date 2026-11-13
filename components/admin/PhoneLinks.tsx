import { MessageCircle, Phone } from 'lucide-react';
import { telUrl, viberUrl, whatsappUrl } from '@/lib/phone';

const chip =
  'inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/15 hover:bg-primary hover:text-white';

/** Phone number to call, plus WhatsApp and Viber buttons (admin) */
export default function PhoneLinks({ phone, className = '' }: { phone: string; className?: string }) {
  const wa = whatsappUrl(phone);
  const viber = viberUrl(phone);
  return (
    <div className={className}>
      <a href={telUrl(phone)} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
        <Phone className="size-3.5" aria-hidden /> {phone}
      </a>
      {(wa || viber) && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={chip} title={`WhatsApp poruka na ${phone}`}>
              <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
            </a>
          )}
          {viber && (
            <a href={viber} className={chip} title={`Viber poruka na ${phone}`}>
              <MessageCircle className="size-3.5" aria-hidden /> Viber
            </a>
          )}
        </div>
      )}
    </div>
  );
}
