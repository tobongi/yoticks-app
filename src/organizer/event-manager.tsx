import { useEffect, useMemo, useState } from 'react';
import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import {
  FALLBACK_EVENTS,
  createOrganizerEvent,
  listOrganizerEvents,
  updateOrganizerEvent,
  type BackendCreateEventInput,
  type BackendEvent,
} from '../backend';
import { useAuth } from '../auth';
import { useLiveRefresh } from '../live-refresh';
import { ActionTile, Chip, HeroPanel, InlineScroll, LivedBackground, ScreenHeader, SectionBlock, StatRow } from '../ui/lived-in';
import { Pictogram, TicketStubArt } from '../ui/pictograms';
import { usePhoneLayout } from '../ui/responsive';

type OrganizerEventManagerProps = {
  mode?: 'create' | 'edit';
};

type EventFormState = BackendCreateEventInput;

const CATEGORY_OPTIONS = ['Concerts', 'Conferences', 'Soirees', 'Sport', 'Festivals', 'Meetups', 'Workshops'];

function makeEmptyForm(organizerName: string): EventFormState {
  return {
    title: '',
    date: '',
    location: '',
    category: CATEGORY_OPTIONS[0],
    price: '',
    description: '',
    organizer: organizerName,
    color: colors.orange,
    status: 'draft',
    coverImageUrl: '',
    venueMapUrl: '',
    galleryImageUrls: [],
  };
}

