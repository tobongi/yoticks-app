import { useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Découvrez les\nmeilleurs events',
    subtitle: 'Concerts, conférences, soirées, festivals — tous les événements africains en un seul endroit.',
    emoji: '🎉',
  },
  {
    id: '2',
    title: 'Réservez en\nquelques secondes',
    subtitle: 'Achetez vos billets instantanément et recevez-les directement sur votre téléphone.',
    emoji: '🎟️',
  },
  {
    id: '3',
    title: 'Organisez vos\npropres events',
    subtitle: 'Créez, gérez et vendez des billets pour vos événements en toute simplicité.',
    emoji: '🚀',
  },
];

export default function Onboarding() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex(activeIndex + 1);
    } else {
      router.replace('/auth/login');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {activeIndex === slides.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
        </Pressable>

        {activeIndex < slides.length - 1 && (
          <Pressable onPress={() => router.replace('/auth/login')}>
            <Text style={styles.skip}>Passer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 72, marginBottom: 32 },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 48, alignItems: 'center', gap: 20 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.cardHover },
  dotActive: { width: 24, backgroundColor: colors.orange },
  button: {
    width: '100%',
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.black,
  },
  skip: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
});
