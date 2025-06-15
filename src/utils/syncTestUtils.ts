import { DataSyncService } from '@/services/dataSyncService';
import { ApiFootballService } from '@/services/apiFootballService';

export interface TestResult {
  test: string;
  success: boolean;
  message: string;
  duration?: number;
  data?: any;
}

export class SyncTestUtils {
  /**
   * Test API-Football connection
   */
  static async testAPIConnection(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await ApiFootballService.testConnection();
      const duration = Date.now() - startTime;
      
      return {
        test: 'API-Football Bağlantısı',
        success: result.success,
        message: result.message,
        duration,
      };
    } catch (error) {
      return {
        test: 'API-Football Bağlantısı',
        success: false,
        message: `Bağlantı hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Test a small sync operation (countries)
   */
  static async testSmallSync(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await DataSyncService.syncCountries();
      const duration = Date.now() - startTime;
      
      return {
        test: 'Küçük Sync Testi (Ülkeler)',
        success: result.errors === 0,
        message: `${result.synced} kayıt senkronize edildi, ${result.errors} hata`,
        duration,
        data: result,
      };
    } catch (error) {
      return {
        test: 'Küçük Sync Testi (Ülkeler)',
        success: false,
        message: `Sync hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Test API rate limiting
   */
  static async testRateLimit(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Make multiple quick requests to test rate limiting
      const promises = [
        ApiFootballService.fetchCountries(),
        ApiFootballService.fetchCountries(),
        ApiFootballService.fetchCountries(),
      ];
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      return {
        test: 'Rate Limit Testi',
        success: true,
        message: `3 paralel istek başarılı (${duration}ms)`,
        duration,
      };
    } catch (error) {
      return {
        test: 'Rate Limit Testi',
        success: false,
        message: `Rate limit hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Test data transformation
   */
  static async testDataTransformation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Get sample data from API
      const response = await ApiFootballService.fetchCountries();
      const countries = response.response || [];
      
      if (countries.length === 0) {
        return {
          test: 'Veri Dönüşüm Testi',
          success: false,
          message: 'API\'den veri alınamadı',
          duration: Date.now() - startTime,
        };
      }
      
      // Test transformation
      const sampleCountry = countries[0];
      const transformed = {
        name: sampleCountry.name,
        code: sampleCountry.code || sampleCountry.name.substring(0, 3).toUpperCase(),
        flag: sampleCountry.flag,
      };
      
      const duration = Date.now() - startTime;
      
      return {
        test: 'Veri Dönüşüm Testi',
        success: true,
        message: `Veri dönüşümü başarılı: ${transformed.name}`,
        duration,
        data: { original: sampleCountry, transformed },
      };
    } catch (error) {
      return {
        test: 'Veri Dönüşüm Testi',
        success: false,
        message: `Dönüşüm hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Test database connection and write
   */
  static async testDatabaseWrite(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Try to write a test record
      const testRecord = {
        name: 'Test Country',
        code: 'TST',
        flag: null,
      };
      
      const { supabase } = await import('@/services/supabaseClient');
      const { error } = await supabase
        .from('countries')
        .upsert(testRecord, { onConflict: 'name' });
      
      if (error) {
        return {
          test: 'Veritabanı Yazma Testi',
          success: false,
          message: `Veritabanı hatası: ${error.message}`,
          duration: Date.now() - startTime,
        };
      }
      
      // Clean up test record
      await supabase
        .from('countries')
        .delete()
        .eq('name', 'Test Country');
      
      const duration = Date.now() - startTime;
      
      return {
        test: 'Veritabanı Yazma Testi',
        success: true,
        message: 'Veritabanı yazma/okuma başarılı',
        duration,
      };
    } catch (error) {
      return {
        test: 'Veritabanı Yazma Testi',
        success: false,
        message: `Veritabanı bağlantı hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Tüm testler çalıştırılıyor...');
    
    const tests = [
      this.testAPIConnection(),
      this.testDatabaseWrite(),
      this.testDataTransformation(),
      this.testRateLimit(),
      this.testSmallSync(),
    ];
    
    const results = await Promise.all(tests);
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`🧪 Test sonuçları: ${successCount}/${totalCount} başarılı`);
    
    return results;
  }

  /**
   * Get test summary
   */
  static getTestSummary(results: TestResult[]): {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
    totalDuration: number;
  } {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    return {
      total,
      passed,
      failed,
      successRate,
      totalDuration,
    };
  }

  /**
   * Simple hash function for generating IDs from strings
   */
  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export default SyncTestUtils;
