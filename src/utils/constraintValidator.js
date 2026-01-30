import { TEAM_MEMBERS } from './constants';
import { formatDate, getWeekStart, addDays, getDayOfWeek } from './dateUtils';

// Constraint types
export const CONSTRAINT_TYPES = {
  WEEKEND_THURSDAY_FRIDAY: 'weekend_thursday_friday',
  WEEKEND_SPECIAL_SHIFTS: 'weekend_special_shifts',
  SINGLE_EARLY_SHIFT: 'single_early_shift',
  SINGLE_LATE_SHIFT: 'single_late_shift',
  DUPLICATE_ASSIGNMENT: 'duplicate_assignment',
  WEEKEND_FAIR_ROTATION: 'weekend_fair_rotation',
  EARLY_ONCE_PER_WEEK: 'early_once_per_week',
  LATE_ONCE_PER_WEEK: 'late_once_per_week',
  EARLY_LATE_CONSECUTIVE: 'early_late_consecutive',
  LATE_REQUIRES_PREVIOUS_EARLY: 'late_requires_previous_early',
  MONDAY_LATE_FRIDAY_EARLY: 'monday_late_friday_early',
  FRIDAY_EARLY_REQUIRES_MONDAY_LATE: 'friday_early_requires_monday_late'
};

// Constraint messages
export const CONSTRAINT_MESSAGES = {
  [CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY]: 'Chi lavora nel weekend non può lavorare giovedì e venerdì della stessa settimana',
  [CONSTRAINT_TYPES.WEEKEND_SPECIAL_SHIFTS]: 'Chi lavora nel weekend non può avere turni 8:00-17:00 o 12:00-21:00 nella stessa settimana',
  [CONSTRAINT_TYPES.SINGLE_EARLY_SHIFT]: 'Il turno 8:00-17:00 può essere assegnato a una sola persona al giorno',
  [CONSTRAINT_TYPES.SINGLE_LATE_SHIFT]: 'Il turno 12:00-21:00 può essere assegnato a una sola persona al giorno',
  [CONSTRAINT_TYPES.DUPLICATE_ASSIGNMENT]: 'La persona è già assegnata a un altro turno in questo giorno',
  [CONSTRAINT_TYPES.WEEKEND_FAIR_ROTATION]: 'Questa persona non può lavorare nel weekend finché tutti gli altri (eccetto il suo ultimo partner) non abbiano lavorato almeno un weekend',
  [CONSTRAINT_TYPES.EARLY_ONCE_PER_WEEK]: 'Questa persona ha già un turno 8:00-17:00 questa settimana',
  [CONSTRAINT_TYPES.LATE_ONCE_PER_WEEK]: 'Questa persona ha già un turno 12:00-21:00 questa settimana',
  [CONSTRAINT_TYPES.EARLY_LATE_CONSECUTIVE]: 'Chi ha il turno 8:00-17:00 deve avere il turno 12:00-21:00 il giorno successivo',
  [CONSTRAINT_TYPES.LATE_REQUIRES_PREVIOUS_EARLY]: 'Il turno 12:00-21:00 dovrebbe essere assegnato a chi ha fatto 8:00-17:00 il giorno precedente',
  [CONSTRAINT_TYPES.MONDAY_LATE_FRIDAY_EARLY]: 'Chi ha il turno 12:00-21:00 di lunedì deve avere il turno 8:00-17:00 il venerdì',
  [CONSTRAINT_TYPES.FRIDAY_EARLY_REQUIRES_MONDAY_LATE]: 'Il turno 8:00-17:00 del venerdì dovrebbe essere assegnato a chi ha fatto 12:00-21:00 il lunedì'
};

