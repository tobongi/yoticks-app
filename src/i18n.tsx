import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'fr' | 'en';

interface TranslationTree {
  [key: string]: string | TranslationTree;
}

type I18nState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const STORAGE_KEY = 'yoticks.locale';

const fr = {
  tabs: {
    explore: 'Explorer',
    tickets: 'Mes billets',
    search: 'Recherche',
    profile: 'Profil',
  },
  profile: {
    title: 'Profil',
    organizerAccount: 'Compte organisateur',
    attendeeAccount: 'Compte visiteur',
    edit: 'Modifier',
    ticketsPurchased: 'Billets achetés',
    eventsFollowed: 'Événements suivis',
    citiesVisited: 'Villes visitées',
    savedTitle: 'Enregistrés',
    savedCopy: 'Les événements que tu veux garder sous la main.',
    savedEmpty: 'Aucun événement enregistré pour le moment.',
    savedRemove: 'Retirer',
    languageTitle: "Langue de l'application",
    languageNote: 'Choisis la langue de navigation de YoTicks.',
    languageFrench: 'Français',
    languageEnglish: 'Anglais',
    orders: 'Historique achats',
    organizer: 'Espace organisateur',
    organizerValue: 'Demo',
    notifications: 'Notifications',
    help: 'Aide & Support',
    about: 'À propos de YoTicks',
    logout: 'Se déconnecter',
    alerts: {
      profileTitle: 'Profil',
      profileSoon: 'Mets à jour ton nom et ton email ici.',
      notificationsTitle: 'Notifications',
      notificationsSoon: 'Les rappels de billets et les mises à jour de paiement sont actifs.',
      helpTitle: 'Aide & Support',
      helpSoon: 'Le support est joignable par email avec votre code billet.',
      aboutTitle: 'À propos de YoTicks',
    },
  },
  saved: {
    save: 'Enregistrer',
    saved: 'Enregistré',
  },
  home: {
    brandSub: 'Billetterie live, claire et directe.',
    heroEyebrow: '{city} maintenant • programmation live',
    heroTitle: 'Trouvez le billet qui vaut vraiment le déplacement.',
    heroCopy: 'Concerts, conférences, soirées et festivals présentés comme un vrai agenda, pas comme un catalogue poussé.',
    personalizedBannerFallback: 'Toutes catégories',
    allCities: 'Toutes les villes',
    allCategories: 'Toutes catégories',
    citySelectorEyebrow: 'Ville',
    citySelectorTitle: 'Choisissez votre ville',
    citySelectorCopy: 'Les recommandations, les résultats et les suggestions se recalibrent instantanément.',
    citySelectorSelected: 'Sélectionnée',
    citySelectorChoose: 'Choisir',
    quickFilterEyebrow: 'Filtre rapide',
    quickFilterTitle: 'Affiner le feed',
    quickFilterCopy: 'Choisis une ville et une catégorie pour recalibrer la programmation.',
    quickFilterCities: 'Villes',
    quickFilterCategories: 'Catégories',
    quickFilterReset: 'Tout réinitialiser',
    statsEvents: 'Événements live',
    statsTonight: 'Ce soir',
    statsCities: 'Villes',
    curatedEyebrow: 'À la carte',
    curatedTitle: 'Des pistes rapides pour commencer.',
    fastPickEyebrow: 'Rapide',
    fastPickTitle: 'Événements gratuits',
    fastPickCopy: 'Des plans simples à ouvrir tout de suite.',
    fastPickMeta: 'Pas de billet à payer',
    liveMusicEyebrow: 'Ce soir',
    liveMusicTitle: 'Musique live',
    liveMusicCopy: 'Concerts et soirées à forte traction.',
    liveMusicMeta: 'Bien après la tombée de la nuit',
    workModeEyebrow: 'Travail',
    workModeTitle: 'Conférences et talks',
    workModeCopy: 'Panels, networking et sessions utiles.',
    workModeMeta: 'Des idées qui valent le trajet',
    spotlightLabel: 'Réservation vedette',
    spotlightCta: 'Ouvrir le pass',
    searchPlaceholder: 'Titre, ville, organisateur...',
    searchHint: 'Utilise une ville, un artiste, un organisateur ou un type d’événement.',
    thisWeekEyebrow: 'Cette semaine',
    thisWeekTitle: "Compose un plan en un coup d'œil",
    thisWeekCopy: 'Un rail plus éditorial pour comparer vite avant d’ouvrir un événement.',
    groundEyebrow: 'Réseau terrain',
    groundTitle: 'Couverture des communes de Kinshasa',
    groundCopy: 'Une couverture partenaire au niveau des communes, basée sur les communes officielles de Kinshasa.',
    communeFootnote: '{count} communes officielles couvertes. Matonge reste rattaché à Kalamu, pas considéré comme une commune séparée.',
    priorityEyebrow: 'Accès prioritaire',
    priorityTitle: 'À la une',
    priorityCopy: 'Les événements qui tirent le plus, affichés comme cartes premium.',
    openTicket: 'Ouvrir le billet',
    nextDropsEyebrow: 'Prochainement',
    nextDropsTitle: 'Événements proches',
    nextDropsCopy: 'Des événements encore assez proches pour rester planifiables.',
    noFilterTitle: 'Rien ne reste dans ce filtre',
    noFilterCopy: 'Essaie une autre catégorie ou efface la recherche pour retrouver la programmation.',
  },
  onboarding: {
    brandSub: 'Configuration rapide',
    skip: 'Passer',
    step1Eyebrow: 'Étape 1 sur 3',
    step1Title: 'Choisis les événements que tu veux vraiment voir.',
    step1Copy: 'Nous ajustons le feed autour des catégories qui comptent le plus pour toi.',
    step2Eyebrow: 'Étape 2 sur 3',
    step2Title: 'Choisis ta ville pour rendre les recommandations immédiates.',
    step2Copy: 'Le feed fonctionne mieux quand il sait où tu es.',
    step3Eyebrow: 'Étape 3 sur 3',
    step3Title: 'Prévisualise ton feed avant de commencer.',
    step3Copy: 'Un aperçu rapide des événements qui monteront en haut sur YoTicks.',
    popularCategories: 'Catégories populaires',
    currentSetup: 'Ta configuration actuelle',
    currentSetupCopy: 'Nous nous en servons pour prioriser le feed principal, les suggestions de recherche et les événements mis en avant.',
    cityLabel: 'Ville',
    cityMeta: 'Événements disponibles',
    citySelected: 'Sélectionnée',
    cityChoose: 'Choisir',
    cityNote: 'Les événements locaux passent en premier pour que le feed paraisse immédiat plutôt que générique.',
    previewLead: 'Nous utiliserons ces choix pour faire remonter plus vite les bons événements.',
    readyLabel: 'Prévisualisation',
    back: 'Retour',
    next: 'Suivant',
    saving: 'Enregistrement...',
    startExploring: 'Commencer',
  },
  search: {
    title: 'Recherche',
    placeholder: 'Event, artiste, ville...',
    summaryEyebrow: 'Aperçu recherche',
    summaryTitleWithQuery: '{count} résultats pour "{query}"',
    summaryTitleEmpty: 'Commence à taper pour parcourir la programmation',
    summaryCopyWithQuery: 'Une découverte inspirée des grandes plateformes, avec suggestions, villes et catégories.',
    summaryCopyEmpty: "Essaie une ville, un artiste, un organisateur ou un type d'événement.",
    recognizedWords: 'Mots reconnus',
    predictions: 'Prédictions',
    trends: 'Tendances',
    browseByCity: 'Explorer par ville',
    cityEvents: '{count} événements',
    results: 'Résultats',
    matches: 'Correspondances',
    matchAll: 'tout',
    matchTitle: 'titre',
    matchLocation: 'lieu',
    matchCategory: 'catégorie',
    matchOrganizer: 'organisateur',
    matchDescription: 'description',
    emptyTitle: 'Aucun résultat pour le moment',
    emptyCopy: "Essaie une autre ville, un autre type d'événement ou un autre organisateur.",
  },
  eventDetail: {
    back: 'Retour',
    status: "Détails de l'événement",
    backToDiscovery: 'Retour à la découverte',
    whyItWorksEyebrow: 'Pourquoi ça marche',
    whyItWorksTitle: "L'événement en un coup d'œil",
    whyItWorksCopy: 'La page de détail doit répondre aux trois questions qu’on se pose avant de réserver.',
    audienceCopy: 'Lecture rapide du public pour lequel cet événement est pensé.',
    momentumCopy: "Le niveau de demande et d'énergie que l'interface doit signaler.",
    formatCopy: "Ce que l'utilisateur peut attendre sur place.",
    scheduleEyebrow: 'Programme',
    scheduleTitle: 'À quoi ressemble la journée',
    scheduleCopy: 'Une timeline concise pour rendre l’événement concret, pas seulement promotionnel.',
    faqEyebrow: 'Questions',
    faqTitle: 'Réponses rapides avant la réservation',
    faqCopy: "Les questions qu'Eventbrite affiche souvent, adaptées au parcours YoTicks.",
    relatedEyebrow: 'Similaires',
    relatedTitle: 'Picks proches',
    relatedCopy: "Un petit rail éditorial pour garder l'utilisateur dans la découverte.",
    emptyEyebrow: 'Détails événement',
    emptyTitle: 'Événement introuvable.',
    emptyCopy: "Cet événement n'est pas disponible pour le moment. Retourne à la découverte et choisis un autre événement.",
    primaryAction: 'Retour à la découverte',
    reserveTicket: 'Réserver le billet',
    reserveTickets: 'Réserver des billets',
    audienceLabel: 'Audience',
    momentumLabel: 'Momentum',
    formatLabel: 'Format',
    factDate: 'Date',
    factLocation: 'Lieu',
    factOrganizer: 'Organisateur',
    factPrice: 'Prix',
    factStart: 'Début',
    factEntry: 'Entrée',
    timelineDoorsOpen: 'Ouverture des portes',
    timelineOpeningAct: 'Première partie',
    timelineHeadliner: "Tête d'affiche",
    timelineFinale: 'Finale',
    timelineCheckIn: 'Enregistrement',
    timelineKeynote: "Keynote d'ouverture",
    timelinePanels: 'Panels et ateliers',
    timelineNetworking: 'Networking de clôture',
    timelineGateOpening: 'Ouverture des portes',
    timelineWarmup: 'Échauffement',
    timelineMatch: 'Match principal',
    timelineAwards: 'Remise des trophées',
    timelineDoorsOpenNight: 'Ouverture des portes',
    timelineWarmupSet: "Set d'échauffement",
    timelinePeakSession: 'Moment fort',
    timelineAfterHours: 'After hours',
    timelineOpening: 'Ouverture',
    timelineMainMoment: 'Moment principal',
    timelineSecondHighlight: 'Second temps fort',
    timelineWrapUp: 'Clôture',
    faqTicket: 'Recevrai-je mon billet tout de suite ?',
    faqMultiple: 'Puis-je acheter plusieurs billets ?',
    faqRefund: 'Y a-t-il une politique de remboursement ?',
    faqPaid: 'Le prix affiché est-il final ?',
    faqFree: "Dois-je payer à l'entrée ?",
    faqTicketAnswer: 'Oui. Une fois la réservation confirmée, le billet apparaît dans votre portefeuille avec un QR code.',
    faqMultipleAnswer: "Pas encore sur cette version, mais le flux est prêt pour une quantité multiple de billets.",
    faqRefundAnswer: "Cela dépend de l'organisateur. Nous pouvons l'afficher ici dès qu'il la fournit.",
    faqPaidAnswer: 'Le prix affiché correspond au billet standard. La réservation vous emmène vers le paiement.',
    faqFreeAnswer: 'Non. Cet événement est gratuit, il suffit de réserver pour générer le pass.',
    relatedReason: 'Suggestion proche',
  },
} satisfies TranslationTree;

