import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';
import { useAuth } from '../src/auth';
import { getEntryRoute } from '../src/routing';
import { hasSeenTutorial } from '../src/tutorial';

export default function Index() {
  const { loading, token, user } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    let mounted = true;
    hasSeenTutorial()
      .then((seen) => {
        if (!mounted) {
          return;
        }
        const destination = getEntryRoute({ seenTutorial: seen, token, role: user?.role });
        router.replace(destination as never);
      });

    return () => {
      mounted = false;
    };
  }, [loading, token, user?.role]);

  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}
