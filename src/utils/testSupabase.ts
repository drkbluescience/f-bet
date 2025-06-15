import { supabase } from '@/services/supabaseClient';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Supabase connection successful!', data);
    return { success: true, data };
  } catch (error) {
    console.error('Supabase test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const testSupabaseAuth = async () => {
  try {
    console.log('Testing Supabase auth...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase auth error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Supabase auth test successful!', session ? 'User logged in' : 'No active session');
    return { success: true, session };
  } catch (error) {
    console.error('Supabase auth test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
