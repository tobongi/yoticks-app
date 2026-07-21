import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { elevation, shadow } from '../../src/theme/shadows';
import { Alert, ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { radius, space } from '../../src/theme/tokens';
import { FALLBACK_EVENTS, createCheckoutSession, getEvent, listEvents, quoteTicketReservation, reserveTickets, type BackendReservationQuote, type BackendReservationResult, type BackendEvent } from '../../src/backend';
import { REFRESH, useLiveRefresh } from '../../src/live-refresh';
import { buildReservationFlow, PAYMENT_METHODS, type PaymentMethodKey, type ReservationTier } from '../../src/reservation-flow';
import { scheduleReservationNotifications } from '../../src/notifications';
import { getCheckoutReadiness } from '../../src/checkout-readiness';
import { buildRelatedEvents } from '../../src/recommendations';
import { ArrowLeftIcon, CalendarIcon, ChevronRightIcon, InfoIcon, MapIcon, PinIcon, TicketIcon, UserIcon } from '../../src/icons';
import { useAuth } from '../../src/auth';
import { PrimaryAction } from '../../src/ui/lived-in';
import { Pictogram, TicketStubArt } from '../../src/ui/pictograms';
import { getCategoryVisual } from '../../src/ui/visual-language';
import { Screen } from '../../src/ui/screen';

/** Width of the centred app column — see ui/responsive-core. */
const CONTENT_COLUMN = 620 - 40;

type TierKey = string;

type TimelineStep = {
  time: string;
  title: string;
  description: string;
};

type FAQItem = {
  question: string;
  answer: string;
};

const ACCENT_BY_CATEGORY: Record<string, string> = {
  concerts: colors.orange,
  conférences: '#E63B4E',
  conferences: '#E63B4E',
  soirées: colors.green,
  soirees: colors.green,
  sport: '#F2C94C',
  festivals: '#7AA7FF',
};

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

function formatEventTime(event: BackendEvent) {
  const seed = event.id.length + event.title.length + event.category.length;
  const hour = 18 + (seed % 3);
  return `${hour}h00`;
}

function formatArrivalTime(event: BackendEvent) {
  const match = formatEventTime(event).match(/^(\d{1,2})h00$/);
  if (!match) {
    return '30 min avant';
  }

  const hour = Number(match[1]);
  return `${Math.max(hour - 1, 0)}h30`;
}

function categoryAccent(event: BackendEvent) {
  return ACCENT_BY_CATEGORY[normalizeText(event.category)] ?? event.color;
}

function categoryAudience(event: BackendEvent) {
  const category = normalizeText(event.category);
  if (category.includes('concert')) return 'Fans, groupes d’amis et amoureux du live';
  if (category.includes('conference')) return 'Professionnels, fondateurs et décideurs';
  if (category.includes('soir')) return 'Public nocturne et sorties de groupe';
  if (category.includes('sport')) return 'Familles, supporters et clubs locaux';
  if (category.includes('festival')) return 'Curieux, créateurs et communautés culturelles';
  return 'Public général';
}

function eventMomentum(event: BackendEvent) {
  const category = normalizeText(event.category);
  if (category.includes('concert')) return 'High demand live slot';
  if (category.includes('conference')) return 'Professional crowd and structured sessions';
  if (category.includes('soir')) return 'Late-night energy with faster entry demand';
  if (category.includes('sport')) return 'Community turnout and family rhythm';
  if (category.includes('festival')) return 'Multi-hour cultural experience';
  return 'Popular local event format';
}

function venueStyle(event: BackendEvent) {
  const category = normalizeText(event.category);
  if (category.includes('concert')) return 'Standing crowd, strong sound, photo moments';
  if (category.includes('conference')) return 'Seated flow, keynote blocks, networking breaks';
  if (category.includes('soir')) return 'Entry control, music-first atmosphere, late departure';
  if (category.includes('sport')) return 'Open circulation, family-friendly, easier group attendance';
  if (category.includes('festival')) return 'Browse, pause, and move through different highlights';
  return 'Simple access, mobile ticket, and clear scan flow';
}

function buildTicketTiers(event: BackendEvent): ReservationTier[] {
  if (event.tiers?.length) {
    return event.tiers.map((tier, index) => ({
      key: tier.key,
      title: tier.name,
      subtitle:
        tier.inventoryRemaining > 0
          ? `${tier.inventoryRemaining} left · max ${tier.maxPerOrder}`
          : tier.waitlistEnabled
            ? 'Sold out · waitlist available'
            : 'Sold out',
      price: tier.price,
      description:
        tier.waitlistEnabled && tier.inventoryRemaining === 0
          ? 'Join the waitlist and get notified if inventory opens.'
          : 'Live inventory updates in real time before you confirm.',
      perks: tier.perks,
      highlighted: index === 0,
    }));
  }

  const basePrice = parsePriceValue(event.price);
  const free = basePrice === 0;
  const standardPrice = free ? 'Gratuit' : event.price;
  const plusPrice = free ? formatMoney(1500) : formatMoney(Math.round(basePrice * 1.25));
  const vipPrice = free ? formatMoney(5000) : formatMoney(Math.round(basePrice * 1.8));

  return [
    {
      key: 'standard',
      title: 'Standard',
      subtitle: free ? 'Accès gratuit avec contrôle QR' : 'Entrée simple, parcours rapide',
      price: standardPrice,
      description: 'Le meilleur point d’entrée pour réserver vite et garder le billet sur ton téléphone.',
      perks: ['Billet mobile', 'QR code instantané', 'Confirmation email'],
      highlighted: true,
    },
    {
      key: 'plus',
      title: 'Plus',
      subtitle: 'Accès prioritaire et meilleure fluidité',
      price: plusPrice,
      description: 'Pour ceux qui veulent arriver plus sereinement et profiter d’une meilleure expérience.',
      perks: ['Accès prioritaire', 'Réservation renforcée', 'Support jour J'],
    },
    {
      key: 'vip',
      title: 'VIP',
      subtitle: 'Le format premium pour vivre l’événement à fond',
      price: vipPrice,
      description: 'La formule la plus confortable, pensée pour les invités qui veulent tout sans friction.',
      perks: ['Zone premium', 'Entrée prioritaire', 'Accueil dédié'],
    },
  ];
}

function buildTimeline(event: BackendEvent): TimelineStep[] {
  const category = normalizeText(event.category);

  if (category.includes('concert')) {
    return [
      { time: '18h00', title: 'Ouverture des portes', description: 'Accueil, scan QR et installation dans la salle.' },
      { time: '19h00', title: 'Première partie', description: 'Warm-up, découverte des invités et montée progressive.' },
      { time: '20h30', title: 'Tête d’affiche', description: 'Le moment principal de la soirée, live et mise en scène.' },
      { time: '22h00', title: 'Finale & sortie', description: 'Dernier passage, photos et départ fluide.' },
    ];
  }

  if (category.includes('conference')) {
    return [
      { time: '08h30', title: 'Accueil & badges', description: 'Check-in, networking léger et accès au hall.' },
      { time: '09h30', title: 'Keynote d’ouverture', description: 'Le grand thème qui lance la journée.' },
      { time: '11h00', title: 'Panels & ateliers', description: 'Sessions pratiques, pitchs et cas concrets.' },
      { time: '16h30', title: 'Cocktail & rencontres', description: 'Networking final et prises de contact.' },
    ];
  }

  if (category.includes('sport')) {
    return [
      { time: '15h00', title: 'Ouverture du stade', description: 'Installation, ambiance et premières animations.' },
      { time: '16h00', title: 'Échauffement', description: 'Présentation des équipes et échauffement public.' },
      { time: '17h00', title: 'Match principal', description: 'Le cœur de l’événement avec les temps forts.' },
      { time: '18h45', title: 'Remise des trophées', description: 'Photos, podium et célébration finale.' },
    ];
  }

  if (category.includes('soir')) {
    return [
      { time: '21h00', title: 'Doors open', description: 'Entrée, vestiaire et première montée en salle.' },
      { time: '22h00', title: 'Warm-up set', description: 'DJ d’ouverture et installation du rythme.' },
      { time: '00h00', title: 'Peak session', description: 'Le moment fort avec les meilleures transitions.' },
      { time: '02h00', title: 'After hours', description: 'Dernier passage et clôture propre.' },
    ];
  }

  return [
    { time: '10h00', title: 'Ouverture du site', description: 'Accueil des visiteurs et exploration libre.' },
    { time: '12h00', title: 'Temps fort du jour', description: 'Performance, conférence ou animation principale.' },
    { time: '15h00', title: 'Deuxième temps fort', description: 'Contenu majeur, dédicaces ou démos.' },
    { time: '18h00', title: 'Clôture', description: 'Dernières visites et sortie du site.' },
  ];
}

function buildFaq(event: BackendEvent): FAQItem[] {
  const free = parsePriceValue(event.price) === 0;
  return [
    {
      question: 'Le billet est-il envoyé immédiatement ?',
      answer: 'Oui. Une fois la réservation confirmée, le billet apparaît dans Mes billets avec son QR code.',
    },
    {
      question: 'Puis-je acheter plusieurs places ?',
      answer: 'Pas encore sur cette version, mais le parcours est pensé pour devenir multi-billets ensuite.',
    },
    {
      question: 'Y a-t-il un remboursement ?',
      answer: 'La politique dépend de l’organisateur. On peut l’afficher ici quand elle est fournie.',
    },
    {
      question: free ? 'Faut-il payer à l’entrée ?' : 'Le prix affiché est-il final ?',
      answer: free
        ? 'Non, ce billet est gratuit. Il suffit de réserver pour générer ton QR code.'
        : 'Le prix affiché correspond au billet standard. Les options Plus et VIP sont visibles ci-dessus.',
    },
  ];
}

function SelectorChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View style={styles.selectorChip}>
      <View style={styles.selectorChipRow}>
        {icon}
        <Text style={styles.selectorChipLabel}>{label}</Text>
      </View>
      <Text style={styles.selectorChipValue}>{value}</Text>
    </View>
  );
}

