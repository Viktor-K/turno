import { SHIFTS } from './constants';
import { formatDate, getWeekStart, getDayOfWeek, addDays, getWeeksInYear, isWeekend } from './dateUtils';

// Fisher-Yates shuffle for proper randomization
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Track statistics for fairness
const createStats = (teamMembers) => {
  const stats = {};
  teamMembers.forEach(member => {
    stats[member] = {
      earlyShifts: 0,
      lateShifts: 0,
      standardShifts: 0,
      weekendShifts: 0,
      lastEarlyWeek: -10,
      lastLateWeek: -10,
      lastWeekendWeek: -10,
      skippedSpecialLastWeek: false
    };
  });
  return stats;
};

// Track weekend history for fair rotation
const createWeekendHistory = () => {
  return {
    // Map of member -> their last weekend partner
    lastPartner: {},
    // Map of member -> number of weekends worked in current cycle
    weekendsInCycle: {},
    // Track the current rotation cycle
    cycleNumber: 0
  };
};

// Check if a member can work a weekend based on fair rotation rule
// Rule: A person cannot work another weekend until all others (except their last partner) have worked
const canWorkWeekend = (member, weekendHistory, teamMembers) => {
  const memberWeekends = weekendHistory.weekendsInCycle[member] || 0;

  // If member hasn't worked a weekend in this cycle, they can work
  if (memberWeekends === 0) {
    return true;
  }

  // If member has worked, check if all others (except partner) have also worked
  const lastPartner = weekendHistory.lastPartner[member];
  const othersToCheck = teamMembers.filter(m => m !== member && m !== lastPartner);

  const allOthersWorked = othersToCheck.every(m =>
    (weekendHistory.weekendsInCycle[m] || 0) >= memberWeekends
  );

  return allOthersWorked;
};

// Select the best weekend pair based on fair rotation
const selectWeekendPair = (weekendHistory, stats, teamMembers) => {
  // Get eligible members who can work this weekend
  const eligibleMembers = teamMembers.filter(m => canWorkWeekend(m, weekendHistory, teamMembers));

  if (eligibleMembers.length < 2) {
    // Start a new cycle - reset and pick from those with lowest weekend count
    const sortedByWeekends = [...teamMembers].sort((a, b) =>
      (weekendHistory.weekendsInCycle[a] || 0) - (weekendHistory.weekendsInCycle[b] || 0)
    );
    const minWeekends = weekendHistory.weekendsInCycle[sortedByWeekends[0]] || 0;
    const withMinWeekends = sortedByWeekends.filter(m =>
      (weekendHistory.weekendsInCycle[m] || 0) === minWeekends
    );

    // Pick two from those with minimum weekends
    if (withMinWeekends.length >= 2) {
      const shuffled = shuffleArray(withMinWeekends);
      return [shuffled[0], shuffled[1]];
    }

    // Fallback: pick first available
    return [sortedByWeekends[0], sortedByWeekends[1]];
  }

  // Among eligible members, prioritize those with fewer weekend shifts
  // First shuffle to randomize members with equal priority
  const shuffledEligible = shuffleArray(eligibleMembers);
  const sortedEligible = shuffledEligible.sort((a, b) => {
    const aWeekends = weekendHistory.weekendsInCycle[a] || 0;
    const bWeekends = weekendHistory.weekendsInCycle[b] || 0;
    if (aWeekends !== bWeekends) return aWeekends - bWeekends;
    // Secondary sort by total weekend shifts for overall fairness
    return stats[a].weekendShifts - stats[b].weekendShifts;
  });

  // Try to avoid pairing people who were recently partners
  let selectedPair = null;
  for (let i = 0; i < sortedEligible.length && !selectedPair; i++) {
    for (let j = i + 1; j < sortedEligible.length; j++) {
      const member1 = sortedEligible[i];
      const member2 = sortedEligible[j];

      // Avoid recent partners if possible
      if (weekendHistory.lastPartner[member1] !== member2) {
        selectedPair = [member1, member2];
        break;
      }
    }
  }

  // If no pair found avoiding recent partners, just take the top two
  if (!selectedPair) {
    selectedPair = [sortedEligible[0], sortedEligible[1]];
  }

  return selectedPair;
};

