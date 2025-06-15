import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants';
import { supabase } from '@/services/supabaseClient';
import { ApiFootballService } from '@/services/apiFootballService';

interface TableStats {
  name: string;
  count: number;
  todayAdded: number;
  lastSync: string | null;
  error?: string;
}

interface APIUsage {
  current: number;
  limit: number;
  plan: string;
  remaining: number;
}

interface DataUsageStatsProps {
  showDetailed?: boolean;
}

const DataUsageStats: React.FC<DataUsageStatsProps> = ({ showDetailed = false }) => {
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [apiUsage, setApiUsage] = useState<APIUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tables = [
    { name: 'countries', displayName: 'Ülkeler' },
    { name: 'leagues', displayName: 'Ligler' },
    { name: 'teams', displayName: 'Takımlar' },
    { name: 'venues', displayName: 'Stadyumlar' },
    { name: 'fixtures', displayName: 'Maçlar' },
    { name: 'league_standings', displayName: 'Puan Durumu' },
    { name: 'predictions', displayName: 'Tahminler' },
  ];

  const fetchTableStats = async () => {
    const stats: TableStats[] = [];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    for (const table of tables) {
      try {
        // Get total count
        const { count: totalCount, error: countError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          stats.push({
            name: table.name,
            count: 0,
            todayAdded: 0,
            lastSync: null,
            error: countError.message,
          });
          continue;
        }

        // Get today's additions
        const { count: todayCount, error: todayError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`);

        // Get last sync time (most recent record)
        const { data: lastRecord, error: lastError } = await supabase
          .from(table.name)
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1);

        stats.push({
          name: table.name,
          count: totalCount || 0,
          todayAdded: todayError ? 0 : (todayCount || 0),
          lastSync: lastRecord && lastRecord.length > 0 ? lastRecord[0].created_at : null,
        });
      } catch (err) {
        stats.push({
          name: table.name,
          count: 0,
          todayAdded: 0,
          lastSync: null,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    setTableStats(stats);
  };

  const fetchAPIUsage = async () => {
    try {
      console.log('🌐 Fetching real API-Football usage statistics...');

      const data = await ApiFootballService.getAPIStatus();
      const status = data.response;

      console.log('✅ API-Football status received:', {
        plan: status.subscription.plan,
        current: status.requests.current,
        limit: status.requests.limit_day,
        account: status.account.firstname + ' ' + status.account.lastname
      });

      setApiUsage({
        current: status.requests.current,
        limit: status.requests.limit_day,
        plan: status.subscription.plan,
        remaining: status.requests.limit_day - status.requests.current,
      });
    } catch (err) {
      console.error('Error fetching real API usage:', err);

      // Fallback to mock data for development
      console.warn('Using fallback API usage data');
      setApiUsage({
        current: 15,
        limit: 100,
        plan: 'Free',
        remaining: 85,
      });

      setError(err instanceof Error ? err.message : 'Failed to fetch API usage');
    }
  };

  const loadData = async () => {
    setError(null);
    try {
      await Promise.all([fetchTableStats(), fetchAPIUsage()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Hiç';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  };

  const getTableDisplayName = (tableName: string) => {
    return tables.find(t => t.name === tableName)?.displayName || tableName;
  };

  const totalRecords = tableStats.reduce((sum, table) => sum + table.count, 0);
  const totalTodayAdded = tableStats.reduce((sum, table) => sum + table.todayAdded, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="analytics" size={32} color={COLORS.primary} />
        <Text style={styles.loadingText}>Veri istatistikleri yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* API Usage Card */}
      {apiUsage && (
        <View style={styles.apiCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="cloud" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>API Kullanımı</Text>
          </View>
          <View style={styles.apiStats}>
            <View style={styles.apiStat}>
              <Text style={styles.apiStatValue}>{apiUsage.current}</Text>
              <Text style={styles.apiStatLabel}>Bugün Kullanılan</Text>
            </View>
            <View style={styles.apiStat}>
              <Text style={styles.apiStatValue}>{apiUsage.remaining}</Text>
              <Text style={styles.apiStatLabel}>Kalan</Text>
            </View>
            <View style={styles.apiStat}>
              <Text style={styles.apiStatValue}>{apiUsage.limit}</Text>
              <Text style={styles.apiStatLabel}>Günlük Limit</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(apiUsage.current / apiUsage.limit) * 100}%`,
                  backgroundColor: apiUsage.current / apiUsage.limit > 0.8 ? COLORS.error : COLORS.success
                }
              ]} 
            />
          </View>
          <Text style={styles.planText}>Plan: {apiUsage.plan}</Text>
        </View>
      )}

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="bar-chart" size={24} color={COLORS.accent} />
          <Text style={styles.cardTitle}>Veri Özeti</Text>
        </View>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{totalRecords.toLocaleString()}</Text>
            <Text style={styles.summaryStatLabel}>Toplam Kayıt</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{totalTodayAdded.toLocaleString()}</Text>
            <Text style={styles.summaryStatLabel}>Bugün Eklenen</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{tableStats.filter(t => t.count > 0).length}</Text>
            <Text style={styles.summaryStatLabel}>Dolu Tablo</Text>
          </View>
        </View>
      </View>

      {/* Table Stats */}
      {showDetailed && (
        <View style={styles.tablesCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={24} color={COLORS.secondary} />
            <Text style={styles.cardTitle}>Tablo Detayları</Text>
          </View>
          {tableStats.map((table) => (
            <View key={table.name} style={styles.tableRow}>
              <View style={styles.tableInfo}>
                <Text style={styles.tableName}>{getTableDisplayName(table.name)}</Text>
                <Text style={styles.tableLastSync}>Son güncelleme: {formatTime(table.lastSync)}</Text>
              </View>
              <View style={styles.tableStats}>
                <Text style={styles.tableCount}>{table.count.toLocaleString()}</Text>
                {table.todayAdded > 0 && (
                  <Text style={styles.tableTodayAdded}>+{table.todayAdded}</Text>
                )}
              </View>
              {table.error && (
                <Text style={styles.tableError}>{table.error}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="warning" size={24} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
  },
  apiCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tablesCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  apiStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  apiStat: {
    alignItems: 'center',
  },
  apiStatValue: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
  },
  apiStatLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  planText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
  },
  summaryStatLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableInfo: {
    flex: 1,
  },
  tableName: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.textPrimary,
  },
  tableLastSync: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  tableStats: {
    alignItems: 'flex-end',
  },
  tableCount: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
  },
  tableTodayAdded: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.success,
    marginTop: SPACING.xs,
  },
  tableError: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  errorCard: {
    backgroundColor: COLORS.errorBackground,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    flex: 1,
  },
});

export default DataUsageStats;