// Analyze all weekend assignments to build history
const buildWeekendHistory = (schedule) => {
  const history = {
    // Member -> array of {date, partner}
    memberWeekends: {},
    // Track weekend counts per member
    weekendCounts: {}
  };

  TEAM_MEMBERS.forEach(m => {
    history.memberWeekends[m] = [];
    history.weekendCounts[m] = 0;
  });

  // Collect all weekend assignments
  const weekendDates = Object.keys(schedule)
    .filter(dateStr => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) && schedule[dateStr]?.shifts?.length > 0;
    })
    .sort();

  weekendDates.forEach(dateStr => {
    const daySchedule = schedule[dateStr];
    if (!daySchedule || !daySchedule.shifts) return;

    const weekendWorkers = daySchedule.shifts
      .filter(s => s.shift.id === 'weekend')
      .map(s => s.member);

    if (weekendWorkers.length >= 2) {
      const [member1, member2] = weekendWorkers;
      history.memberWeekends[member1]?.push({ date: dateStr, partner: member2 });
      history.memberWeekends[member2]?.push({ date: dateStr, partner: member1 });
    }
  });

  // Count unique weekends per member (group by week to avoid double counting Sat+Sun)
  TEAM_MEMBERS.forEach(m => {
    const weeksSeen = new Set();
    history.memberWeekends[m].forEach(({ date }) => {
      const d = new Date(date);
      const weekStart = getWeekStart(d);
      weeksSeen.add(formatDate(weekStart));
    });
    history.weekendCounts[m] = weeksSeen.size;
  });

  return history;
};

// Check if a member can work a weekend based on fair rotation rule
const canMemberWorkWeekendFairly = (schedule, member, dateStr) => {
  const history = buildWeekendHistory(schedule);
  const memberWeekendCount = history.weekendCounts[member];

  // If member hasn't worked any weekends, they can work
  if (memberWeekendCount === 0) {
    return { canWork: true };
  }

  // Find the member's last partner
  const memberWeekends = history.memberWeekends[member];
  const lastWeekend = memberWeekends[memberWeekends.length - 1];
  const lastPartner = lastWeekend?.partner;

  // Check if all others (except partner) have worked at least as many weekends
  const othersToCheck = TEAM_MEMBERS.filter(m => m !== member && m !== lastPartner);
  const membersWhoHaventWorkedEnough = othersToCheck.filter(m =>
    history.weekendCounts[m] < memberWeekendCount
  );

  if (membersWhoHaventWorkedEnough.length > 0) {
    return {
      canWork: false,
      membersWhoNeedToWork: membersWhoHaventWorkedEnough,
      lastPartner
    };
  }

  return { canWork: true };
};

// Get all weekend workers for a given week
const getWeekendWorkersForWeek = (schedule, weekStartDate) => {
  const workers = new Set();

  // Saturday (day 5 from Monday)
  const saturday = addDays(weekStartDate, 5);
  const saturdayKey = formatDate(saturday);
  if (schedule[saturdayKey] && schedule[saturdayKey].shifts) {
    schedule[saturdayKey].shifts
      .filter(s => s.shift.id === 'weekend')
      .forEach(s => workers.add(s.member));
  }

  // Sunday (day 6 from Monday)
  const sunday = addDays(weekStartDate, 6);
  const sundayKey = formatDate(sunday);
  if (schedule[sundayKey] && schedule[sundayKey].shifts) {
    schedule[sundayKey].shifts
      .filter(s => s.shift.id === 'weekend')
      .forEach(s => workers.add(s.member));
  }

  return workers;
};

// Check if a person works on Thursday or Friday of a week
const worksOnThursdayOrFriday = (schedule, weekStartDate, member) => {
  const thursday = addDays(weekStartDate, 3);
  const friday = addDays(weekStartDate, 4);

  const thursdayKey = formatDate(thursday);
  const fridayKey = formatDate(friday);

  const worksThursday = schedule[thursdayKey]?.shifts?.some(s => s.member === member) || false;
  const worksFriday = schedule[fridayKey]?.shifts?.some(s => s.member === member) || false;

  return worksThursday || worksFriday;
};

// Check if a person has special shifts (early or late) in a week
const hasSpecialShiftsInWeek = (schedule, weekStartDate, member) => {
  for (let i = 0; i < 5; i++) { // Monday to Friday
    const day = addDays(weekStartDate, i);
    const dayKey = formatDate(day);

    if (schedule[dayKey]?.shifts) {
      const hasSpecial = schedule[dayKey].shifts.some(
        s => s.member === member && (s.shift.id === 'early' || s.shift.id === 'late')
      );
      if (hasSpecial) return true;
    }
  }
  return false;
};

