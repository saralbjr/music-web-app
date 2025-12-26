import { ISchedule } from "@/models/Schedule";

/**
 * Scheduling Algorithm
 *
 * Computer Science Concepts:
 * - Priority Scheduling: Schedules with higher priority are selected first
 * - Time-Based Scheduling: Matches schedules based on current time and day
 * - Greedy Algorithm: Selects the best matching schedule at the current moment
 *
 * Algorithm Approach:
 * 1. Filter schedules that match current time and day
 * 2. Sort by priority (higher priority first)
 * 3. Return the highest priority matching schedule
 *
 * Time Complexity: O(n log n) where n is the number of schedules
 * - Filtering: O(n)
 * - Sorting: O(n log n)
 * - Selection: O(1)
 */

/**
 * Check if current time falls within a schedule's time range
 *
 * @param currentTime - Current time in HH:MM format
 * @param startTime - Schedule start time in HH:MM format
 * @param endTime - Schedule end time in HH:MM format
 * @returns true if current time is within the range
 */
export function isTimeInRange(
  currentTime: string,
  startTime: string,
  endTime: string
): boolean {
  const [currentHour, currentMinute] = currentTime.split(":").map(Number);
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const currentMinutes = currentHour * 60 + currentMinute;
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // Handle schedules that span midnight (e.g., 22:00 to 02:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Get current time in HH:MM format
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Get current day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getCurrentDayOfWeek(): number {
  return new Date().getDay();
}

/**
 * Priority-based scheduling algorithm
 *
 * Selects the best matching schedule using:
 * 1. Time matching (current time within schedule range)
 * 2. Day matching (current day in schedule's daysOfWeek)
 * 3. Priority sorting (higher priority schedules selected first)
 *
 * @param schedules - Array of schedules to evaluate
 * @returns The best matching schedule or null if none match
 */
export function findBestSchedule(schedules: ISchedule[]): ISchedule | null {
  const currentTime = getCurrentTime();
  const currentDay = getCurrentDayOfWeek();

  // Filter schedules that match current time and day
  const matchingSchedules = schedules.filter((schedule) => {
    if (!schedule.isActive) return false;

    // Check if current day is in schedule's daysOfWeek
    if (!schedule.daysOfWeek.includes(currentDay)) return false;

    // Check if current time is within schedule's time range
    return isTimeInRange(
      currentTime,
      schedule.timeRange.start,
      schedule.timeRange.end
    );
  });

  if (matchingSchedules.length === 0) {
    return null;
  }

  // Sort by priority (higher priority first) - Priority Scheduling Algorithm
  matchingSchedules.sort((a, b) => b.priority - a.priority);

  // Return the highest priority matching schedule (Greedy selection)
  return matchingSchedules[0];
}

/**
 * Get all active schedules for a user, sorted by priority
 *
 * @param schedules - Array of user's schedules
 * @returns Sorted array of active schedules
 */
export function getActiveSchedules(schedules: ISchedule[]): ISchedule[] {
  return schedules
    .filter((schedule) => schedule.isActive)
    .sort((a, b) => b.priority - a.priority);
}