// Update weekend history after assigning a weekend
const updateWeekendHistory = (weekendHistory, pair, teamMembers) => {
  const [member1, member2] = pair;

  // Update partners
  weekendHistory.lastPartner[member1] = member2;
  weekendHistory.lastPartner[member2] = member1;

  // Update weekend counts
  weekendHistory.weekendsInCycle[member1] = (weekendHistory.weekendsInCycle[member1] || 0) + 1;
  weekendHistory.weekendsInCycle[member2] = (weekendHistory.weekendsInCycle[member2] || 0) + 1;

  // Check if we need to start a new cycle (everyone has worked at least once)
  const minWeekends = Math.min(...teamMembers.map(m => weekendHistory.weekendsInCycle[m] || 0));
  if (minWeekends > 0) {
    // Everyone has worked - we can optionally reset counts but keep partners
    // For simplicity, we increment cycle but keep counts for continued fairness
    weekendHistory.cycleNumber++;
  }
};

// Get members with lowest count of a specific shift type
const getMembersWithLowestCount = (stats, shiftType, excludeMembers = [], teamMembers) => {
  const available = teamMembers.filter(m => !excludeMembers.includes(m));
  if (available.length === 0) return [];

  const counts = available.map(m => ({
    member: m,
    count: stats[m][shiftType]
  }));

  const minCount = Math.min(...counts.map(c => c.count));
  return counts.filter(c => c.count === minCount).map(c => c.member);
};