// Check if a person already has an early shift (8-17) in the week
const hasEarlyShiftInWeek = (schedule, weekStartDate, member, excludeDateStr = null) => {
  for (let i = 0; i < 5; i++) { // Monday to Friday
    const day = addDays(weekStartDate, i);
    const dayKey = formatDate(day);

    // Skip the day we're checking for (to allow moving within same day)
    if (dayKey === excludeDateStr) continue;

    if (schedule[dayKey]?.shifts) {
      const hasEarly = schedule[dayKey].shifts.some(
        s => s.member === member && s.shift.id === 'early'
      );
      if (hasEarly) return true;
    }
  }
  return false;
};

// Check if a person already has a late shift (12-21) in the week
const hasLateShiftInWeek = (schedule, weekStartDate, member, excludeDateStr = null) => {
  for (let i = 0; i < 5; i++) { // Monday to Friday
    const day = addDays(weekStartDate, i);
    const dayKey = formatDate(day);

    // Skip the day we're checking for (to allow moving within same day)
    if (dayKey === excludeDateStr) continue;

    if (schedule[dayKey]?.shifts) {
      const hasLate = schedule[dayKey].shifts.some(
        s => s.member === member && s.shift.id === 'late'
      );
      if (hasLate) return true;
    }
  }
  return false;
};

// Check if a person had early shift the previous day
const hadEarlyShiftYesterday = (schedule, dateStr, member) => {
  const date = new Date(dateStr);
  const yesterday = addDays(date, -1);
  const yesterdayKey = formatDate(yesterday);

  if (schedule[yesterdayKey]?.shifts) {
    return schedule[yesterdayKey].shifts.some(
      s => s.member === member && s.shift.id === 'early'
    );
  }
  return false;
};

// Check if a person has early shift today (to verify they should have late tomorrow)
const hasEarlyShiftOnDay = (schedule, dateStr, member) => {
  if (schedule[dateStr]?.shifts) {
    return schedule[dateStr].shifts.some(
      s => s.member === member && s.shift.id === 'early'
    );
  }
  return false;
};

// Get who has early shift on a specific day
const getEarlyWorkerOnDay = (schedule, dateStr) => {
  if (schedule[dateStr]?.shifts) {
    const earlyShift = schedule[dateStr].shifts.find(s => s.shift.id === 'early');
    return earlyShift?.member || null;
  }
  return null;
};

// Get who has late shift on a specific day
const getLateWorkerOnDay = (schedule, dateStr) => {
  if (schedule[dateStr]?.shifts) {
    const lateShift = schedule[dateStr].shifts.find(s => s.shift.id === 'late');
    return lateShift?.member || null;
  }
  return null;
};

// Get Monday of the same week
const getMondayOfWeek = (date) => {
  const weekStart = getWeekStart(date);
  return weekStart; // getWeekStart returns Monday
};

// Check if a person had late shift on Monday of this week
const hadLateOnMonday = (schedule, dateStr, member) => {
  const date = new Date(dateStr);
  const monday = getMondayOfWeek(date);
  const mondayKey = formatDate(monday);
  return getLateWorkerOnDay(schedule, mondayKey) === member;
};

// Get who had late shift on Monday of the week containing dateStr
const getMondayLateWorker = (schedule, dateStr) => {
  const date = new Date(dateStr);
  const monday = getMondayOfWeek(date);
  const mondayKey = formatDate(monday);
  return getLateWorkerOnDay(schedule, mondayKey);
};

