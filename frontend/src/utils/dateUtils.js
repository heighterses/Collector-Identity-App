/**
 * Format date according to user's timezone and language preferences
 */

export const formatDate = (dateString, userTimezone = 'UTC', userLanguage = 'en') => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Format options
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: userTimezone
    };
    
    return date.toLocaleDateString(userLanguage, options);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return new Date(dateString).toLocaleDateString();
  }
};

export const formatDateTime = (dateString, userTimezone = 'UTC', userLanguage = 'en') => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Format options
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimezone
    };
    
    return date.toLocaleDateString(userLanguage, options);
  } catch (error) {
    console.warn('DateTime formatting error:', error);
    return new Date(dateString).toLocaleString();
  }
};

export const formatRelativeTime = (dateString, userTimezone = 'UTC', userLanguage = 'en') => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Fall back to formatted date
    return formatDate(dateString, userTimezone, userLanguage);
  } catch (error) {
    console.warn('Relative time formatting error:', error);
    return 'Some time ago';
  }
};