import { TEAM_MEMBERS, SHIFTS } from './constants';
import { formatDate, getWeekStart, getDayOfWeek, addDays, getWeeksInYear } from './dateUtils';

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
const createStats = () => {
  const stats = {};
  TEAM_MEMBERS.forEach(member => {
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
const canWorkWeekend = (member, weekendHistory) => {
  const memberWeekends = weekendHistory.weekendsInCycle[member] || 0;

  // If member hasn't worked a weekend in this cycle, they can work
  if (memberWeekends === 0) {
    return true;
  }

  // If member has worked, check if all others (except partner) have also worked
  const lastPartner = weekendHistory.lastPartner[member];
  const othersToCheck = TEAM_MEMBERS.filter(m => m !== member && m !== lastPartner);

  const allOthersWorked = othersToCheck.every(m =>
    (weekendHistory.weekendsInCycle[m] || 0) >= memberWeekends
  );

  return allOthersWorked;
};

// Select the best weekend pair based on fair rotation
const selectWeekendPair = (weekendHistory, stats) => {
  // Get eligible members who can work this weekend
  const eligibleMembers = TEAM_MEMBERS.filter(m => canWorkWeekend(m, weekendHistory));

  if (eligibleMembers.length < 2) {
    // Start a new cycle - reset and pick from those with lowest weekend count
    const sortedByWeekends = [...TEAM_MEMBERS].sort((a, b) =>
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
const updateWeekendHistory = (weekendHistory, pair) => {
  const [member1, member2] = pair;

  // Update partners
  weekendHistory.lastPartner[member1] = member2;
  weekendHistory.lastPartner[member2] = member1;

  // Update weekend counts
  weekendHistory.weekendsInCycle[member1] = (weekendHistory.weekendsInCycle[member1] || 0) + 1;
  weekendHistory.weekendsInCycle[member2] = (weekendHistory.weekendsInCycle[member2] || 0) + 1;

  // Check if we need to start a new cycle (everyone has worked at least once)
  const minWeekends = Math.min(...TEAM_MEMBERS.map(m => weekendHistory.weekendsInCycle[m] || 0));
  if (minWeekends > 0) {
    // Everyone has worked - we can optionally reset counts but keep partners
    // For simplicity, we increment cycle but keep counts for continued fairness
    weekendHistory.cycleNumber++;
  }
};

// Get members with lowest count of a specific shift type
const getMembersWithLowestCount = (stats, shiftType, excludeMembers = []) => {
  const available = TEAM_MEMBERS.filter(m => !excludeMembers.includes(m));
  if (available.length === 0) return [];

  const counts = available.map(m => ({
    member: m,
    count: stats[m][shiftType]
  }));

  const minCount = Math.min(...counts.map(c => c.count));
  return counts.filter(c => c.count === minCount).map(c => c.member);
};

// Select member for special shift with fairness consideration
const selectMemberForSpecialShift = (stats, shiftType, excludeMembers, currentWeek, priorityMembers = []) => {
  const available = TEAM_MEMBERS.filter(m => !excludeMembers.includes(m));
  if (available.length === 0) return null;

  // First priority: members who skipped special shifts last week
  const prioritized = available.filter(m => priorityMembers.includes(m));
  if (prioritized.length > 0) {
    const withLowest = getMembersWithLowestCount(stats, shiftType,
      TEAM_MEMBERS.filter(m => !prioritized.includes(m)));
    if (withLowest.length > 0) {
      return withLowest[Math.floor(Math.random() * withLowest.length)];
    }
  }

  // Second priority: members with lowest count
  const withLowest = getMembersWithLowestCount(stats, shiftType, excludeMembers);
  if (withLowest.length > 0) {
    return withLowest[Math.floor(Math.random() * withLowest.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
};

// Main schedule generator
export const generateYearSchedule = (year, closures = []) => {
  const schedule = {};
  const stats = createStats();
  const weeks = getWeeksInYear(year);
  const weekendHistory = createWeekendHistory();

  // Track who had priority for special shifts
  let priorityForEarly = [];
  let priorityForLate = [];

  weeks.forEach((week, weekIndex) => {
    const weekStart = week.start;
    const weekKey = formatDate(weekStart);

    // Select weekend pair using fair rotation algorithm
    const weekendPair = selectWeekendPair(weekendHistory, stats);
    updateWeekendHistory(weekendHistory, weekendPair);

    // Members working weekend cannot work Thu/Fri and cannot have early/late shifts all week
    const weekendWorkers = weekendPair;
    const availableForSpecialShifts = TEAM_MEMBERS.filter(m => !weekendWorkers.includes(m));
    const availableForThursFri = TEAM_MEMBERS.filter(m => !weekendWorkers.includes(m));

    // Track who gets special shifts this week
    const weekSpecialShiftWorkers = new Set();

    // Generate schedule for each day of the week
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = addDays(weekStart, dayOffset);
      const dateKey = formatDate(currentDate);
      const dayOfWeek = getDayOfWeek(currentDate);

      // Check if this is a closure day
      const isClosure = closures.some(c => formatDate(c) === dateKey);
      if (isClosure) {
        schedule[dateKey] = { closure: true, shifts: [] };
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
        continue;
      }

      // Weekday schedule
      const dayShifts = [];
      const assignedToday = new Set();

      // Thursday and Friday restrictions
      const isThursOrFri = dayOfWeek === 4 || dayOfWeek === 5;
      const availableToday = isThursOrFri ? availableForThursFri : TEAM_MEMBERS;

      // Assign EARLY shift (8:00 - 17:00) - one person only
      const earlyMember = selectMemberForSpecialShift(
        stats,
        'earlyShifts',
        [...weekendWorkers, ...assignedToday],
        weekIndex,
        priorityForEarly
      );

      if (earlyMember && availableToday.includes(earlyMember)) {
        dayShifts.push({ member: earlyMember, shift: SHIFTS.EARLY });
        assignedToday.add(earlyMember);
        stats[earlyMember].earlyShifts++;
        stats[earlyMember].lastEarlyWeek = weekIndex;
        weekSpecialShiftWorkers.add(earlyMember);
      }

      // Assign LATE shift (12:00 - 21:00) - one person only
      const lateMember = selectMemberForSpecialShift(
        stats,
        'lateShifts',
        [...weekendWorkers, ...assignedToday],
        weekIndex,
        priorityForLate
      );

      if (lateMember && availableToday.includes(lateMember)) {
        dayShifts.push({ member: lateMember, shift: SHIFTS.LATE });
        assignedToday.add(lateMember);
        stats[lateMember].lateShifts++;
        stats[lateMember].lastLateWeek = weekIndex;
        weekSpecialShiftWorkers.add(lateMember);
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
    // Members who didn't get special shifts this week get priority next week
    priorityForEarly = TEAM_MEMBERS.filter(m =>
      !weekendWorkers.includes(m) &&
      !weekSpecialShiftWorkers.has(m)
    );
    priorityForLate = [...priorityForEarly];
  });

  return { schedule, stats };
};

// Regenerate schedule for a specific period
export const regenerateSchedule = (existingSchedule, startDate, endDate, closures = []) => {
  // This function can be used to regenerate a portion of the schedule
  // while trying to maintain consistency with the rest
  const year = new Date(startDate).getFullYear();
  return generateYearSchedule(year, closures);
};

// Get schedule statistics
export const getScheduleStats = (schedule) => {
  const stats = {};
  TEAM_MEMBERS.forEach(member => {
    stats[member] = {
      earlyShifts: 0,
      lateShifts: 0,
      standardShifts: 0,
      weekendShifts: 0,
      totalDays: 0
    };
  });

  Object.values(schedule).forEach(day => {
    if (day.closure) return;
    day.shifts.forEach(({ member, shift }) => {
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
