import React from 'react';
import {
  ScrollView,
  StyleSheet,
} from 'react-native';
import { COLORS } from '@/constants';
import { DashboardStats } from '@/components/DashboardStats';
import ComprehensiveSyncDashboard from '@/components/ComprehensiveSyncDashboard';

const SimpleHomeScreen: React.FC = () => {

  return (
    <ScrollView style={styles.container}>


      {/* Dashboard Stats */}
      <DashboardStats />

      {/* Comprehensive Sync Dashboard */}
      <ComprehensiveSyncDashboard />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default SimpleHomeScreen;
