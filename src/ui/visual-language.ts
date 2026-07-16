export type VisualTone = 'orange' | 'green' | 'yellow' | 'blue' | 'ink' | 'red';
export type PictogramKey =
  | 'music'
  | 'talk'
  | 'night'
  | 'sport'
  | 'celebrate'
  | 'people'
  | 'art'
  | 'learn'
  | 'check'
  | 'history'
  | 'blocked'
  | 'search'
  | 'ticket'
  | 'scan'
  | 'map'
  | 'help'
  | 'profile'
  | 'bell'
  | 'speaker';

export type VisualDescriptor = {
  key: PictogramKey;
  label: string;
  tone: VisualTone;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function getCategoryVisual(category: string): VisualDescriptor {
  const key = normalize(category);
  if (key.includes('concert') || key.includes('music')) return { key: 'music', label: 'Musique', tone: 'orange' };
  if (key.includes('conference') || key.includes('talk')) return { key: 'talk', label: 'Conférences', tone: 'blue' };
  if (key.includes('soiree') || key.includes('night')) return { key: 'night', label: 'Soirée', tone: 'ink' };
  if (key.includes('sport')) return { key: 'sport', label: 'Sport', tone: 'green' };
  if (key.includes('festival')) return { key: 'celebrate', label: 'Festival', tone: 'yellow' };
  if (key.includes('meetup')) return { key: 'people', label: 'Rencontre', tone: 'blue' };
  if (key.includes('exhibition') || key.includes('expo')) return { key: 'art', label: 'Expo', tone: 'red' };
  if (key.includes('workshop') || key.includes('atelier')) return { key: 'learn', label: 'Atelier', tone: 'green' };
  return { key: 'celebrate', label: category || 'Sortie', tone: 'orange' };
}

export function getTicketVisual(status: 'valid' | 'used' | 'cancelled') {
  if (status === 'valid') return { key: 'check' as const, label: 'Prêt', hint: 'Montre le QR', tone: 'green' as const };
  if (status === 'used') return { key: 'history' as const, label: 'Passé', hint: 'Déjà entré', tone: 'ink' as const };
  return { key: 'blocked' as const, label: 'Annulé', hint: 'N’entre pas', tone: 'red' as const };
}

export type ActionName = 'discover' | 'tickets' | 'scan' | 'nearby' | 'help' | 'profile' | 'alerts';

export function getActionVisual(action: ActionName): VisualDescriptor {
  const actions: Record<ActionName, VisualDescriptor> = {
    discover: { key: 'search', label: 'Trouver', tone: 'orange' },
    tickets: { key: 'ticket', label: 'Mes QR', tone: 'blue' },
    scan: { key: 'scan', label: 'Scanner', tone: 'green' },
    nearby: { key: 'map', label: 'Près de moi', tone: 'yellow' },
    help: { key: 'help', label: 'Aide', tone: 'blue' },
    profile: { key: 'profile', label: 'Mon compte', tone: 'ink' },
    alerts: { key: 'bell', label: 'Alertes', tone: 'orange' },
  };
  return actions[action];
}

export type ScanOutcome = 'checked_in' | 'already_used' | 'cancelled' | 'not_found';

export function getScanOutcomeVisual(outcome: ScanOutcome) {
  if (outcome === 'checked_in') return { key: 'check' as const, label: 'ENTRE', hint: 'Scanner le suivant', tone: 'green' as const };
  if (outcome === 'already_used') return { key: 'history' as const, label: 'DÉJÀ PASSÉ', hint: 'Vérifier le nom', tone: 'yellow' as const };
  if (outcome === 'cancelled') return { key: 'blocked' as const, label: 'BLOQUÉ', hint: 'Refuser l’entrée', tone: 'red' as const };
  return { key: 'help' as const, label: 'INCONNU', hint: 'Entrer le code', tone: 'red' as const };
}
