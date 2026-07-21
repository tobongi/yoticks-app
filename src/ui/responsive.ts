import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { getLayout, type PhoneLayout } from './responsive-core';

/**
 * Current viewport layout. Re-computes on rotation and on browser resize.
 */
export function useLayout(): PhoneLayout {
  const { width } = useWindowDimensions();
  return useMemo(() => getLayout(width), [width]);
}

/**
 * @deprecated Prefer {@link useLayout}. Kept so existing screens keep working.
 */
export const usePhoneLayout = useLayout;

export {
  getLayout,
  getPhoneLayout,
  getBreakpoint,
  BREAKPOINTS,
  type Breakpoint,
  type PhoneLayout,
} from './responsive-core';
