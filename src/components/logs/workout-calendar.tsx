"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMonthDates, toDateKey, getWeekStart } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type WorkoutCalendarProps = {
  workoutDates: Set<string>; // Set of YYYY-MM-DD strings
  streakWeeks: Set<string>; // Set of week_start dates that hit the threshold
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function WorkoutCalendar({ workoutDates, streakWeeks }: WorkoutCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const dates = getMonthDates(currentYear, currentMonth);
  const todayKey = toDateKey(today);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Check if a date's week hit the streak threshold
  const isStreakWeek = (date: Date): boolean => {
    return streakWeeks.has(getWeekStart(date));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {MONTHS[currentMonth]} {currentYear}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {dates.map((date, index) => {
            const dateKey = toDateKey(date);
            const isCurrentMonth = date.getMonth() === currentMonth;
            const isToday = dateKey === todayKey;
            const hasWorkout = workoutDates.has(dateKey);
            const inStreakWeek = isStreakWeek(date);

            return (
              <div
                key={index}
                className={cn(
                  "aspect-square flex items-center justify-center text-sm rounded-md transition-colors",
                  !isCurrentMonth && "text-muted-foreground/40",
                  isCurrentMonth && !hasWorkout && "text-foreground",
                  isToday && "ring-2 ring-primary ring-offset-1",
                  hasWorkout && inStreakWeek && "bg-orange-500 text-white font-medium",
                  hasWorkout && !inStreakWeek && "bg-green-500 text-white font-medium"
                )}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Workout</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span>Streak week</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
