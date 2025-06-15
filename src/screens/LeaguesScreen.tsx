import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants';

type NavigationProp = StackNavigationProp<any>;

const LeaguesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const menuItems = [
    {
      title: 'Premier League',
      description: 'English Premier League standings and fixtures',
      icon: 'trophy',
      onPress: () => {
        // TODO: Navigate to Premier League
      },
    },
    {
      title: 'La Liga',
      description: 'Spanish La Liga standings and fixtures',
      icon: 'trophy',
      onPress: () => {
        // TODO: Navigate to La Liga
      },
    },
    {
      title: 'Bundesliga',
      description: 'German Bundesliga standings and fixtures',
      icon: 'trophy',
      onPress: () => {
        // TODO: Navigate to Bundesliga
      },
    },
    {
      title: 'Serie A',
      description: 'Italian Serie A standings and fixtures',
      icon: 'trophy',
      onPress: () => {
        // TODO: Navigate to Serie A
      },
    },
    {
      title: 'Veri Raporu',
      description: 'Günlük veri çekme istatistikleri ve senkronizasyon logları',
      icon: 'analytics',
      onPress: () => navigation.navigate('DataReport'),
      isAdmin: true,
    },
    {
      title: 'Tablo Yöneticisi',
      description: 'Veritabanı tablolarını görüntüle ve yönet',
      icon: 'server',
      onPress: () => navigation.navigate('TableManager'),
      isAdmin: true,
    },
    {
      title: 'Database Test',
      description: 'View database tables and test data connection',
      icon: 'bug',
      onPress: () => navigation.navigate('TestData'),
      isAdmin: true,
    },
    {
      title: 'Gerçek Veri Testi',
      description: 'Supabase veritabanından gerçek verileri çek ve test et',
      icon: 'cloud-download',
      onPress: () => navigation.navigate('RealDataTest'),
      isAdmin: true,
    },
    {
      title: 'Web Platform Test',
      description: 'Web platformunda Supabase bağlantısını test et',
      icon: 'globe',
      onPress: () => navigation.navigate('WebTest'),
      isAdmin: true,
    },
    {
      title: 'Sync System Test',
      description: 'API ve senkronizasyon sistemini test et',
      icon: 'sync',
      onPress: () => navigation.navigate('SyncTest'),
      isAdmin: true,
    },
    {
      title: 'Admin Panel',
      description: 'Data synchronization and system management',
      icon: 'settings',
      onPress: () => navigation.navigate('Admin'),
      isAdmin: true,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trophy" size={48} color={COLORS.accent} />
        <Text style={styles.title}>Leagues & More</Text>
        <Text style={styles.subtitle}>
          Browse leagues and manage app settings
        </Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, item.isAdmin && styles.adminMenuItem]}
            onPress={item.onPress}
          >
            <View style={[styles.iconContainer, item.isAdmin && styles.adminIconContainer]}>
              <Ionicons
                name={item.icon as any}
                size={24}
                color={item.isAdmin ? COLORS.warning : COLORS.accent}
              />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, item.isAdmin && styles.adminMenuTitle]}>
                {item.title}
              </Text>
              <Text style={styles.menuDescription}>
                {item.description}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          More features coming soon...
        </Text>
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
    padding: SPACING.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  menuContainer: {
    padding: SPACING.lg,
  },
  menuItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminMenuItem: {
    borderColor: COLORS.warning + '40',
    backgroundColor: COLORS.warning + '10',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  adminIconContainer: {
    backgroundColor: COLORS.warning + '20',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  adminMenuTitle: {
    color: COLORS.warning,
  },
  menuDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.normal * TYPOGRAPHY.fontSizes.sm,
  },
  footer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});

export default LeaguesScreen;
