<!-- PURPOSE OF THIS FILE: React Native Expo root layout — providers, navigation container, safe area, query client. -->
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 dakika
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="{{model_name}}/[id]"
            options={{ title: '{{ModelName}} Detay', headerBackTitle: 'Geri' }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
