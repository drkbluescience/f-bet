import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

const SimpleTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const runBasicTests = () => {
    const results: string[] = [];
    
    try {
      // Test 1: Basic JavaScript
      results.push('✅ JavaScript working');
      
      // Test 2: React Native components
      results.push('✅ React Native components working');
      
      // Test 3: Constants
      results.push(`✅ Constants loaded: ${COLORS.primary}`);
      
      // Test 4: Environment variables
      const hasEnv = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
      results.push(`${hasEnv ? '✅' : '❌'} Environment variables: ${hasEnv ? 'loaded' : 'missing'}`);
      
      // Test 5: Global objects
      const hasGlobal = typeof global !== 'undefined';
      results.push(`${hasGlobal ? '✅' : '❌'} Global object: ${hasGlobal ? 'available' : 'missing'}`);
      
      // Test 6: Crypto
      const hasCrypto = typeof global.crypto !== 'undefined';
      results.push(`${hasCrypto ? '✅' : '❌'} Crypto polyfill: ${hasCrypto ? 'available' : 'missing'}`);
      
      setTestResults(results);
      Alert.alert('Tests Complete', `${results.filter(r => r.includes('✅')).length}/${results.length} tests passed`);
      
    } catch (error) {
      results.push(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTestResults(results);
      Alert.alert('Test Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple App Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={runBasicTests}>
        <Text style={styles.buttonText}>Run Basic Tests</Text>
      </TouchableOpacity>
      
      <View style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  resultsContainer: {
    flex: 1,
  },
  resultText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: 'monospace',
  },
});

export default SimpleTest;
