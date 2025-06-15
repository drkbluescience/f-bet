import { DataSyncService } from './dataSyncService';
import { DataTrackingService } from './dataTrackingService';
import { notificationService } from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScheduleConfig {
  id: string;
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  priority: 'high' | 'medium' | 'low';
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export interface SyncJob {
  id: string;
  type: 'countries' | 'leagues' | 'teams' | 'fixtures' | 'live' | 'standings' | 'players';
  config: ScheduleConfig;
  handler: () => Promise<any>;
}

export interface SyncResult {
  jobId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  recordsProcessed: number;
  errors: string[];
  apiCallsUsed: number;
}

class SchedulerService {
  private jobs: Map<string, SyncJob> = new Map();
  private activeJobs: Set<string> = new Set();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  // Predefined sync schedules
  private readonly DEFAULT_SCHEDULES: ScheduleConfig[] = [
    {
      id: 'daily-countries',
      name: 'Daily Countries Sync',
      cronExpression: '0 2 * * *', // 02:00 daily
      enabled: true,
      priority: 'low',
      maxRetries: 3,
      retryDelay: 300000, // 5 minutes
      timeout: 600000, // 10 minutes
    },
    {
      id: 'daily-leagues',
      name: 'Daily Leagues Sync',
      cronExpression: '0 3 * * *', // 03:00 daily
      enabled: true,
      priority: 'medium',
      maxRetries: 3,
      retryDelay: 300000,
      timeout: 900000, // 15 minutes
    },
    {
      id: 'daily-teams',
      name: 'Daily Teams Sync',
      cronExpression: '0 4 * * *', // 04:00 daily
      enabled: true,
      priority: 'medium',
      maxRetries: 3,
      retryDelay: 300000,
      timeout: 1200000, // 20 minutes
    },
    {
      id: 'hourly-fixtures',
      name: 'Hourly Fixtures Sync',
      cronExpression: '0 * * * *', // Every hour
      enabled: true,
      priority: 'high',
      maxRetries: 5,
      retryDelay: 180000, // 3 minutes
      timeout: 600000,
    },
    {
      id: 'live-fixtures',
      name: 'Live Fixtures Sync',
      cronExpression: '*/2 * * * *', // Every 2 minutes
      enabled: true,
      priority: 'high',
      maxRetries: 3,
      retryDelay: 30000, // 30 seconds
      timeout: 120000, // 2 minutes
    },
    {
      id: 'daily-standings',
      name: 'Daily Standings Sync',
      cronExpression: '0 5 * * *', // 05:00 daily
      enabled: true,
      priority: 'medium',
      maxRetries: 3,
      retryDelay: 300000,
      timeout: 900000,
    },
    {
      id: 'weekly-players',
      name: 'Weekly Players Sync',
      cronExpression: '0 6 * * 0', // 06:00 every Sunday
      enabled: true,
      priority: 'low',
      maxRetries: 2,
      retryDelay: 600000, // 10 minutes
      timeout: 3600000, // 60 minutes
    },
  ];

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs() {
    // Countries sync job
    this.registerJob({
      id: 'daily-countries',
      type: 'countries',
      config: this.DEFAULT_SCHEDULES[0],
      handler: async () => {
        console.log('🌍 Starting scheduled countries sync...');
        return await DataSyncService.syncCountries();
      }
    });

    // Leagues sync job
    this.registerJob({
      id: 'daily-leagues',
      type: 'leagues',
      config: this.DEFAULT_SCHEDULES[1],
      handler: async () => {
        console.log('🏆 Starting scheduled leagues sync...');
        return await DataSyncService.syncLeagues();
      }
    });

    // Teams sync job
    this.registerJob({
      id: 'daily-teams',
      type: 'teams',
      config: this.DEFAULT_SCHEDULES[2],
      handler: async () => {
        console.log('⚽ Starting scheduled teams sync...');
        return await DataSyncService.syncTeams();
      }
    });

    // Fixtures sync job
    this.registerJob({
      id: 'hourly-fixtures',
      type: 'fixtures',
      config: this.DEFAULT_SCHEDULES[3],
      handler: async () => {
        console.log('📅 Starting scheduled fixtures sync...');
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return await DataSyncService.syncFixtures({ 
          from: today, 
          to: tomorrow 
        });
      }
    });

    // Live fixtures sync job
    this.registerJob({
      id: 'live-fixtures',
      type: 'live',
      config: this.DEFAULT_SCHEDULES[4],
      handler: async () => {
        console.log('🔴 Starting scheduled live fixtures sync...');
        return await DataSyncService.syncLiveFixtures();
      }
    });

    // Standings sync job
    this.registerJob({
      id: 'daily-standings',
      type: 'standings',
      config: this.DEFAULT_SCHEDULES[5],
      handler: async () => {
        console.log('📊 Starting scheduled standings sync...');
        // Sync standings for major leagues
        const majorLeagues = [39, 140, 203, 78, 135]; // Premier League, La Liga, Süper Lig, Bundesliga, Serie A
        const currentSeason = new Date().getFullYear();

        let totalSynced = 0;
        let totalErrors = 0;

        for (const leagueId of majorLeagues) {
          try {
            const result = await DataSyncService.syncStandings(leagueId, currentSeason);
            totalSynced += result.synced;
            totalErrors += result.errors;
          } catch (error) {
            console.error(`Error syncing standings for league ${leagueId}:`, error);
            totalErrors++;
          }
        }

        return { synced: totalSynced, errors: totalErrors };
      }
    });

    // Players sync job
    this.registerJob({
      id: 'weekly-players',
      type: 'players',
      config: this.DEFAULT_SCHEDULES[6],
      handler: async () => {
        console.log('👤 Starting scheduled players sync...');
        return await DataSyncService.syncMajorLeaguePlayers();
      }
    });
  }

  registerJob(job: SyncJob) {
    this.jobs.set(job.id, job);
    console.log(`📋 Registered sync job: ${job.config.name}`);
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting scheduler service...');

    // Load saved configurations
    await this.loadConfigurations();

    // Start all enabled jobs
    for (const [jobId, job] of this.jobs) {
      if (job.config.enabled) {
        this.scheduleJob(jobId);
      }
    }

    console.log(`✅ Scheduler started with ${this.intervals.size} active jobs`);

    // Run a test job to initialize lastRun values
    setTimeout(async () => {
      console.log('🧪 Running initial test job to set lastRun values...');
      try {
        await this.runJobNow('daily-countries');
        console.log('✅ Initial test job completed');
      } catch (error) {
        console.warn('⚠️ Initial test job failed:', error);
      }
    }, 5000); // Wait 5 seconds after startup
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping scheduler service...');

    // Clear all intervals
    for (const [jobId, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`⏹️ Stopped job: ${jobId}`);
    }

    this.intervals.clear();
    this.activeJobs.clear();
    this.isRunning = false;

    console.log('✅ Scheduler stopped');
  }

  private scheduleJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job || !job.config.enabled) {
      return;
    }

    // Calculate next run time based on cron expression
    const nextRun = this.calculateNextRun(job.config.cronExpression);
    job.config.nextRun = nextRun.toISOString();

    // Set timeout for next execution
    const delay = nextRun.getTime() - Date.now();
    
    const timeout = setTimeout(async () => {
      await this.executeJob(jobId);
      // Reschedule for next run
      this.scheduleJob(jobId);
    }, delay);

    this.intervals.set(jobId, timeout);

    console.log(`⏰ Scheduled ${job.config.name} for ${nextRun.toLocaleString()}`);
  }

  private async executeJob(jobId: string): Promise<SyncResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (this.activeJobs.has(jobId)) {
      console.log(`⚠️ Job ${jobId} is already running, skipping...`);
      return {
        jobId,
        success: false,
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        recordsProcessed: 0,
        errors: ['Job already running'],
        apiCallsUsed: 0,
      };
    }

    this.activeJobs.add(jobId);
    const startTime = new Date();
    let result: SyncResult;

    try {
      console.log(`🔄 Executing job: ${job.config.name}`);

      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), job.config.timeout);
      });

      const jobPromise = job.handler();
      const syncResult = await Promise.race([jobPromise, timeoutPromise]) as any;

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      result = {
        jobId,
        success: true,
        startTime,
        endTime,
        duration,
        recordsProcessed: syncResult.synced || 0,
        errors: syncResult.errors || [],
        apiCallsUsed: 1, // This should be tracked properly
      };

      // Update last run time
      job.config.lastRun = startTime.toISOString();
      await this.saveConfiguration(job.config);

      console.log(`📝 Updated lastRun for ${job.config.name}: ${startTime.toISOString()}`);

      // Log to tracking service
      await DataTrackingService.logDataSync({
        table_name: job.type,
        sync_date: startTime.toISOString().split('T')[0],
        records_added: syncResult.synced || 0,
        records_updated: 0,
        api_calls_used: 1,
        sync_duration_ms: duration,
        status: 'success',
      });

      console.log(`✅ Job completed: ${job.config.name} (${duration}ms, ${syncResult.synced || 0} records)`);

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      result = {
        jobId,
        success: false,
        startTime,
        endTime,
        duration,
        recordsProcessed: 0,
        errors: [errorMessage],
        apiCallsUsed: 0,
      };

      // Log error
      await DataTrackingService.logDataSync({
        table_name: job.type,
        sync_date: startTime.toISOString().split('T')[0],
        records_added: 0,
        records_updated: 0,
        api_calls_used: 1,
        sync_duration_ms: duration,
        status: 'error',
        error_message: errorMessage,
      });

      console.error(`❌ Job failed: ${job.config.name} - ${errorMessage}`);

      // Update last run time even for failed jobs
      job.config.lastRun = startTime.toISOString();
      await this.saveConfiguration(job.config);

      console.log(`📝 Updated lastRun for failed job ${job.config.name}: ${startTime.toISOString()}`);

      // Retry logic
      if (job.config.maxRetries > 0) {
        console.log(`🔄 Retrying job ${jobId} in ${job.config.retryDelay}ms...`);
        setTimeout(() => {
          job.config.maxRetries--;
          this.executeJob(jobId);
        }, job.config.retryDelay);
      }
    } finally {
      this.activeJobs.delete(jobId);
    }

    // Send notification for important jobs
    if (job.config.priority === 'high' && !result.success) {
      await notificationService.sendSyncAlert(job.config.name, result.errors[0]);
    }

    return result;
  }

  // Simple cron parser for basic expressions
  private calculateNextRun(cronExpression: string): Date {
    const now = new Date();
    const parts = cronExpression.split(' ');
    
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression');
    }

    const [minute, hour, day, month, dayOfWeek] = parts;

    // Handle simple cases
    if (cronExpression === '*/2 * * * *') {
      // Every 2 minutes
      return new Date(now.getTime() + 2 * 60 * 1000);
    }

    if (cronExpression === '0 * * * *') {
      // Every hour
      const next = new Date(now);
      next.setMinutes(0, 0, 0);
      next.setHours(next.getHours() + 1);
      return next;
    }

    if (cronExpression.match(/^0 \d+ \* \* \*$/)) {
      // Daily at specific hour
      const targetHour = parseInt(hour);
      const next = new Date(now);
      next.setHours(targetHour, 0, 0, 0);
      
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      return next;
    }

    // Default: next hour
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  private async loadConfigurations() {
    try {
      const saved = await AsyncStorage.getItem('scheduler_configs');
      if (saved) {
        const configs = JSON.parse(saved);
        for (const config of configs) {
          const job = this.jobs.get(config.id);
          if (job) {
            job.config = { ...job.config, ...config };
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load scheduler configurations:', error);
    }
  }

  private async saveConfiguration(config: ScheduleConfig) {
    try {
      const allConfigs = Array.from(this.jobs.values()).map(job => job.config);
      await AsyncStorage.setItem('scheduler_configs', JSON.stringify(allConfigs));
    } catch (error) {
      console.warn('Failed to save scheduler configuration:', error);
    }
  }

  // Public methods for management
  async enableJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.config.enabled = true;
      await this.saveConfiguration(job.config);
      if (this.isRunning) {
        this.scheduleJob(jobId);
      }
    }
  }

  async disableJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.config.enabled = false;
      await this.saveConfiguration(job.config);
      const interval = this.intervals.get(jobId);
      if (interval) {
        clearTimeout(interval);
        this.intervals.delete(jobId);
      }
    }
  }

  getJobStatus() {
    const statuses = Array.from(this.jobs.values()).map(job => ({
      id: job.id,
      name: job.config.name,
      enabled: job.config.enabled,
      lastRun: job.config.lastRun,
      nextRun: job.config.nextRun,
      isActive: this.activeJobs.has(job.id),
      priority: job.config.priority,
    }));

    console.log('📊 Current job statuses:', statuses.map(s => ({
      name: s.name,
      lastRun: s.lastRun || 'Never',
      enabled: s.enabled,
      isActive: s.isActive
    })));

    return statuses;
  }

  async runJobNow(jobId: string) {
    return await this.executeJob(jobId);
  }
}

export const schedulerService = new SchedulerService();
export default SchedulerService;
