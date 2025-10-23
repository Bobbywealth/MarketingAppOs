import { format, formatDistanceToNow, parseISO, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isSameDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Eastern Standard Time (America/New_York)
export const APP_TIMEZONE = 'America/New_York';

/**
 * Convert any date to EST timezone
 */
export function toEST(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return toZonedTime(dateObj, APP_TIMEZONE);
}

/**
 * Convert EST date to UTC for server
 */
export function fromEST(date: Date): Date {
  return fromZonedTime(date, APP_TIMEZONE);
}

/**
 * Format date in EST timezone
 */
export function formatInEST(date: Date | string | number, formatStr: string = 'MMM d, yyyy h:mm a'): string {
  const estDate = toEST(date);
  return format(estDate, formatStr);
}

/**
 * Format date as locale string in EST
 */
export function toLocaleDateStringEST(date: Date | string | number): string {
  const estDate = toEST(date);
  return estDate.toLocaleDateString('en-US', { 
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format date and time as locale string in EST
 */
export function toLocaleStringEST(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const estDate = toEST(date);
  return estDate.toLocaleString('en-US', { 
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  });
}

/**
 * Format date as short time (e.g., "2:30 PM")
 */
export function toLocaleTimeStringEST(date: Date | string | number): string {
  const estDate = toEST(date);
  return estDate.toLocaleTimeString('en-US', { 
    timeZone: APP_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format distance to now in EST (e.g., "2 hours ago")
 */
export function formatDistanceToNowEST(date: Date | string | number, options?: { addSuffix?: boolean }): string {
  const estDate = toEST(date);
  return formatDistanceToNow(estDate, options);
}

/**
 * Get current date/time in EST
 */
export function nowEST(): Date {
  return toEST(new Date());
}

/**
 * Format for input[type="date"] in EST
 */
export function toInputDateEST(date: Date | string | number): string {
  const estDate = toEST(date);
  return format(estDate, 'yyyy-MM-dd');
}

/**
 * Format for input[type="datetime-local"] in EST
 */
export function toInputDateTimeEST(date: Date | string | number): string {
  const estDate = toEST(date);
  return format(estDate, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Parse input date as EST/EDT (America/New_York timezone)
 * Takes a date string like "2025-10-23" or "2025-10-23T14:30" and treats it as America/New_York time
 */
export function parseInputDateEST(dateString: string): Date {
  // Parse the date components
  const parts = dateString.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!parts) {
    throw new Error('Invalid date format');
  }
  
  const [, year, month, day, hours = '00', minutes = '00'] = parts;
  
  // Use fromZonedTime to properly convert from America/New_York time to UTC
  // This function treats the input as if it's in the specified timezone
  const dateInNY = `${year}-${month}-${day} ${hours}:${minutes}:00`;
  return fromZonedTime(dateInNY, APP_TIMEZONE);
}

/**
 * Check if date is today in EST
 */
export function isTodayEST(date: Date | string | number): boolean {
  const estDate = toEST(date);
  const estNow = nowEST();
  return isSameDay(estDate, estNow);
}

/**
 * Get start of week in EST
 */
export function startOfWeekEST(date: Date | string | number): Date {
  const estDate = toEST(date);
  return startOfWeek(estDate);
}

/**
 * Get end of week in EST
 */
export function endOfWeekEST(date: Date | string | number): Date {
  const estDate = toEST(date);
  return endOfWeek(estDate);
}

/**
 * Get start of month in EST
 */
export function startOfMonthEST(date: Date | string | number): Date {
  const estDate = toEST(date);
  return startOfMonth(estDate);
}

/**
 * Get end of month in EST
 */
export function endOfMonthEST(date: Date | string | number): Date {
  const estDate = toEST(date);
  return endOfMonth(estDate);
}

/**
 * Add days in EST
 */
export function addDaysEST(date: Date | string | number, days: number): Date {
  const estDate = toEST(date);
  return addDays(estDate, days);
}

/**
 * Check if date is within interval in EST
 */
export function isWithinIntervalEST(
  date: Date | string | number,
  interval: { start: Date | string | number; end: Date | string | number }
): boolean {
  const estDate = toEST(date);
  const estStart = toEST(interval.start);
  const estEnd = toEST(interval.end);
  return isWithinInterval(estDate, { start: estStart, end: estEnd });
}

/**
 * Format compact date for display (e.g., "Oct 21, 2:30 PM")
 */
export function formatCompactEST(date: Date | string | number): string {
  return formatInEST(date, 'MMM d, h:mm a');
}

/**
 * Format for calendar display (e.g., "Monday, October 21, 2025")
 */
export function formatCalendarDateEST(date: Date | string | number): string {
  return formatInEST(date, 'EEEE, MMMM d, yyyy');
}

/**
 * Get timezone abbreviation (EST or EDT depending on daylight savings)
 */
export function getTimezoneAbbr(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    timeZoneName: 'short'
  });
  const parts = formatter.formatToParts(now);
  const tzPart = parts.find(part => part.type === 'timeZoneName');
  return tzPart?.value || 'EST';
}