function PaymentMethodCard({
  active,
  method,
  onPress,
}: {
  active: boolean;
  method: (typeof PAYMENT_METHODS)[number];
  onPress: () => void;
}) {
  const hasProviderButton = method.key !== 'card';

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      accessibilityLabel={method.actionLabel}
      style={[styles.paymentCard, active && styles.paymentCardActive]}
      onPress={onPress}
    >
      <View style={styles.paymentCardTop}>
        <View style={styles.paymentCopy}>
          <Text style={[styles.paymentLabel, active && styles.paymentLabelActive]}>{method.label}</Text>
          <Text style={styles.paymentDetail}>{method.detail}</Text>
        </View>
        <View style={styles.paymentMeta}>
          <View style={[styles.paymentBadge, active && styles.paymentBadgeActive]}>
            <Text style={[styles.paymentBadgeText, active && styles.paymentBadgeTextActive]}>{method.badge}</Text>
          </View>
          <Text style={[styles.paymentActionLabel, active && styles.paymentActionLabelActive]}>
            {active ? 'Selectionne' : method.actionLabel}
          </Text>
        </View>
      </View>
      {hasProviderButton ? (
        <View style={[styles.providerButton, providerButtonStyle(method.key), active && styles.providerButtonActive]}>
          <Text style={[styles.providerButtonText, providerButtonTextStyle(method.key)]}>{providerLeadLabel(method.key)}</Text>
          {method.key === 'google_pay' ? (
            <Text style={styles.googlePayWordmark}>
              <Text style={styles.googleBlue}>G</Text>
              <Text style={styles.googleRed}>o</Text>
              <Text style={styles.googleYellow}>o</Text>
              <Text style={styles.googleBlue}>g</Text>
              <Text style={styles.googleGreen}>l</Text>
              <Text style={styles.googleRed}>e</Text>
              <Text style={styles.googlePayText}> Pay</Text>
            </Text>
          ) : (
            <Text style={[styles.providerButtonBrand, providerButtonTextStyle(method.key)]}>{providerBrandLabel(method.key)}</Text>
          )}
        </View>
      ) : null}
    </Pressable>
  );
}

function providerLeadLabel(methodKey: PaymentMethodKey) {
  if (methodKey === 'paypal') {
    return 'Checkout with';
  }

  return 'Pay with';
}

