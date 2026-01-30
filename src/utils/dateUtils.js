export const formatDate = (date) => {
  const d = new Date(date);
  // Use local timezone to avoid date shifting issues
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getWeekEnd = (date) => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
};

export const getMonthStart = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export const getMonthEnd = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
};

export const getQuarterStart = (date) => {
  const d = new Date(date);
  const quarter = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), quarter * 3, 1);
};

export const getQuarterEnd = (date) => {
  const d = new Date(date);
  const quarter = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), (quarter + 1) * 3, 0);
};

export const getYearStart = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), 0, 1);
};

export const getYearEnd = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), 11, 31);
};

export const getDaysInRange = (startDate, endDate) => {
  const days = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const getDayOfWeek = (date) => {
  return new Date(date).getDay();
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getWeeksInYear = (year) => {
  const weeks = [];
  let current = new Date(year, 0, 1);

  // Find first Monday
  while (current.getDay() !== 1) {
    current.setDate(current.getDate() + 1);
  }

  while (current.getFullYear() === year || (current.getFullYear() === year + 1 && getWeekNumber(current) === 1)) {
    weeks.push({
      weekNumber: getWeekNumber(current),
      start: new Date(current),
      end: addDays(current, 6)
    });
    current.setDate(current.getDate() + 7);
    if (current.getFullYear() > year && getWeekNumber(current) > 1) break;
  }

  return weeks;
};

// Generate a short hash from schedule data (for debugging)
export const generateScheduleHash = (schedule) => {
  if (!schedule || Object.keys(schedule).length === 0) {
    return null;
  }

  // Create a deterministic string representation of the schedule
  const sortedDates = Object.keys(schedule).sort();
  const scheduleString = sortedDates.map(date => {
    const day = schedule[date];
    if (day.closure) return `${date}:C`;
    const shifts = (day.shifts || [])
      .map(s => `${s.member}:${s.shift.id}`)
      .sort()
      .join(',');
    return `${date}:${shifts}`;
  }).join('|');

  // djb2 hash algorithm
  let hash = 5381;
  for (let i = 0; i < scheduleString.length; i++) {
    hash = ((hash << 5) + hash) + scheduleString.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to hex and take last 8 characters
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0').slice(-8);
  return hexHash.toUpperCase();
};
