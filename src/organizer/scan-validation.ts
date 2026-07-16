import type { BackendTicketScanAudit } from '../backend';

type ScanValidationInput = {
  audit: BackendTicketScanAudit;
  ticket: {
    code: string;
    holderName: string;
    seat: string;
    tierKey?: string;
    pricePaid?: number;
    event: { title: string; date: string; location?: string; organizer?: string };
  };
};

export type ScanValidationDetails = {
  auditId: string;
  code: string;
  holderName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventOrganizer: string;
  seat: string;
  ticketTier: string;
  pricePaidLabel: string;
  gate: string;
  scannerName: string;
  scannerRole: string;
  sourceLabel: string;
  outcome: BackendTicketScanAudit['outcome'];
  scannedAtIso: string;
  scannedAtLabel: string;
};

export function buildScanValidationDetails({ audit, ticket }: ScanValidationInput): ScanValidationDetails {
  const scannedAt = new Date(audit.scannedAt);

  return {
    auditId: audit.id,
    code: ticket.code,
    holderName: ticket.holderName,
    eventTitle: ticket.event.title,
    eventDate: ticket.event.date,
    eventLocation: ticket.event.location ?? 'Lieu non renseigné',
    eventOrganizer: ticket.event.organizer ?? 'Organisateur non renseigné',
    seat: ticket.seat,
    ticketTier: ticket.tierKey === 'vip' ? 'VIP' : 'Standard',
    pricePaidLabel: typeof ticket.pricePaid === 'number' ? `${ticket.pricePaid.toLocaleString('fr-FR')} FC` : 'Non renseigné',
    gate: audit.gate,
    scannerName: audit.scannerName,
    scannerRole: audit.scannerRole,
    sourceLabel: audit.source === 'qr' ? 'QR' : 'Code manuel',
    outcome: audit.outcome,
    scannedAtIso: audit.scannedAt,
    scannedAtLabel: new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(scannedAt),
  };
}
