import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { getPhoneLayout, type PhoneLayout } from './responsive-core';

export function usePhoneLayout() {
  const { width } = useWindowDimensions();
  return useMemo(() => getPhoneLayout(width), [width]);
}

export { getPhoneLayout, type PhoneLayout };