// Validate a proposed change
export const validateChange = (schedule, dateStr, member, newShiftId, currentAssignment = null) => {
  const violations = [];
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const weekStart = getWeekStart(date);

  // Get current day schedule
  const daySchedule = schedule[dateStr] || { shifts: [] };

  // Check for duplicate assignment on the same day (different shift)
  if (newShiftId) {
    const alreadyAssigned = daySchedule.shifts?.some(
      s => s.member === member && s.shift.id !== currentAssignment?.shift?.id
    );
    if (alreadyAssigned) {
      violations.push({
        type: CONSTRAINT_TYPES.DUPLICATE_ASSIGNMENT,
        message: CONSTRAINT_MESSAGES[CONSTRAINT_TYPES.DUPLICATE_ASSIGNMENT]
      });
    }
  }

  // Check single person constraints for early/late shifts
  if (newShiftId === 'early') {
    const existingEarly = daySchedule.shifts?.filter(
      s => s.shift.id === 'early' && s.member !== member
    );
    if (existingEarly && existingEarly.length > 0) {
      violations.push({
        type: CONSTRAINT_TYPES.SINGLE_EARLY_SHIFT,
        message: CONSTRAINT_MESSAGES[CONSTRAINT_TYPES.SINGLE_EARLY_SHIFT]
      });
    }

    // Check if person already has an early shift this week (only one per week)
    if (hasEarlyShiftInWeek(schedule, weekStart, member, dateStr)) {
      violations.push({
        type: CONSTRAINT_TYPES.EARLY_ONCE_PER_WEEK,
        message: CONSTRAINT_MESSAGES[CONSTRAINT_TYPES.EARLY_ONCE_PER_WEEK]
      });
    }

    // On Friday: early should be assigned to whoever had late on Monday
    if (dayOfWeek === 5) {
      const mondayLateWorker = getMondayLateWorker(schedule, dateStr);
      if (mondayLateWorker && mondayLateWorker !== member) {
        violations.push({
          type: CONSTRAINT_TYPES.FRIDAY_EARLY_REQUIRES_MONDAY_LATE,
          message: `${CONSTRAINT_MESSAGES[CONSTRAINT_TYPES.FRIDAY_EARLY_REQUIRES_MONDAY_LATE]} (${mondayLateWorker} ha fatto 12:00-21:00 lunedì)`
        });
      }
    }
  }

  if (newShiftId === 'late') {
    const existingLate = daySchedule.shifts?.filter(
      s => s.shift.id === 'late' && s.member !== member
    );
    if (existingLate && existingLate.length > 0) {
      violations.push({
        type: CONSTRAINT_TYPES.SINGLE_LATE_SHIFT,
        message: CONSTRAINT_MESSAGES[CONSTRAINT_TYPES.SINGLE_LATE_SHIFT]
      });
    }

    // Check if person already has a late shift this week (only one per week)
    if (hasLateShiftInWeek(schedule, weekStart, member, dateStr)) {
      violations.push({
        type: CONSTRAINT_TYPES.LATE_ONCE_PER_WEEK,
        message: CONSTRAINT_MESSAGES[CONSTRAINT_TYPES.LATE_ONCE_PER_WEEK]
      });
    }

    // Check consecutive rule for Wed-Fri (yesterday's early worker should have late today)
    // Tuesday doesn't have this check because Monday has late (not early)
    if (dayOfWeek >= 3 && dayOfWeek <= 5) { // Wednesday (3), Thursday (4), Friday (5)
      const yesterdayEarlyWorker = getEarlyWorkerOnDay(schedule, formatDate(addDays(date, -1)));
      if (yesterdayEarlyWorker && yesterdayEarlyWorker !== member) {
        violations.push({
          type: CONSTRAINT_TYPES.LATE_REQUIRES_PREVIOUS_EARLY,
          message: `${CONSTRAINT_MESSAGES[CONSTRAINT_TYPES.LATE_REQUIRES_PREVIOUS_EARLY]} (${yesterdayEarlyWorker} ha fatto 8:00-17:00 ieri)`
        });
      }
    }
  }

  // Check weekend constraints
  if (newShiftId === 'weekend') {
    // If assigning to weekend, check if person works Thu/Fri
    if (worksOnThursdayOrFriday(schedule, weekStart, member)) {
      violations.push({
        type: CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY,
        message: CONSTRAINT_MESSAGES[CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY]
      });
    }

    // Check fair rotation rule
    const fairRotationCheck = canMemberWorkWeekendFairly(schedule, member, dateStr);
    if (!fairRotationCheck.canWork) {
      const membersList = fairRotationCheck.membersWhoNeedToWork.join(', ');
      violations.push({
        type: CONSTRAINT_TYPES.WEEKEND_FAIR_ROTATION,
        message: `${member} non può lavorare nel weekend finché ${membersList} non abbiano lavorato almeno un weekend (partner escluso: ${fairRotationCheck.lastPartner || 'nessuno'})`
      });
    }

    // Check if person has special shifts in the week
    if (hasSpecialShiftsInWeek(schedule, weekStart, member)) {
      violations.push({
        type: CONSTRAINT_TYPES.WEEKEND_SPECIAL_SHIFTS,
        message: CONSTRAINT_MESSAGES[CONSTRAINT_TYPES.WEEKEND_SPECIAL_SHIFTS]
      });
    }
  }

  // If assigning to Thu/Fri or special shifts, check if person works weekend
  if ((dayOfWeek === 4 || dayOfWeek === 5) || (newShiftId === 'early' || newShiftId === 'late')) {
    const weekendWorkers = getWeekendWorkersForWeek(schedule, weekStart);

    if (weekendWorkers.has(member)) {
      if (dayOfWeek === 4 || dayOfWeek === 5) {
        violations.push({
          type: CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY,
          message: CONSTRAINT_MESSAGES[CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY]
        });
      }

      if (newShiftId === 'early' || newShiftId === 'late') {
        violations.push({
          type: CONSTRAINT_TYPES.WEEKEND_SPECIAL_SHIFTS,
          message: CONSTRAINT_MESSAGES[CONSTRAINT_TYPES.WEEKEND_SPECIAL_SHIFTS]
        });
      }
    }
  }

  return violations;
};

