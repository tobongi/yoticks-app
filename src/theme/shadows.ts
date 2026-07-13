import { Platform, type ViewStyle } from 'react-native';

type ShadowSpec = {
  color: string;
  opacity: number;
  radius: number;
  offset: {
    width: number;
    height: number;
  };
  elevation?: number;
};

function toRgba(color: string, opacity: number) {
  const normalized = color.trim();
  const hex = normalized.replace(/^#/, '');

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  }

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    const red = Number.parseInt(`${hex[0]}${hex[0]}`, 16);
    const green = Number.parseInt(`${hex[1]}${hex[1]}`, 16);
    const blue = Number.parseInt(`${hex[2]}${hex[2]}`, 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  }

  return normalized;
}

export function shadow({ color, opacity, radius, offset, elevation }: ShadowSpec): ViewStyle {
  const boxShadow = `${offset.width}px ${offset.height}px ${radius}px ${toRgba(color, opacity)}`;

  if (Platform.OS === 'web') {
    return {
      boxShadow,
    };
  }

  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: offset,
    elevation: elevation ?? Math.max(1, Math.round(radius / 2)),
  };
}
