import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants';
import {
  isMobile,
  isWeb,
  isIOS,
  isAndroid,
  getDeviceDimensions,
  isTablet,
  checkNetworkConnectivity,
  triggerHapticFeedback,
  isDevelopment,
  getUserAgent,
} from '@/utils/mobileCompatibility';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const MobileCompatibilityTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Platform Detection Tests
    results.push({
      name: 'Platform Detection',
      status: 'pass',
      message: `Running on ${Platform.OS} (${Platform.Version})`,
    });

    // Device Type Tests
    results.push({
      name: 'Device Type',
      status: 'pass',
      message: `${isMobile ? 'Mobile' : 'Web'} ${isTablet() ? '(Tablet)' : '(Phone)'}`,
    });

    // Dimensions Test
    const { width, height } = getDeviceDimensions();
    results.push({
      name: 'Screen Dimensions',
      status: 'pass',
      message: `${width}x${height}`,
    });

    // Network Connectivity Test
    try {
      const isConnected = await checkNetworkConnectivity();
      setNetworkStatus(isConnected);
      results.push({
        name: 'Network Connectivity',
        status: isConnected ? 'pass' : 'fail',
        message: isConnected ? 'Connected' : 'No connection',
      });
    } catch (error) {
      results.push({
        name: 'Network Connectivity',
        status: 'warning',
        message: 'Test failed',
      });
    }

    // Environment Variables Test
    const hasSupabaseUrl = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
    const hasApiKey = !!process.env.EXPO_PUBLIC_API_FOOTBALL_KEY;
    
    results.push({
      name: 'Environment Variables',
      status: hasSupabaseUrl && hasApiKey ? 'pass' : 'warning',
      message: `Supabase: ${hasSupabaseUrl ? '✓' : '✗'}, API Key: ${hasApiKey ? '✓' : '✗'}`,
    });

    // Polyfills Test
    const hasBuffer = typeof global.Buffer !== 'undefined';
    const hasCrypto = typeof global.crypto !== 'undefined';
    const hasProcess = typeof global.process !== 'undefined';
    
    results.push({
      name: 'Polyfills',
      status: hasBuffer && hasCrypto && hasProcess ? 'pass' : 'warning',
      message: `Buffer: ${hasBuffer ? '✓' : '✗'}, Crypto: ${hasCrypto ? '✓' : '✗'}, Process: ${hasProcess ? '✓' : '✗'}`,
    });

    // Development Mode Test
    results.push({
      name: 'Development Mode',
      status: isDevelopment() ? 'warning' : 'pass',
      message: isDevelopment() ? 'Development' : 'Production',
    });

    // User Agent Test
    results.push({
      name: 'User Agent',
      status: 'pass',
      message: getUserAgent().substring(0, 50) + '...',
    });

    // Haptic Feedback Test (iOS only)
    if (isIOS) {
      try {
        triggerHapticFeedback('light');
        results.push({
          name: 'Haptic Feedback',
          status: 'pass',
          message: 'Available',
        });
      } catch (error) {
        results.push({
          name: 'Haptic Feedback',
          status: 'warning',
          message: 'Not available',
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const testHapticFeedback = () => {
    if (isIOS) {
      triggerHapticFeedback('medium');
      Alert.alert('Haptic Test', 'Did you feel the vibration?');
    } else {
      Alert.alert('Haptic Test', 'Haptic feedback is only available on iOS');
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />;
      case 'fail':
        return <Ionicons name="close-circle" size={20} color={COLORS.error} />;
      case 'warning':
        return <Ionicons name="warning" size={20} color={COLORS.warning} />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return COLORS.success;
      case 'fail':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="phone-portrait" size={32} color={COLORS.primary} />
        <Text style={styles.title}>Mobile Compatibility Test</Text>
        <Text style={styles.subtitle}>
          Platform: {Platform.OS} • Version: {Platform.Version}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runTests}
          disabled={isRunning}
        >
          <Ionicons 
            name={isRunning ? "refresh" : "play"} 
            size={20} 
            color={COLORS.surface} 
          />
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Text>
        </TouchableOpacity>

        {isIOS && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testHapticFeedback}
          >
            <Ionicons name="vibrate" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Test Haptic</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.results}>
        <Text style={styles.resultsTitle}>Test Results</Text>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              {getStatusIcon(result.status)}
              <Text style={styles.resultName}>{result.name}</Text>
            </View>
            <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
              {result.message}
            </Text>
          </View>
        ))}
      </View>

      {networkStatus !== null && (
        <View style={styles.networkStatus}>
          <Ionicons 
            name={networkStatus ? "wifi" : "wifi-off"} 
            size={24} 
            color={networkStatus ? COLORS.success : COLORS.error} 
          />
          <Text style={[styles.networkText, { color: networkStatus ? COLORS.success : COLORS.error }]}>
            {networkStatus ? 'Network Connected' : 'No Network Connection'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.surface,
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.primary,
  },
  results: {
    padding: SPACING.md,
  },
  resultsTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  resultItem: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  resultName: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.textPrimary,
  },
  resultMessage: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginLeft: SPACING.lg + SPACING.sm,
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    margin: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  networkText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
});

export default MobileCompatibilityTest;
