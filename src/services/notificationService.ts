import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationConfig {
  enabled: boolean;
  syncAlerts: boolean;
  errorAlerts: boolean;
  dailySummary: boolean;
  liveMatchAlerts: boolean;
}

export interface SyncNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

class NotificationService {
  private notifications: SyncNotification[] = [];
  private config: NotificationConfig = {
    enabled: true,
    syncAlerts: true,
    errorAlerts: true,
    dailySummary: true,
    liveMatchAlerts: false,
  };

  constructor() {
    this.loadConfig();
    this.loadNotifications();
  }

  async sendSyncAlert(jobName: string, error?: string) {
    if (!this.config.enabled || !this.config.syncAlerts) {
      return;
    }

    const notification: SyncNotification = {
      id: `sync_${Date.now()}`,
      type: error ? 'error' : 'success',
      title: error ? 'Sync Failed' : 'Sync Completed',
      message: error 
        ? `${jobName} failed: ${error}`
        : `${jobName} completed successfully`,
      timestamp: new Date(),
      read: false,
      data: { jobName, error },
    };

    await this.addNotification(notification);

    // Show system notification if supported
    if (Platform.OS === 'web' && 'Notification' in window) {
      this.showWebNotification(notification);
    }
  }

  async sendDailySummary(summary: {
    totalJobs: number;
    successfulJobs: number;
    failedJobs: number;
    recordsProcessed: number;
    apiCallsUsed: number;
  }) {
    if (!this.config.enabled || !this.config.dailySummary) {
      return;
    }

    const notification: SyncNotification = {
      id: `daily_${Date.now()}`,
      type: summary.failedJobs > 0 ? 'warning' : 'success',
      title: 'Daily Sync Summary',
      message: `${summary.successfulJobs}/${summary.totalJobs} jobs completed. ${summary.recordsProcessed} records processed.`,
      timestamp: new Date(),
      read: false,
      data: summary,
    };

    await this.addNotification(notification);
  }

  async sendLiveMatchAlert(match: any) {
    if (!this.config.enabled || !this.config.liveMatchAlerts) {
      return;
    }

    const notification: SyncNotification = {
      id: `live_${match.fixture_id}`,
      type: 'info',
      title: 'Live Match Update',
      message: `${match.home_team.name} ${match.home_goals} - ${match.away_goals} ${match.away_team.name}`,
      timestamp: new Date(),
      read: false,
      data: match,
    };

    await this.addNotification(notification);
  }

  private async addNotification(notification: SyncNotification) {
    this.notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    await this.saveNotifications();
    
    console.log(`📢 Notification: ${notification.title} - ${notification.message}`);
  }

  private showWebNotification(notification: SyncNotification) {
    if (Platform.OS !== 'web' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showWebNotification(notification);
        }
      });
    }
  }

  async getNotifications(limit = 50): Promise<SyncNotification[]> {
    return this.notifications.slice(0, limit);
  }

  async getUnreadCount(): Promise<number> {
    return this.notifications.filter(n => !n.read).length;
  }

  async markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
    }
  }

  async markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    await this.saveNotifications();
  }

  async clearNotifications() {
    this.notifications = [];
    await this.saveNotifications();
  }

  async updateConfig(newConfig: Partial<NotificationConfig>) {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  private async loadConfig() {
    try {
      const saved = await AsyncStorage.getItem('notification_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load notification config:', error);
    }
  }

  private async saveConfig() {
    try {
      await AsyncStorage.setItem('notification_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save notification config:', error);
    }
  }

  private async loadNotifications() {
    try {
      const saved = await AsyncStorage.getItem('sync_notifications');
      if (saved) {
        const notifications = JSON.parse(saved);
        this.notifications = notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch (error) {
      console.warn('Failed to load notifications:', error);
    }
  }

  private async saveNotifications() {
    try {
      await AsyncStorage.setItem('sync_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.warn('Failed to save notifications:', error);
    }
  }

  // Get sync statistics for dashboard
  async getSyncStats(days = 7) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentNotifications = this.notifications.filter(n => n.timestamp >= cutoff);

    const syncNotifications = recentNotifications.filter(n => 
      n.type === 'success' || n.type === 'error'
    );

    const successCount = syncNotifications.filter(n => n.type === 'success').length;
    const errorCount = syncNotifications.filter(n => n.type === 'error').length;

    return {
      totalSyncs: syncNotifications.length,
      successfulSyncs: successCount,
      failedSyncs: errorCount,
      successRate: syncNotifications.length > 0 ? (successCount / syncNotifications.length) * 100 : 0,
      lastSync: syncNotifications.length > 0 ? syncNotifications[0].timestamp : null,
    };
  }

  // Create system-wide sync status
  async createSyncStatusLog(status: 'running' | 'completed' | 'failed', details?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      status,
      details,
    };

    try {
      const existingLogs = await AsyncStorage.getItem('sync_status_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.unshift(logEntry);
      
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.splice(50);
      }

      await AsyncStorage.setItem('sync_status_logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to save sync status log:', error);
    }
  }

  async getSyncStatusLogs(limit = 20) {
    try {
      const saved = await AsyncStorage.getItem('sync_status_logs');
      if (saved) {
        const logs = JSON.parse(saved);
        return logs.slice(0, limit).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
    } catch (error) {
      console.warn('Failed to load sync status logs:', error);
    }
    return [];
  }
}

export const notificationService = new NotificationService();
export { NotificationService };
export default NotificationService;
