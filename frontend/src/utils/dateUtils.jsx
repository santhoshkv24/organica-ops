/**
 * Utility functions for handling dates and timezones
 */

/**
 * Converts a date string to local timezone Date object
 * @param {string} dateString - ISO date string
 * @returns {Date} - Local timezone Date object
 */
export const toLocalDate = (dateString) => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  // Get timezone offset in milliseconds
  const tzOffset = date.getTimezoneOffset() * 60000;
  // Apply the offset to get local time
  return new Date(date.getTime() + tzOffset);
};

/**
 * Formats a date for display
 * @param {Date|string} date - Date object or ISO date string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  const dt = typeof date === 'string' ? toLocalDate(date) : date;
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dt);
};

/**
 * Converts a local date to ISO string for API requests
 * @param {Date} date - Local date object
 * @returns {string} - ISO date string
 */
export const toISOLocal = (date) => {
  if (!date) return null;
  
  // Get the timezone offset in minutes and convert to ms
  const tzOffset = date.getTimezoneOffset() * 60000;
  // Create a new date with the offset applied
  const localDate = new Date(date.getTime() - tzOffset);
  
  return localDate.toISOString();
};
