// Initialize polyfills first
import './src/utils/polyfills';
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { COLORS } from './src/constants';
import { schedulerService } from './src/services/schedulerService';
import { notificationService } from './src/services/notificationService';

// Import polyfills for web compatibility
import './src/utils/polyfills';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function App() {
  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
        console.log('🚀 Initializing F-bet services...');

        // Start scheduler service for automatic data sync
        await schedulerService.start();

        // Create initial sync status log
        await notificationService.createSyncStatusLog('running', {
          message: 'Application started, scheduler initialized'
        });

        console.log('✅ Services initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);

        await notificationService.createSyncStatusLog('failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      schedulerService.stop();
    };
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider>
            <QueryClientProvider client={queryClient}>
              <StatusBar style="light" backgroundColor={COLORS.primary} />
              <AppNavigator />
            </QueryClientProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}


