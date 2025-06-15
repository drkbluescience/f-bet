import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants';
import { SimpleDataService } from '@/services/simpleDataService';

interface DataSection {
  title: string;
  icon: string;
  data: any[];
  loading: boolean;
  error: string | null;
  fetchFunction: () => Promise<void>;
}

export const RealDataTestScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
    tested: boolean;
  }>({ success: false, message: '', tested: false });
  const [sections, setSections] = useState<DataSection[]>([
    {
      title: 'Ülkeler',
      icon: 'flag',
      data: [],
      loading: false,
      error: null,
      fetchFunction: async () => await fetchCountries(),
    },
    {
      title: 'Ligler',
      icon: 'trophy',
      data: [],
      loading: false,
      error: null,
      fetchFunction: async () => await fetchLeagues(),
    },
    {
      title: 'Sezonlar',
      icon: 'calendar',
      data: [],
      loading: false,
      error: null,
      fetchFunction: async () => await fetchSeasons(),
    },
    {
      title: 'Mekanlar',
      icon: 'location',
      data: [],
      loading: false,
      error: null,
      fetchFunction: async () => await fetchVenues(),
    },
    {
      title: 'Takımlar',
      icon: 'people',
      data: [],
      loading: false,
      error: null,
      fetchFunction: async () => await fetchTeams(),
    },
    {
      title: 'Oyuncular',
      icon: 'person',
      data: [],
      loading: false,
      error: null,
      fetchFunction: async () => await fetchPlayers(),
    },
    {
      title: 'Maçlar',
      icon: 'football',
      data: [],
      loading: false,
      error: null,
      fetchFunction: async () => await fetchFixtures(),
    },
    {
      title: 'Lig Sıralaması',
      icon: 'podium',
      data: [],
      loading: false,
      error: null,
      fetchFunction: async () => await fetchLeagueStandings(),
    },
    {
      title: 'Bahis Oranları',
      icon: 'trending-up',
      data: [],
      loading: false,
      error: null,
      fetchFunction: async () => await fetchOdds(),
    },
    {
      title: 'Tahminler',
      icon: 'bulb',
      data: [],
      loading: false,
      error: null,
      fetchFunction: async () => await fetchPredictions(),
    },
  ]);

  const updateSection = (index: number, updates: Partial<DataSection>) => {
    setSections(prev => prev.map((section, i) =>
      i === index ? { ...section, ...updates } : section
    ));
  };

  const fetchSeasons = async () => {
    updateSection(2, { loading: true, error: null });
    const result = await SimpleDataService.getSeasons();
    updateSection(2, {
      loading: false,
      data: result.data,
      error: result.error
    });
  };

  const fetchVenues = async () => {
    updateSection(3, { loading: true, error: null });
    const result = await SimpleDataService.getVenues();
    updateSection(3, {
      loading: false,
      data: result.data,
      error: result.error
    });
  };

  const fetchOdds = async () => {
    updateSection(8, { loading: true, error: null });
    const result = await SimpleDataService.getOdds(20);
    updateSection(8, {
      loading: false,
      data: result.data,
      error: result.error
    });
  };

  const fetchPredictions = async () => {
    updateSection(9, { loading: true, error: null });
    const result = await SimpleDataService.getPredictions(20);
    updateSection(9, {
      loading: false,
      data: result.data,
      error: result.error
    });
  };

  const fetchCountries = async () => {
    updateSection(0, { loading: true, error: null });
    const result = await SimpleDataService.getCountries();
    updateSection(0, {
      loading: false,
      data: result.data,
      error: result.error
    });
  };

  const fetchLeagues = async () => {
    updateSection(1, { loading: true, error: null });
    const result = await SimpleDataService.getLeagues();
    updateSection(1, {
      loading: false,
      data: result.data,
      error: result.error
    });
  };

  const fetchTeams = async () => {
    updateSection(4, { loading: true, error: null });
    const result = await SimpleDataService.getTeams(20);
    updateSection(4, {
      loading: false,
      data: result.data,
      error: result.error
    });
  };

  const fetchPlayers = async () => {
    updateSection(5, { loading: true, error: null });
    const result = await SimpleDataService.getPlayers(20);
    updateSection(5, {
      loading: false,
      data: result.data,
      error: result.error
    });
  };

  const fetchFixtures = async () => {
    updateSection(6, { loading: true, error: null });
    const result = await SimpleDataService.getFixtures(20);
    updateSection(6, {
      loading: false,
      data: result.data,
      error: result.error
    });
  };

  const fetchLeagueStandings = async () => {
    updateSection(7, { loading: true, error: null });
    const result = await SimpleDataService.getLeagueStandings(20);
    updateSection(7, {
      loading: false,
      data: result.data,
      error: result.error
    });
  };

  const testConnection = async () => {
    const result = await SimpleDataService.testConnection();
    setConnectionStatus({
      success: result.success,
      message: result.message,
      tested: true
    });
    return result.success;
  };

  const fetchAllData = async () => {
    setRefreshing(true);

    // Önce bağlantıyı test et
    const connectionOk = await testConnection();

    if (connectionOk) {
      await Promise.all(sections.map(section => section.fetchFunction()));
    }

    setRefreshing(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const renderSection = (section: DataSection, index: number) => (
    <View key={index} style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name={section.icon as any} size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={section.fetchFunction}
          disabled={section.loading}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={section.loading ? COLORS.textSecondary : COLORS.primary} 
          />
        </TouchableOpacity>
      </View>

      {section.loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      )}

      {section.error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={20} color={COLORS.error} />
          <Text style={styles.errorText}>{section.error}</Text>
        </View>
      )}

      {!section.loading && !section.error && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataCount}>
            {section.data.length} kayıt bulundu
          </Text>
          
          {section.data.length > 0 && (
            <TouchableOpacity
              style={styles.viewDataButton}
              onPress={() => {
                Alert.alert(
                  `${section.title} Verileri`,
                  `İlk kayıt:\n${JSON.stringify(section.data[0], null, 2)}`,
                  [{ text: 'Tamam' }]
                );
              }}
            >
              <Text style={styles.viewDataText}>Örnek Veri Görüntüle</Text>
              <Ionicons name="eye" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchAllData} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Gerçek Veri Testi</Text>
        <Text style={styles.subtitle}>
          Supabase veritabanından gerçek veriler çekiliyor
        </Text>

        {connectionStatus.tested && (
          <View style={[
            styles.connectionStatus,
            { backgroundColor: connectionStatus.success ? COLORS.success : COLORS.error }
          ]}>
            <Ionicons
              name={connectionStatus.success ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={COLORS.surface}
            />
            <Text style={styles.connectionText}>
              {connectionStatus.message}
            </Text>
          </View>
        )}
      </View>

      {sections.map(renderSection)}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.refreshAllButton} onPress={fetchAllData}>
          <Ionicons name="refresh-circle" size={24} color={COLORS.surface} />
          <Text style={styles.refreshAllText}>Tümünü Yenile</Text>
        </TouchableOpacity>
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
    padding: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  connectionText: {
    color: COLORS.surface,
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  section: {
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  refreshButton: {
    padding: SPACING.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  loadingText: {
    marginLeft: SPACING.sm,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.errorBackground,
    borderRadius: BORDER_RADIUS.sm,
  },
  errorText: {
    marginLeft: SPACING.sm,
    color: COLORS.error,
    flex: 1,
  },
  dataContainer: {
    padding: SPACING.sm,
  },
  dataCount: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  viewDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
  },
  viewDataText: {
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  footer: {
    padding: SPACING.lg,
  },
  refreshAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  refreshAllText: {
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    marginLeft: SPACING.sm,
  },
});
