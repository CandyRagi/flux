import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-get-random-values';
import 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to the login page if the user is not signed in
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirect away from the login page if the user is signed in
      router.replace('/sites');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  const renderHeaderTitle = (props: { children: string; tintColor?: string }) => (
    <ThemedText style={{
      fontFamily: 'Valorant',
      fontSize: 24,
      marginTop: 6,
      color: props.tintColor
    }}>
      {props.children}
    </ThemedText>
  );

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{
          title: 'Profile',
          headerTitle: renderHeaderTitle,
          headerTransparent: true,
          headerStyle: {
            backgroundColor: 'transparent',
          },
        }} />
        <Stack.Screen name="notifications" options={{
          title: 'Notifications',
          headerTitle: renderHeaderTitle,
          headerTransparent: true,
          headerStyle: {
            backgroundColor: 'transparent',
          },
        }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Valorant: require('../assets/fonts/Valorant-Font.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