// Get available members for a specific shift on a specific day
export const getAvailableMembers = (schedule, dateStr, shiftId, excludeMembers = []) => {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const weekStart = getWeekStart(date);
  const daySchedule = schedule[dateStr] || { shifts: [] };

  // Get members already assigned today
  const assignedToday = new Set(daySchedule.shifts?.map(s => s.member) || []);

  // Get weekend workers for the week
  const weekendWorkers = getWeekendWorkersForWeek(schedule, weekStart);

  return TEAM_MEMBERS.filter(member => {
    // Exclude specified members
    if (excludeMembers.includes(member)) return false;

    // Already assigned today to another shift
    if (assignedToday.has(member)) return false;

    // Weekend worker constraints
    if (weekendWorkers.has(member)) {
      // Can't work Thu/Fri
      if (dayOfWeek === 4 || dayOfWeek === 5) return false;

      // Can't have special shifts
      if (shiftId === 'early' || shiftId === 'late') return false;
    }

    // Special shift constraints: only one of each type per week
    if (shiftId === 'early') {
      if (hasEarlyShiftInWeek(schedule, weekStart, member, dateStr)) return false;
      // On Friday: only the Monday late worker can have early
      if (dayOfWeek === 5) {
        const mondayLateWorker = getMondayLateWorker(schedule, dateStr);
        if (mondayLateWorker && member !== mondayLateWorker) {
          return false;
        }
      }
    }

    if (shiftId === 'late') {
      if (hasLateShiftInWeek(schedule, weekStart, member, dateStr)) return false;
      // For late shift Wed-Fri: only the person who had early yesterday should be available
      if (dayOfWeek >= 3 && dayOfWeek <= 5) { // Wednesday, Thursday, Friday
        const yesterdayEarlyWorker = getEarlyWorkerOnDay(schedule, formatDate(addDays(date, -1)));
        if (yesterdayEarlyWorker && member !== yesterdayEarlyWorker) {
          return false;
        }
      }
      // Note: Tuesday late has no consecutive restriction (Monday has late, not early)
    }

    // If it's a weekend shift, check constraints
    if (shiftId === 'weekend') {
      if (worksOnThursdayOrFriday(schedule, weekStart, member)) return false;
      if (hasSpecialShiftsInWeek(schedule, weekStart, member)) return false;

      // Check fair rotation rule
      const fairRotationCheck = canMemberWorkWeekendFairly(schedule, member, dateStr);
      if (!fairRotationCheck.canWork) return false;
    }

    return true;
  });
};
