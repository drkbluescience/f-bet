import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  StyleSheet,
  TouchableOpacity,
  FlatList 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Fixture } from '@/types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants';
import { useLiveFixtures, useTodayFixtures, useHighConfidencePredictions } from '@/hooks';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorBoundary';
import FixtureCard from '@/components/FixtureCard';
import DataUsageStats from '@/components/DataUsageStats';
import SimpleTest from '@/components/SimpleTest';
import { DashboardStats } from '@/components/DashboardStats';
import { testSupabaseConnection } from '@/utils/testSupabase';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // Fetch data with error handling
  let liveFixtures, isLiveLoading, liveError, refetchLive;
  let todayFixtures, isTodayLoading, todayError, refetchToday;
  let predictions, isPredictionsLoading, predictionsError, refetchPredictions;

  try {
    const liveResult = useLiveFixtures();
    liveFixtures = liveResult.data;
    isLiveLoading = liveResult.isLoading;
    liveError = liveResult.error;
    refetchLive = liveResult.refetch;
  } catch (error) {
    console.error('Error in useLiveFixtures:', error);
    liveFixtures = [];
    isLiveLoading = false;
    liveError = error;
    refetchLive = () => {};
  }

  try {
    const todayResult = useTodayFixtures();
    todayFixtures = todayResult.data;
    isTodayLoading = todayResult.isLoading;
    todayError = todayResult.error;
    refetchToday = todayResult.refetch;
  } catch (error) {
    console.error('Error in useTodayFixtures:', error);
    todayFixtures = [];
    isTodayLoading = false;
    todayError = error;
    refetchToday = () => {};
  }

  try {
    const predictionsResult = useHighConfidencePredictions(5, 0.7);
    predictions = predictionsResult.data;
    isPredictionsLoading = predictionsResult.isLoading;
    predictionsError = predictionsResult.error;
    refetchPredictions = predictionsResult.refetch;
  } catch (error) {
    console.error('Error in useHighConfidencePredictions:', error);
    predictions = [];
    isPredictionsLoading = false;
    predictionsError = error;
    refetchPredictions = () => {};
  }

  const isLoading = isLiveLoading || isTodayLoading || isPredictionsLoading;
  const hasError = liveError || todayError || predictionsError;

  const handleRefresh = useCallback(() => {
    refetchLive();
    refetchToday();
    refetchPredictions();
  }, [refetchLive, refetchToday, refetchPredictions]);

  const handleFixturePress = useCallback((fixture: Fixture) => {
    navigation.navigate('FixtureDetail', { fixtureId: fixture.fixture_id });
  }, [navigation]);

  const handleViewAllOdds = useCallback(() => {
    navigation.navigate('Odds');
  }, [navigation]);

  const handleViewAllPredictions = useCallback(() => {
    navigation.navigate('Predictions');
  }, [navigation]);

  const handleTestSupabase = useCallback(async () => {
    const result = await testSupabaseConnection();
    console.log('Supabase test result:', result);
  }, []);

  // Show error screen only if we have errors and no data at all
  if (hasError && !liveFixtures && !todayFixtures && !predictions) {
    return (
      <ErrorDisplay
        message="Failed to load data. Please check your connection and try again."
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={isLoading} 
          onRefresh={handleRefresh}
          tintColor={COLORS.accent}
          colors={[COLORS.accent]}
        />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome to F-Bet</Text>
        <Text style={styles.welcomeSubtitle}>
          Your AI-powered football betting companion
        </Text>
      </View>

      {/* Dashboard Stats */}
      <DashboardStats onRefresh={handleRefresh} />

      {/* Live Matches Section */}
      {liveFixtures && liveFixtures.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="radio" size={20} color={COLORS.live} />
              <Text style={styles.sectionTitle}>Live Matches</Text>
            </View>
          </View>
          <FlatList
            data={liveFixtures}
            keyExtractor={(item) => item.fixture_id.toString()}
            renderItem={({ item }) => (
              <FixtureCard 
                fixture={item} 
                onPress={handleFixturePress}
                compact
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {/* Today's Matches Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="today" size={20} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Today's Matches</Text>
          </View>
        </View>
        
        {isTodayLoading ? (
          <LoadingSpinner message="Loading today's matches..." />
        ) : todayError ? (
          <ErrorDisplay
            message="Failed to load today's matches"
            onRetry={refetchToday}
          />
        ) : todayFixtures && todayFixtures.length > 0 ? (
          <FlatList
            data={todayFixtures.slice(0, 5)}
            keyExtractor={(item) => item.fixture_id.toString()}
            renderItem={({ item }) => (
              <FixtureCard 
                fixture={item} 
                onPress={handleFixturePress}
                showLeague={false}
              />
            )}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyStateText}>No matches today</Text>
          </View>
        )}
      </View>

      {/* AI Predictions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="analytics" size={20} color={COLORS.info} />
            <Text style={styles.sectionTitle}>AI Predictions</Text>
          </View>
          <TouchableOpacity onPress={handleViewAllPredictions}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {isPredictionsLoading ? (
          <LoadingSpinner message="Loading predictions..." />
        ) : predictionsError ? (
          <ErrorDisplay
            message="Failed to load predictions"
            onRetry={refetchPredictions}
          />
        ) : predictions && predictions.length > 0 ? (
          <FlatList
            data={predictions.slice(0, 3)}
            keyExtractor={(item) => item.fixture_id.toString()}
            renderItem={({ item }) => (
              <View style={styles.predictionCard}>
                <FixtureCard 
                  fixture={item.fixture!} 
                  onPress={handleFixturePress}
                  compact
                />
                <View style={styles.predictionInfo}>
                  <Text style={styles.predictionLabel}>Confidence:</Text>
                  <Text style={styles.predictionValue}>
                    {Math.max(
                      item.prob_home || 0,
                      item.prob_draw || 0,
                      item.prob_away || 0
                    ).toFixed(1)}%
                  </Text>
                </View>
              </View>
            )}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyStateText}>No predictions available</Text>
          </View>
        )}
      </View>

      {/* Data Usage Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="bar-chart" size={20} color={COLORS.info} />
            <Text style={styles.sectionTitle}>Veri Kullanımı</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Admin')}>
            <Text style={styles.viewAllText}>Detay</Text>
          </TouchableOpacity>
        </View>
        <DataUsageStats showDetailed={false} />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewAllOdds}
          >
            <Ionicons name="trending-up" size={24} color={COLORS.accent} />
            <Text style={styles.actionButtonText}>View Odds</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Teams')}
          >
            <Ionicons name="people" size={24} color={COLORS.accent} />
            <Text style={styles.actionButtonText}>Teams</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Leagues')}
          >
            <Ionicons name="trophy" size={24} color={COLORS.accent} />
            <Text style={styles.actionButtonText}>Leagues</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTestSupabase}
          >
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.actionButtonText}>Test DB</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Simple Test Component */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Diagnostics</Text>
        <SimpleTest />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  welcomeSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  welcomeTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  welcomeSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
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
    marginLeft: SPACING.xs,
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  horizontalList: {
    paddingLeft: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  predictionCard: {
    marginBottom: SPACING.sm,
  },
  predictionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  predictionLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  predictionValue: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default HomeScreen;
