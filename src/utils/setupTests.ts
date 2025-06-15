// Test utilities and setup for the F-Bet app
import { testSupabaseConnection } from '@/services/supabaseClient';
import { ApiFootballService } from '@/services/apiFootballService';
import { DataSyncService } from '@/services/dataSyncService';

export interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export class TestRunner {
  static async runAllTests(): Promise<{
    supabase: TestResult;
    apiFootball: TestResult;
    dataSync: TestResult;
    overall: TestResult;
  }> {
    console.log('🧪 Running F-Bet system tests...');

    const results = {
      supabase: await this.testSupabase(),
      apiFootball: await this.testApiFootball(),
      dataSync: await this.testDataSync(),
      overall: { success: false, message: '' },
    };

    // Determine overall result
    const allPassed = Object.values(results).slice(0, -1).every(r => r.success);
    results.overall = {
      success: allPassed,
      message: allPassed 
        ? 'All tests passed! System is ready.' 
        : 'Some tests failed. Check individual results.',
    };

    console.log('🧪 Test results:', results);
    return results;
  }

  static async testSupabase(): Promise<TestResult> {
    try {
      console.log('🔍 Testing Supabase connection...');
      const result = await testSupabaseConnection();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Supabase test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  static async testApiFootball(): Promise<TestResult> {
    try {
      console.log('🔍 Testing API-Football connection...');
      const result = await ApiFootballService.testConnection();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `API-Football test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  static async testDataSync(): Promise<TestResult> {
    try {
      console.log('🔍 Testing data synchronization...');
      
      // Check if sync is possible
      const syncStatus = DataSyncService.getSyncStatus();
      
      if (syncStatus.isRunning) {
        return {
          success: false,
          message: 'Data sync is currently running. Cannot test.',
        };
      }

      // Try a small sync operation (just countries)
      const result = await DataSyncService.syncCountries();
      
      if (result.errors > 0 && result.synced === 0) {
        return {
          success: false,
          message: `Data sync failed: ${result.errors} errors, ${result.synced} synced`,
          details: result,
        };
      }

      return {
        success: true,
        message: `Data sync working: ${result.synced} synced, ${result.errors} errors`,
        details: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Data sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  static async quickHealthCheck(): Promise<TestResult> {
    try {
      console.log('⚡ Running quick health check...');
      
      const [supabaseResult, apiFootballResult] = await Promise.all([
        this.testSupabase(),
        this.testApiFootball(),
      ]);

      const bothWorking = supabaseResult.success && apiFootballResult.success;
      
      return {
        success: bothWorking,
        message: bothWorking 
          ? 'Quick health check passed - both services are working'
          : 'Quick health check failed - one or more services are down',
        details: {
          supabase: supabaseResult,
          apiFootball: apiFootballResult,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  static logResults(results: any) {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    Object.entries(results).forEach(([key, result]: [string, any]) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${key}: ${result.message}`);
    });
    
    console.log('========================\n');
  }
}

// Export individual test functions for convenience
export const testSupabase = TestRunner.testSupabase;
export const testApiFootball = TestRunner.testApiFootball;
export const testDataSync = TestRunner.testDataSync;
export const quickHealthCheck = TestRunner.quickHealthCheck;
export const runAllTests = TestRunner.runAllTests;

// Development helper functions
export const devHelpers = {
  // Clear all React Query cache
  clearCache: (queryClient: any) => {
    queryClient.clear();
    console.log('🧹 React Query cache cleared');
  },

  // Log current environment
  logEnvironment: () => {
    console.log('🌍 Environment Info:');
    console.log('- Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...');
    console.log('- API Football Key:', process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ? 'Configured' : 'Not configured');
    console.log('- App Environment:', process.env.EXPO_PUBLIC_APP_ENV);
  },

  // Mock data helpers
  generateMockFixture: (id: number) => ({
    fixture_id: id,
    league_id: 39,
    season_year: 2024,
    date_utc: new Date().toISOString(),
    status: 'NS',
    home_team_id: id * 2,
    away_team_id: id * 2 + 1,
    venue_id: 1,
    referee: 'Test Referee',
    home_goals: null,
    away_goals: null,
    updated_at: new Date().toISOString(),
    home_team: { team_id: id * 2, name: `Team ${id * 2}`, logo_url: '', created_at: '', updated_at: '' },
    away_team: { team_id: id * 2 + 1, name: `Team ${id * 2 + 1}`, logo_url: '', created_at: '', updated_at: '' },
    league: { league_id: 39, name: 'Test League', country_id: 1, season_year: 2024, created_at: '', updated_at: '' }
  }),

  generateMockTeam: (id: number) => ({
    team_id: id,
    name: `Test Team ${id}`,
    country_id: 1,
    founded_year: 2000,
    venue_id: id,
    logo_url: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
};

export default TestRunner;
