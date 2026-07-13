import type { BackendEvent } from './backend';
import { buildRelatedEvents, type RelatedEvent } from './recommendations';

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function parsePriceValue(price: string) {
  const value = Number(price.replace(/[^\d]/g, ''));
  return Number.isFinite(value) ? value : 0;
}

function formatMoney(value: number) {
  return `${value.toLocaleString('fr-FR')} FC`;
}

export type EventDetailFact = {
  label: string;
  value: string;
};

export type EventDetailInsight = {
  label: string;
  value: string;
  copy: string;
};

export type EventDetailTimelineStep = {
  time: string;
  title: string;
  description: string;
};

export type EventDetailFaq = {
  question: string;
  answer: string;
};

export type EventDetailModel = {
  accent: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  heroBadge: string;
  title: string;
  subtitle: string;
  facts: EventDetailFact[];
  insights: EventDetailInsight[];
  timeline: EventDetailTimelineStep[];
  faqs: EventDetailFaq[];
  relatedEvents: RelatedEvent[];
};

const ACCENT_BY_CATEGORY: Record<string, string> = {
  concerts: '#F2643B',
  conferences: '#D71F27',
  soirees: '#4D8F6A',
  sport: '#F6C35B',
  festivals: '#7AA7FF',
};

function getAccent(event: BackendEvent) {
  return ACCENT_BY_CATEGORY[normalizeText(event.category)] ?? event.color;
}

function categoryAudience(event: BackendEvent) {
  const category = normalizeText(event.category);
  if (category.includes('concert')) return 'Fans, groups of friends, and live music regulars.';
  if (category.includes('conference')) return 'Professionals, founders, and curious operators.';
  if (category.includes('soir')) return 'Night-out crowds who want an easy, fast entry.';
  if (category.includes('sport')) return 'Families, supporters, and neighborhood teams.';
  if (category.includes('festival')) return 'People who want a full-day cultural outing.';
  return 'Anyone looking for a clear, mobile-first event.';
}

function eventMomentum(event: BackendEvent) {
  const category = normalizeText(event.category);
  if (category.includes('concert')) return 'High-demand live slot.';
  if (category.includes('conference')) return 'Structured agenda with strong professional pull.';
  if (category.includes('soir')) return 'Late-night energy with quick entry pressure.';
  if (category.includes('sport')) return 'Community turnout with family-friendly pacing.';
  if (category.includes('festival')) return 'Multi-hour experience with many possible touchpoints.';
  return 'Popular local event format.';
}

function venueStyle(event: BackendEvent) {
  const category = normalizeText(event.category);
  if (category.includes('concert')) return 'Standing crowd, strong sound, and photo moments.';
  if (category.includes('conference')) return 'Seated flow, keynote blocks, and breaks.';
  if (category.includes('soir')) return 'Entry control, music-first atmosphere, and late exits.';
  if (category.includes('sport')) return 'Open circulation and easier group arrivals.';
  if (category.includes('festival')) return 'Browse, pause, and move between highlights.';
  return 'Simple access, clear scan flow, and mobile ticketing.';
}

function formatEventTime(event: BackendEvent) {
  const seed = event.id.length + event.title.length + event.category.length;
  const hour = 18 + (seed % 3);
  return `${hour}h00`;
}

function formatArrivalTime(event: BackendEvent) {
  const match = formatEventTime(event).match(/^(\d{1,2})h00$/);
  if (!match) {
    return '30 min before start';
  }

  const hour = Number(match[1]);
  return `${Math.max(hour - 1, 0)}h30`;
}

