export type PhoneLayout = {
  width: number;
  isCompact: boolean;
  isTight: boolean;
  screenPadding: number;
  sectionGap: number;
  authTopPadding: number;
  heroImageMinHeight: number;
  featuredPosterWidth: number;
  featuredPosterHeight: number;
  twoUpWidth: '100%' | '48.5%';
  tileWidth: '100%' | '48.5%' | '31.5%';
  qrSizeSmall: number;
  qrSizeLarge: number;
  modalCardWidth: number;
  eventTitleSize: number;
  eventTitleLineHeight: number;
};

export function getPhoneLayout(width: number): PhoneLayout {
  const clampedWidth = Math.max(320, width);
  const isTight = clampedWidth < 360;
  const isCompact = clampedWidth < 430;
  const screenPadding = isTight ? 14 : isCompact ? 16 : 18;
  const sectionGap = isTight ? 16 : 18;
  const featuredPosterWidth = Math.max(168, Math.min(220, clampedWidth - screenPadding * 2 - (isTight ? 12 : 18)));
  const qrSizeLarge = Math.max(176, Math.min(240, clampedWidth - 120));

  return {
    width: clampedWidth,
    isCompact,
    isTight,
    screenPadding,
    sectionGap,
    authTopPadding: isTight ? 28 : isCompact ? 36 : 52,
    heroImageMinHeight: isTight ? 280 : isCompact ? 300 : 340,
    featuredPosterWidth,
    featuredPosterHeight: isTight ? 192 : 220,
    twoUpWidth: isCompact ? '100%' : '48.5%',
    tileWidth: isTight ? '100%' : isCompact ? '48.5%' : '31.5%',
    qrSizeSmall: isTight ? 124 : isCompact ? 136 : 144,
    qrSizeLarge,
    modalCardWidth: Math.min(360, clampedWidth - 32),
    eventTitleSize: isTight ? 26 : isCompact ? 28 : 32,
    eventTitleLineHeight: isTight ? 31 : isCompact ? 34 : 38,
  };
}
