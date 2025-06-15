import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SCREEN_NAMES, TAB_NAMES } from '@/constants';
import { RootStackParamList } from '@/types';

// Import screens
import HomeScreen from '@/screens/HomeScreen';
import SimpleHomeScreen from '@/screens/SimpleHomeScreen';
import FixtureDetailScreen from '@/screens/FixtureDetailScreen';
import OddsScreen from '@/screens/OddsScreen';
import PredictionsScreen from '@/screens/PredictionsScreen';
import TeamsScreen from '@/screens/TeamsScreen';
import PlayersScreen from '@/screens/PlayersScreen';
import LeaguesScreen from '@/screens/LeaguesScreen';
import AdminScreen from '@/screens/AdminScreen';
import { TestDataScreen } from '@/screens/TestDataScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

// Safe Home Stack Navigator with fallback
const SafeHomeStack = () => {
  try {
    return (
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.surface,
            shadowColor: COLORS.border,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: COLORS.textPrimary,
          },
          cardStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name={SCREEN_NAMES.HOME}
          component={SimpleHomeScreen}
          options={{
            title: 'F-Bet (Safe Mode)',
            headerStyle: {
              backgroundColor: COLORS.surface,
              elevation: 0,
              shadowOpacity: 0,
            },
          }}
        />
      <Stack.Screen 
        name={SCREEN_NAMES.FIXTURE_DETAIL} 
        component={FixtureDetailScreen}
        options={{
          title: 'Match Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name={SCREEN_NAMES.TEAMS} 
        component={TeamsScreen}
        options={{
          title: 'Teams',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name={SCREEN_NAMES.PLAYERS} 
        component={PlayersScreen}
        options={{
          title: 'Players',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
  } catch (error) {
    console.error('Error in SafeHomeStack:', error);
    // Return minimal fallback
    return (
      <Stack.Navigator>
        <Stack.Screen
          name={SCREEN_NAMES.HOME}
          component={SimpleHomeScreen}
          options={{ title: 'F-Bet (Fallback)' }}
        />
      </Stack.Navigator>
    );
  }
};

// Odds Stack Navigator
const OddsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
          shadowColor: COLORS.border,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: COLORS.textPrimary,
        },
        cardStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen 
        name={SCREEN_NAMES.ODDS} 
        component={OddsScreen}
        options={{
          title: 'Betting Odds',
        }}
      />
      <Stack.Screen 
        name={SCREEN_NAMES.FIXTURE_DETAIL} 
        component={FixtureDetailScreen}
        options={{
          title: 'Match Details',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Predictions Stack Navigator
const PredictionsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
          shadowColor: COLORS.border,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: COLORS.textPrimary,
        },
        cardStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen 
        name={SCREEN_NAMES.PREDICTIONS} 
        component={PredictionsScreen}
        options={{
          title: 'AI Predictions',
        }}
      />
      <Stack.Screen 
        name={SCREEN_NAMES.FIXTURE_DETAIL} 
        component={FixtureDetailScreen}
        options={{
          title: 'Match Details',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

// More Stack Navigator (includes Leagues and Admin)
const MoreStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
          shadowColor: COLORS.border,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: COLORS.textPrimary,
        },
        cardStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen
        name={SCREEN_NAMES.LEAGUES}
        component={LeaguesScreen}
        options={{
          title: 'Leagues & More',
        }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={{
          title: 'Admin Panel',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="TestData"
        component={TestDataScreen}
        options={{
          title: 'Database Test',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name={SCREEN_NAMES.TEAMS}
        component={TeamsScreen}
        options={{
          title: 'Teams',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name={SCREEN_NAMES.FIXTURE_DETAIL}
        component={FixtureDetailScreen}
        options={{
          title: 'Match Details',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case TAB_NAMES.HOME:
              iconName = focused ? 'home' : 'home-outline';
              break;
            case TAB_NAMES.ODDS:
              iconName = focused ? 'trending-up' : 'trending-up-outline';
              break;
            case TAB_NAMES.PREDICTIONS:
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case TAB_NAMES.MORE:
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          shadowColor: COLORS.border,
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name={TAB_NAMES.HOME} 
        component={SafeHomeStack}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name={TAB_NAMES.ODDS} 
        component={OddsStack}
        options={{
          title: 'Odds',
        }}
      />
      <Tab.Screen 
        name={TAB_NAMES.PREDICTIONS} 
        component={PredictionsStack}
        options={{
          title: 'Predictions',
        }}
      />
      <Tab.Screen
        name={TAB_NAMES.MORE}
        component={MoreStack}
        options={{
          title: 'More',
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: COLORS.primary,
          background: COLORS.background,
          card: COLORS.surface,
          text: COLORS.textPrimary,
          border: COLORS.border,
          notification: COLORS.accent,
        },
      }}
    >
      <TabNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;
