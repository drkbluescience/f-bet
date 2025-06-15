import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Card, Button, ActivityIndicator, Chip, DataTable } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { DataTrackingService, DailyDataSummary, DataSyncLog } from '@/services/dataTrackingService';
import { format, subDays, parseISO } from 'date-fns';
import { setupDataSyncLogs } from '@/scripts/setupDataSyncLogs';

const { width } = Dimensions.get('window');

interface DataReportScreenProps {
  navigation: any;
}

export const DataReportScreen: React.FC<DataReportScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailyDataSummary[]>([]);
  const [recentLogs, setRecentLogs] = useState<DataSyncLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Son 7 günün özeti
      const summaryPromises = [];
      for (let i = 0; i < 7; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        summaryPromises.push(DataTrackingService.getDailySummary(date));
      }
      
      const summaries = await Promise.all(summaryPromises);
      setDailySummary(summaries.filter(s => s !== null) as DailyDataSummary[]);
      
      // Son sync logları
      const logs = await DataTrackingService.getRecentLogs(20);
      setRecentLogs(logs);
      
    } catch (error) {
      console.error('Error loading data report:', error);
      Alert.alert('Hata', 'Veri raporu yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const setupDatabase = async () => {
    try {
      setLoading(true);
      Alert.alert('Kurulum', 'Veritabanı tabloları oluşturuluyor...', [{ text: 'Tamam' }]);

      const success = await setupDataSyncLogs();

      if (success) {
        Alert.alert('Başarılı', 'Veritabanı tabloları başarıyla oluşturuldu!');
        await loadData(); // Reload data
      } else {
        Alert.alert('Hata', 'Veritabanı kurulumu başarısız oldu.');
      }
    } catch (error) {
      console.error('Setup error:', error);
      Alert.alert('Hata', 'Kurulum sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return COLORS.success;
      case 'error': return COLORS.error;
      case 'partial': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'partial': return 'warning';
      default: return 'help-circle';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Veri raporu yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Günlük Özet Kartları */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Son 7 Günün Özeti</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dailySummary.map((summary, index) => (
            <Card key={summary.date} style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.cardDate}>
                  {format(parseISO(summary.date), 'dd MMM')}
                </Text>
                <View style={styles.statRow}>
                  <Ionicons name="download" size={16} color={COLORS.primary} />
                  <Text style={styles.statText}>{summary.total_records_added}</Text>
                </View>
                <View style={styles.statRow}>
                  <Ionicons name="server" size={16} color={COLORS.accent} />
                  <Text style={styles.statText}>{summary.tables_synced}</Text>
                </View>
                <View style={styles.statRow}>
                  <Ionicons name="flash" size={16} color={COLORS.warning} />
                  <Text style={styles.statText}>{summary.total_api_calls}</Text>
                </View>
                <View style={styles.statRow}>
                  <Ionicons 
                    name={summary.success_rate > 90 ? "checkmark-circle" : "warning"} 
                    size={16} 
                    color={summary.success_rate > 90 ? COLORS.success : COLORS.warning} 
                  />
                  <Text style={styles.statText}>{summary.success_rate.toFixed(1)}%</Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </View>

      {/* Bugünün Detayları */}
      {dailySummary.length > 0 && (
        <Card style={styles.todayCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>🎯 Bugünün Detayları</Text>
            <View style={styles.todayStats}>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatNumber}>{dailySummary[0]?.total_records_added || 0}</Text>
                <Text style={styles.todayStatLabel}>Toplam Kayıt</Text>
              </View>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatNumber}>{dailySummary[0]?.tables_synced || 0}</Text>
                <Text style={styles.todayStatLabel}>Tablo</Text>
              </View>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatNumber}>{dailySummary[0]?.total_api_calls || 0}</Text>
                <Text style={styles.todayStatLabel}>API Çağrısı</Text>
              </View>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatNumber}>{dailySummary[0]?.sync_sessions || 0}</Text>
                <Text style={styles.todayStatLabel}>Senkronizasyon</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Son Sync İşlemleri */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔄 Son Senkronizasyon İşlemleri</Text>
        {recentLogs.map((log, index) => (
          <Card key={log.id || index} style={styles.logCard}>
            <Card.Content>
              <View style={styles.logHeader}>
                <View style={styles.logTitleRow}>
                  <Ionicons 
                    name={getStatusIcon(log.status)} 
                    size={20} 
                    color={getStatusColor(log.status)} 
                  />
                  <Text style={styles.logTableName}>{log.table_name}</Text>
                  <Chip 
                    mode="outlined" 
                    style={[styles.statusChip, { borderColor: getStatusColor(log.status) }]}
                    textStyle={{ color: getStatusColor(log.status), fontSize: 10 }}
                  >
                    {log.status.toUpperCase()}
                  </Chip>
                </View>
                <Text style={styles.logDate}>
                  {format(parseISO(log.created_at || log.sync_date), 'dd/MM HH:mm')}
                </Text>
              </View>
              
              <View style={styles.logStats}>
                <View style={styles.logStat}>
                  <Text style={styles.logStatLabel}>Eklenen</Text>
                  <Text style={styles.logStatValue}>{log.records_added}</Text>
                </View>
                <View style={styles.logStat}>
                  <Text style={styles.logStatLabel}>Güncellenen</Text>
                  <Text style={styles.logStatValue}>{log.records_updated}</Text>
                </View>
                <View style={styles.logStat}>
                  <Text style={styles.logStatLabel}>API</Text>
                  <Text style={styles.logStatValue}>{log.api_calls_used}</Text>
                </View>
                <View style={styles.logStat}>
                  <Text style={styles.logStatLabel}>Süre</Text>
                  <Text style={styles.logStatValue}>{formatDuration(log.sync_duration_ms)}</Text>
                </View>
              </View>
              
              {log.error_message && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{log.error_message}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Aksiyon Butonları */}
      <Card style={styles.actionCard}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('TableManager')}
            icon="database"
            style={[styles.actionButton, { marginBottom: 12 }]}
          >
            Tablo Yöneticisi
          </Button>

          <Button
            mode="outlined"
            onPress={setupDatabase}
            icon="cog"
            style={styles.setupButton}
            disabled={loading}
          >
            Veritabanı Kurulumu
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  summaryCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: COLORS.surface,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  todayCard: {
    margin: 16,
    backgroundColor: COLORS.surface,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  todayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  todayStat: {
    alignItems: 'center',
  },
  todayStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  todayStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  logCard: {
    marginBottom: 12,
    backgroundColor: COLORS.surface,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logTableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  statusChip: {
    height: 24,
  },
  logDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  logStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logStat: {
    alignItems: 'center',
  },
  logStatLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  logStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: COLORS.error + '20',
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
  },
  actionCard: {
    margin: 16,
    backgroundColor: COLORS.surface,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
  },
  setupButton: {
    borderColor: COLORS.primary,
  },
});
