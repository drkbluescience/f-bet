import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { schedulerService } from '../services/schedulerService';
import { notificationService, SyncNotification } from '../services/notificationService';
import { DataTrackingService } from '../services/dataTrackingService';

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
  textMuted: '#999999',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  shadow: '#000000',
  border: '#E1E1E1',
  primaryLight: '#E3F2FD',
};

interface SyncStatus {
  id: string;
  name: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  isActive: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface DashboardStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  successRate: number;
  lastSync?: Date;
  apiCallsToday: number;
  recordsToday: number;
}

export const SyncDashboard: React.FC = () => {
  const [syncJobs, setSyncJobs] = useState<SyncStatus[]>([]);
  const [notifications, setNotifications] = useState<SyncNotification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    successRate: 0,
    apiCallsToday: 0,
    recordsToday: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load sync job statuses
      const jobStatuses = schedulerService.getJobStatus();
      console.log('🔄 Dashboard loading job statuses:', jobStatuses);
      setSyncJobs(jobStatuses);

      // Load recent notifications
      const recentNotifications = await notificationService.getNotifications(10);
      setNotifications(recentNotifications);

      // Load unread count
      const unread = await notificationService.getUnreadCount();
      setUnreadCount(unread);

      // Load sync statistics
      const syncStats = await notificationService.getSyncStats(7);
      
      // Load today's API usage
      const today = new Date().toISOString().split('T')[0];
      const todayStats = await DataTrackingService.getDailyStats(today);

      setStats({
        ...syncStats,
        apiCallsToday: todayStats?.total_api_calls || 0,
        recordsToday: todayStats?.total_records_added || 0,
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleRunJob = async (jobId: string) => {
    try {
      Alert.alert(
        'Run Sync Job',
        'Are you sure you want to run this sync job now?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Run',
            onPress: async () => {
              console.log(`🚀 Manually running job: ${jobId}`);
              const result = await schedulerService.runJobNow(jobId);
              console.log(`✅ Job result:`, result);
              await loadDashboardData();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Failed to run sync job:', error);
      Alert.alert('Error', 'Failed to run sync job');
    }
  };

  const handleToggleJob = async (jobId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await schedulerService.disableJob(jobId);
      } else {
        await schedulerService.enableJob(jobId);
      }
      await loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle sync job');
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (priority: string, isActive: boolean, enabled: boolean) => {
    if (isActive) return COLORS.warning;
    if (!enabled) return COLORS.textSecondary;
    
    switch (priority) {
      case 'high': return COLORS.error;
      case 'medium': return COLORS.info;
      case 'low': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return COLORS.success;
      case 'error': return COLORS.error;
      case 'warning': return COLORS.warning;
      case 'info': return COLORS.info;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sync Dashboard</Text>
        <Text style={styles.subtitle}>Automated data synchronization status</Text>
      </View>

      {/* Quick Test Button */}
      <View style={styles.quickTestContainer}>
        <TouchableOpacity
          style={styles.quickTestButton}
          onPress={async () => {
            console.log('🧪 Running quick test job...');
            await handleRunJob('daily-countries');
          }}
        >
          <Ionicons name="flash" size={20} color={COLORS.surface} />
          <Text style={styles.quickTestText}>Quick Test (Countries)</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.success }]}>
          <Text style={styles.statValue}>{stats.successRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
        
        <View style={[styles.statCard, { borderLeftColor: COLORS.info }]}>
          <Text style={styles.statValue}>{stats.apiCallsToday}</Text>
          <Text style={styles.statLabel}>API Calls Today</Text>
        </View>
        
        <View style={[styles.statCard, { borderLeftColor: COLORS.warning }]}>
          <Text style={styles.statValue}>{stats.recordsToday}</Text>
          <Text style={styles.statLabel}>Records Today</Text>
        </View>
        
        <View style={[styles.statCard, { borderLeftColor: COLORS.error }]}>
          <Text style={styles.statValue}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Unread Alerts</Text>
        </View>
      </View>

      {/* Sync Jobs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Jobs</Text>
        
        {syncJobs.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <View style={styles.jobInfo}>
                <View style={styles.jobTitleRow}>
                  <Ionicons
                    name="sync"
                    size={20}
                    color={getStatusColor(job.priority, job.isActive, job.enabled)}
                  />
                  <Text style={styles.jobName}>{job.name}</Text>
                  {job.isActive && (
                    <View style={styles.activeIndicator}>
                      <Text style={styles.activeText}>RUNNING</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.jobDetails}>
                  Last: {formatTime(job.lastRun)} | Next: {formatTime(job.nextRun)}
                </Text>
                
                <View style={styles.priorityBadge}>
                  <Text style={[styles.priorityText, { color: getStatusColor(job.priority, false, true) }]}>
                    {job.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.jobActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: job.enabled ? COLORS.error : COLORS.success }]}
                  onPress={() => handleToggleJob(job.id, job.enabled)}
                >
                  <Ionicons
                    name={job.enabled ? 'pause' : 'play'}
                    size={16}
                    color={COLORS.surface}
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
                  onPress={() => handleRunJob(job.id)}
                  disabled={job.isActive}
                >
                  <Ionicons
                    name="play-forward"
                    size={16}
                    color={COLORS.surface}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={() => notificationService.markAllAsRead()}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadNotification
              ]}
            >
              <Ionicons
                name={getNotificationIcon(notification.type)}
                size={24}
                color={getNotificationColor(notification.type)}
              />
              
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>
                  {notification.timestamp.toLocaleString()}
                </Text>
              </View>
              
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  markAllText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '500',
  },
  jobCard: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  activeIndicator: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  jobDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  jobActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadNotification: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  quickTestContainer: {
    margin: 16,
    marginBottom: 0,
  },
  quickTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickTestText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default SyncDashboard;
