import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants';
import { useDataSync } from '@/hooks';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataUsageStats from '@/components/DataUsageStats';
import MobileCompatibilityTest from '@/components/MobileCompatibilityTest';

const AdminScreen: React.FC = () => {
  const {
    syncStatus,
    connectionStatus,
    isLoading,
    error,
    testConnections,
    syncAll,
    syncCountries,
    syncLeagues,
    syncTeams,
    syncFixtures,
    syncTodayFixtures,
    isConnected,
    canSync,
  } = useDataSync();

  const [refreshing, setRefreshing] = useState(false);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [showMobileTest, setShowMobileTest] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await testConnections();
    setRefreshing(false);
  };

  const handleSyncAll = async () => {
    Alert.alert(
      'Full Data Sync',
      'This will sync all data from API-Football to Supabase. This may take several minutes and use API quota. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          style: 'destructive',
          onPress: async () => {
            const result = await syncAll();
            Alert.alert(
              result.success ? 'Success' : 'Error',
              result.message,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleQuickSync = async (type: string, syncFunction: () => Promise<any>) => {
    const result = await syncFunction();
    Alert.alert(
      'Sync Complete',
      `${type}: ${result.synced} synced, ${result.errors} errors`,
      [{ text: 'OK' }]
    );
  };

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const ConnectionCard = ({ title, status }: { title: string; status: { success: boolean; message: string } }) => (
    <View style={[styles.card, { borderLeftColor: status.success ? COLORS.success : COLORS.error }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Ionicons
          name={status.success ? 'checkmark-circle' : 'close-circle'}
          size={24}
          color={status.success ? COLORS.success : COLORS.error}
        />
      </View>
      <Text style={styles.cardMessage}>{status.message}</Text>
    </View>
  );

  const SyncCard = ({ title, lastSync, onSync, disabled }: {
    title: string;
    lastSync: number;
    onSync: () => void;
    disabled?: boolean;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <TouchableOpacity
          style={[styles.syncButton, disabled && styles.syncButtonDisabled]}
          onPress={onSync}
          disabled={disabled}
        >
          <Ionicons name="sync" size={16} color={disabled ? COLORS.textMuted : COLORS.textPrimary} />
          <Text style={[styles.syncButtonText, disabled && styles.syncButtonTextDisabled]}>
            Sync
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.lastSyncText}>Last sync: {formatLastSync(lastSync)}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Ionicons name="settings" size={32} color={COLORS.accent} />
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Data synchronization and system status</Text>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="warning" size={24} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Data Usage Statistics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Veri Kullanım İstatistikleri</Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowDetailedStats(!showDetailedStats)}
          >
            <Text style={styles.toggleButtonText}>
              {showDetailedStats ? 'Özet' : 'Detay'}
            </Text>
            <Ionicons
              name={showDetailedStats ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>
        <DataUsageStats showDetailed={showDetailedStats} />
      </View>

      {/* Mobile Compatibility Test */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mobil Uyumluluk Testi</Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowMobileTest(!showMobileTest)}
          >
            <Text style={styles.toggleButtonText}>
              {showMobileTest ? 'Gizle' : 'Göster'}
            </Text>
            <Ionicons
              name={showMobileTest ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>
        {showMobileTest && <MobileCompatibilityTest />}
      </View>

      {/* Connection Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Status</Text>
        <ConnectionCard title="Supabase Database" status={connectionStatus.supabase} />
        <ConnectionCard title="API-Football" status={connectionStatus.apiFootball} />
        
        <TouchableOpacity style={styles.testButton} onPress={testConnections} disabled={isLoading}>
          <Ionicons name="refresh" size={20} color={COLORS.textPrimary} />
          <Text style={styles.testButtonText}>Test Connections</Text>
        </TouchableOpacity>
      </View>

      {/* Sync Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Synchronization</Text>
        
        {syncStatus.isRunning && (
          <View style={styles.syncingCard}>
            <LoadingSpinner size="small" />
            <Text style={styles.syncingText}>Synchronization in progress...</Text>
          </View>
        )}

        <SyncCard
          title="Countries"
          lastSync={syncStatus.lastSyncTimes.countries}
          onSync={() => handleQuickSync('Countries', syncCountries)}
          disabled={!canSync}
        />

        <SyncCard
          title="Leagues"
          lastSync={syncStatus.lastSyncTimes.leagues}
          onSync={() => handleQuickSync('Leagues', syncLeagues)}
          disabled={!canSync}
        />

        <SyncCard
          title="Teams"
          lastSync={syncStatus.lastSyncTimes.teams}
          onSync={() => handleQuickSync('Teams', syncTeams)}
          disabled={!canSync}
        />

        <SyncCard
          title="Fixtures"
          lastSync={syncStatus.lastSyncTimes.fixtures}
          onSync={() => handleQuickSync('Fixtures', syncFixtures)}
          disabled={!canSync}
        />

        <SyncCard
          title="Today's Fixtures"
          lastSync={syncStatus.lastSyncTimes.fixtures}
          onSync={() => handleQuickSync('Today\'s Fixtures', syncTodayFixtures)}
          disabled={!canSync}
        />
      </View>

      {/* Full Sync */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.fullSyncButton, !canSync && styles.fullSyncButtonDisabled]}
          onPress={handleSyncAll}
          disabled={!canSync}
        >
          <Ionicons name="cloud-download" size={24} color={canSync ? COLORS.textPrimary : COLORS.textMuted} />
          <Text style={[styles.fullSyncButtonText, !canSync && styles.fullSyncButtonTextDisabled]}>
            Full Data Sync
          </Text>
          <Text style={[styles.fullSyncButtonSubtext, !canSync && styles.fullSyncButtonTextDisabled]}>
            Sync all data from API-Football
          </Text>
        </TouchableOpacity>
      </View>

      {/* System Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Information</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Connected: {isConnected ? 'Yes' : 'No'}</Text>
          <Text style={styles.infoText}>Can Sync: {canSync ? 'Yes' : 'No'}</Text>
          <Text style={styles.infoText}>Sync Running: {syncStatus.isRunning ? 'Yes' : 'No'}</Text>
        </View>
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
    padding: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.textPrimary,
  },
  cardMessage: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  errorCard: {
    backgroundColor: COLORS.error + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    margin: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  testButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  testButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  syncButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: COLORS.surface,
  },
  syncButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  syncButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  lastSyncText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
  },
  syncingCard: {
    backgroundColor: COLORS.info + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncingText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.info,
    marginLeft: SPACING.sm,
  },
  fullSyncButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  fullSyncButtonDisabled: {
    backgroundColor: COLORS.surface,
  },
  fullSyncButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  fullSyncButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  fullSyncButtonSubtext: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.accent + '20',
  },
  toggleButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
});

export default AdminScreen;
