import { setHours, setMinutes, startOfDay, startOfDecade, startOfHour, startOfMinute, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * Perform a timezone-aware startOfMinute operation
 */
export function startOfTZMinute(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfMinute(t);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware startOfHour operation
 */
export function startOfTZHour(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfHour(t);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware startOfDay operation
 */
export function startOfTZDay(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfDay(t);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware startOfWeek operation
 */
export function startOfTZWeek(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfWeek(t, { weekStartsOn: 1 });

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware startOfMonth operation
 */
export function startOfTZMonth(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfMonth(t);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware startOfYear operation
 */
export function startOfTZYear(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfYear(t);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware startOfDecade operation
 */
export function startOfTZDecade(t: Date, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = startOfDecade(t);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware setHours operation
 */
export function setTZHours(t: Date, hours: number, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = setHours(t, hours);

    // Shift back
    return fromZonedTime(t, timezone);
}

/**
 * Perform a timezone-aware setMinutes operation
 */
export function setTZMinutes(t: Date, minutes: number, timezone: string) {
    // Shift t to the proper timezone
    t = toZonedTime(t, timezone);

    t = setMinutes(t, minutes);

    // Shift back
    return fromZonedTime(t, timezone);
}
