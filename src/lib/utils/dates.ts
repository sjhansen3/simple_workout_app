/**
 * Get the Monday of the week for a given date
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust for Sunday (0) to be end of week
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

/**
 * Format a date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date with time for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Get a human-readable week range string
 */
export function getWeekRangeString(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${startStr} - ${endStr}`;
}

/**
 * Get all dates in a month as an array
 */
export function getMonthDates(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add padding days from previous month to start on Sunday
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    dates.push(d);
  }

  // Add all days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    dates.push(new Date(year, month, d));
  }

  // Add padding days to complete the last week
  const endPadding = 6 - lastDay.getDay();
  for (let i = 1; i <= endPadding; i++) {
    dates.push(new Date(year, month + 1, i));
  }

  return dates;
}

/**
 * Format date as YYYY-MM-DD for comparison
 */
export function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Streak = 3+ workout DAYS in a week
 * Consecutive weeks hitting the threshold = streak continues
 */
export type StreakData = {
  currentStreak: number; // consecutive weeks with 3+ days
  streakWeeks: string[]; // week_start dates that hit the threshold
};

/**
 * Count unique workout days from completions
 */
export function countWorkoutDays(completions: Array<{ completed_at: string }>): number {
  const days = new Set<string>();
  for (const c of completions) {
    days.add(toDateKey(new Date(c.completed_at)));
  }
  return days.size;
}

export function calculateStreaks(
  completionsByWeek: Record<string, Array<{ completed_at: string }>>,
  streakThreshold: number = 3
): StreakData {
  const currentWeekStart = getWeekStart(new Date());

  // Find all weeks that hit the threshold (3+ unique days)
  const streakWeeks: string[] = [];
  for (const [week, completions] of Object.entries(completionsByWeek)) {
    if (countWorkoutDays(completions) >= streakThreshold) {
      streakWeeks.push(week);
    }
  }

  // Calculate current streak (consecutive weeks ending at current or last week)
  let currentStreak = 0;
  let checkWeek = currentWeekStart;

  // Check current week first
  const currentWeekDays = countWorkoutDays(completionsByWeek[checkWeek] || []);
  if (currentWeekDays >= streakThreshold) {
    currentStreak = 1;
  } else {
    // Current week not complete, check from last week
    checkWeek = getWeekStart(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const lastWeekDays = countWorkoutDays(completionsByWeek[checkWeek] || []);
    if (lastWeekDays >= streakThreshold) {
      currentStreak = 1;
    }
  }

  // Count backwards from where we started
  if (currentStreak > 0) {
    let prevWeek = getWeekStart(new Date(new Date(checkWeek).getTime() - 7 * 24 * 60 * 60 * 1000));
    while (countWorkoutDays(completionsByWeek[prevWeek] || []) >= streakThreshold) {
      currentStreak++;
      prevWeek = getWeekStart(new Date(new Date(prevWeek).getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  }

  return { currentStreak, streakWeeks };
}
