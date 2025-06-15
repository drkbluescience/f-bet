import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FixturesService } from '@/services/fixturesService';
import { TeamsService } from '@/services/teamsService';
import { OddsService } from '@/services/oddsService';
import { PredictionsService } from '@/services/predictionsService';
import { QUERY_KEYS } from '@/constants';
import { FilterOptions, LoadingState } from '@/types';

// Export data sync hook
export { useDataSync } from './useDataSync';

/**
 * Hook for managing loading states
 */
export const useLoadingState = (initialState: boolean = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState<string | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) setError(null);
  }, []);

  const setErrorState = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    setLoading,
    setError: setErrorState,
    reset,
  };
};

/**
 * Hook for fetching fixtures with filtering and pagination
 */
export const useFixtures = (options: FilterOptions & { page?: number; limit?: number } = {}) => {
  return useQuery(
    [QUERY_KEYS.FIXTURES, options],
    () => FixturesService.getFixtures(options),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
      refetchInterval: options.status === 'LIVE' ? 30000 : false, // Auto-refresh live matches
    }
  );
};

/**
 * Hook for fetching a single fixture
 */
export const useFixture = (fixtureId: number) => {
  return useQuery(
    [QUERY_KEYS.FIXTURE_DETAIL, fixtureId],
    () => FixturesService.getFixtureById(fixtureId),
    {
      enabled: !!fixtureId,
      staleTime: 30000,
    }
  );
};

/**
 * Hook for fetching live fixtures
 */
export const useLiveFixtures = () => {
  return useQuery(
    [QUERY_KEYS.FIXTURES, 'live'],
    () => FixturesService.getLiveFixtures(),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 15000,
      retry: 2, // Retry on error
    }
  );
};

/**
 * Hook for fetching today's fixtures
 */
export const useTodayFixtures = () => {
  return useQuery(
    [QUERY_KEYS.FIXTURES, 'today'],
    () => FixturesService.getTodayFixtures(),
    {
      staleTime: 60000, // 1 minute
      refetchInterval: 60000,
      retry: 2, // Retry on error
    }
  );
};

/**
 * Hook for fetching teams
 */
export const useTeams = (options: FilterOptions & { page?: number; limit?: number } = {}) => {
  return useQuery(
    [QUERY_KEYS.TEAMS, options],
    () => TeamsService.getTeams(options),
    {
      keepPreviousData: true,
      staleTime: 300000, // 5 minutes
    }
  );
};

/**
 * Hook for fetching a single team
 */
export const useTeam = (teamId: number) => {
  return useQuery(
    [QUERY_KEYS.TEAMS, teamId],
    () => TeamsService.getTeamById(teamId),
    {
      enabled: !!teamId,
      staleTime: 300000,
    }
  );
};

/**
 * Hook for fetching team statistics
 */
export const useTeamStats = (teamId: number, options: { league_id?: number; season_year?: number } = {}) => {
  return useQuery(
    [QUERY_KEYS.TEAM_STATS, teamId, options],
    () => TeamsService.getTeamSeasonStats(teamId, options),
    {
      enabled: !!teamId,
      staleTime: 300000,
    }
  );
};

/**
 * Hook for fetching odds
 */
export const useOdds = (fixtureId: number) => {
  return useQuery(
    [QUERY_KEYS.ODDS, fixtureId],
    () => OddsService.getFixtureOdds(fixtureId),
    {
      enabled: !!fixtureId,
      staleTime: 60000, // 1 minute
      refetchInterval: 60000,
    }
  );
};

/**
 * Hook for fetching live odds
 */
export const useLiveOdds = (fixtureId: number) => {
  return useQuery(
    [QUERY_KEYS.ODDS, fixtureId, 'live'],
    () => OddsService.getLiveOdds(fixtureId),
    {
      enabled: !!fixtureId,
      staleTime: 30000,
      refetchInterval: 30000,
    }
  );
};

/**
 * Hook for fetching predictions
 */
export const usePrediction = (fixtureId: number) => {
  return useQuery(
    [QUERY_KEYS.PREDICTIONS, fixtureId],
    () => PredictionsService.getFixturePrediction(fixtureId),
    {
      enabled: !!fixtureId,
      staleTime: 300000, // 5 minutes
    }
  );
};

/**
 * Hook for fetching high confidence predictions
 */
export const useHighConfidencePredictions = (limit: number = 10, minConfidence: number = 0.7) => {
  return useQuery(
    [QUERY_KEYS.PREDICTIONS, 'high-confidence', limit, minConfidence],
    () => PredictionsService.getHighConfidencePredictions(limit, minConfidence),
    {
      staleTime: 300000,
      retry: 2, // Retry on error
    }
  );
};

/**
 * Hook for debounced search
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for managing real-time subscriptions
 */
export const useRealtimeSubscription = (
  subscriptionFn: (callback: (payload: any) => void) => any,
  callback: (payload: any) => void,
  dependencies: any[] = []
) => {
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (subscriptionFn) {
      subscriptionRef.current = subscriptionFn(callback);
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, dependencies);

  return subscriptionRef.current;
};

/**
 * Hook for managing fixture real-time updates
 */
export const useFixtureRealtime = (fixtureId: number) => {
  const queryClient = useQueryClient();

  const handleFixtureUpdate = useCallback((payload: any) => {
    queryClient.invalidateQueries([QUERY_KEYS.FIXTURE_DETAIL, fixtureId]);
    queryClient.invalidateQueries([QUERY_KEYS.FIXTURES]);
  }, [fixtureId, queryClient]);

  const handleEventsUpdate = useCallback((payload: any) => {
    queryClient.invalidateQueries([QUERY_KEYS.FIXTURE_DETAIL, fixtureId]);
  }, [fixtureId, queryClient]);

  useRealtimeSubscription(
    (callback) => FixturesService.subscribeToFixtureUpdates(fixtureId, callback),
    handleFixtureUpdate,
    [fixtureId]
  );

  useRealtimeSubscription(
    (callback) => FixturesService.subscribeToFixtureEvents(fixtureId, callback),
    handleEventsUpdate,
    [fixtureId]
  );
};

/**
 * Hook for managing odds real-time updates
 */
export const useOddsRealtime = (fixtureId: number) => {
  const queryClient = useQueryClient();

  const handleOddsUpdate = useCallback((payload: any) => {
    queryClient.invalidateQueries([QUERY_KEYS.ODDS, fixtureId]);
  }, [fixtureId, queryClient]);

  useRealtimeSubscription(
    (callback) => OddsService.subscribeToOddsUpdates(fixtureId, callback),
    handleOddsUpdate,
    [fixtureId]
  );
};

/**
 * Hook for managing pagination
 */
export const usePagination = (initialPage: number = 1, initialLimit: number = 20) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
  }, [initialPage]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    reset,
  };
};

/**
 * Hook for managing filters
 */
export const useFilters = <T extends Record<string, any>>(initialFilters: T) => {
  const [filters, setFilters] = useState<T>(initialFilters);

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearFilter = useCallback(<K extends keyof T>(key: K) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilter,
  };
};