const en = {
  tabs: {
    explore: 'Explore',
    tickets: 'My Tickets',
    search: 'Search',
    profile: 'Profile',
  },
  profile: {
    title: 'Profile',
    organizerAccount: 'Organizer account',
    attendeeAccount: 'Guest account',
    edit: 'Edit',
    ticketsPurchased: 'Tickets bought',
    eventsFollowed: 'Events followed',
    citiesVisited: 'Cities visited',
    savedTitle: 'Saved',
    savedCopy: 'The events you want to keep close.',
    savedEmpty: 'No saved events yet.',
    savedRemove: 'Remove',
    languageTitle: 'App language',
    languageNote: 'Choose the navigation language used across YoTicks.',
    languageFrench: 'French',
    languageEnglish: 'English',
    orders: 'Order history',
    organizer: 'Organizer hub',
    organizerValue: 'Demo',
    notifications: 'Notifications',
    help: 'Help & Support',
    about: 'About YoTicks',
    logout: 'Sign out',
    alerts: {
      profileTitle: 'Profile',
      profileSoon: 'Update your name and email here.',
      notificationsTitle: 'Notifications',
      notificationsSoon: 'Ticket reminders and payment updates are active.',
      helpTitle: 'Help & Support',
      helpSoon: 'Support is available by email with your ticket code.',
      aboutTitle: 'About YoTicks',
    },
  },
  saved: {
    save: 'Save',
    saved: 'Saved',
  },
  home: {
    brandSub: 'Live ticketing, clearer and direct.',
    heroEyebrow: '{city} now • live line-up',
    heroTitle: 'Find the ticket that is actually worth the trip.',
    heroCopy: 'Concerts, conferences, nights, and festivals arranged like a real schedule, not a catalogue dump.',
    personalizedBannerFallback: 'All categories',
    allCities: 'All cities',
    allCategories: 'All categories',
    citySelectorEyebrow: 'City',
    citySelectorTitle: 'Choose your city',
    citySelectorCopy: 'Recommendations, results, and suggestions recalculate instantly.',
    citySelectorSelected: 'Selected',
    citySelectorChoose: 'Choose',
    quickFilterEyebrow: 'Quick filter',
    quickFilterTitle: 'Refine the feed',
    quickFilterCopy: 'Pick a city and a category to recalibrate the lineup.',
    quickFilterCities: 'Cities',
    quickFilterCategories: 'Categories',
    quickFilterReset: 'Reset all',
    statsEvents: 'Events live',
    statsTonight: 'Tonight',
    statsCities: 'Cities',
    curatedEyebrow: 'Curated like a marketplace',
    curatedTitle: 'A few smart ways to start browsing.',
    fastPickEyebrow: 'Fast pick',
    fastPickTitle: 'Free events',
    fastPickCopy: 'Low-friction plans you can open quickly.',
    fastPickMeta: 'No ticket cost',
    liveMusicEyebrow: 'Tonight',
    liveMusicTitle: 'Live music',
    liveMusicCopy: 'Concerts and night events with strong pull.',
    liveMusicMeta: 'Best for after dark',
    workModeEyebrow: 'Work mode',
    workModeTitle: 'Talks & conferences',
    workModeCopy: 'Panels, networking, and useful sessions.',
    workModeMeta: 'Ideas worth the trip',
    spotlightLabel: 'Spotlight reservation',
    spotlightCta: 'Open pass',
    searchPlaceholder: 'Title, city, organizer...',
    searchHint: 'Use a city, artist, organizer, or event type.',
    thisWeekEyebrow: 'This week',
    thisWeekTitle: 'Build a plan in one glance',
    thisWeekCopy: 'A tighter, more editorial rail for people who want to compare quickly before opening a full event.',
    groundEyebrow: 'Ground network',
    groundTitle: 'Kinshasa commune coverage',
    groundCopy: 'Real commune-level partner coverage across the city, seeded with official Kinshasa communes.',
    communeFootnote: '{count} official communes covered. Matonge stays treated as a neighborhood inside Kalamu, not as a separate commune.',
    priorityEyebrow: 'Priority access',
    priorityTitle: 'Featured',
    priorityCopy: 'The events with the strongest pull, surfaced as premium cards.',
    openTicket: 'Open ticket',
    nextDropsEyebrow: 'Next drops',
    nextDropsTitle: 'Upcoming',
    nextDropsCopy: 'Events that still feel close enough to plan around.',
    noFilterTitle: 'Nothing left in this filter',
    noFilterCopy: 'Try another category or clear the search to bring the lineup back.',
  },
  onboarding: {
    brandSub: 'Quick setup',
    skip: 'Skip',
    step1Eyebrow: 'Step 1 of 3',
    step1Title: 'Choose the events you actually want to see.',
    step1Copy: 'We will tune the feed around the categories that matter most to you.',
    step2Eyebrow: 'Step 2 of 3',
    step2Title: 'Set your city so local events feel immediate.',
    step2Copy: 'The feed works best when it knows where you are.',
    step3Eyebrow: 'Step 3 of 3',
    step3Title: 'Preview your feed before you jump in.',
    step3Copy: 'A quick snapshot of the events that will rise to the top in YoTicks.',
    popularCategories: 'Popular categories',
    currentSetup: 'Your current setup',
    currentSetupCopy: 'We will use this to prioritize the home feed, search suggestions, and featured events.',
    cityLabel: 'City',
    cityMeta: 'events available',
    citySelected: 'Selected',
    cityChoose: 'Choose',
    cityNote: 'Local events rise first, so the feed feels immediate instead of generic.',
    previewLead: 'We will use your picks to highlight the right events faster.',
    readyLabel: 'Preview',
    back: 'Back',
    next: 'Next',
    saving: 'Saving...',
    startExploring: 'Start exploring',
  },
  search: {
    title: 'Search',
    placeholder: 'Event, artist, city...',
    summaryEyebrow: 'Search preview',
    summaryTitleWithQuery: '{count} results for "{query}"',
    summaryTitleEmpty: 'Start typing to browse the lineup',
    summaryCopyWithQuery: 'Eventbrite-style discovery with suggestions, cities, and category matches.',
    summaryCopyEmpty: 'Try a city, artist, organizer, or event type to narrow the feed.',
    recognizedWords: 'Recognized words',
    predictions: 'Predictions',
    trends: 'Trending',
    browseByCity: 'Browse by city',
    cityEvents: '{count} events',
    results: 'Results',
    matches: 'Matches',
    matchAll: 'all',
    matchTitle: 'title',
    matchLocation: 'location',
    matchCategory: 'category',
    matchOrganizer: 'organizer',
    matchDescription: 'description',
    emptyTitle: 'No matches yet',
    emptyCopy: 'Try a different city, event type, or organizer to bring the lineup back.',
  },
  eventDetail: {
    back: 'Back',
    status: 'Event details',
    backToDiscovery: 'Back to discovery',
    whyItWorksEyebrow: 'Why it works',
    whyItWorksTitle: 'The event in one glance',
    whyItWorksCopy: 'The detail page should answer the three questions people ask before they tap reserve.',
    audienceCopy: 'A quick read on who this event is naturally built for.',
    momentumCopy: 'The kind of demand and energy the UI should signal up front.',
    formatCopy: 'What the user should expect once they get to the venue.',
    scheduleEyebrow: 'Schedule',
    scheduleTitle: 'What the day feels like',
    scheduleCopy: 'A compact timeline that makes the event feel concrete, not just promotional.',
    faqEyebrow: 'Questions',
    faqTitle: 'Fast answers before checkout',
    faqCopy: 'The same questions Eventbrite surfaces, but tuned for the YoTicks booking path.',
    relatedEyebrow: 'Related',
    relatedTitle: 'Similar picks nearby',
    relatedCopy: 'A small editorial rail that keeps the user in the discovery loop.',
    emptyEyebrow: 'Event details',
    emptyTitle: 'Event not found.',
    emptyCopy: 'This event is not available right now. Go back to discovery and pick another one.',
    primaryAction: 'Back to discovery',
    reserveTicket: 'Reserve free ticket',
    reserveTickets: 'Reserve tickets',
    audienceLabel: 'Audience',
    momentumLabel: 'Momentum',
    formatLabel: 'Format',
    factDate: 'Date',
    factLocation: 'Location',
    factOrganizer: 'Organizer',
    factPrice: 'Price',
    factStart: 'Start',
    factEntry: 'Entry',
    timelineDoorsOpen: 'Doors open',
    timelineOpeningAct: 'Opening act',
    timelineHeadliner: 'Headliner',
    timelineFinale: 'Finale',
    timelineCheckIn: 'Check-in',
    timelineKeynote: 'Opening keynote',
    timelinePanels: 'Panels and workshops',
    timelineNetworking: 'Closing networking',
    timelineGateOpening: 'Gate opening',
    timelineWarmup: 'Warm-up',
    timelineMatch: 'Main match',
    timelineAwards: 'Awards',
    timelineDoorsOpenNight: 'Doors open',
    timelineWarmupSet: 'Warm-up set',
    timelinePeakSession: 'Peak session',
    timelineAfterHours: 'After hours',
    timelineOpening: 'Opening',
    timelineMainMoment: 'Main moment',
    timelineSecondHighlight: 'Second highlight',
    timelineWrapUp: 'Wrap-up',
    faqTicket: 'Will I get my ticket right away?',
    faqMultiple: 'Can I buy more than one ticket?',
    faqRefund: 'Is there a refund policy?',
    faqPaid: 'Is the shown price final?',
    faqFree: 'Do I pay at the door?',
    faqTicketAnswer: 'Yes. Once the reservation is confirmed, the ticket appears in your wallet with a QR code.',
    faqMultipleAnswer: 'Not on this version yet, but the flow is ready to grow into multiple ticket quantities.',
    faqRefundAnswer: 'That depends on the organizer. We can surface it here once the event provides it.',
    faqPaidAnswer: 'The listed price is the standard ticket. Reservation takes you into the checkout flow.',
    faqFreeAnswer: 'No. This event is free, so reserving it is enough to generate the pass.',
    relatedReason: 'Nearby suggestion',
  },
} satisfies TranslationTree;

