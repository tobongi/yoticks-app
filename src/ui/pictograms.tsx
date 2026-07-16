import type { ReactNode } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
  Svg,
} from 'react-native-svg';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { PictogramKey, VisualTone } from './visual-language';

const tones: Record<VisualTone, { strong: string; mid: string; soft: string; ink: string }> = {
  orange: { strong: colors.orange, mid: '#FF9A58', soft: '#FFF0E8', ink: colors.orangeDark },
  green: { strong: colors.green, mid: '#86C99E', soft: colors.surfaceGreen, ink: colors.greenDark },
  yellow: { strong: colors.yellow, mid: '#FFE092', soft: '#FFF8DD', ink: '#805D08' },
  blue: { strong: colors.blue, mid: '#7CA3F4', soft: colors.surfaceBlue, ink: '#214B9F' },
  ink: { strong: colors.black, mid: '#655D58', soft: '#F1ECE8', ink: colors.black },
  red: { strong: colors.red, mid: '#E88B8B', soft: '#FFF0F0', ink: '#8E2B2B' },
};

function Glyph({ pictogram, palette }: { pictogram: PictogramKey; palette: (typeof tones)[VisualTone] }) {
  const stroke = palette.ink;
  switch (pictogram) {
    case 'music':
      return <><Path d="M23 40V18l22-5v22" stroke={stroke} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/><Circle cx="17" cy="43" r="7" fill={palette.strong}/><Circle cx="39" cy="38" r="7" fill={palette.mid}/><Path d="M23 25l22-5" stroke={stroke} strokeWidth="4.5"/></>;
    case 'talk':
      return <><Path d="M13 17h38a7 7 0 0 1 7 7v17a7 7 0 0 1-7 7H31L19 57v-9h-6a7 7 0 0 1-7-7V24a7 7 0 0 1 7-7Z" fill={palette.soft} stroke={stroke} strokeWidth="3"/><Circle cx="22" cy="32" r="3" fill={palette.strong}/><Circle cx="32" cy="32" r="3" fill={palette.strong}/><Circle cx="42" cy="32" r="3" fill={palette.strong}/></>;
    case 'night':
      return <><Path d="M45 12c-10 4-15 16-10 26 4 9 14 13 23 10-5 8-15 13-26 10C17 54 9 38 14 24 18 14 31 8 45 12Z" fill={palette.strong}/><Path d="m48 18 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill={palette.mid}/></>;
    case 'sport':
      return <><Circle cx="32" cy="32" r="23" fill={palette.soft} stroke={stroke} strokeWidth="3"/><Polygon points="32,20 42,27 38,39 26,39 22,27" fill={palette.strong}/><Path d="M32 9v11M11 25l11 2M17 50l9-11M47 50l-9-11M53 25l-11 2" stroke={stroke} strokeWidth="3"/></>;
    case 'people':
      return <><Circle cx="24" cy="25" r="9" fill={palette.mid}/><Circle cx="43" cy="28" r="7" fill={palette.strong}/><Path d="M8 52c2-11 8-16 16-16s14 5 16 16" fill={palette.soft} stroke={stroke} strokeWidth="3" strokeLinecap="round"/><Path d="M37 52c1-8 5-12 11-12 5 0 9 4 10 12" stroke={stroke} strokeWidth="3" strokeLinecap="round"/></>;
    case 'art':
      return <><Path d="M12 43 24 14h27L40 51H13Z" fill={palette.soft} stroke={stroke} strokeWidth="3"/><Circle cx="28" cy="28" r="6" fill={palette.strong}/><Path d="m19 43 10-9 7 6 6-5 5 8" stroke={palette.mid} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></>;
    case 'learn':
      return <><Path d="m7 22 25-11 25 11-25 11Z" fill={palette.strong} stroke={stroke} strokeWidth="3" strokeLinejoin="round"/><Path d="M17 29v13c8 7 22 7 30 0V29" fill={palette.soft} stroke={stroke} strokeWidth="3"/><Path d="M56 23v19" stroke={stroke} strokeWidth="3"/><Circle cx="56" cy="46" r="4" fill={palette.mid}/></>;
    case 'check':
      return <><Circle cx="32" cy="32" r="24" fill={palette.strong}/><Path d="m19 33 8 8 18-20" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></>;
    case 'history':
      return <><Circle cx="32" cy="32" r="23" fill={palette.soft} stroke={stroke} strokeWidth="3"/><Path d="M32 18v15l10 7" stroke={stroke} strokeWidth="5" strokeLinecap="round"/><Path d="m12 18-1 12 12-2" stroke={palette.strong} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></>;
    case 'blocked':
      return <><Circle cx="32" cy="32" r="23" fill={palette.strong}/><Path d="M17 17 47 47" stroke="#fff" strokeWidth="6" strokeLinecap="round"/></>;
    case 'search':
      return <><Circle cx="28" cy="28" r="17" fill={palette.soft} stroke={stroke} strokeWidth="4"/><Path d="m41 41 12 12" stroke={palette.strong} strokeWidth="7" strokeLinecap="round"/><Circle cx="23" cy="23" r="4" fill={palette.mid}/></>;
    case 'ticket':
      return <><Path d="M9 18a6 6 0 0 1 6-6h34a6 6 0 0 1 6 6v8a7 7 0 0 0 0 12v8a6 6 0 0 1-6 6H15a6 6 0 0 1-6-6v-8a7 7 0 0 0 0-12Z" fill={palette.soft} stroke={stroke} strokeWidth="3"/><Path d="M37 14v36" stroke={palette.strong} strokeWidth="3" strokeDasharray="4 5"/><Rect x="17" y="23" width="12" height="12" rx="2" fill={palette.strong}/><Path d="M18 42h11" stroke={stroke} strokeWidth="3" strokeLinecap="round"/></>;
    case 'scan':
      return <><Path d="M9 24V12a3 3 0 0 1 3-3h12M40 9h12a3 3 0 0 1 3 3v12M55 40v12a3 3 0 0 1-3 3H40M24 55H12a3 3 0 0 1-3-3V40" stroke={stroke} strokeWidth="4" strokeLinecap="round"/><Rect x="21" y="21" width="9" height="9" rx="1" fill={palette.strong}/><Rect x="35" y="21" width="9" height="9" rx="1" fill={palette.mid}/><Rect x="21" y="35" width="9" height="9" rx="1" fill={palette.mid}/><Path d="M36 36h8v8h-4v-4h-4Z" fill={palette.strong}/></>;
    case 'map':
      return <><Path d="m8 17 15-5 18 6 15-5v34l-15 5-18-6-15 5Z" fill={palette.soft} stroke={stroke} strokeWidth="3" strokeLinejoin="round"/><Path d="M23 12v34M41 18v34" stroke={palette.mid} strokeWidth="3"/><Path d="M33 18c-6 0-10 4-10 10 0 8 10 16 10 16s10-8 10-16c0-6-4-10-10-10Z" fill={palette.strong}/><Circle cx="33" cy="28" r="4" fill="#fff"/></>;
    case 'help':
      return <><Circle cx="32" cy="32" r="24" fill={palette.soft} stroke={stroke} strokeWidth="3"/><Path d="M24 25c1-6 14-8 17-1 4 9-9 9-9 16" stroke={palette.strong} strokeWidth="5" strokeLinecap="round"/><Circle cx="32" cy="48" r="3" fill={stroke}/></>;
    case 'profile':
      return <><Circle cx="32" cy="23" r="12" fill={palette.mid}/><Path d="M10 56c2-13 10-20 22-20s20 7 22 20" fill={palette.soft} stroke={stroke} strokeWidth="3" strokeLinecap="round"/></>;
    case 'bell':
      return <><Path d="M17 44h30c-4-6-5-10-5-18 0-7-4-12-10-12s-10 5-10 12c0 8-1 12-5 18Z" fill={palette.soft} stroke={stroke} strokeWidth="3" strokeLinejoin="round"/><Path d="M27 49c1 7 9 7 10 0" stroke={palette.strong} strokeWidth="4" strokeLinecap="round"/><Circle cx="45" cy="15" r="7" fill={palette.strong}/></>;
    case 'speaker':
      return <><Path d="M11 26h11l14-12v36L22 38H11Z" fill={palette.strong} stroke={stroke} strokeWidth="3" strokeLinejoin="round"/><Path d="M44 23c5 5 5 13 0 18M50 17c9 9 9 21 0 30" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round"/></>;
    default:
      return <><Path d="m32 8 6 15 16 2-12 10 4 16-14-8-14 8 4-16-12-10 16-2Z" fill={palette.strong} stroke={stroke} strokeWidth="2"/></>;
  }
}

