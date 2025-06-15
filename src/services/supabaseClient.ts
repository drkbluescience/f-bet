// Import polyfills for web compatibility
import 'react-native-url-polyfill/auto';
import { API_CONFIG } from '@/constants';

// Platform detection
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

console.log('🔍 Platform detection:', { isWeb, isReactNative });

// Import Supabase for both platforms
let createClient: any = null;

// Try to import Supabase for all platforms
try {
  const supabaseModule = require('@supabase/supabase-js');
  createClient = supabaseModule.createClient;
  console.log(`✅ Supabase client loaded for ${isWeb ? 'Web' : 'React Native'}`);
} catch (error) {
  console.warn(`⚠️ Failed to import Supabase for ${isWeb ? 'Web' : 'React Native'}:`, error);
  console.warn('Using mock client instead');
}

// Create Supabase client with proper configuration
const supabaseUrl = API_CONFIG.supabaseUrl;
const supabaseAnonKey = API_CONFIG.supabaseAnonKey;

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'your-supabase-url') {
  console.warn('⚠️ Supabase URL not configured. Using mock client.');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-supabase-anon-key') {
  console.warn('⚠️ Supabase Anon Key not configured. Using mock client.');
}

// Create real Supabase client for all platforms
const createRealSupabaseClient = () => {
  // Allow real client for web platform now
  console.log(`🔗 Creating Supabase client for ${isWeb ? 'Web' : 'React Native'} platform`);

  if (!createClient) {
    console.warn('⚠️ Supabase createClient not available');
    return null;
  }

  try {
    const clientConfig: any = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    };

    // Add realtime config for React Native
    if (isReactNative) {
      clientConfig.realtime = {
        params: {
          eventsPerSecond: 10,
        },
      };
    }

    console.log('🔗 Creating real Supabase client for React Native');
    return createClient(supabaseUrl, supabaseAnonKey, clientConfig);
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    return null;
  }
};

// Create a mock Supabase client for fallback
const createMockSupabaseClient = () => {
  // Mock query builder that supports method chaining
  const createMockQueryBuilder = () => {
    const mockResult = {
      data: [],
      error: { message: 'Using mock data - Supabase not connected' },
      count: 0
    };

    const queryBuilder = {
      eq: (column: string, value: any) => queryBuilder,
      neq: (column: string, value: any) => queryBuilder,
      gt: (column: string, value: any) => queryBuilder,
      gte: (column: string, value: any) => queryBuilder,
      lt: (column: string, value: any) => queryBuilder,
      lte: (column: string, value: any) => queryBuilder,
      like: (column: string, pattern: string) => queryBuilder,
      ilike: (column: string, pattern: string) => queryBuilder,
      is: (column: string, value: any) => queryBuilder,
      in: (column: string, values: any[]) => queryBuilder,
      contains: (column: string, value: any) => queryBuilder,
      containedBy: (column: string, value: any) => queryBuilder,
      rangeGt: (column: string, value: any) => queryBuilder,
      rangeGte: (column: string, value: any) => queryBuilder,
      rangeLt: (column: string, value: any) => queryBuilder,
      rangeLte: (column: string, value: any) => queryBuilder,
      rangeAdjacent: (column: string, value: any) => queryBuilder,
      overlaps: (column: string, value: any) => queryBuilder,
      textSearch: (column: string, query: string, options?: any) => queryBuilder,
      match: (query: Record<string, any>) => queryBuilder,
      not: (column: string, operator: string, value: any) => queryBuilder,
      or: (filters: string) => queryBuilder,
      filter: (column: string, operator: string, value: any) => queryBuilder,
      order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => queryBuilder,
      limit: (count: number, options?: { foreignTable?: string }) => queryBuilder,
      range: (from: number, to: number, options?: { foreignTable?: string }) => queryBuilder,
      abortSignal: (signal: AbortSignal) => queryBuilder,
      single: () => Promise.resolve({
        data: null,
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      maybeSingle: () => Promise.resolve({
        data: null,
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      csv: () => Promise.resolve({
        data: '',
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      geojson: () => Promise.resolve({
        data: null,
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      explain: (options?: any) => Promise.resolve({
        data: null,
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      rollback: () => Promise.resolve({
        data: null,
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      returns: () => queryBuilder,
      then: (onfulfilled?: any, onrejected?: any) => {
        return Promise.resolve(mockResult).then(onfulfilled, onrejected);
      },
      catch: (onrejected?: any) => {
        return Promise.resolve(mockResult).catch(onrejected);
      },
      finally: (onfinally?: any) => {
        return Promise.resolve(mockResult).finally(onfinally);
      }
    };

    // Make it thenable so it can be awaited
    Object.defineProperty(queryBuilder, Symbol.toStringTag, {
      value: 'Promise',
      configurable: true
    });

    return queryBuilder;
  };

  return {
    from: (table: string) => ({
      select: (columns?: string, options?: any) => createMockQueryBuilder(),
      insert: (data: any) => createMockQueryBuilder(),
      update: (data: any) => createMockQueryBuilder(),
      upsert: (data: any) => createMockQueryBuilder(),
      delete: () => createMockQueryBuilder(),
    }),
    auth: {
      getSession: () => Promise.resolve({
        data: { session: null },
        error: null
      }),
      signIn: (credentials: any) => Promise.resolve({
        data: null,
        error: { message: 'Authentication not available in mock mode' }
      }),
      signOut: () => Promise.resolve({ error: null }),
    },
    channel: (name: string) => ({
      on: (event: string, options: any, callback: Function) => ({
        subscribe: () => ({
          unsubscribe: () => {
            console.log('Mock realtime unsubscribed');
          }
        })
      })
    }),
  };
};

// Determine which client to use - removed isWeb condition
const shouldUseMockClient = !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === 'your-supabase-url' ||
  supabaseAnonKey === 'your-supabase-anon-key';

// Create and export the appropriate client
export const supabase = shouldUseMockClient
  ? createMockSupabaseClient()
  : createRealSupabaseClient() || createMockSupabaseClient();

// Log which client is being used
if (shouldUseMockClient) {
  console.log('🔧 Using mock Supabase client - configure environment variables for real data');
} else {
  console.log(`✅ Using real Supabase client for ${isWeb ? 'Web' : 'React Native'}`);
}

// Export connection test function
export const testSupabaseConnection = async () => {
  try {
    if (shouldUseMockClient) {
      return { success: false, message: 'Using mock client - configure environment variables for real connection' };
    }

    const { data, error } = await supabase
      .from('countries')
      .select('count(*)')
      .limit(1);

    if (error) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }

    return { success: true, message: 'Supabase connection successful' };
  } catch (error) {
    return { success: false, message: `Connection error: ${error}` };
  }
};

export default supabase;
