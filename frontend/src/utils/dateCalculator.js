import { isWeekend, eachDayOfInterval, isSameDay } from 'date-fns';

// This function takes start/end dates and an array of Holiday objects from DB
export const calculateBusinessDays = (startDate, endDate, holidays) => {
  // 1. Get all days in the range
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  // 2. Filter out weekends and holidays
  const workingDays = allDays.filter(day => {
    // Check if it's Saturday or Sunday
    if (isWeekend(day)) return false;

    // Check if it matches any holiday in the DB
    const isHoliday = holidays.some(holiday => isSameDay(holiday.date, day));
    if (isHoliday) return false;

    return true; // It's a working day
  });

  return workingDays.length;
};
