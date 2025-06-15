// Import polyfills for web compatibility
import 'react-native-url-polyfill/auto';
import { API_CONFIG } from '@/constants';

// Platform detection
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

console.log('🔍 Platform detection:', { isWeb, isReactNative });

// For web, we'll use only mock client to avoid bundling issues
let createClient: any = null;

// Only import Supabase for React Native to avoid web bundling issues
if (!isWeb) {
  try {
    const supabaseModule = require('@supabase/supabase-js');
    createClient = supabaseModule.createClient;
    console.log('✅ Supabase client loaded for React Native');
  } catch (error) {
    console.warn('⚠️ Failed to import Supabase for React Native:', error);
    console.warn('Using mock client instead');
  }
} else {
  console.log('🌐 Web platform detected - using mock Supabase client only');
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

// Create real Supabase client only for React Native
const createRealSupabaseClient = () => {
  // Force mock client for web to avoid bundling issues
  if (isWeb) {
    console.log('🌐 Using mock client for web platform');
    return null;
  }

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
const createMockSupabaseClient = () => ({
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({
          data: null,
          error: { message: 'Using mock data - Supabase not connected' }
        })
      }),
      in: (column: string, values: any[]) => Promise.resolve({
        data: [],
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      order: (column: string, options?: any) => Promise.resolve({
        data: [],
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      limit: (count: number) => Promise.resolve({
        data: [],
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      gte: (column: string, value: any) => Promise.resolve({
        data: [],
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      lt: (column: string, value: any) => Promise.resolve({
        data: [],
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      or: (query: string) => Promise.resolve({
        data: [],
        error: { message: 'Using mock data - Supabase not connected' }
      }),
      range: (from: number, to: number) => Promise.resolve({
        data: [],
        error: { message: 'Using mock data - Supabase not connected' },
        count: 0
      }),
    }),
    insert: (data: any) => Promise.resolve({
      data: null,
      error: { message: 'Insert not available in mock mode' }
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({
        data: null,
        error: { message: 'Update not available in mock mode' }
      })
    }),
    upsert: (data: any) => Promise.resolve({
      data: null,
      error: { message: 'Upsert not available in mock mode' }
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({
        data: null,
        error: { message: 'Delete not available in mock mode' }
      })
    })
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
});

// Determine which client to use
const shouldUseMockClient = isWeb ||
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === 'your-supabase-url' ||
  supabaseAnonKey === 'your-supabase-anon-key';

// Create and export the appropriate client
export const supabase = shouldUseMockClient
  ? createMockSupabaseClient()
  : createRealSupabaseClient() || createMockSupabaseClient();

// Log which client is being used
if (shouldUseMockClient) {
  if (isWeb) {
    console.log('🌐 Using mock Supabase client for web platform');
  } else {
    console.log('🔧 Using mock Supabase client - configure environment variables for real data');
  }
} else {
  console.log('✅ Using real Supabase client for React Native');
}

// Export connection test function
export const testSupabaseConnection = async () => {
  try {
    if (shouldUseMockClient) {
      if (isWeb) {
        return { success: false, message: 'Web platform - using mock client (Supabase not loaded to avoid bundling issues)' };
      } else {
        return { success: false, message: 'Using mock client - configure environment variables for real connection' };
      }
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