function buildTimeline(event: BackendEvent): EventDetailTimelineStep[] {
  const category = normalizeText(event.category);

  if (category.includes('concert')) {
    return [
      { time: '18h00', title: 'Doors open', description: 'Entry, QR scans, and early arrivals settle in.' },
      { time: '19h00', title: 'Opening act', description: 'Warm-up, first impressions, and the room builds.' },
      { time: '20h30', title: 'Headliner', description: 'The main live set, where the crowd is fully in.' },
      { time: '22h00', title: 'Finale', description: 'Last songs, photos, and a smoother exit.' },
    ];
  }

  if (category.includes('conference')) {
    return [
      { time: '08h30', title: 'Check-in', description: 'Badges, networking, and a first scan at the door.' },
      { time: '09h30', title: 'Opening keynote', description: 'The main idea that frames the day.' },
      { time: '11h00', title: 'Panels and workshops', description: 'Practical sessions with structured breaks.' },
      { time: '16h30', title: 'Closing networking', description: 'Wrap-up conversations and follow-up contacts.' },
    ];
  }

  if (category.includes('sport')) {
    return [
      { time: '15h00', title: 'Gate opening', description: 'Fans arrive and the venue starts to fill.' },
      { time: '16h00', title: 'Warm-up', description: 'Players, teams, and the crowd settle in.' },
      { time: '17h00', title: 'Main match', description: 'The central moment of the event.' },
      { time: '18h45', title: 'Awards', description: 'Photos, applause, and the closing moment.' },
    ];
  }

  if (category.includes('soir')) {
    return [
      { time: '21h00', title: 'Doors open', description: 'Entry, coat check, and first drinks.' },
      { time: '22h00', title: 'Warm-up set', description: 'The room builds tempo before the peak.' },
      { time: '00h00', title: 'Peak session', description: 'The strongest moment of the night.' },
      { time: '02h00', title: 'After hours', description: 'Final tracks and a clean close-out.' },
    ];
  }

  return [
    { time: '10h00', title: 'Opening', description: 'Guests arrive and start exploring.' },
    { time: '12h00', title: 'Main moment', description: 'The central performance or talk begins.' },
    { time: '15h00', title: 'Second highlight', description: 'Another key experience in the schedule.' },
    { time: '18h00', title: 'Wrap-up', description: 'Final visits before departure.' },
  ];
}

function buildFaq(event: BackendEvent): EventDetailFaq[] {
  const isFree = parsePriceValue(event.price) === 0;

  return [
    {
      question: 'Will I get my ticket right away?',
      answer: 'Yes. Once the reservation is confirmed, the ticket appears in your wallet with a QR code.',
    },
    {
      question: 'Can I buy more than one ticket?',
      answer: 'Not on this version yet, but the flow is ready to grow into multiple ticket quantities.',
    },
    {
      question: 'Is there a refund policy?',
      answer: 'That depends on the organizer. We can surface it here once the event provides it.',
    },
    {
      question: isFree ? 'Do I pay at the door?' : 'Is the shown price final?',
      answer: isFree
        ? 'No. This event is free, so reserving it is enough to generate the pass.'
        : 'The listed price is the standard ticket. Reservation takes you into the checkout flow.',
    },
  ];
}

export function buildEventDetailModel(event: BackendEvent, allEvents: BackendEvent[]): EventDetailModel {
  const accent = getAccent(event);
  const priceValue = parsePriceValue(event.price);
  const isFree = priceValue === 0;

  return {
    accent,
    primaryActionLabel: isFree ? 'Reserve free ticket' : 'Reserve tickets',
    secondaryActionLabel: 'Back to discovery',
    heroBadge: event.category,
    title: event.title,
    subtitle: event.description,
    facts: [
      { label: 'Date', value: event.date },
      { label: 'Location', value: event.location },
      { label: 'Organizer', value: event.organizer },
      { label: 'Price', value: event.price },
      { label: 'Start', value: formatEventTime(event) },
      { label: 'Entry', value: formatArrivalTime(event) },
    ],
    insights: [
      {
        label: 'Audience',
        value: categoryAudience(event),
        copy: 'A quick read on who this event is naturally built for.',
      },
      {
        label: 'Momentum',
        value: eventMomentum(event),
        copy: 'The kind of demand and energy the UI should signal up front.',
      },
      {
        label: 'Format',
        value: venueStyle(event),
        copy: 'What the user should expect once they get to the venue.',
      },
    ],
    timeline: buildTimeline(event),
    faqs: buildFaq(event),
    relatedEvents: buildRelatedEvents(event, allEvents),
  };
}

export { formatEventTime, formatArrivalTime, formatMoney };
