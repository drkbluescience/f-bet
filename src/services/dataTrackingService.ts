import { supabase } from './supabaseClient';

export interface DataSyncLog {
  id?: number;
  table_name: string;
  sync_date: string;
  records_added: number;
  records_updated: number;
  api_calls_used: number;
  sync_duration_ms: number;
  status: 'success' | 'error' | 'partial';
  error_message?: string;
  created_at?: string;
}

export interface DailyDataSummary {
  date: string;
  total_records_added: number;
  total_api_calls: number;
  tables_synced: number;
  sync_sessions: number;
  success_rate: number;
}

export class DataTrackingService {
  /**
   * Log a data synchronization operation
   */
  static async logDataSync(log: Omit<DataSyncLog, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('data_sync_logs')
        .insert([{
          ...log,
          sync_date: log.sync_date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error('Failed to log data sync:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging data sync:', error);
      return false;
    }
  }

  /**
   * Get daily data summary for a specific date
   */
  static async getDailySummary(date: string): Promise<DailyDataSummary | null> {
    try {
      const { data, error } = await supabase
        .from('data_sync_logs')
        .select('*')
        .eq('sync_date', date);

      if (error) {
        console.error('Failed to get daily summary:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          date,
          total_records_added: 0,
          total_api_calls: 0,
          tables_synced: 0,
          sync_sessions: 0,
          success_rate: 0,
        };
      }

      const summary: DailyDataSummary = {
        date,
        total_records_added: data.reduce((sum, log) => sum + (log.records_added || 0), 0),
        total_api_calls: data.reduce((sum, log) => sum + (log.api_calls_used || 0), 0),
        tables_synced: new Set(data.map(log => log.table_name)).size,
        sync_sessions: data.length,
        success_rate: (data.filter(log => log.status === 'success').length / data.length) * 100,
      };

      return summary;
    } catch (error) {
      console.error('Error getting daily summary:', error);
      return null;
    }
  }

  /**
   * Get data sync logs for a date range
   */
  static async getSyncLogs(
    startDate: string,
    endDate: string,
    tableName?: string
  ): Promise<DataSyncLog[]> {
    try {
      let query = supabase
        .from('data_sync_logs')
        .select('*')
        .gte('sync_date', startDate)
        .lte('sync_date', endDate)
        .order('created_at', { ascending: false });

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get sync logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting sync logs:', error);
      return [];
    }
  }

  /**
   * Get weekly data summary
   */
  static async getWeeklySummary(): Promise<DailyDataSummary[]> {
    const summaries: DailyDataSummary[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const summary = await this.getDailySummary(dateString);
      if (summary) {
        summaries.push(summary);
      }
    }

    return summaries;
  }

  /**
   * Get table-specific statistics
   */
  static async getTableStats(tableName: string, days: number = 7): Promise<{
    total_records_added: number;
    total_api_calls: number;
    avg_sync_duration: number;
    success_rate: number;
    last_sync: string | null;
  }> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateString = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('data_sync_logs')
        .select('*')
        .eq('table_name', tableName)
        .gte('sync_date', startDateString)
        .lte('sync_date', endDate);

      if (error) {
        console.error('Failed to get table stats:', error);
        return {
          total_records_added: 0,
          total_api_calls: 0,
          avg_sync_duration: 0,
          success_rate: 0,
          last_sync: null,
        };
      }

      if (!data || data.length === 0) {
        return {
          total_records_added: 0,
          total_api_calls: 0,
          avg_sync_duration: 0,
          success_rate: 0,
          last_sync: null,
        };
      }

      const stats = {
        total_records_added: data.reduce((sum, log) => sum + (log.records_added || 0), 0),
        total_api_calls: data.reduce((sum, log) => sum + (log.api_calls_used || 0), 0),
        avg_sync_duration: data.reduce((sum, log) => sum + (log.sync_duration_ms || 0), 0) / data.length,
        success_rate: (data.filter(log => log.status === 'success').length / data.length) * 100,
        last_sync: data.length > 0 ? data[0].created_at || null : null,
      };

      return stats;
    } catch (error) {
      console.error('Error getting table stats:', error);
      return {
        total_records_added: 0,
        total_api_calls: 0,
        avg_sync_duration: 0,
        success_rate: 0,
        last_sync: null,
      };
    }
  }

  /**
   * Create the data_sync_logs table if it doesn't exist
   */
  static async createLogTable(): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS data_sync_logs (
            id SERIAL PRIMARY KEY,
            table_name VARCHAR(100) NOT NULL,
            sync_date DATE NOT NULL,
            records_added INTEGER DEFAULT 0,
            records_updated INTEGER DEFAULT 0,
            api_calls_used INTEGER DEFAULT 0,
            sync_duration_ms INTEGER DEFAULT 0,
            status VARCHAR(20) DEFAULT 'success',
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_data_sync_logs_table_date 
          ON data_sync_logs(table_name, sync_date);
          
          CREATE INDEX IF NOT EXISTS idx_data_sync_logs_date 
          ON data_sync_logs(sync_date);
        `
      });

      if (error) {
        console.error('Failed to create log table:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating log table:', error);
      return false;
    }
  }

  /**
   * Clean up old logs (keep only last 30 days)
   */
  static async cleanupOldLogs(): Promise<boolean> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

      const { error } = await supabase
        .from('data_sync_logs')
        .delete()
        .lt('sync_date', cutoffDate);

      if (error) {
        console.error('Failed to cleanup old logs:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      return false;
    }
  }
}
