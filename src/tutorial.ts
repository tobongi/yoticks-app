import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_KEY = 'yoticks.tutorial_seen';

export async function hasSeenTutorial() {
  return (await AsyncStorage.getItem(TUTORIAL_KEY)) === 'true';
}

export async function markTutorialSeen() {
  await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
}