const translations: Record<Locale, TranslationTree> = { fr, en };

const I18nContext = createContext<I18nState | null>(null);

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) {
    return 'fr';
  }

  const normalized = value.toLowerCase().trim();
  if (normalized.startsWith('en')) {
    return 'en';
  }

  return 'fr';
}

function resolveTranslation(locale: Locale, key: string): string | undefined {
  const walk = (tree: TranslationTree): string | undefined => {
    const keys = key.split('.');
    let value: string | TranslationTree | undefined = tree;

    for (const currentKey of keys) {
      if (!value || typeof value === 'string') {
        return undefined;
      }
      value = value[currentKey];
    }

    return typeof value === 'string' ? value : undefined;
  };

  return walk(translations[locale]) ?? (locale !== 'fr' ? walk(translations.fr) : undefined);
}

export const __testResolve = resolveTranslation;

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('fr');

  useEffect(() => {
    const stored = normalizeLocale(getStorage()?.getItem(STORAGE_KEY));
    if (stored) {
      setLocale(stored);
      return;
    }

    if (typeof navigator !== 'undefined') {
      setLocale(normalizeLocale(navigator.language));
    }
  }, []);

  useEffect(() => {
    getStorage()?.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo<I18nState>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => {
        let result = resolveTranslation(locale, key) ?? key;
        if (params) {
          for (const [paramKey, paramValue] of Object.entries(params)) {
            result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
          }
        }
        return result;
      },
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}
