import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fixture } from '@/types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants';
import { 
  formatTime, 
  getRelativeDate, 
  getMatchStatusColor, 
  getMatchStatusText,
  isMatchLive,
  isMatchFinished 
} from '@/utils';

interface FixtureCardProps {
  fixture: Fixture;
  onPress?: (fixture: Fixture) => void;
  showLeague?: boolean;
  compact?: boolean;
}

const FixtureCard: React.FC<FixtureCardProps> = ({
  fixture,
  onPress,
  showLeague = true,
  compact = false,
}) => {
  const handlePress = () => {
    onPress?.(fixture);
  };

  const statusColor = getMatchStatusColor(fixture.status || '');
  const statusText = getMatchStatusText(fixture.status || '', fixture.date_utc);
  const isLive = isMatchLive(fixture.status || '');
  const isFinished = isMatchFinished(fixture.status || '');

  return (
    <TouchableOpacity 
      style={[styles.container, compact && styles.compactContainer]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* League info */}
      {showLeague && fixture.league && (
        <View style={styles.leagueContainer}>
          {fixture.league.logo_url && (
            <Image 
              source={{ uri: fixture.league.logo_url }} 
              style={styles.leagueLogo}
            />
          )}
          <Text style={styles.leagueName} numberOfLines={1}>
            {fixture.league.name}
          </Text>
        </View>
      )}

      {/* Match info */}
      <View style={styles.matchContainer}>
        {/* Date and time */}
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateText}>
            {fixture.date_utc ? getRelativeDate(fixture.date_utc) : 'TBD'}
          </Text>
          <View style={[styles.statusContainer, { backgroundColor: statusColor }]}>
            {isLive && (
              <View style={styles.liveIndicator} />
            )}
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        {/* Teams */}
        <View style={styles.teamsContainer}>
          {/* Home team */}
          <View style={styles.teamContainer}>
            {fixture.home_team?.logo_url && (
              <Image 
                source={{ uri: fixture.home_team.logo_url }} 
                style={styles.teamLogo}
              />
            )}
            <Text style={styles.teamName} numberOfLines={1}>
              {fixture.home_team?.name || 'TBD'}
            </Text>
          </View>

          {/* Score or VS */}
          <View style={styles.scoreContainer}>
            {isFinished && fixture.home_goals !== null && fixture.away_goals !== null ? (
              <Text style={styles.scoreText}>
                {fixture.home_goals} - {fixture.away_goals}
              </Text>
            ) : isLive && fixture.home_goals !== null && fixture.away_goals !== null ? (
              <Text style={[styles.scoreText, styles.liveScore]}>
                {fixture.home_goals} - {fixture.away_goals}
              </Text>
            ) : (
              <Text style={styles.vsText}>VS</Text>
            )}
          </View>

          {/* Away team */}
          <View style={styles.teamContainer}>
            {fixture.away_team?.logo_url && (
              <Image 
                source={{ uri: fixture.away_team.logo_url }} 
                style={styles.teamLogo}
              />
            )}
            <Text style={styles.teamName} numberOfLines={1}>
              {fixture.away_team?.name || 'TBD'}
            </Text>
          </View>
        </View>

        {/* Additional info */}
        {!compact && (
          <View style={styles.additionalInfo}>
            {fixture.venue?.name && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.infoText} numberOfLines={1}>
                  {fixture.venue.name}
                </Text>
              </View>
            )}
            {fixture.referee && (
              <View style={styles.infoItem}>
                <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.infoText} numberOfLines={1}>
                  {fixture.referee}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Arrow indicator */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.md,
    flexDirection: 'column',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  compactContainer: {
    padding: SPACING.sm,
  },
  leagueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leagueLogo: {
    width: 16,
    height: 16,
    marginRight: SPACING.xs,
  },
  leagueName: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  matchContainer: {
    flex: 1,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textPrimary,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 24,
    height: 24,
    marginRight: SPACING.xs,
  },
  teamName: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    flex: 1,
  },
  scoreContainer: {
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
  },
  liveScore: {
    color: COLORS.live,
  },
  vsText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  additionalInfo: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  arrowContainer: {
    position: 'absolute',
    right: SPACING.sm,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});

export default FixtureCard;