// Select member for special shift with fairness consideration
const selectMemberForSpecialShift = (stats, shiftType, excludeMembers, currentWeek, priorityMembers = [], teamMembers) => {
  const available = teamMembers.filter(m => !excludeMembers.includes(m));
  if (available.length === 0) return null;

  // First priority: members who skipped special shifts last week
  const prioritized = available.filter(m => priorityMembers.includes(m));
  if (prioritized.length > 0) {
    const withLowest = getMembersWithLowestCount(stats, shiftType,
      teamMembers.filter(m => !prioritized.includes(m)), teamMembers);
    if (withLowest.length > 0) {
      return withLowest[Math.floor(Math.random() * withLowest.length)];
    }
  }

  // Second priority: members with lowest count
  const withLowest = getMembersWithLowestCount(stats, shiftType, excludeMembers, teamMembers);
  if (withLowest.length > 0) {
    return withLowest[Math.floor(Math.random() * withLowest.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
};

// Default team members for backward compatibility
const DEFAULT_TEAM_MEMBERS = [
  'Gabriela', 'Usfar', 'Fabio', 'Elisa', 'Marina', 'Stefania', 'Virginia', 'Silvia'
];

// Main schedule generator
export const generateYearSchedule = (year, closures = [], teamMembersList = null) => {
  const teamMembers = teamMembersList || DEFAULT_TEAM_MEMBERS;
  const schedule = {};
  const stats = createStats(teamMembers);
  const weeks = getWeeksInYear(year);
  const weekendHistory = createWeekendHistory();

  // Track who had priority for special shifts
  let priorityForEarly = [];
  let priorityForLate = [];

  weeks.forEach((week, weekIndex) => {
    const weekStart = week.start;
    const weekKey = formatDate(weekStart);

    // Select weekend pair using fair rotation algorithm
    const weekendPair = selectWeekendPair(weekendHistory, stats, teamMembers);
    updateWeekendHistory(weekendHistory, weekendPair, teamMembers);

    // Members working weekend cannot work Thu/Fri and cannot have early/late shifts all week
    const weekendWorkers = weekendPair;
    const availableForThursFri = teamMembers.filter(m => !weekendWorkers.includes(m));

    // Track who gets each type of special shift this week (separately)
    // Rule: A person can only work ONE early shift per week, and ONE late shift per week
    // NEW RULES:
    // - Person with early on day X must have late on day X+1 (consecutive) for Tue-Wed, Wed-Thu, Thu-Fri
    // - Person with late on Monday must have early on Friday
    const weekEarlyWorkers = new Set();  // People who already worked 8-17 this week
    const weekLateWorkers = new Set();   // People who already worked 12-21 this week

    // Track who should have late shift tomorrow (person who did early today)
    let nextDayLateMember = null;
    // Track who should have early on Friday (person who did late on Monday)
    let fridayEarlyMember = null;

    // Generate schedule for each day of the week
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = addDays(weekStart, dayOffset);
      const dateKey = formatDate(currentDate);
      const dayOfWeek = getDayOfWeek(currentDate);

      // Check if this is a closure day
      const isClosure = closures.some(c => formatDate(c) === dateKey);
      if (isClosure) {
        schedule[dateKey] = { closure: true, shifts: [] };
        // If someone was supposed to have late today but it's a closure, reset
        nextDayLateMember = null;
        continue;
      }

      // Weekend days (Saturday = 6, Sunday = 0)
      if (dayOfWeek === 6 || dayOfWeek === 0) {
        schedule[dateKey] = {
          closure: false,
          shifts: weekendPair.map(member => ({
            member,
            shift: SHIFTS.WEEKEND
          }))
        };

        // Update stats
        weekendPair.forEach(member => {
          stats[member].weekendShifts++;
          stats[member].lastWeekendWeek = weekIndex;
        });
        // Reset next day late member at weekend
        nextDayLateMember = null;
        continue;
      }

      // Weekday schedule
      const dayShifts = [];
      const assignedToday = new Set();

      // Thursday and Friday restrictions
      const isThursOrFri = dayOfWeek === 4 || dayOfWeek === 5;
      const availableToday = isThursOrFri ? availableForThursFri : teamMembers;

      const isMonday = dayOfWeek === 1;
      const isFriday = dayOfWeek === 5;

      // Assign LATE shift FIRST if someone was pre-assigned from yesterday's early
      // This ensures the early->late consecutive rule
      let lateMember = null;
      if (nextDayLateMember && availableToday.includes(nextDayLateMember)) {
        lateMember = nextDayLateMember;
        dayShifts.push({ member: lateMember, shift: SHIFTS.LATE });
        assignedToday.add(lateMember);
        stats[lateMember].lateShifts++;
        stats[lateMember].lastLateWeek = weekIndex;
        weekLateWorkers.add(lateMember);
      }
      // Reset for next iteration
      nextDayLateMember = null;

      // Assign EARLY shift (8:00 - 17:00) - one person only
      let earlyMember = null;

      if (isFriday && fridayEarlyMember && availableToday.includes(fridayEarlyMember)) {
        // Friday: assign early to whoever had late on Monday
        earlyMember = fridayEarlyMember;
        dayShifts.push({ member: earlyMember, shift: SHIFTS.EARLY });
        assignedToday.add(earlyMember);
        stats[earlyMember].earlyShifts++;
        stats[earlyMember].lastEarlyWeek = weekIndex;
        weekEarlyWorkers.add(earlyMember);
      } else if (!isFriday) {
        // Mon-Thu: normal early assignment
        earlyMember = selectMemberForSpecialShift(
          stats,
          'earlyShifts',
          [...weekendWorkers, ...assignedToday, ...weekEarlyWorkers],
          weekIndex,
          priorityForEarly,
          teamMembers
        );

        if (earlyMember && availableToday.includes(earlyMember)) {
          dayShifts.push({ member: earlyMember, shift: SHIFTS.EARLY });
          assignedToday.add(earlyMember);
          stats[earlyMember].earlyShifts++;
          stats[earlyMember].lastEarlyWeek = weekIndex;
          weekEarlyWorkers.add(earlyMember);

          // Pre-assign this person for late shift tomorrow (Tue-Thu early -> Wed-Fri late)
          const tomorrowDayOfWeek = getDayOfWeek(addDays(currentDate, 1));
          if (tomorrowDayOfWeek !== 6 && tomorrowDayOfWeek !== 0) {
            nextDayLateMember = earlyMember;
            weekLateWorkers.add(earlyMember); // Mark as will have late this week
          }
        }
      }

      // On Monday, also assign late shift and track for Friday early
      if (isMonday && !lateMember) {
        // Select someone for Monday late who will also do Friday early
        const mondayLateMember = selectMemberForSpecialShift(
          stats,
          'lateShifts',
          [...weekendWorkers, ...assignedToday, ...weekLateWorkers],
          weekIndex,
          priorityForLate,
          teamMembers
        );

        if (mondayLateMember && availableToday.includes(mondayLateMember)) {
          dayShifts.push({ member: mondayLateMember, shift: SHIFTS.LATE });
          assignedToday.add(mondayLateMember);
          stats[mondayLateMember].lateShifts++;
          stats[mondayLateMember].lastLateWeek = weekIndex;
          weekLateWorkers.add(mondayLateMember);
          // This person will have early on Friday
          fridayEarlyMember = mondayLateMember;
          weekEarlyWorkers.add(mondayLateMember); // Mark as will have early this week
        }
      }

      // Assign STANDARD shifts (9:00 - 18:00) - remaining members
      const remainingMembers = availableToday.filter(m => !assignedToday.has(m));
      remainingMembers.forEach(member => {
        dayShifts.push({ member, shift: SHIFTS.STANDARD });
        stats[member].standardShifts++;
      });

      schedule[dateKey] = {
        closure: false,
        shifts: dayShifts
      };
    }

    // Calculate priority for next week
    // Members who didn't get a specific special shift this week get priority for that shift next week
    priorityForEarly = teamMembers.filter(m =>
      !weekendWorkers.includes(m) &&
      !weekEarlyWorkers.has(m)
    );
    priorityForLate = teamMembers.filter(m =>
      !weekendWorkers.includes(m) &&
      !weekLateWorkers.has(m)
    );
  });

  return { schedule, stats };
};

// Generate schedule for 3 months, preserving existing weekend allocations
export const generateQuarterSchedule = (year, startMonth, existingSchedule = {}, closures = [], teamMembersList = null) => {
  const teamMembers = teamMembersList || DEFAULT_TEAM_MEMBERS;
  const schedule = { ...existingSchedule };
  const stats = createStats(teamMembers);
  const weekendHistory = createWeekendHistory();

  // Calculate the date range for 3 months
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0); // Last day of the 3rd month

  // Get all weeks that fall within this 3-month period
  const allWeeks = getWeeksInYear(year);
  const relevantWeeks = allWeeks.filter(week => {
    const weekEnd = week.end;
    const weekStart = week.start;
    return weekEnd >= startDate && weekStart <= endDate;
  });

  // Track who had priority for special shifts
  let priorityForEarly = [];
  let priorityForLate = [];

  // Helper to check if a date has existing weekend allocation
  const hasExistingWeekendAllocation = (dateKey) => {
    const existing = existingSchedule[dateKey];
    if (!existing || existing.closure) return false;
    // Check if it's a weekend day with shifts assigned
    const date = new Date(dateKey);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) return false;
    return existing.shifts && existing.shifts.length > 0;
  };

  // Get existing weekend members for a week
  const getExistingWeekendPair = (weekStart) => {
    const saturdayDate = addDays(weekStart, 5); // Saturday
    const sundayDate = addDays(weekStart, 6);   // Sunday
    const satKey = formatDate(saturdayDate);
    const sunKey = formatDate(sundayDate);

    // Check Saturday first
    if (hasExistingWeekendAllocation(satKey)) {
      const satSchedule = existingSchedule[satKey];
      return satSchedule.shifts.map(s => s.member);
    }
    // Then check Sunday
    if (hasExistingWeekendAllocation(sunKey)) {
      const sunSchedule = existingSchedule[sunKey];
      return sunSchedule.shifts.map(s => s.member);
    }
    return null;
  };

  relevantWeeks.forEach((week, weekIndex) => {
    const weekStart = week.start;

    // Check if this week has existing weekend allocations
    const existingWeekendPair = getExistingWeekendPair(weekStart);

    // Use existing weekend pair or generate new one
    let weekendPair;
    if (existingWeekendPair && existingWeekendPair.length >= 2) {
      weekendPair = existingWeekendPair.slice(0, 2);
      // Update weekend history with existing pair
      updateWeekendHistory(weekendHistory, weekendPair, teamMembers);
    } else {
      weekendPair = selectWeekendPair(weekendHistory, stats, teamMembers);
      updateWeekendHistory(weekendHistory, weekendPair, teamMembers);
    }

    // Members working weekend cannot work Thu/Fri and cannot have early/late shifts all week
    const weekendWorkers = weekendPair;
    const availableForThursFri = teamMembers.filter(m => !weekendWorkers.includes(m));

    const weekEarlyWorkers = new Set();
    const weekLateWorkers = new Set();

    let nextDayLateMember = null;
    let fridayEarlyMember = null;

    // Generate schedule for each day of the week
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = addDays(weekStart, dayOffset);
      const dateKey = formatDate(currentDate);
      const dayOfWeek = getDayOfWeek(currentDate);

      // Skip if date is outside our 3-month range
      if (currentDate < startDate || currentDate > endDate) {
        continue;
      }

      // Check if this is a closure day
      const isClosureDay = closures.some(c => formatDate(c) === dateKey);
      if (isClosureDay) {
        schedule[dateKey] = { closure: true, shifts: [] };
        nextDayLateMember = null;
        continue;
      }

      // Weekend days (Saturday = 6, Sunday = 0) - preserve existing or use weekendPair
      if (dayOfWeek === 6 || dayOfWeek === 0) {
        // If there's an existing weekend allocation, preserve it
        if (hasExistingWeekendAllocation(dateKey)) {
          // Keep the existing schedule
          // Update stats from existing
          existingSchedule[dateKey].shifts.forEach(s => {
            if (stats[s.member]) {
              stats[s.member].weekendShifts++;
              stats[s.member].lastWeekendWeek = weekIndex;
            }
          });
        } else {
          // Generate new weekend allocation
          schedule[dateKey] = {
            closure: false,
            shifts: weekendPair.map(member => ({
              member,
              shift: SHIFTS.WEEKEND
            }))
          };

          weekendPair.forEach(member => {
            stats[member].weekendShifts++;
            stats[member].lastWeekendWeek = weekIndex;
          });
        }
        nextDayLateMember = null;
        continue;
      }

      // Weekday schedule
      const dayShifts = [];
      const assignedToday = new Set();

      const isThursOrFri = dayOfWeek === 4 || dayOfWeek === 5;
      const availableToday = isThursOrFri ? availableForThursFri : teamMembers;

      const isMonday = dayOfWeek === 1;
      const isFriday = dayOfWeek === 5;

      // Assign LATE shift FIRST if someone was pre-assigned from yesterday's early
      let lateMember = null;
      if (nextDayLateMember && availableToday.includes(nextDayLateMember)) {
        lateMember = nextDayLateMember;
        dayShifts.push({ member: lateMember, shift: SHIFTS.LATE });
        assignedToday.add(lateMember);
        stats[lateMember].lateShifts++;
        stats[lateMember].lastLateWeek = weekIndex;
        weekLateWorkers.add(lateMember);
      }
      nextDayLateMember = null;

      // Assign EARLY shift
      let earlyMember = null;

      if (isFriday && fridayEarlyMember && availableToday.includes(fridayEarlyMember)) {
        earlyMember = fridayEarlyMember;
        dayShifts.push({ member: earlyMember, shift: SHIFTS.EARLY });
        assignedToday.add(earlyMember);
        stats[earlyMember].earlyShifts++;
        stats[earlyMember].lastEarlyWeek = weekIndex;
        weekEarlyWorkers.add(earlyMember);
      } else if (!isFriday) {
        earlyMember = selectMemberForSpecialShift(
          stats,
          'earlyShifts',
          [...weekendWorkers, ...assignedToday, ...weekEarlyWorkers],
          weekIndex,
          priorityForEarly,
          teamMembers
        );

        if (earlyMember && availableToday.includes(earlyMember)) {
          dayShifts.push({ member: earlyMember, shift: SHIFTS.EARLY });
          assignedToday.add(earlyMember);
          stats[earlyMember].earlyShifts++;
          stats[earlyMember].lastEarlyWeek = weekIndex;
          weekEarlyWorkers.add(earlyMember);

          const tomorrowDayOfWeek = getDayOfWeek(addDays(currentDate, 1));
          if (tomorrowDayOfWeek !== 6 && tomorrowDayOfWeek !== 0) {
            nextDayLateMember = earlyMember;
            weekLateWorkers.add(earlyMember);
          }
        }
      }

      // On Monday, also assign late shift and track for Friday early
      if (isMonday && !lateMember) {
        const mondayLateMember = selectMemberForSpecialShift(
          stats,
          'lateShifts',
          [...weekendWorkers, ...assignedToday, ...weekLateWorkers],
          weekIndex,
          priorityForLate,
          teamMembers
        );

        if (mondayLateMember && availableToday.includes(mondayLateMember)) {
          dayShifts.push({ member: mondayLateMember, shift: SHIFTS.LATE });
          assignedToday.add(mondayLateMember);
          stats[mondayLateMember].lateShifts++;
          stats[mondayLateMember].lastLateWeek = weekIndex;
          weekLateWorkers.add(mondayLateMember);
          fridayEarlyMember = mondayLateMember;
          weekEarlyWorkers.add(mondayLateMember);
        }
      }

      // Assign STANDARD shifts - remaining members
      const remainingMembers = availableToday.filter(m => !assignedToday.has(m));
      remainingMembers.forEach(member => {
        dayShifts.push({ member, shift: SHIFTS.STANDARD });
        stats[member].standardShifts++;
      });

      schedule[dateKey] = {
        closure: false,
        shifts: dayShifts
      };
    }

    // Calculate priority for next week
    priorityForEarly = teamMembers.filter(m =>
      !weekendWorkers.includes(m) &&
      !weekEarlyWorkers.has(m)
    );
    priorityForLate = teamMembers.filter(m =>
      !weekendWorkers.includes(m) &&
      !weekLateWorkers.has(m)
    );
  });

  return { schedule, stats };
};

// Regenerate schedule for a specific period
export const regenerateSchedule = (existingSchedule, startDate, endDate, closures = [], teamMembersList = null) => {
  // This function can be used to regenerate a portion of the schedule
  // while trying to maintain consistency with the rest
  const year = new Date(startDate).getFullYear();
  return generateYearSchedule(year, closures, teamMembersList);
};

// Get schedule statistics
export const getScheduleStats = (schedule) => {
  const stats = {};

  // Dynamically build stats from schedule data
  Object.values(schedule).forEach(day => {
    if (day.closure) return;
    day.shifts.forEach(({ member, shift }) => {
      if (!stats[member]) {
        stats[member] = {
          earlyShifts: 0,
          lateShifts: 0,
          standardShifts: 0,
          weekendShifts: 0,
          totalDays: 0
        };
      }
      stats[member].totalDays++;
      switch (shift.id) {
        case 'early':
          stats[member].earlyShifts++;
          break;
        case 'late':
          stats[member].lateShifts++;
          break;
        case 'standard':
          stats[member].standardShifts++;
          break;
        case 'weekend':
          stats[member].weekendShifts++;
          break;
      }
    });
  });

  return stats;
};
