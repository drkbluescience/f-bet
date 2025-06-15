import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { schedulerService } from '../services/schedulerService';
import { DataSyncService } from '../services/dataSyncService';
import { ApiFootballService } from '../services/apiFootballService';

// Colors
const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  textPrimary: '#000000',
  textSecondary: '#666666',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  shadow: '#000000',
  border: '#E1E1E1',
};

export const SyncTestScreen: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const addResult = (test: string, success: boolean, message: string, data?: any) => {
    const result = {
      id: Date.now(),
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString(),
    };
    setResults(prev => [result, ...prev]);
  };

  const testApiConnection = async () => {
    setLoading('api');
    try {
      const status = await ApiFootballService.getAPIStatus();
      addResult('API Connection', true, 'API-Football connection successful', status);
    } catch (error) {
      addResult('API Connection', false, `API connection failed: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const testCountriesSync = async () => {
    setLoading('countries');
    try {
      const result = await DataSyncService.syncCountries();
      addResult('Countries Sync', true, `Synced ${result.synced} countries, ${result.errors} errors`, result);
    } catch (error) {
      addResult('Countries Sync', false, `Countries sync failed: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const testLeaguesSync = async () => {
    setLoading('leagues');
    try {
      const result = await DataSyncService.syncLeagues();
      addResult('Leagues Sync', true, `Synced ${result.synced} leagues, ${result.errors} errors`, result);
    } catch (error) {
      addResult('Leagues Sync', false, `Leagues sync failed: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const testTeamsSync = async () => {
    setLoading('teams');
    try {
      const result = await DataSyncService.syncTeams();
      addResult('Teams Sync', true, `Synced ${result.synced} teams, ${result.errors} errors`, result);
    } catch (error) {
      addResult('Teams Sync', false, `Teams sync failed: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const testFixturesSync = async () => {
    setLoading('fixtures');
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await DataSyncService.syncFixtures({ date: today });
      addResult('Fixtures Sync', true, `Synced ${result.synced} fixtures, ${result.errors} errors`, result);
    } catch (error) {
      addResult('Fixtures Sync', false, `Fixtures sync failed: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const testPlayersSync = async () => {
    setLoading('players');
    try {
      // Test with a specific team (e.g., Manchester United - team ID 33)
      const result = await DataSyncService.syncPlayersByTeam(33, 2024);
      addResult('Players Sync', true, `Synced ${result.synced} players, ${result.errors} errors`, result);
    } catch (error) {
      addResult('Players Sync', false, `Players sync failed: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const testMajorLeaguePlayers = async () => {
    setLoading('major-players');
    try {
      const result = await DataSyncService.syncMajorLeaguePlayers(2024);
      addResult('Major League Players', true, `Synced ${result.synced} players, ${result.errors} errors`, result);
    } catch (error) {
      addResult('Major League Players', false, `Major league players sync failed: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const testSchedulerJob = async (jobId: string) => {
    setLoading(jobId);
    try {
      const result = await schedulerService.runJobNow(jobId);
      addResult(`Job: ${jobId}`, result.success, `Job completed in ${result.duration}ms, ${result.recordsProcessed} records`, result);
    } catch (error) {
      addResult(`Job: ${jobId}`, false, `Job failed: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const TestButton = ({ title, onPress, testId, icon }: {
    title: string;
    onPress: () => void;
    testId: string;
    icon: string;
  }) => (
    <TouchableOpacity
      style={[styles.testButton, loading === testId && styles.loadingButton]}
      onPress={onPress}
      disabled={loading !== null}
    >
      <Ionicons
        name={loading === testId ? 'hourglass' : icon as any}
        size={20}
        color={COLORS.surface}
      />
      <Text style={styles.testButtonText}>
        {loading === testId ? 'Testing...' : title}
      </Text>
    </TouchableOpacity>
  );

  const ResultItem = ({ result }: { result: any }) => (
    <View style={[styles.resultItem, result.success ? styles.successResult : styles.errorResult]}>
      <View style={styles.resultHeader}>
        <Ionicons
          name={result.success ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={result.success ? COLORS.success : COLORS.error}
        />
        <Text style={styles.resultTitle}>{result.test}</Text>
        <Text style={styles.resultTime}>{result.timestamp}</Text>
      </View>
      <Text style={styles.resultMessage}>{result.message}</Text>
      {result.data && (
        <Text style={styles.resultData}>
          {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sync System Test</Text>
        <Text style={styles.subtitle}>Test API connections and sync jobs</Text>
      </View>

      {/* API Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Tests</Text>
        <View style={styles.buttonGrid}>
          <TestButton
            title="Test API Connection"
            onPress={testApiConnection}
            testId="api"
            icon="cloud"
          />
        </View>
      </View>

      {/* Sync Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sync Tests</Text>
        <View style={styles.buttonGrid}>
          <TestButton
            title="Sync Countries"
            onPress={testCountriesSync}
            testId="countries"
            icon="flag"
          />
          <TestButton
            title="Sync Leagues"
            onPress={testLeaguesSync}
            testId="leagues"
            icon="trophy"
          />
          <TestButton
            title="Sync Teams"
            onPress={testTeamsSync}
            testId="teams"
            icon="people"
          />
          <TestButton
            title="Sync Fixtures"
            onPress={testFixturesSync}
            testId="fixtures"
            icon="calendar"
          />
          <TestButton
            title="Sync Players (Team)"
            onPress={testPlayersSync}
            testId="players"
            icon="person"
          />
          <TestButton
            title="Major League Players"
            onPress={testMajorLeaguePlayers}
            testId="major-players"
            icon="star"
          />
        </View>
      </View>

      {/* Scheduler Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduler Job Tests</Text>
        <View style={styles.buttonGrid}>
          <TestButton
            title="Run Countries Job"
            onPress={() => testSchedulerJob('daily-countries')}
            testId="daily-countries"
            icon="flag"
          />
          <TestButton
            title="Run Leagues Job"
            onPress={() => testSchedulerJob('daily-leagues')}
            testId="daily-leagues"
            icon="trophy"
          />
          <TestButton
            title="Run Teams Job"
            onPress={() => testSchedulerJob('daily-teams')}
            testId="daily-teams"
            icon="people"
          />
          <TestButton
            title="Run Fixtures Job"
            onPress={() => testSchedulerJob('hourly-fixtures')}
            testId="hourly-fixtures"
            icon="calendar"
          />
          <TestButton
            title="Run Players Job"
            onPress={() => testSchedulerJob('weekly-players')}
            testId="weekly-players"
            icon="person"
          />
        </View>
      </View>

      {/* Results */}
      <View style={styles.section}>
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {results.length === 0 ? (
          <View style={styles.emptyResults}>
            <Ionicons name="flask" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No test results yet</Text>
          </View>
        ) : (
          results.map(result => (
            <ResultItem key={result.id} result={result} />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.9,
  },
  section: {
    margin: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '48%',
  },
  loadingButton: {
    backgroundColor: COLORS.warning,
  },
  testButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyResults: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  successResult: {
    backgroundColor: '#F0F9FF',
    borderColor: COLORS.success,
  },
  errorResult: {
    backgroundColor: '#FEF2F2',
    borderColor: COLORS.error,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  resultTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  resultMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resultData: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 4,
    maxHeight: 100,
  },
});

export default SyncTestScreen;
