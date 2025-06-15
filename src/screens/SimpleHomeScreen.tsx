import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@/types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants';
import SimpleTest from '@/components/SimpleTest';

type SimpleHomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const SimpleHomeScreen: React.FC = () => {
  const navigation = useNavigation<SimpleHomeScreenNavigationProp>();

  const handleTestConnection = () => {
    Alert.alert('Test', 'Connection test would run here');
  };

  const handleNavigateToAdmin = () => {
    try {
      navigation.navigate('Admin');
    } catch (error) {
      Alert.alert('Navigation Error', 'Could not navigate to Admin screen');
    }
  };

  const handleNavigateToTestData = () => {
    try {
      navigation.navigate('TestData');
    } catch (error) {
      Alert.alert('Navigation Error', 'Could not navigate to TestData screen');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>F-Bet Mobile</Text>
        <Text style={styles.welcomeSubtitle}>
          Football Betting Platform (Simple Mode)
        </Text>
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.statusText}>App Loaded Successfully</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="phone-portrait" size={24} color={COLORS.primary} />
            <Text style={styles.statusText}>React Native Working</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="navigate" size={24} color={COLORS.primary} />
            <Text style={styles.statusText}>Navigation Ready</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={handleTestConnection}>
            <Ionicons name="wifi" size={32} color={COLORS.primary} />
            <Text style={styles.actionText}>Test Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToAdmin}>
            <Ionicons name="settings" size={32} color={COLORS.secondary} />
            <Text style={styles.actionText}>Admin Panel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToTestData}>
            <Ionicons name="analytics" size={32} color={COLORS.accent} />
            <Text style={styles.actionText}>Test Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Info', 'More features coming soon!')}>
            <Ionicons name="information-circle" size={32} color={COLORS.info} />
            <Text style={styles.actionText}>More Info</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Diagnostics */}
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
    alignItems: 'center',
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
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    width: '48%',
    marginBottom: SPACING.sm,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default SimpleHomeScreen;
