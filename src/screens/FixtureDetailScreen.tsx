import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';
import { useFixture } from '@/hooks';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorBoundary';

type FixtureDetailRouteProp = RouteProp<RootStackParamList, 'FixtureDetail'>;

const FixtureDetailScreen: React.FC = () => {
  const route = useRoute<FixtureDetailRouteProp>();
  const { fixtureId } = route.params;

  const { data: fixture, isLoading, error, refetch } = useFixture(fixtureId);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading match details..." />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        message="Failed to load match details"
        onRetry={refetch}
      />
    );
  }

  if (!fixture) {
    return (
      <ErrorDisplay 
        message="Match not found"
        showRetry={false}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Match Details</Text>
        <Text style={styles.subtitle}>
          {fixture.home_team?.name} vs {fixture.away_team?.name}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Match Information</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>League: {fixture.league?.name}</Text>
          <Text style={styles.infoText}>Status: {fixture.status}</Text>
          <Text style={styles.infoText}>Date: {fixture.date_utc}</Text>
          {fixture.venue?.name && (
            <Text style={styles.infoText}>Venue: {fixture.venue.name}</Text>
          )}
          {fixture.referee && (
            <Text style={styles.infoText}>Referee: {fixture.referee}</Text>
          )}
        </View>

        {/* Score */}
        {fixture.home_goals !== null && fixture.away_goals !== null && (
          <View style={styles.scoreSection}>
            <Text style={styles.sectionTitle}>Score</Text>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreText}>
                {fixture.home_goals} - {fixture.away_goals}
              </Text>
            </View>
          </View>
        )}

        {/* Placeholder for additional sections */}
        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderText}>
            Additional match details, statistics, events, and lineups will be displayed here.
          </Text>
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
    backgroundColor: COLORS.primary,
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
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
  },
  content: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  scoreSection: {
    alignItems: 'center',
  },
  scoreCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: TYPOGRAPHY.fontSizes.xxxl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
  },
  placeholderSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 8,
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.relaxed * TYPOGRAPHY.fontSizes.md,
  },
});

export default FixtureDetailScreen;
