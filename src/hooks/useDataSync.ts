import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import { DataSyncService } from '@/services/dataSyncService';
import { ApiFootballService } from '@/services/apiFootballService';
import { testSupabaseConnection } from '@/services/supabaseClient';
import { QUERY_KEYS } from '@/constants';

interface SyncStatus {
  isRunning: boolean;
  lastSyncTimes: Record<string, number>;
  intervals: Record<string, number>;
}

interface ConnectionStatus {
  supabase: { success: boolean; message: string };
  apiFootball: { success: boolean; message: string };
}

export const useDataSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSyncTimes: {},
    intervals: {},
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    supabase: { success: false, message: 'Not tested' },
    apiFootball: { success: false, message: 'Not tested' },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Test connections
  const testConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [supabaseResult, apiFootballResult] = await Promise.all([
        testSupabaseConnection(),
        ApiFootballService.testConnection(),
      ]);

      setConnectionStatus({
        supabase: supabaseResult,
        apiFootball: apiFootballResult,
      });

      return {
        supabase: supabaseResult.success,
        apiFootball: apiFootballResult.success,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { supabase: false, apiFootball: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync all data
  const syncAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await DataSyncService.syncAll();
      
      if (result.success) {
        // Invalidate all queries to refresh data
        queryClient.invalidateQueries();
        console.log('✅ Data sync completed successfully');
      } else {
        setError(result.message);
        console.error('❌ Data sync failed:', result.message);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Data sync error:', error);
      return { success: false, message: errorMessage, details: {} };
    } finally {
      setIsLoading(false);
      updateSyncStatus();
    }
  }, [queryClient]);

  // Sync specific data types
  const syncCountries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await DataSyncService.syncCountries();
      queryClient.invalidateQueries([QUERY_KEYS.FIXTURES]);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { synced: 0, errors: 1 };
    } finally {
      setIsLoading(false);
      updateSyncStatus();
    }
  }, [queryClient]);

  const syncLeagues = useCallback(async (country?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await DataSyncService.syncLeagues(country);
      queryClient.invalidateQueries([QUERY_KEYS.FIXTURES]);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { synced: 0, errors: 1 };
    } finally {
      setIsLoading(false);
      updateSyncStatus();
    }
  }, [queryClient]);

  const syncTeams = useCallback(async (leagueId?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await DataSyncService.syncTeams(leagueId);
      queryClient.invalidateQueries([QUERY_KEYS.TEAMS]);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { synced: 0, errors: 1 };
    } finally {
      setIsLoading(false);
      updateSyncStatus();
    }
  }, [queryClient]);

  const syncFixtures = useCallback(async (params: {
    league?: number;
    team?: number;
    date?: string;
    from?: string;
    to?: string;
  } = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await DataSyncService.syncFixtures(params);
      queryClient.invalidateQueries([QUERY_KEYS.FIXTURES]);
      queryClient.invalidateQueries([QUERY_KEYS.FIXTURE_DETAIL]);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { synced: 0, errors: 1 };
    } finally {
      setIsLoading(false);
      updateSyncStatus();
    }
  }, [queryClient]);

  const syncLiveFixtures = useCallback(async () => {
    try {
      const result = await DataSyncService.syncLiveFixtures();
      queryClient.invalidateQueries([QUERY_KEYS.FIXTURES, 'live']);
      return result;
    } catch (error) {
      console.error('Live fixtures sync error:', error);
      return { synced: 0, errors: 1 };
    }
  }, [queryClient]);

  const syncTodayFixtures = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await DataSyncService.syncTodayFixtures();
      queryClient.invalidateQueries([QUERY_KEYS.FIXTURES, 'today']);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { synced: 0, errors: 1 };
    } finally {
      setIsLoading(false);
      updateSyncStatus();
    }
  }, [queryClient]);

  // Update sync status
  const updateSyncStatus = useCallback(() => {
    setSyncStatus(DataSyncService.getSyncStatus());
  }, []);

  // Check if sync is needed
  const shouldSync = useCallback((type: 'countries' | 'leagues' | 'teams' | 'fixtures' | 'liveFixtures') => {
    return DataSyncService.shouldSync(type);
  }, []);

  // Auto-sync live fixtures
  useEffect(() => {
    const interval = setInterval(() => {
      if (shouldSync('liveFixtures')) {
        syncLiveFixtures();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [shouldSync, syncLiveFixtures]);

  // Update sync status on mount and periodically
  useEffect(() => {
    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateSyncStatus]);

  // Auto-test connections on mount
  useEffect(() => {
    testConnections();
  }, [testConnections]);

  // Additional sync methods
  const syncVenues = useCallback(async (params: { country?: string; city?: string; search?: string } = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await DataSyncService.syncVenues(params);
      queryClient.invalidateQueries(['venues']);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { synced: 0, errors: 1 };
    } finally {
      setIsLoading(false);
      updateSyncStatus();
    }
  }, [queryClient]);

  const syncAllTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await DataSyncService.syncAllTables();

      if (result.success) {
        // Invalidate all queries to refresh data
        queryClient.invalidateQueries();
        console.log('✅ Comprehensive data sync completed successfully');
      } else {
        setError(result.message);
        console.error('❌ Comprehensive data sync failed:', result.message);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Comprehensive data sync error:', error);
      return { success: false, message: errorMessage, details: {} };
    } finally {
      setIsLoading(false);
      updateSyncStatus();
    }
  }, [queryClient]);

  return {
    // Status
    syncStatus,
    connectionStatus,
    isLoading,
    error,

    // Actions
    testConnections,
    syncAll,
    syncAllTables,
    syncCountries,
    syncLeagues,
    syncTeams,
    syncFixtures,
    syncLiveFixtures,
    syncTodayFixtures,
    syncVenues,

    // Utilities
    shouldSync,
    updateSyncStatus,

    // Computed values
    isConnected: connectionStatus.supabase.success && connectionStatus.apiFootball.success,
    canSync: connectionStatus.supabase.success && connectionStatus.apiFootball.success && !syncStatus.isRunning,
  };
};

export default useDataSync;