export function Pictogram({ pictogram, tone = 'orange', size = 64, label }: { pictogram: PictogramKey; tone?: VisualTone; size?: number; label?: string }) {
  const palette = tones[tone];
  return (
    <Svg accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label} aria-hidden={label ? undefined : true} width={size} height={size} viewBox="0 0 64 64">
      <Defs><LinearGradient id={`wash-${pictogram}-${tone}`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={palette.soft}/><Stop offset="1" stopColor={palette.mid} stopOpacity="0.34"/></LinearGradient></Defs>
      <Circle cx="32" cy="32" r="31" fill={`url(#wash-${pictogram}-${tone})`}/>
      <Circle cx="48" cy="13" r="8" fill={palette.mid} opacity="0.3"/>
      <Glyph pictogram={pictogram} palette={palette}/>
    </Svg>
  );
}

export function PictogramLabel({ pictogram, tone = 'orange', label, size = 64 }: { pictogram: PictogramKey; tone?: VisualTone; label: string; size?: number }) {
  return <View style={styles.labelWrap}><Pictogram pictogram={pictogram} tone={tone} size={size} label={label}/><Text style={styles.label} numberOfLines={1}>{label}</Text></View>;
}

export function TicketStubArt({ tone = 'orange', size = 130 }: { tone?: VisualTone; size?: number }) {
  const palette = tones[tone];
  return (
    <Svg accessibilityRole="image" accessibilityLabel="Billet avec code QR" width={size} height={size * 0.8} viewBox="0 0 150 120">
      <Defs><LinearGradient id={`ticket-${tone}`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={palette.strong}/><Stop offset="1" stopColor={palette.mid}/></LinearGradient></Defs>
      <Path d="M12 22c0-7 6-13 13-13h100c7 0 13 6 13 13v20c-13 4-13 23 0 27v22c0 7-6 13-13 13H25c-7 0-13-6-13-13V69c13-4 13-23 0-27Z" fill={`url(#ticket-${tone})`} stroke={palette.ink} strokeWidth="3"/>
      <Path d="M96 12v89" stroke="#fff" strokeOpacity="0.66" strokeWidth="3" strokeDasharray="7 6"/>
      <Rect x="29" y="29" width="46" height="46" rx="8" fill="#fff"/>
      <Rect x="36" y="36" width="12" height="12" rx="2" fill={palette.ink}/><Rect x="56" y="36" width="12" height="12" rx="2" fill={palette.ink}/><Rect x="36" y="56" width="12" height="12" rx="2" fill={palette.ink}/><Path d="M57 57h11v11h-6v-5h-5Z" fill={palette.ink}/>
      <Circle cx="116" cy="38" r="10" fill="#fff" opacity="0.92"/><Path d="m110 38 4 4 8-9" stroke={palette.ink} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <Path d="M106 72h21M106 82h15" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.85"/>
    </Svg>
  );
}

export function StatusSeal({ pictogram, tone, label, hint, size = 88 }: { pictogram: PictogramKey; tone: VisualTone; label: string; hint?: string; size?: number }) {
  return <View style={styles.seal}><Pictogram pictogram={pictogram} tone={tone} size={size} label={`${label}${hint ? `. ${hint}` : ''}`}/><Text style={[styles.sealLabel, { color: tones[tone].ink }]}>{label}</Text>{hint ? <Text style={styles.sealHint}>{hint}</Text> : null}</View>;
}

export function VisualState({ art, title, action }: { art: ReactNode; title: string; action?: ReactNode }) {
  return <View style={styles.state}>{art}<Text style={styles.stateTitle}>{title}</Text>{action}</View>;
}

const styles = StyleSheet.create({
  labelWrap: { minWidth: 76, gap: 7, alignItems: 'center' },
  label: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text, textAlign: 'center' },
  seal: { alignItems: 'center', gap: 5 },
  sealLabel: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, textAlign: 'center' },
  sealHint: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  state: { minHeight: 180, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.text, textAlign: 'center' },
});
