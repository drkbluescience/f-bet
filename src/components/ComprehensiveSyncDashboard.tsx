import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants';
import { DataSyncService } from '@/services/dataSyncService';
import { SyncTestUtils, TestResult } from '@/utils/syncTestUtils';

interface SyncJob {
  id: string;
  name: string;
  icon: string;
  description: string;
  isRunning: boolean;
  lastRun?: Date;
  syncFunction: () => Promise<{ synced: number; errors: number }>;
}

interface SyncLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const ComprehensiveSyncDashboard: React.FC = () => {
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    initializeSyncJobs();
  }, []);

  const initializeSyncJobs = () => {
    const jobs: SyncJob[] = [
      {
        id: 'countries',
        name: 'Ülkeler',
        icon: 'globe-outline',
        description: 'Tüm ülke verilerini senkronize et',
        isRunning: false,
        syncFunction: DataSyncService.syncCountries,
      },
      {
        id: 'leagues',
        name: 'Ligler',
        icon: 'trophy-outline',
        description: 'Lig bilgilerini senkronize et',
        isRunning: false,
        syncFunction: DataSyncService.syncLeagues,
      },
      {
        id: 'venues',
        name: 'Stadyumlar',
        icon: 'business-outline',
        description: 'Stadyum verilerini senkronize et',
        isRunning: false,
        syncFunction: DataSyncService.syncVenues,
      },
      {
        id: 'teams',
        name: 'Takımlar',
        icon: 'people-outline',
        description: 'Takım bilgilerini senkronize et',
        isRunning: false,
        syncFunction: DataSyncService.syncTeams,
      },
      {
        id: 'coaches',
        name: 'Antrenörler',
        icon: 'person-outline',
        description: 'Antrenör verilerini senkronize et',
        isRunning: false,
        syncFunction: DataSyncService.syncCoaches,
      },
      {
        id: 'fixtures',
        name: 'Maçlar',
        icon: 'calendar-outline',
        description: 'Maç programını senkronize et',
        isRunning: false,
        syncFunction: DataSyncService.syncFixtures,
      },
      {
        id: 'players',
        name: 'Oyuncular',
        icon: 'shirt-outline',
        description: 'Oyuncu verilerini senkronize et',
        isRunning: false,
        syncFunction: DataSyncService.syncMajorLeaguePlayers,
      },
      {
        id: 'standings',
        name: 'Puan Durumu',
        icon: 'list-outline',
        description: 'Lig puan durumunu senkronize et',
        isRunning: false,
        syncFunction: () => DataSyncService.syncStandings(39, new Date().getFullYear()),
      },
      {
        id: 'odds',
        name: 'Oranlar',
        icon: 'calculator-outline',
        description: 'Bahis oranlarını senkronize et',
        isRunning: false,
        syncFunction: DataSyncService.syncOdds,
      },
      {
        id: 'injuries',
        name: 'Sakatlıklar',
        icon: 'medical-outline',
        description: 'Oyuncu sakatlık verilerini senkronize et',
        isRunning: false,
        syncFunction: () => DataSyncService.syncInjuries({ league: 39, season: new Date().getFullYear() }),
      },
      {
        id: 'transfers',
        name: 'Transferler',
        icon: 'swap-horizontal-outline',
        description: 'Transfer verilerini senkronize et',
        isRunning: false,
        syncFunction: DataSyncService.syncTransfers,
      },
    ];

    setSyncJobs(jobs);
  };

  const addLog = (message: string, type: SyncLog['type'] = 'info') => {
    const newLog: SyncLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message,
      type,
    };
    setSyncLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const runSyncJob = async (jobId: string) => {
    const job = syncJobs.find(j => j.id === jobId);
    if (!job || job.isRunning) return;

    // Update job status
    setSyncJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, isRunning: true } : j
    ));

    addLog(`🚀 ${job.name} senkronizasyonu başlatıldı...`, 'info');

    try {
      const startTime = Date.now();
      const result = await job.syncFunction();
      const duration = Date.now() - startTime;

      if (result.errors === 0) {
        addLog(`✅ ${job.name}: ${result.synced} kayıt senkronize edildi (${Math.round(duration/1000)}s)`, 'success');
      } else {
        addLog(`⚠️ ${job.name}: ${result.synced} başarılı, ${result.errors} hata (${Math.round(duration/1000)}s)`, 'warning');
      }

      // Update last run time
      setSyncJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, isRunning: false, lastRun: new Date() } : j
      ));

    } catch (error) {
      addLog(`❌ ${job.name} senkronizasyonu başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, 'error');
      setSyncJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, isRunning: false } : j
      ));
    }
  };

  const runAllSyncJobs = async () => {
    if (isRunningAll) return;

    Alert.alert(
      'Tüm Tabloları Senkronize Et',
      'Bu işlem uzun sürebilir ve API limitlerini etkileyebilir. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Başlat',
          onPress: async () => {
            setIsRunningAll(true);
            addLog('🚀 Kapsamlı senkronizasyon başlatıldı...', 'info');

            try {
              const result = await DataSyncService.syncAllTables();
              
              if (result.success) {
                addLog(`✅ Kapsamlı senkronizasyon tamamlandı: ${result.message}`, 'success');
              } else {
                addLog(`❌ Kapsamlı senkronizasyon başarısız: ${result.message}`, 'error');
              }
            } catch (error) {
              addLog(`❌ Kapsamlı senkronizasyon hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, 'error');
            } finally {
              setIsRunningAll(false);
            }
          },
        },
      ]
    );
  };

  const runSystemTests = async () => {
    if (isRunningTests) return;

    setIsRunningTests(true);
    addLog('🧪 Sistem testleri başlatıldı...', 'info');

    try {
      const results = await SyncTestUtils.runAllTests();
      const summary = SyncTestUtils.getTestSummary(results);

      // Log each test result
      results.forEach(result => {
        const logType = result.success ? 'success' : 'error';
        addLog(`${result.success ? '✅' : '❌'} ${result.test}: ${result.message}`, logType);
      });

      // Log summary
      addLog(
        `🧪 Test özeti: ${summary.passed}/${summary.total} başarılı (${summary.successRate.toFixed(1)}%) - ${summary.totalDuration}ms`,
        summary.successRate === 100 ? 'success' : 'warning'
      );

    } catch (error) {
      addLog(`❌ Test hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, 'error');
    } finally {
      setIsRunningTests(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh logic here if needed
    setRefreshing(false);
  };

  const clearLogs = () => {
    setSyncLogs([]);
    addLog('📝 Loglar temizlendi', 'info');
  };

  const getLogIcon = (type: SyncLog['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getLogColor = (type: SyncLog['type']) => {
    switch (type) {
      case 'success': return COLORS.success;
      case 'error': return COLORS.error;
      case 'warning': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Kapsamlı Veri Senkronizasyonu</Text>
        <Text style={styles.subtitle}>Tüm tablolar için veri senkronizasyon işlemleri</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.runAllButton, isRunningAll && styles.runAllButtonDisabled]}
          onPress={runAllSyncJobs}
          disabled={isRunningAll}
        >
          {isRunningAll ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <Ionicons name="play-circle" size={24} color={COLORS.surface} />
          )}
          <Text style={styles.runAllButtonText}>
            {isRunningAll ? 'Çalışıyor...' : 'Tüm Tabloları Senkronize Et'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, isRunningTests && styles.testButtonDisabled]}
          onPress={runSystemTests}
          disabled={isRunningTests}
        >
          {isRunningTests ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <Ionicons name="flask" size={20} color={COLORS.surface} />
          )}
          <Text style={styles.testButtonText}>
            {isRunningTests ? 'Test Ediliyor...' : 'Sistem Testleri'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sync Jobs Grid */}
      <View style={styles.jobsContainer}>
        <Text style={styles.sectionTitle}>Senkronizasyon İşleri</Text>
        <View style={styles.jobsGrid}>
          {syncJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={[styles.jobCard, job.isRunning && styles.jobCardRunning]}
              onPress={() => runSyncJob(job.id)}
              disabled={job.isRunning}
            >
              <View style={styles.jobHeader}>
                {job.isRunning ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons name={job.icon as any} size={24} color={COLORS.primary} />
                )}
                <Text style={styles.jobName}>{job.name}</Text>
              </View>
              <Text style={styles.jobDescription}>{job.description}</Text>
              {job.lastRun && (
                <Text style={styles.jobLastRun}>
                  Son: {job.lastRun.toLocaleTimeString('tr-TR')}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logs Section */}
      <View style={styles.logsContainer}>
        <View style={styles.logsHeader}>
          <Text style={styles.sectionTitle}>Canlı Loglar</Text>
          <TouchableOpacity onPress={clearLogs} style={styles.clearLogsButton}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={styles.clearLogsText}>Temizle</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.logsContent}>
          {syncLogs.length === 0 ? (
            <Text style={styles.noLogsText}>Henüz log kaydı yok</Text>
          ) : (
            syncLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <Text style={[styles.logMessage, { color: getLogColor(log.type) }]}>
                  {getLogIcon(log.type)} {log.message}
                </Text>
                <Text style={styles.logTimestamp}>
                  {log.timestamp.toLocaleTimeString('tr-TR')}
                </Text>
              </View>
            ))
          )}
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    lineHeight: 28,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  runAllButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  runAllButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  runAllButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.surface,
  },
  testButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  testButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  testButtonText: {
    ...TYPOGRAPHY.buttonSmall,
    color: COLORS.surface,
  },
  jobsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  jobsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    width: '47%',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 75,
  },
  jobCardRunning: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  jobName: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
  },
  jobDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 2,
    lineHeight: 14,
    fontSize: 10,
  },
  jobLastRun: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 8,
    lineHeight: 10,
  },
  logsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  clearLogsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.xs,
  },
  clearLogsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
  logsContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    maxHeight: 280,
  },
  noLogsText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: SPACING.md,
    lineHeight: 20,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    minHeight: 32,
  },
  logMessage: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    marginRight: SPACING.sm,
    lineHeight: 16,
    fontSize: 11,
  },
  logTimestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 12,
    minWidth: 50,
  },
});

export default ComprehensiveSyncDashboard;