function providerBrandLabel(methodKey: PaymentMethodKey) {
  if (methodKey === 'apple_pay') {
    return 'Apple Pay';
  }

  if (methodKey === 'paypal') {
    return 'PayPal';
  }

  return '';
}

function providerButtonStyle(methodKey: PaymentMethodKey) {
  if (methodKey === 'apple_pay') {
    return styles.providerButtonApple;
  }

  if (methodKey === 'paypal') {
    return styles.providerButtonPaypal;
  }

  return styles.providerButtonGoogle;
}

function providerButtonTextStyle(methodKey: PaymentMethodKey) {
  if (methodKey === 'paypal') {
    return styles.providerButtonTextPaypal;
  }

  return styles.providerButtonTextDark;
}

export default function ReserveEventPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [allEvents, setAllEvents] = useState<BackendEvent[]>(FALLBACK_EVENTS);
  const [selectedTier, setSelectedTier] = useState<TierKey>('standard');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodKey>('card');
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [quote, setQuote] = useState<BackendReservationQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reservationResult, setReservationResult] = useState<BackendReservationResult | null>(null);
  const refreshTick = useLiveRefresh(REFRESH.live);

  useEffect(() => {
    if (!id) return;
    getEvent(id).then((nextEvent) => setEvent(nextEvent ?? FALLBACK_EVENTS[0]));
    listEvents().then(setAllEvents);
  }, [id, refreshTick]);

  const current = event ?? FALLBACK_EVENTS[0];
  const accent = categoryAccent(current);
  const tiers = useMemo(() => buildTicketTiers(current), [current]);
  const timeline = useMemo(() => buildTimeline(current), [current]);
  const faq = useMemo(() => buildFaq(current), [current]);
  const related = useMemo(() => buildRelatedEvents(current, allEvents), [allEvents, current]);
  const currentTier = tiers.find((tier) => tier.key === selectedTier) ?? tiers[0];
  const reservationFlow = useMemo(() => buildReservationFlow(current, currentTier), [current, currentTier]);
  const requiresPayment = parsePriceValue(currentTier.price) > 0;
  const checkoutReadiness = getCheckoutReadiness({
    amount: parsePriceValue(currentTier.price),
    paidCheckoutEnabled: process.env.EXPO_PUBLIC_ENABLE_PAID_CHECKOUT === 'true',
  });
  const reservationTicket = reservationResult?.tickets[0] ?? null;
  const categoryVisual = getCategoryVisual(current.category);
  const eventDateParts = current.date.split(' ');
  const quickFacts = [
    { label: 'Best for', value: categoryAudience(current) },
    { label: 'Entry', value: formatArrivalTime(current) },
    { label: 'Format', value: venueStyle(current) },
  ];
  const planningNotes = [
    `Mobile ticket delivery for ${currentTier.title.toLowerCase()}`,
    requiresPayment
      ? checkoutReadiness.allowed
        ? `Pay now from ${currentTier.price}`
        : 'Online payment is not open for this event'
      : 'Reserve now and pay nothing today',
    `Crowd signal: ${eventMomentum(current)}`,
  ];
  const handleBack = () => {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  };

  useEffect(() => {
    if (!tiers.some((tier) => tier.key === selectedTier)) {
      setSelectedTier((tiers[0]?.key ?? 'standard') as TierKey);
    }
  }, [tiers, selectedTier]);

  useEffect(() => {
    if (!requiresPayment) {
      return;
    }

    if (!PAYMENT_METHODS.some((method) => method.key === selectedPayment)) {
      setSelectedPayment('card');
    }
  }, [requiresPayment, selectedPayment]);

  useEffect(() => {
    if (!token) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    quoteTicketReservation(current.id, selectedTier, quantity, promoCode.trim() || undefined, token).then((nextQuote) => {
      if (!cancelled) {
        setQuote(nextQuote);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [current.id, promoCode, quantity, selectedTier, token]);

  const handleReserve = async () => {
    if (!token) {
      router.push({ pathname: '/auth/login', params: { redirect: `/reserver/${current.id}` } });
      return;
    }

    if (!checkoutReadiness.allowed) {
      Alert.alert('Paiement indisponible', checkoutReadiness.reason);
      return;
    }

    if (!showReview) {
      setShowReview(true);
      return;
    }

    setBusy(true);
    try {
      if (requiresPayment) {
        const session = await createCheckoutSession(
          current.id,
          selectedTier,
          selectedPayment,
          quantity,
          promoCode.trim() || undefined,
          token,
        );
        if (!session) {
          throw new Error('Passerelle de paiement indisponible');
        }
        setShowReview(false);
        router.push({ pathname: '/checkout/[sessionId]', params: { sessionId: session.id } });
        return;
      }

      const reservation = await reserveTickets(current.id, selectedTier, quantity, promoCode.trim() || undefined, token);
      if (!reservation) {
        throw new Error('Réservation impossible');
      }
      setReservationResult(reservation);
      if (reservation.status === 'confirmed') {
        await scheduleReservationNotifications(current);
      }
      setShowReview(false);
    } catch (error) {
      Alert.alert('Réservation', error instanceof Error ? error.message : 'Réservation impossible');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Screen>
      <View style={styles.topActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" style={styles.backPill} onPress={handleBack}>
          <ArrowLeftIcon size={16} color={colors.orangeInk} />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>Réservation ouverte</Text>
        </View>
      </View>

      <View style={[styles.heroCard, { borderColor: accent }]}>
        <ImageBackground
          source={{ uri: current.imageUrl }}
          style={styles.heroImage}
          imageStyle={styles.heroImageInner}
        >
          <View style={styles.heroImageOverlay} />
          <View style={[styles.heroImageBadge, { backgroundColor: accent + '22' }]}>
            <Text style={[styles.heroImageBadgeText, { color: accent }]}>{current.category}</Text>
          </View>
        </ImageBackground>

        <View style={styles.heroHeader}>
          <View style={[styles.categoryPill, { backgroundColor: accent + '22' }]}>
            <Text style={[styles.categoryText, { color: accent }]}>{current.category}</Text>
          </View>
          <View style={styles.heroMeta}>
            <Text style={styles.heroMetaLabel}>À partir de</Text>
            <Text style={[styles.heroMetaValue, { color: accent }]}>{current.price}</Text>
          </View>
        </View>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{current.description}</Text>

        <View style={styles.heroGrid}>
          <View style={styles.heroStat}>
            <CalendarIcon size={16} color={colors.orangeInk} />
            <View style={styles.heroStatCopy}>
              <Text style={styles.heroStatLabel}>Date</Text>
              <Text style={styles.heroStatValue}>{current.date}</Text>
            </View>
          </View>
          <View style={styles.heroStat}>
            <PinIcon size={16} color={colors.orangeInk} />
            <View style={styles.heroStatCopy}>
              <Text style={styles.heroStatLabel}>Ville</Text>
              <Text style={styles.heroStatValue}>{current.location}</Text>
            </View>
          </View>
          <View style={styles.heroStat}>
            <UserIcon size={16} color={colors.orangeInk} />
            <View style={styles.heroStatCopy}>
              <Text style={styles.heroStatLabel}>Organisateur</Text>
              <Text style={styles.heroStatValue}>{current.organizer}</Text>
            </View>
          </View>
        </View>

        <View style={styles.trustRow}>
          <View style={styles.trustPill}>
            <TicketIcon size={13} color={accent} />
            <Text style={styles.trustText}>Billet mobile</Text>
          </View>
          <View style={styles.trustPill}>
            <InfoIcon size={13} color={accent} />
            <Text style={styles.trustText}>QR prêt</Text>
          </View>
          <View style={styles.trustPill}>
            <ChevronRightIcon size={13} color={accent} />
            <Text style={styles.trustText}>Vérifie avant paiement</Text>
          </View>
        </View>
      </View>

      <View style={styles.visualFlow}>
        <View style={styles.visualFlowHead}>
          <Pictogram pictogram={categoryVisual.key} tone={categoryVisual.tone} size={76} />
          <View style={styles.visualFlowCopy}>
            <Text style={styles.sectionTitle}>Choisis ton billet</Text>
            <Text style={styles.visualFlowHint}>{current.date} • {current.location}</Text>
          </View>
          <TicketStubArt tone={categoryVisual.tone} size={76} />
        </View>

        <View style={styles.tierList}>
          {tiers.map((tier) => {
            const active = tier.key === selectedTier;
            return (
              <Pressable key={tier.key} accessibilityRole="radio" accessibilityState={{ checked: active }} style={[styles.visualTier, active && styles.visualTierActive]} onPress={() => setSelectedTier(tier.key as TierKey)}>
                <Pictogram pictogram={active ? 'check' : 'ticket'} tone={active ? 'green' : 'blue'} size={54} />
                <View style={styles.visualTierCopy}><Text style={styles.tierTitle}>{tier.title}</Text><Text style={styles.tierPrice}>{tier.price}</Text></View>
                <Text style={styles.visualTierStock}>{tier.subtitle.split('·')[0]}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.quantityVisual}>
          <Pictogram pictogram="people" tone="blue" size={58} />
          <View style={styles.quantityRow}>
            {[1, 2, 3, 4].map((value) => {
              const max = current.tiers?.find((tier) => tier.key === selectedTier)?.maxPerOrder ?? 4;
              const disabled = value > max;
              return <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`${value} billet${value > 1 ? 's' : ''}`} accessibilityState={{ checked: quantity === value, disabled }} disabled={disabled} style={[styles.quantityChip, quantity === value && styles.quantityChipActive, disabled && styles.quantityChipDisabled]} onPress={() => setQuantity(value)}><Text style={[styles.quantityChipText, quantity === value && styles.quantityChipTextActive]}>{value}</Text></Pressable>;
            })}
          </View>
        </View>

        <TextInput style={styles.promoInput} accessibilityLabel="Code promotionnel" value={promoCode} onChangeText={setPromoCode} placeholder="Code promo" placeholderTextColor={colors.textMuted} autoCapitalize="characters" autoCorrect={false} />

        {quote ? <View style={styles.visualTotal}><Text style={styles.quoteLabel}>TOTAL</Text><Text style={styles.visualTotalValue}>{formatMoney(quote.total)}</Text><Pictogram pictogram={quote.status === 'available' ? 'check' : 'blocked'} tone={quote.status === 'available' ? 'green' : 'red'} size={54} /></View> : null}

        {requiresPayment ? <View style={styles.paymentList}>{PAYMENT_METHODS.map((method) => <PaymentMethodCard key={method.key} active={method.key === selectedPayment} method={method} onPress={() => setSelectedPayment(method.key)} />)}</View> : null}

        <PrimaryAction label={requiresPayment && !checkoutReadiness.allowed ? 'Paiement indisponible' : 'Vérifier'} pictogram={requiresPayment ? 'check' : 'ticket'} tone={requiresPayment && !checkoutReadiness.allowed ? 'red' : 'orange'} disabled={busy} onPress={handleReserve} />
      </View>

      {false && <>
      <View style={styles.checkoutStepper}>
        <View style={styles.checkoutStepperHeader}>
          <Text style={styles.checkoutStepperEyebrow}>Parcours de paiement</Text>
          <Text style={styles.checkoutStepperTitle}>Trois étapes, sans surprise.</Text>
        </View>
        <View style={styles.checkoutStepperRail}>
          {[
            { key: 'discover', label: '1', text: 'Choisir le billet' },
            { key: 'review', label: '2', text: 'Récapitulatif' },
            { key: 'confirm', label: '3', text: 'Confirmer' },
          ].map((step, index) => (
            <View key={step.key} style={styles.checkoutStep}>
              <View style={[styles.checkoutStepDot, index === 0 && { backgroundColor: accent }]}>
                <Text style={[styles.checkoutStepLabel, index === 0 && styles.checkoutStepLabelActive]}>{step.label}</Text>
              </View>
              <Text style={styles.checkoutStepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.selectorBlock}>
        <View style={styles.selectorHeader}>
          <Text style={styles.sectionEyebrow}>Réservation</Text>
          <Text style={styles.selectorTitle}>Choisis une date ou une session</Text>
          <Text style={styles.selectorCaption}>
            Comme sur les meilleures plateformes, tout est résumé ici avant de choisir ton billet.
          </Text>
        </View>

        <View style={styles.selectorRail}>
          <SelectorChip icon={<CalendarIcon size={14} color={colors.orangeInk} />} label="Date" value={current.date} />
          <SelectorChip icon={<MapIcon size={14} color={colors.orangeInk} />} label="Heure" value={formatEventTime(current)} />
          <SelectorChip icon={<TicketIcon size={14} color={colors.orangeInk} />} label="Billet" value={`${quantity} billet${quantity > 1 ? 's' : ''}`} />
        </View>
      </View>

      <View style={styles.selectorBlock}>
        <View style={styles.selectorHeader}>
          <Text style={styles.sectionEyebrow}>Live inventory</Text>
          <Text style={styles.selectorTitle}>Quantite, promo, and live availability</Text>
          <Text style={styles.selectorCaption}>
            This is the real ticketing layer: per-order limits, sold-out handling, promo codes, and total before checkout.
          </Text>
        </View>

        <View style={styles.quantityRow}>
          {[1, 2, 3, 4].map((value) => {
            const maxPerOrder = current.tiers?.find((tier) => tier.key === selectedTier)?.maxPerOrder ?? 4;
            const disabled = value > maxPerOrder;
            const active = quantity === value;
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={`${value} billet${value > 1 ? 's' : ''}`} accessibilityState={{ selected: active, disabled }}
                key={value}
                style={[styles.quantityChip, active && styles.quantityChipActive, disabled && styles.quantityChipDisabled]}
                onPress={() => !disabled && setQuantity(value)}
              >
                <Text style={[styles.quantityChipText, active && styles.quantityChipTextActive]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          style={styles.promoInput}
          value={promoCode}
          onChangeText={setPromoCode}
          placeholder="Promo code"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        {quote ? (
          <View style={styles.quoteCard}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Subtotal</Text>
              <Text style={styles.quoteValue}>{formatMoney(quote!.subtotal)}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Discount</Text>
              <Text style={styles.quoteValue}>{formatMoney(quote!.discount)}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Total</Text>
              <Text style={styles.quoteValue}>{formatMoney(quote!.total)}</Text>
            </View>
            <Text style={styles.quoteNote}>
              {quote!.status === 'available'
                ? `${quote!.remainingAfterPurchase} tickets remain after this order.`
                : quote!.status === 'waitlist_only'
                  ? 'This tier is sold out, but waitlist is open.'
                  : 'This tier is sold out right now.'}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.overviewPanel}>
        <View style={styles.overviewHero}>
          <View style={styles.overviewDateBadge}>
            <Text style={styles.overviewDateDay}>{eventDateParts[0] ?? '--'}</Text>
            <Text style={styles.overviewDateMonth}>{(eventDateParts[1] ?? '').slice(0, 3).toUpperCase()}</Text>
          </View>
          <View style={styles.overviewCopy}>
            <Text style={styles.overviewEyebrow}>Event snapshot</Text>
            <Text style={styles.overviewTitle}>Why this page should feel easier to trust</Text>
            <Text style={styles.overviewText}>
              Strong event apps help people compare timing, access, and crowd fit before they commit. This card does that work up front.
            </Text>
          </View>
        </View>

        <View style={styles.quickFactsGrid}>
          {quickFacts.map((fact) => (
            <View key={fact.label} style={styles.quickFactCard}>
              <Text style={styles.quickFactLabel}>{fact.label}</Text>
              <Text style={styles.quickFactValue}>{fact.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.planningList}>
          {planningNotes.map((note) => (
            <View key={note} style={styles.planningItem}>
              <View style={[styles.planningBullet, { backgroundColor: accent }]} />
              <Text style={styles.planningText}>{note}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choisis ton billet</Text>
        <View style={styles.tierList}>
          {tiers.map((tier) => {
            const active = tier.key === selectedTier;
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={tier.title} accessibilityState={{ selected: active }}
                key={tier.key}
                style={[
                  styles.tierCard,
                  active && { borderColor: accent, backgroundColor: colors.bg },
                ]}
                onPress={() => setSelectedTier(tier.key as TierKey)}
              >
                <View style={styles.tierHeader}>
                  <View style={styles.tierTitleRow}>
                    <View style={[styles.tierRadio, active && { borderColor: accent }]}>
                      {active && <View style={[styles.tierRadioInner, { backgroundColor: accent }]} />}
                    </View>
                    <View style={styles.tierTitleCopy}>
                      <Text style={styles.tierTitle}>{tier.title}</Text>
                      <Text style={styles.tierSubtitle}>{tier.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.tierPriceWrap}>
                    <Text style={[styles.tierPrice, { color: active ? accent : colors.text }]}>{tier.price}</Text>
                    {tier.highlighted && <Text style={styles.tierHighlight}>{active ? 'Sélectionné' : 'Le plus choisi'}</Text>}
                  </View>
                </View>
                <Text style={styles.tierDescription}>{tier.description}</Text>
                <View style={styles.perkRow}>
                  {tier.perks.map((perk) => (
                    <View key={perk} style={styles.perkChip}>
                      <Text style={styles.perkText}>{perk}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {requiresPayment && (
        <View style={styles.section}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelEyebrow}>Moyen de paiement</Text>
            <Text style={styles.panelTitle}>Choisis comment payer</Text>
          </View>

          <View style={styles.paymentList}>
            {PAYMENT_METHODS.map((method) => {
              const active = method.key === selectedPayment;
              return (
                <PaymentMethodCard
                  key={method.key}
                  active={active}
                  method={method}
                  onPress={() => setSelectedPayment(method.key)}
                />
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ce qui t’attend</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <TicketIcon size={18} color={accent} />
            <Text style={styles.infoLabel}>Format</Text>
            <Text style={styles.infoValue}>Billet mobile + QR code</Text>
          </View>
          <View style={styles.infoCard}>
            <MapIcon size={18} color={accent} />
            <Text style={styles.infoLabel}>Accès</Text>
            <Text style={styles.infoValue}>{current.location}</Text>
          </View>
          <View style={styles.infoCard}>
            <InfoIcon size={18} color={accent} />
            <Text style={styles.infoLabel}>Audience</Text>
            <Text style={styles.infoValue}>{categoryAudience(current)}</Text>
          </View>
          <View style={styles.infoCard}>
            <PinIcon size={18} color={accent} />
            <Text style={styles.infoLabel}>Arrivée conseillée</Text>
            <Text style={styles.infoValue}>{formatArrivalTime(current)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Programme</Text>
        <View style={styles.timeline}>
          {timeline.map((step, index) => (
            <View key={`${step.time}-${index}`} style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: accent }]} />
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineTime}>{step.time}</Text>
                <Text style={styles.timelineTitle}>{step.title}</Text>
                <Text style={styles.timelineText}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pourquoi réserver ici</Text>
        <View style={styles.benefitList}>
          {[
            'Paiement rapide et billet envoyé directement dans l’app',
            'Tous les détails utiles avant l’achat, sans surcharge',
            'QR code, statut du billet et historique centralisés',
          ].map((item) => (
            <View key={item} style={styles.benefitItem}>
              <View style={[styles.benefitBullet, { backgroundColor: accent }]} />
              <Text style={styles.benefitText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Before you go</Text>
        <View style={styles.supportGrid}>
          <View style={styles.supportCard}>
            <Text style={styles.supportLabel}>Doors</Text>
            <Text style={styles.supportValue}>{formatArrivalTime(current)}</Text>
          </View>
          <View style={styles.supportCard}>
            <Text style={styles.supportLabel}>Tempo</Text>
            <Text style={styles.supportValue}>{eventMomentum(current)}</Text>
          </View>
          <View style={styles.supportCard}>
            <Text style={styles.supportLabel}>Host</Text>
            <Text style={styles.supportValue}>{current.organizer}</Text>
          </View>
          <View style={styles.supportCard}>
            <Text style={styles.supportLabel}>Ticket mode</Text>
            <Text style={styles.supportValue}>{requiresPayment ? 'Pay then scan' : 'Reserve then scan'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos de l’événement</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>{current.description}</Text>
          <View style={styles.aboutMetaRow}>
            <Text style={styles.aboutMeta}>Organisé par {current.organizer}</Text>
            <Text style={styles.aboutMeta}>•</Text>
            <Text style={styles.aboutMeta}>{current.category}</Text>
          </View>
          <Text style={styles.aboutNote}>
            YoTicks prépare ici un véritable parcours de réservation plutôt qu’une simple fiche.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accès & infos pratiques</Text>
        <View style={styles.supportGrid}>
          <View style={styles.supportCard}>
            <Text style={styles.supportLabel}>Où</Text>
            <Text style={styles.supportValue}>{current.location}</Text>
          </View>
          <View style={styles.supportCard}>
            <Text style={styles.supportLabel}>Quand</Text>
            <Text style={styles.supportValue}>{current.date}</Text>
          </View>
          <View style={styles.supportCard}>
            <Text style={styles.supportLabel}>Prix</Text>
            <Text style={styles.supportValue}>{current.price}</Text>
          </View>
          <View style={styles.supportCard}>
            <Text style={styles.supportLabel}>Ticket</Text>
            <Text style={styles.supportValue}>{currentTier.title}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Questions fréquentes</Text>
        <View style={styles.faqList}>
          {faq.map((item) => (
            <View key={item.question} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Événements similaires</Text>
        <View style={styles.relatedList}>
          {related.map((item) => (
            <Pressable accessibilityRole="button" accessibilityLabel={`Ouvrir ${item.title}`}
              key={item.id}
              style={styles.relatedCard}
              onPress={() => router.push({ pathname: '/reserver/[id]', params: { id: item.id } })}
            >
              <ImageBackground
                source={{ uri: item.imageUrl }}
                style={styles.relatedThumb}
                imageStyle={styles.relatedThumbInner}
              >
                <View style={styles.relatedThumbOverlay} />
                <View style={[styles.relatedAccent, { backgroundColor: item.color }]} />
              </ImageBackground>
              <View style={styles.relatedBody}>
                <Text style={styles.relatedCategory}>{item.category}</Text>
                <Text style={styles.relatedReason}>{item.reason}</Text>
                <Text style={styles.relatedTitle}>{item.title}</Text>
                <Text style={styles.relatedMeta}>{item.date} • {item.location}</Text>
              </View>
              <ChevronRightIcon size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>
      </>}

      <View style={styles.bottomSpacer} />
      </Screen>

      {showReview && !reservationTicket && <View style={styles.backdrop} />}

      <View style={styles.stickyBar}>
        {reservationTicket ? (
          <View style={styles.successPanel}>
            <View style={styles.sheetHandle} />
            <View style={styles.stickyInfo}>
              <View style={styles.stickyCopy}>
                <Text style={styles.stickyLabel}>Réservation confirmée</Text>
                <Text style={styles.stickyTitle}>
                  {reservationResult?.status === 'waitlisted' ? 'We will notify you if inventory opens.' : reservationFlow.successTitle}
                </Text>
              </View>
              <Text style={styles.stickyPrice}>{reservationTicket.code}</Text>
            </View>
            <Text style={styles.reviewSubtitle}>
              {reservationResult?.status === 'waitlisted'
                ? 'Your request is saved and reminders will fire if a seat is released.'
                : reservationFlow.successSubtitle}
            </Text>

            <View style={styles.successActions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Voir mon billet"
                style={[styles.successBtn, { backgroundColor: accent }]}
                onPress={() => router.push(`/ticket/${reservationTicket.id}`)}
              >
                <Text style={styles.successBtnText}>Voir mon billet</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Retour aux événements" style={styles.successGhostBtn} onPress={() => router.replace('/(tabs)')}>
                <Text style={styles.successGhostText}>Retour aux événements</Text>
              </Pressable>
            </View>
          </View>
        ) : showReview ? (
          <View style={styles.reviewPanel}>
            <View style={styles.sheetHandle} />
            <View style={styles.reviewHeader}>
              <View style={styles.stickyCopy}>
                <Text style={styles.stickyLabel}>{reservationFlow.reviewTitle}</Text>
                <Text style={styles.stickyTitle}>{currentTier.title}</Text>
              </View>
              <Text style={styles.stickyPrice}>{reservationFlow.paymentLabel}</Text>
            </View>
            <Text style={styles.reviewSubtitle}>{reservationFlow.reviewSubtitle}</Text>

            {requiresPayment && (
              <View style={styles.paymentSection}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelEyebrow}>Moyen de paiement</Text>
                  <Text style={styles.panelTitle}>Choisis comment payer</Text>
                </View>

                <View style={styles.paymentList}>
                  {PAYMENT_METHODS.map((method) => {
                    const active = method.key === selectedPayment;
                    return (
                      <PaymentMethodCard
                        key={method.key}
                        active={active}
                        method={method}
                        onPress={() => setSelectedPayment(method.key)}
                      />
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.reviewList}>
              {reservationFlow.reviewItems.map((item) => (
                <View key={item.label} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{item.label}</Text>
                  <Text style={styles.reviewValue}>{item.value}</Text>
                </View>
              ))}
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Quantity</Text>
                <Text style={styles.reviewValue}>{quantity}</Text>
              </View>
              {quote ? (
                <>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Discount</Text>
                    <Text style={styles.reviewValue}>{formatMoney(quote.discount)}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Final total</Text>
                    <Text style={styles.reviewValue}>{formatMoney(quote.total)}</Text>
                  </View>
                </>
              ) : null}
            </View>
            <View style={styles.reviewActions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Retour" accessibilityState={{ disabled: busy }} style={styles.reviewSecondaryBtn} onPress={() => setShowReview(false)} disabled={busy}>
                <Text style={styles.reviewSecondaryText}>Retour</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={reservationFlow.primaryActionLabel} accessibilityState={{ disabled: busy, busy }}
                style={[styles.reserveBtn, { backgroundColor: accent }, busy && styles.reserveBtnDisabled]}
                onPress={handleReserve}
                disabled={busy}
              >
                <Text style={styles.reserveBtnText}>{busy ? 'Réservation...' : reservationFlow.primaryActionLabel}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.stickyInfo}>
              <View style={styles.stickyCopy}>
                <Text style={styles.stickyLabel}>Sélection</Text>
                <Text style={styles.stickyTitle}>{currentTier.title}</Text>
              </View>
              <Text style={styles.stickyPrice}>{quote ? formatMoney(quote.total) : currentTier.price}</Text>
            </View>

            <Pressable accessibilityRole="button" accessibilityLabel={token ? checkoutReadiness.allowed ? 'Continuer' : 'Paiement indisponible' : 'Se connecter pour réserver'} accessibilityState={{ disabled: busy, busy }}
              style={[styles.reserveBtn, { backgroundColor: accent }, busy && styles.reserveBtnDisabled]}
              onPress={handleReserve}
              disabled={busy}
            >
              <Text style={styles.reserveBtnText}>
                {busy
                  ? 'Chargement...'
                  : token
                    ? checkoutReadiness.allowed
                      ? `${currentTier.price} — Continuer`
                      : 'Paiement indisponible'
                    : 'Se connecter pour réserver'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  visualFlow: { marginTop: 16, padding: 16, gap: 14, borderRadius: 28, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong },
  visualFlowHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  visualFlowCopy: { flex: 1, gap: 3 },
  visualFlowHint: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  visualTier: { minHeight: 78, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardStrong },
  visualTierActive: { borderColor: colors.green, backgroundColor: colors.surfaceGreen },
  visualTierCopy: { flex: 1, gap: 3 },
  visualTierStock: { maxWidth: 82, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted, textAlign: 'right' },
  quantityVisual: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  visualTotal: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 22, backgroundColor: colors.surfaceGreen, borderWidth: 1, borderColor: colors.green + '44' },
  visualTotalValue: { flex: 1, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text },
  topActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12 },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.text },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.accentWash,
    borderWidth: 1,
    borderColor: colors.borderOrange,
  },
  statusText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.orangeInk, textTransform: 'uppercase', letterSpacing: 1.5 },
  heroCard: {
    borderRadius: 30,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 18,
    marginBottom: 18,
    ...shadow({ color: '#000', opacity: 0.28, radius: 22, offset: { width: 0, height: 12 }, elevation: 3 }),
  },
  heroImage: {
    height: 176,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 14,
  },
  heroImageInner: { borderRadius: 22 },
  heroImageOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(17,17,17,0.2)' },
  heroImageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderOrange,
  },
  heroImageBadgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, letterSpacing: 0.5 },
  heroMeta: { alignItems: 'flex-end' },
  heroMetaLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 },
  heroMetaValue: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.base, marginTop: 4 },
  title: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['3xl'], color: colors.text, lineHeight: 40, letterSpacing: -0.5 },
  subtitle: { marginTop: 10, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.textSecondary, lineHeight: 24 },
  heroGrid: { marginTop: 18, gap: 10 },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  heroStatCopy: { flex: 1 },
  heroStatLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  heroStatValue: { marginTop: 3, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  trustRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trustText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  checkoutStepper: {
    marginBottom: 18,
    padding: 16,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  checkoutStepperHeader: {
    gap: 4,
  },
  checkoutStepperEyebrow: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
  },
  checkoutStepperTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.text,
  },
  checkoutStepperRail: {
    flexDirection: 'row',
    gap: 10,
  },
  checkoutStep: {
    flex: 1,
    gap: 8,
    alignItems: 'center',
  },
  checkoutStepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  checkoutStepLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  checkoutStepLabelActive: {
    color: colors.black,
  },
  checkoutStepText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  selectorBlock: {
    padding: 16,
    borderRadius: 26,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    ...shadow({ color: colors.black, opacity: 0.05, radius: 14, offset: { width: 0, height: 6 }, elevation: 1 }),
  },
  selectorHeader: { gap: 4 },
  sectionEyebrow: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 2.8,
  },
  selectorTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.text, lineHeight: 26 },
  selectorCaption: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  selectorRail: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quantityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quantityChip: {
    minWidth: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityChipActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  quantityChipDisabled: {
    opacity: 0.4,
  },
  quantityChipText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  quantityChipTextActive: {
    color: colors.black,
  },
  promoInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardStrong,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  quoteCard: {
    gap: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  quoteLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  quoteValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  quoteNote: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  selectorChip: {
    flex: 1,
    minWidth: 95,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  selectorChipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectorChipLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  selectorChipValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text, lineHeight: 20 },
  overviewPanel: {
    marginTop: 18,
    marginBottom: 28,
    padding: 16,
    borderRadius: 26,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  overviewHero: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  overviewDateBadge: {
    width: 60,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewDateDay: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.text,
    lineHeight: 24,
  },
  overviewDateMonth: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  overviewCopy: {
    flex: 1,
    gap: 4,
  },
  overviewEyebrow: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  overviewTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.text,
    lineHeight: 26,
  },
  overviewText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  quickFactsGrid: {
    gap: 10,
  },
  quickFactCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  quickFactLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  quickFactValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  planningList: {
    gap: 10,
  },
  planningItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  planningBullet: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 6,
  },
  planningText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  section: { marginBottom: 28 },
  sectionTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.text, marginBottom: 14 },
  tierList: { gap: 12 },
  tierCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardStrong,
    gap: 12,
    ...shadow({ color: colors.black, opacity: 0.04, radius: 10, offset: { width: 0, height: 4 }, elevation: 1 }),
  },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  tierTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tierTitleCopy: { flex: 1, gap: 4 },
  tierRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: colors.bg,
  },
  tierRadioInner: { width: 8, height: 8, borderRadius: 4 },
  tierTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md, color: colors.text },
  tierSubtitle: { marginTop: 4, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textSecondary },
  tierPriceWrap: { alignItems: 'flex-end' },
  tierPrice: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md },
  tierHighlight: { marginTop: 4, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.orangeInk, textTransform: 'uppercase', letterSpacing: 1.2 },
  tierDescription: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  perkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  perkChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  perkText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.text },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoCard: {
    width: '48%',
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    minHeight: 120,
  },
  infoLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  infoValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text, lineHeight: 20 },
  timeline: { gap: 14 },
  timelineRow: { flexDirection: 'row', gap: 14 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  timelineCopy: { flex: 1, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  timelineTime: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xs, color: colors.orangeInk, letterSpacing: 1.5, textTransform: 'uppercase' },
  timelineTitle: { marginTop: 4, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.base, color: colors.text },
  timelineText: { marginTop: 3, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  benefitList: { gap: 12 },
  benefitItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 18, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.border },
  benefitBullet: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  benefitText: { flex: 1, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.text, lineHeight: 20 },
  aboutCard: { padding: 16, borderRadius: 22, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.border, gap: 12 },
  aboutText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.textSecondary, lineHeight: 24 },
  aboutMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  aboutMeta: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted },
  aboutNote: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.orangeInk, lineHeight: 18 },
  supportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  supportCard: { width: '48%', padding: 14, borderRadius: 20, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.border, gap: 6 },
  supportLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  supportValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  faqList: { gap: 10 },
  faqCard: { padding: 14, borderRadius: 18, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.border, gap: 8 },
  faqQuestion: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  faqAnswer: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  relatedList: { gap: 10 },
  relatedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.border },
  relatedThumb: { width: 56, height: 56, borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end' },
  relatedThumbInner: { borderRadius: 16 },
  relatedThumbOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(17,17,17,0.18)' },
  relatedAccent: { width: 10, height: 10, borderRadius: 999, margin: 10 },
  relatedBody: { flex: 1, gap: 4 },
  relatedCategory: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.orangeInk, textTransform: 'uppercase', letterSpacing: 1.2 },
  relatedReason: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted, lineHeight: 16 },
  relatedTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  relatedMeta: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textSecondary },
  bottomSpacer: { height: 118 },
  // Matches the centred app column rather than spanning the viewport: on a
  // desktop browser this was a 1440px-wide bar under a 620px page.
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space.md,
    marginHorizontal: 'auto',
    width: '100%',
    maxWidth: CONTENT_COLUMN,
    padding: space.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
    ...elevation.lg,
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(17,17,17,0.32)',
  },
  successPanel: { gap: 12 },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.borderStrong,
  },
  stickyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  stickyCopy: { flex: 1, gap: 3 },
  stickyLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  stickyTitle: { marginTop: 2, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.base, color: colors.text },
  stickyPrice: { marginTop: 2, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.orangeInk },
  reviewPanel: { gap: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  reviewSubtitle: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary },
  panelHeader: {
    gap: 4,
  },
  panelEyebrow: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  panelTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.text,
  },
  paymentSection: {
    gap: 12,
    paddingTop: 2,
  },
  paymentList: {
    gap: 10,
  },
  paymentCard: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentCardActive: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.orange,
  },
  paymentCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentCopy: {
    flex: 1,
    gap: 4,
  },
  paymentMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  paymentLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  paymentLabelActive: {
    color: colors.orangeInk,
  },
  paymentDetail: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentBadgeActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  paymentBadgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paymentBadgeTextActive: {
    color: colors.black,
  },
  paymentActionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
    maxWidth: 92,
    lineHeight: 16,
  },
  paymentActionLabelActive: {
    color: colors.orangeInk,
  },
  providerButton: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  providerButtonActive: {
    transform: [{ scale: 1.01 }],
  },
  providerButtonGoogle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#202124',
  },
  providerButtonApple: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  providerButtonPaypal: {
    backgroundColor: '#0070E0',
    borderColor: '#005FC4',
  },
  providerButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
  },
  providerButtonBrand: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
  },
  providerButtonTextDark: {
    color: '#1F1F1F',
  },
  providerButtonTextPaypal: {
    color: '#FFFFFF',
  },
  googlePayWordmark: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: '#1F1F1F',
  },
  googleBlue: {
    color: '#4285F4',
  },
  googleRed: {
    color: '#EA4335',
  },
  googleYellow: {
    color: '#FBBC05',
  },
  googleGreen: {
    color: '#34A853',
  },
  googlePayText: {
    color: '#1F1F1F',
  },
  reviewList: { gap: 10, paddingVertical: 2 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  reviewLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  reviewValue: { flex: 1, textAlign: 'right', fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  reviewActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  reviewSecondaryBtn: {
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewSecondaryText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  successActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  successBtn: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.black },
  successGhostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  successGhostText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  reserveBtn: {
    minWidth: 178,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow({ color: '#000', opacity: 0.12, radius: 12, offset: { width: 0, height: 6 } }),
  },
  reserveBtnDisabled: { opacity: 0.72 },
  reserveBtnText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.black },
});
