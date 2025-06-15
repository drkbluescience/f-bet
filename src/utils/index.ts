import { format, parseISO, isToday, isTomorrow, isYesterday, differenceInMinutes } from 'date-fns';
import { COLORS, MATCH_STATUS, DATE_FORMATS } from '@/constants';

/**
 * Format date for display
 */
export const formatDate = (dateString: string, formatStr: string = DATE_FORMATS.DISPLAY_DATE): string => {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format time for display
 */
export const formatTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, DATE_FORMATS.DISPLAY_TIME);
  } catch (error) {
    return '--:--';
  }
};

/**
 * Get relative date string (Today, Tomorrow, Yesterday, or formatted date)
 */
export const getRelativeDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return formatDate(dateString, 'MMM dd');
    }
  } catch (error) {
    return 'Unknown';
  }
};

/**
 * Get match status color
 */
export const getMatchStatusColor = (status: string): string => {
  switch (status) {
    case MATCH_STATUS.LIVE:
    case 'LIVE':
    case '1H':
    case '2H':
      return COLORS.live;
    case MATCH_STATUS.FINISHED:
    case 'FT':
    case 'AET':
    case 'PEN':
      return COLORS.finished;
    case MATCH_STATUS.SCHEDULED:
    case 'NS':
    case 'TBD':
      return COLORS.scheduled;
    case MATCH_STATUS.POSTPONED:
    case 'PST':
      return COLORS.postponed;
    case MATCH_STATUS.CANCELLED:
    case 'CANC':
      return COLORS.cancelled;
    case MATCH_STATUS.HALFTIME:
    case 'HT':
      return COLORS.warning;
    default:
      return COLORS.textSecondary;
  }
};

/**
 * Get match status display text
 */
export const getMatchStatusText = (status: string, dateString?: string): string => {
  switch (status) {
    case 'LIVE':
    case '1H':
    case '2H':
      return 'LIVE';
    case 'HT':
      return 'HT';
    case 'FT':
      return 'FT';
    case 'AET':
      return 'AET';
    case 'PEN':
      return 'Penalties';
    case 'PST':
      return 'Postponed';
    case 'CANC':
      return 'Cancelled';
    case 'SUSP':
      return 'Suspended';
    case 'INT':
      return 'Interrupted';
    case 'NS':
    case 'TBD':
      return dateString ? formatTime(dateString) : 'TBD';
    default:
      return status || 'Unknown';
  }
};

/**
 * Check if match is live
 */
export const isMatchLive = (status: string): boolean => {
  return ['LIVE', '1H', '2H', 'HT'].includes(status);
};

/**
 * Check if match is finished
 */
export const isMatchFinished = (status: string): boolean => {
  return ['FT', 'AET', 'PEN'].includes(status);
};

/**
 * Check if match is scheduled
 */
export const isMatchScheduled = (status: string): boolean => {
  return ['NS', 'TBD'].includes(status);
};

/**
 * Format odds for display
 */
export const formatOdds = (odds: number): string => {
  if (odds < 1) return '--';
  return odds.toFixed(2);
};

/**
 * Calculate implied probability from odds
 */
export const getImpliedProbability = (odds: number): number => {
  if (odds <= 1) return 0;
  return (1 / odds) * 100;
};

/**
 * Format probability as percentage
 */
export const formatProbability = (probability: number): string => {
  if (probability < 0 || probability > 1) return '--';
  return `${(probability * 100).toFixed(1)}%`;
};

/**
 * Get team form color based on recent results
 */
export const getFormColor = (form: string): string => {
  if (!form) return COLORS.textSecondary;
  
  const wins = (form.match(/W/g) || []).length;
  const losses = (form.match(/L/g) || []).length;
  
  if (wins > losses) return COLORS.success;
  if (losses > wins) return COLORS.error;
  return COLORS.warning;
};

/**
 * Calculate goal difference
 */
export const getGoalDifference = (goalsFor: number, goalsAgainst: number): number => {
  return goalsFor - goalsAgainst;
};

/**
 * Format goal difference for display
 */
export const formatGoalDifference = (difference: number): string => {
  if (difference > 0) return `+${difference}`;
  return difference.toString();
};

/**
 * Get player age from birth date
 */
export const getPlayerAge = (birthDate: string): number => {
  try {
    const birth = parseISO(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    
    return age;
  } catch (error) {
    return 0;
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (text: string): string => {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Get time until match starts
 */
export const getTimeUntilMatch = (dateString: string): string => {
  try {
    const matchDate = parseISO(dateString);
    const now = new Date();
    const diffMinutes = differenceInMinutes(matchDate, now);
    
    if (diffMinutes < 0) return 'Started';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours < 24) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  } catch (error) {
    return 'Unknown';
  }
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Format large numbers (e.g., 1000 -> 1K)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Get contrast color for background
 */
export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 128 ? '#000000' : '#FFFFFF';
};
