import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { testSupabaseConnection } from '../services/supabaseClient';
import { SimpleDataService } from '../services/simpleDataService';

// Colors
const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  textPrimary: '#000000',
  textSecondary: '#666666',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  shadow: '#000000',
};

interface ConnectionStatus {
  success: boolean;
  message: string;
  tested: boolean;
}

interface Stats {
  countries: number;
  leagues: number;
  teams: number;
  fixtures: number;
}

export const WebTestScreen: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    success: false,
    message: 'Not tested',
    tested: false,
  });
  const [stats, setStats] = useState<Stats>({
    countries: 0,
    leagues: 0,
    teams: 0,
    fixtures: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isMockClient, setIsMockClient] = useState<boolean | null>(null);

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await testSupabaseConnection();
      setConnectionStatus({
        success: result.success,
        message: result.message,
        tested: true,
      });

      // Mock client kontrolü
      const mockCheck = await SimpleDataService.checkIfMockClient();
      setIsMockClient(mockCheck);

      if (result.success) {
        await loadStats();
      }
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: `Test failed: ${error}`,
        tested: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [countries, leagues, teams, fixtures] = await Promise.all([
        SimpleDataService.getCountriesCount(),
        SimpleDataService.getLeaguesCount(),
        SimpleDataService.getTeamsCount(),
        SimpleDataService.getFixturesCount(),
      ]);

      setStats({
        countries,
        leagues,
        teams,
        fixtures,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      Alert.alert('Hata', 'İstatistikler yüklenirken hata oluştu');
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const StatCard = ({ title, value, icon, color }: {
    title: string;
    value: number;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>
        {value.toLocaleString()}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Web Platform Test</Text>
        <Text style={styles.subtitle}>
          Supabase bağlantısı ve veri testi
        </Text>
      </View>

      {/* Connection Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bağlantı Durumu</Text>
        
        {connectionStatus.tested && (
          <View style={[
            styles.connectionCard,
            { backgroundColor: connectionStatus.success ? COLORS.success : COLORS.error }
          ]}>
            <Ionicons
              name={connectionStatus.success ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={COLORS.surface}
            />
            <Text style={styles.connectionText}>
              {connectionStatus.message}
            </Text>
          </View>
        )}

        {isMockClient !== null && (
          <View style={[
            styles.mockCard,
            { backgroundColor: isMockClient ? COLORS.warning : COLORS.success }
          ]}>
            <Ionicons
              name={isMockClient ? 'warning' : 'checkmark-circle'}
              size={20}
              color={COLORS.surface}
            />
            <Text style={styles.mockText}>
              {isMockClient ? 'Mock Client Kullanılıyor' : 'Gerçek Supabase Client Kullanılıyor'}
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.testButton} 
          onPress={testConnection}
          disabled={loading}
        >
          <Ionicons name="refresh" size={20} color={COLORS.surface} />
          <Text style={styles.testButtonText}>
            {loading ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {connectionStatus.success && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veritabanı İstatistikleri</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Ülkeler"
              value={stats.countries}
              icon="flag"
              color={COLORS.primary}
            />
            <StatCard
              title="Ligler"
              value={stats.leagues}
              icon="trophy"
              color={COLORS.secondary}
            />
            <StatCard
              title="Takımlar"
              value={stats.teams}
              icon="people"
              color={COLORS.accent}
            />
            <StatCard
              title="Maçlar"
              value={stats.fixtures}
              icon="football"
              color={COLORS.warning}
            />
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Toplam {(stats.countries + stats.leagues + stats.teams + stats.fixtures).toLocaleString()} kayıt
            </Text>
            <Text style={styles.summarySubtext}>
              Gerçek Supabase veritabanından çekilen veriler
            </Text>
          </View>
        </View>
      )}

      {/* Platform Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform Bilgisi</Text>
        <View style={styles.platformCard}>
          <Text style={styles.platformText}>🌐 Web Platform</Text>
          <Text style={styles.platformText}>⚛️ React Native Web</Text>
          <Text style={styles.platformText}>🔗 Supabase Client: {isMockClient ? 'Mock' : 'Real'}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.9,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  connectionText: {
    color: COLORS.surface,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  mockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  mockText: {
    color: COLORS.surface,
    fontSize: 12,
    marginLeft: 6,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
  },
  testButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summary: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  summarySubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  platformCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
  },
  platformText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
});

export default WebTestScreen;
