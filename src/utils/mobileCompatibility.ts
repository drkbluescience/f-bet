import { Platform, Dimensions } from 'react-native';

/**
 * Mobile compatibility utilities
 */

export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * Get device dimensions
 */
export const getDeviceDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

/**
 * Check if device is tablet
 */
export const isTablet = () => {
  const { width, height } = getDeviceDimensions();
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && (aspectRatio > 1.2 && aspectRatio < 2.0);
};

/**
 * Get safe area insets for different platforms
 */
export const getSafeAreaInsets = () => {
  if (isIOS) {
    return {
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    };
  } else if (isAndroid) {
    return {
      top: 24,
      bottom: 0,
      left: 0,
      right: 0,
    };
  } else {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
  }
};

/**
 * Platform-specific styles
 */
export const platformStyles = {
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
  }),
  
  headerHeight: Platform.select({
    ios: 44,
    android: 56,
    web: 60,
  }),
  
  tabBarHeight: Platform.select({
    ios: 83,
    android: 60,
    web: 60,
  }),
};

/**
 * Check if running in Expo Go
 */
export const isExpoGo = () => {
  return __DEV__ && (global as any).__expo?.modules?.ExpoConstants?.executionEnvironment === 'storeClient';
};

/**
 * Get platform-specific API base URL
 */
export const getApiBaseUrl = () => {
  if (isWeb) {
    return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  } else {
    // For mobile, use the actual server IP or deployed URL
    return process.env.EXPO_PUBLIC_API_BASE_URL || 'https://your-api-server.com';
  }
};

/**
 * Platform-specific navigation options
 */
export const getNavigationOptions = () => {
  return {
    headerStyle: {
      backgroundColor: '#FFFFFF',
      ...platformStyles.shadow,
    },
    headerTitleStyle: {
      fontSize: Platform.select({
        ios: 17,
        android: 20,
        web: 18,
      }),
      fontWeight: Platform.select({
        ios: '600',
        android: '500',
        web: '600',
      }),
    },
    cardStyle: {
      backgroundColor: '#FFFFFF',
    },
  };
};

/**
 * Check network connectivity (mobile-specific)
 */
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  if (isWeb) {
    return navigator.onLine;
  }
  
  try {
    // For mobile, we can use a simple fetch to check connectivity
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Platform-specific storage keys
 */
export const getStorageKey = (key: string) => {
  return `fbet_${Platform.OS}_${key}`;
};

/**
 * Handle platform-specific errors
 */
export const handlePlatformError = (error: Error, context: string) => {
  console.error(`[${Platform.OS.toUpperCase()}] ${context}:`, error);
  
  if (isWeb) {
    // Web-specific error handling
    console.error('Stack trace:', error.stack);
  } else {
    // Mobile-specific error handling
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      platform: Platform.OS,
      context,
    });
  }
};

/**
 * Get platform-specific font sizes
 */
export const getFontSizes = () => {
  const baseSize = Platform.select({
    ios: 16,
    android: 14,
    web: 16,
  });
  
  return {
    xs: baseSize - 4,
    sm: baseSize - 2,
    md: baseSize,
    lg: baseSize + 2,
    xl: baseSize + 4,
    xxl: baseSize + 8,
  };
};

/**
 * Platform-specific haptic feedback
 */
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (isIOS) {
    try {
      const { Haptics } = require('expo-haptics');
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }
};

/**
 * Check if app is running in development mode
 */
export const isDevelopment = () => {
  return __DEV__;
};

/**
 * Get platform-specific user agent
 */
export const getUserAgent = () => {
  if (isWeb) {
    return navigator.userAgent;
  } else {
    return `F-Bet Mobile App (${Platform.OS} ${Platform.Version})`;
  }
};

export default {
  isMobile,
  isWeb,
  isIOS,
  isAndroid,
  getDeviceDimensions,
  isTablet,
  getSafeAreaInsets,
  platformStyles,
  isExpoGo,
  getApiBaseUrl,
  getNavigationOptions,
  checkNetworkConnectivity,
  getStorageKey,
  handlePlatformError,
  getFontSizes,
  triggerHapticFeedback,
  isDevelopment,
  getUserAgent,
};
