import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants';
import { SimpleDataService } from '@/services/simpleDataService';

interface DashboardStatsProps {
  onRefresh?: () => void;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  loading?: boolean;
}

interface Season {
  id: number;
  year: number;
  name: string;
}

interface Stats {
  countries: number;
  leagues: number;
  teams: number;
  players: number;
  seasons: number;
  fixtures: number;
  venues: number;
  standings: number;
  teamStats: number;
  playerStats: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading }) => {
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!loading && value > 0) {
      Animated.timing(animatedValue, {
        toValue: value,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }
  }, [value, loading]);

  const getColorByValue = (val: number) => {
    if (val === 0) return COLORS.textMuted;
    if (val < 10) return COLORS.warning;
    if (val < 100) return COLORS.info;
    return COLORS.success;
  };

  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        {loading && <ActivityIndicator size="small" color={color} />}
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Animated.Text style={[styles.statValue, { color: getColorByValue(value) }]}>
        {loading ? '...' : value.toLocaleString()}
      </Animated.Text>
    </View>
  );
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ onRefresh }) => {
  const [stats, setStats] = useState<Stats>({
    countries: 0,
    leagues: 0,
    teams: 0,
    players: 0,
    seasons: 0,
    fixtures: 0,
    venues: 0,
    standings: 0,
    teamStats: 0,
    playerStats: 0,
  });
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSeasons = async () => {
    try {
      const result = await SimpleDataService.getAvailableSeasons();
      if (result.error) {
        console.warn('Seasons load warning:', result.error);
      }
      setSeasons(result.data);
      
      // Mevcut yılı varsayılan olarak seç
      const currentYear = new Date().getFullYear();
      const currentSeason = result.data.find(s => s.year === currentYear);
      setSelectedSeason(currentSeason?.year || result.data[0]?.year || currentYear);
    } catch (error) {
      console.error('Error loading seasons:', error);
      // Fallback sezon
      const currentYear = new Date().getFullYear();
      setSeasons([{ id: currentYear, year: currentYear, name: `${currentYear}/${currentYear + 1}` }]);
      setSelectedSeason(currentYear);
    }
  };

  const loadStats = async (seasonYear?: number) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading dashboard stats for season:', seasonYear);
      const result = await SimpleDataService.getDashboardStats(seasonYear);

      if (result.error) {
        // Hata varsa ama veri de varsa, veriyi göster ve uyarı ver
        if (result.data && Object.values(result.data).some(val => val > 0)) {
          setStats(result.data);
          console.warn('Stats loaded with warnings:', result.error);
        } else {
          setError(`Veri yüklenirken hata: ${result.error}`);
          console.error('Stats load error:', result.error);
        }
      } else {
        setStats(result.data);
        console.log('Stats loaded successfully:', result.data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setError(`İstatistikler yüklenemedi: ${errorMessage}`);
      console.error('Error loading stats:', error);

      // Fallback: boş istatistikler göster
      setStats({
        countries: 0,
        leagues: 0,
        teams: 0,
        players: 0,
        seasons: 0,
        fixtures: 0,
        venues: 0,
        standings: 0,
        teamStats: 0,
        playerStats: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadSeasons();
    await loadStats(selectedSeason || undefined);
    onRefresh?.();
  };

  const handleSeasonChange = async (seasonYear: number) => {
    setSelectedSeason(seasonYear);
    await loadStats(seasonYear);
  };

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      loadStats(selectedSeason);
    }
  }, [selectedSeason]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={32} color={COLORS.error} />
        <Text style={styles.errorText}>İstatistikler yüklenemedi</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="stats-chart" size={24} color={COLORS.primary} />
          <Text style={styles.title}>Veritabanı İstatistikleri</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Season Selector */}
      {seasons.length > 0 && (
        <View style={styles.seasonSelector}>
          <Text style={styles.seasonLabel}>Sezon:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSeason}
              onValueChange={handleSeasonChange}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {seasons.map((season) => (
                <Picker.Item
                  key={season.id}
                  label={season.name}
                  value={season.year}
                />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Ülkeler"
          value={stats.countries}
          icon="flag"
          color={COLORS.primary}
          loading={loading}
        />
        <StatCard
          title="Ligler"
          value={stats.leagues}
          icon="trophy"
          color={COLORS.secondary}
          loading={loading}
        />
        <StatCard
          title="Takımlar"
          value={stats.teams}
          icon="people"
          color={COLORS.accent}
          loading={loading}
        />
        <StatCard
          title="Oyuncular"
          value={stats.players}
          icon="person"
          color={COLORS.success}
          loading={loading}
        />
        <StatCard
          title="Maçlar"
          value={stats.fixtures}
          icon="football"
          color={COLORS.warning}
          loading={loading}
        />
        <StatCard
          title="Mekanlar"
          value={stats.venues}
          icon="location"
          color={COLORS.info}
          loading={loading}
        />

        {/* Sezon bazlı istatistikler - sadece sezon seçiliyse göster */}
        {selectedSeason && (
          <>
            <StatCard
              title="Lig Sıralaması"
              value={stats.standings}
              icon="podium"
              color="#9C27B0"
              loading={loading}
            />
            <StatCard
              title="Takım İstatistikleri"
              value={stats.teamStats}
              icon="stats-chart"
              color="#FF5722"
              loading={loading}
            />
            <StatCard
              title="Oyuncu İstatistikleri"
              value={stats.playerStats}
              icon="analytics"
              color="#607D8B"
              loading={loading}
            />
          </>
        )}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Toplam {(
            stats.countries +
            stats.leagues +
            stats.teams +
            stats.players +
            stats.fixtures +
            stats.venues +
            (selectedSeason ? stats.standings + stats.teamStats + stats.playerStats : 0)
          ).toLocaleString()} kayıt
        </Text>
        <Text style={styles.summarySubtext}>
          {selectedSeason ? `${selectedSeason}/${selectedSeason + 1} sezonu` : 'Tüm veriler'}
        </Text>
        {selectedSeason && (
          <Text style={styles.summaryNote}>
            Sezon bazlı veriler: {(stats.standings + stats.teamStats + stats.playerStats).toLocaleString()} kayıt
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    margin: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  refreshButton: {
    padding: SPACING.xs,
  },
  seasonSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  seasonLabel: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  pickerContainer: {
    flex: 1,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  pickerItem: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
  },
  summary: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.textPrimary,
  },
  summarySubtext: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  summaryNote: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  errorContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.errorBackground,
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.error,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.md,
  },
  retryText: {
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
});