export function OrganizerEventManager({ mode = 'edit' }: OrganizerEventManagerProps) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, token } = useAuth();
  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [form, setForm] = useState<EventFormState>(() => makeEmptyForm('YoTicks Organizer'));
  const [isSaving, setIsSaving] = useState(false);
  const refreshTick = useLiveRefresh(2600);
  const layout = usePhoneLayout();
  const isCreateMode = mode === 'create';

  useEffect(() => {
    if (!user) {
      return;
    }
    setForm((current) => ({
      ...current,
      organizer: current.organizer?.trim() ? current.organizer : user.name,
    }));
  }, [user]);

  useEffect(() => {
    if (isCreateMode || !user || typeof id !== 'string' || !id.trim()) {
      setEvent(null);
      return;
    }
    const fallback = FALLBACK_EVENTS.find((entry) => entry.id === id && entry.organizerId === user.id) ?? null;
    setEvent(fallback);
    listOrganizerEvents(token ?? undefined, user.id).then((items) => {
      setEvent(items.find((entry) => entry.id === id) ?? null);
    });
  }, [id, isCreateMode, refreshTick, token, user]);

  useEffect(() => {
    if (isCreateMode) {
      setForm(makeEmptyForm(user?.name ?? 'YoTicks Organizer'));
      return;
    }
    if (!event) {
      return;
    }
    setForm({
      title: event.title,
      date: event.date,
      location: event.location,
      category: event.category,
      price: event.price,
      description: event.description,
      organizer: event.organizer,
      color: event.color,
      status: event.status ?? 'published',
      coverImageUrl: event.coverImageUrl ?? '',
      venueMapUrl: event.venueMapUrl ?? '',
      galleryImageUrls: event.galleryImageUrls ?? [],
    });
  }, [event, isCreateMode, user?.name]);

  const previewEvent = useMemo(
    () => ({
      title: form.title.trim() || 'Nouvel event',
      date: form.date.trim() || 'Date',
      location: form.location.trim() || 'Lieu',
      category: form.category.trim() || 'Event',
      description: form.description.trim() || 'Decris le moment en quelques lignes simples.',
      price: form.price.trim() || 'Prix',
      organizer: form.organizer?.trim() || user?.name || 'Organisateur',
      imageUrl: event?.imageUrl ?? FALLBACK_EVENTS[0]?.imageUrl ?? '',
      status: form.status ?? 'draft',
    }),
    [event?.imageUrl, form, user?.name],
  );

  const galleryDraft = (form.galleryImageUrls ?? []).join('\n');
  const isMissingRequiredField =
    !form.title.trim() ||
    !form.date.trim() ||
    !form.location.trim() ||
    !form.category.trim() ||
    !form.price.trim() ||
    !form.description.trim();

  async function handleSave() {
    if (!user || isMissingRequiredField) {
      Alert.alert('Event', 'Titre, date, lieu, categorie, prix et texte sont requis.');
      return;
    }

    setIsSaving(true);
    try {
      if (isCreateMode) {
        const created = await createOrganizerEvent(token ?? undefined, form);
        if (!created) {
          throw new Error('Creation impossible');
        }
        setEvent(created);
        router.replace(`/(organizer)/events/${created.id}` as never);
        Alert.alert('Event cree', 'La fiche est prete.');
        return;
      }

      if (!event) {
        throw new Error('Event indisponible');
      }

      const updated = await updateOrganizerEvent(token ?? undefined, event.id, form);
      if (!updated) {
        throw new Error('Mise a jour impossible');
      }

      setEvent(updated);
      Alert.alert('Sauve', 'Les infos ont ete mises a jour.');
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur inattendue');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isCreateMode && !event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LivedBackground />
        <View style={styles.emptyState}>
          <Text style={styles.kicker}>Event</Text>
          <Text style={styles.emptyTitle}>Introuvable</Text>
          <Text style={styles.emptyCopy}>Cette fiche n'est pas dans ton espace.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour aux événements" style={styles.primaryButton} onPress={() => router.replace('/(organizer)/events')}>
            <Text style={styles.primaryButtonText}>Retour events</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingHorizontal: layout.screenPadding, paddingBottom: layout.isCompact ? 96 : 110, gap: layout.sectionGap }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow={isCreateMode ? 'Nouveau' : 'Edition'} title={previewEvent.title} />

        <ImageBackground source={{ uri: previewEvent.imageUrl }} style={styles.cover} imageStyle={styles.coverInner}>
          <View style={styles.coverShade} />
          <View style={styles.coverTop}>
            <Text style={styles.coverChip}>{previewEvent.category}</Text>
            <Text style={styles.coverChip}>{previewEvent.status === 'published' ? 'Publie' : 'Brouillon'}</Text>
          </View>
          <Text style={styles.coverTitle}>{previewEvent.title}</Text>
          <Text style={styles.coverMeta}>{previewEvent.location} • {previewEvent.date}</Text>
        </ImageBackground>

        <HeroPanel
          eyebrow="Pilotage"
          title={isCreateMode ? 'Monter la fiche' : 'Ajuster vite'}
          subtitle="Infos courtes, action claire, fiche prete a publier."
          art={<Pictogram pictogram={isCreateMode ? 'celebrate' : 'art'} tone={isCreateMode ? 'yellow' : 'orange'} size={78} />}
        >
          <StatRow
            items={[
              { label: 'Etat', value: previewEvent.status === 'published' ? 'Live' : 'Draft' },
              { label: 'Prix', value: previewEvent.price },
              { label: 'Ville', value: previewEvent.location || '-' },
            ]}
          />
        </HeroPanel>

        {!isCreateMode ? (
          <View style={styles.tileGrid}>
            <ActionTile icon={<TicketStubArt tone="blue" size={54} />} label="Billets" tone="blue" style={{ width: layout.tileWidth }} onPress={() => router.push('/(organizer)/tickets' as never)} />
            <ActionTile icon={<Pictogram pictogram="scan" tone="green" size={48} />} label="Scanner" tone="green" style={{ width: layout.tileWidth }} onPress={() => router.push('/(organizer)/scan' as never)} />
          </View>
        ) : null}

        <SectionBlock eyebrow="Base" title="Infos rapides">
          <View style={styles.stack}>
            <Field label="Titre" value={form.title} onChangeText={(value) => setForm((current) => ({ ...current, title: value }))} placeholder="Kinshasa Jazz Festival" />
            <Field label="Date" value={form.date} onChangeText={(value) => setForm((current) => ({ ...current, date: value }))} placeholder="15 Juin 2026" />
            <Field label="Lieu" value={form.location} onChangeText={(value) => setForm((current) => ({ ...current, location: value }))} placeholder="Kinshasa, RDC" />
            <Field label="Prix" value={form.price} onChangeText={(value) => setForm((current) => ({ ...current, price: value }))} placeholder="5 000 FC" />
          </View>
        </SectionBlock>

        <SectionBlock eyebrow="Type" title="Categorie">
          <InlineScroll>
            {CATEGORY_OPTIONS.map((category) => (
              <Chip
                key={category}
                label={category}
                active={form.category === category}
                onPress={() => setForm((current) => ({ ...current, category }))}
              />
            ))}
          </InlineScroll>
        </SectionBlock>

        <SectionBlock eyebrow="Texte" title="Ce qu'on voit">
          <Field
            label="Description"
            value={form.description}
            onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
            placeholder="Concert live, portes a 19h, scene, food, invites."
            multiline
          />
        </SectionBlock>

        <SectionBlock eyebrow="Media" title="Images et plan">
          <View style={styles.stack}>
            <Field label="Cover" value={form.coverImageUrl ?? ''} onChangeText={(value) => setForm((current) => ({ ...current, coverImageUrl: value }))} placeholder="https://..." />
            <Field label="Plan salle" value={form.venueMapUrl ?? ''} onChangeText={(value) => setForm((current) => ({ ...current, venueMapUrl: value }))} placeholder="https://..." />
            <Field
              label="Galerie"
              value={galleryDraft}
              onChangeText={(value) =>
                setForm((current) => ({
                  ...current,
                  galleryImageUrls: value
                    .split('\n')
                    .map((entry) => entry.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="Une URL par ligne"
              multiline
            />
          </View>
        </SectionBlock>

        <View style={styles.footerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Enregistrer l'événement" accessibilityState={{ disabled: isSaving, busy: isSaving }} style={[styles.primaryButton, isSaving && styles.buttonDisabled]} onPress={handleSave} disabled={isSaving}>
            <Text style={styles.primaryButtonText}>{isSaving ? 'Sauvegarde...' : isCreateMode ? 'Creer' : 'Sauver'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1 },
  content: { paddingTop: 14 },
  emptyState: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', gap: 12 },
  kicker: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.8 },
  emptyTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], color: colors.text },
  emptyCopy: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.textSecondary },
  cover: { minHeight: 220, borderRadius: 28, overflow: 'hidden', padding: 16, justifyContent: 'flex-end', gap: 8 },
  coverInner: { borderRadius: 28 },
  coverShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(17,17,17,0.24)' },
  coverTop: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  coverChip: { borderRadius: 999, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.88)', fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  coverTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], lineHeight: 34, color: colors.ivory },
  coverMeta: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.beige },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stack: { gap: 12 },
  field: { gap: 8 },
  fieldLabel: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  inputMultiline: { minHeight: 120 },
  footerActions: { gap: 10 },
  primaryButton: { minHeight: 52, borderRadius: 18, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.black },
  buttonDisabled: { opacity: 0.7 },
});
