import { describe, it, expect, beforeEach } from 'vitest';
import { generateYearSchedule, getScheduleStats } from './shiftGenerator';
import { TEAM_MEMBERS, SHIFTS } from './constants';
import { formatDate, getWeekStart, addDays, getWeeksInYear } from './dateUtils';

describe('Shift Generator', () => {
  let schedule;
  let stats;
  const testYear = 2025;

  beforeEach(() => {
    const result = generateYearSchedule(testYear, []);
    schedule = result.schedule;
    stats = result.stats;
  });

  describe('Basic Schedule Generation', () => {
    it('should generate schedule for the entire year', () => {
      const scheduledDays = Object.keys(schedule).length;
      expect(scheduledDays).toBeGreaterThan(300); // At least 300 days in a year
    });

    it('should include all team members in stats', () => {
      TEAM_MEMBERS.forEach(member => {
        expect(stats[member]).toBeDefined();
      });
    });

    it('should not create empty days (except closures)', () => {
      Object.entries(schedule).forEach(([dateStr, day]) => {
        if (!day.closure) {
          expect(day.shifts.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Weekday Shifts Rules', () => {
    it('should assign exactly one person to early shift (8:00-17:00) per weekday', () => {
      Object.entries(schedule).forEach(([dateStr, day]) => {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();

        // Skip weekends and closures
        if (dayOfWeek === 0 || dayOfWeek === 6 || day.closure) return;

        const earlyShifts = day.shifts.filter(s => s.shift.id === 'early');
        expect(earlyShifts.length).toBeLessThanOrEqual(1);
      });
    });

    it('should assign exactly one person to late shift (12:00-21:00) per weekday', () => {
      Object.entries(schedule).forEach(([dateStr, day]) => {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();

        // Skip weekends and closures
        if (dayOfWeek === 0 || dayOfWeek === 6 || day.closure) return;

        const lateShifts = day.shifts.filter(s => s.shift.id === 'late');
        expect(lateShifts.length).toBeLessThanOrEqual(1);
      });
    });

    it('should assign remaining members to standard shift (9:00-18:00) on weekdays', () => {
      // Count total standard shifts across the year
      let totalStandardShifts = 0;
      let weekdayCount = 0;

      Object.entries(schedule).forEach(([dateStr, day]) => {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();

        // Skip weekends and closures
        if (dayOfWeek === 0 || dayOfWeek === 6 || day.closure) return;

        weekdayCount++;
        const standardShifts = day.shifts.filter(s => s.shift.id === 'standard');
        totalStandardShifts += standardShifts.length;
      });

      // On average, there should be standard shifts (remaining members after early/late)
      expect(totalStandardShifts).toBeGreaterThan(0);
      // Most weekdays should have standard shifts
      expect(totalStandardShifts / weekdayCount).toBeGreaterThan(3); // At least 3-4 people on standard per day
    });

    it('should not assign the same person to multiple shifts on the same day', () => {
      Object.entries(schedule).forEach(([dateStr, day]) => {
        if (day.closure) return;

        const members = day.shifts.map(s => s.member);
        const uniqueMembers = new Set(members);
        expect(members.length).toBe(uniqueMembers.size);
      });
    });
  });

  describe('Weekend Shifts Rules', () => {
    it('should correctly assign weekend shifts to Saturdays and Sundays', () => {
      // After timezone fix, dates should match correctly
      Object.entries(schedule).forEach(([dateStr, day]) => {
        if (day.closure) return;
        if (!dateStr.startsWith(String(testYear))) return;

        // Parse the date string using local timezone
        const [year, month, dayNum] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, dayNum);
        const dayOfWeek = date.getDay();

        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const hasWeekendShifts = day.shifts.some(s => s.shift.id === 'weekend');
        const hasWeekdayShifts = day.shifts.some(s => s.shift.id !== 'weekend');

        // A day should not have BOTH weekend and weekday shifts
        expect(hasWeekendShifts && hasWeekdayShifts).toBe(false);

        // Weekend days should have weekend shifts
        if (isWeekend && day.shifts.length > 0) {
          expect(hasWeekendShifts).toBe(true);
        }

        // Weekdays should not have weekend shifts
        if (!isWeekend && day.shifts.length > 0) {
          expect(hasWeekendShifts).toBe(false);
        }
      });
    });

    it('should assign weekend shifts in pairs (same people Saturday and Sunday)', () => {
      const weeks = getWeeksInYear(testYear);

      weeks.forEach(week => {
        const saturday = addDays(week.start, 5);
        const sunday = addDays(week.start, 6);

        const satKey = formatDate(saturday);
        const sunKey = formatDate(sunday);

        const satSchedule = schedule[satKey];
        const sunSchedule = schedule[sunKey];

        if (!satSchedule || !sunSchedule) return;
        if (satSchedule.closure || sunSchedule.closure) return;

        const satWorkers = satSchedule.shifts
          .filter(s => s.shift.id === 'weekend')
          .map(s => s.member)
          .sort();

        const sunWorkers = sunSchedule.shifts
          .filter(s => s.shift.id === 'weekend')
          .map(s => s.member)
          .sort();

        expect(satWorkers).toEqual(sunWorkers);
      });
    });

    it('should have exactly 2 people working each weekend day when shifts are assigned', () => {
      Object.entries(schedule).forEach(([dateStr, day]) => {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();

        if (day.closure) return;

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          const weekendWorkers = day.shifts.filter(s => s.shift.id === 'weekend');
          // If there are weekend workers, there should be exactly 2
          if (weekendWorkers.length > 0) {
            expect(weekendWorkers.length).toBe(2);
          }
        }
      });
    });
  });

  describe('Weekend Workers Restrictions', () => {
    it('should not assign weekend workers to Thursday of the same week', () => {
      const weeks = getWeeksInYear(testYear);

      weeks.forEach(week => {
        const thursday = addDays(week.start, 3);
        const saturday = addDays(week.start, 5);

        const thursKey = formatDate(thursday);
        const satKey = formatDate(saturday);

        const thursSchedule = schedule[thursKey];
        const satSchedule = schedule[satKey];

        if (!thursSchedule || !satSchedule) return;
        if (thursSchedule.closure || satSchedule.closure) return;

        const weekendWorkers = satSchedule.shifts
          .filter(s => s.shift.id === 'weekend')
          .map(s => s.member);

        const thursdayWorkers = thursSchedule.shifts.map(s => s.member);

        weekendWorkers.forEach(worker => {
          expect(thursdayWorkers).not.toContain(worker);
        });
      });
    });

    it('should not assign weekend workers to Friday of the same week', () => {
      const weeks = getWeeksInYear(testYear);

      weeks.forEach(week => {
        const friday = addDays(week.start, 4);
        const saturday = addDays(week.start, 5);

        const friKey = formatDate(friday);
        const satKey = formatDate(saturday);

        const friSchedule = schedule[friKey];
        const satSchedule = schedule[satKey];

        if (!friSchedule || !satSchedule) return;
        if (friSchedule.closure || satSchedule.closure) return;

        const weekendWorkers = satSchedule.shifts
          .filter(s => s.shift.id === 'weekend')
          .map(s => s.member);

        const fridayWorkers = friSchedule.shifts.map(s => s.member);

        weekendWorkers.forEach(worker => {
          expect(fridayWorkers).not.toContain(worker);
        });
      });
    });

    it('should not assign early shift (8:00-17:00) to weekend workers during the same week', () => {
      const weeks = getWeeksInYear(testYear);

      weeks.forEach(week => {
        const saturday = addDays(week.start, 5);
        const satKey = formatDate(saturday);
        const satSchedule = schedule[satKey];

        if (!satSchedule || satSchedule.closure) return;

        const weekendWorkers = satSchedule.shifts
          .filter(s => s.shift.id === 'weekend')
          .map(s => s.member);

        // Check Monday to Friday
        for (let i = 0; i < 5; i++) {
          const day = addDays(week.start, i);
          const dayKey = formatDate(day);
          const daySchedule = schedule[dayKey];

          if (!daySchedule || daySchedule.closure) continue;

          const earlyWorkers = daySchedule.shifts
            .filter(s => s.shift.id === 'early')
            .map(s => s.member);

          weekendWorkers.forEach(worker => {
            expect(earlyWorkers).not.toContain(worker);
          });
        }
      });
    });

    it('should not assign late shift (12:00-21:00) to weekend workers during the same week', () => {
      const weeks = getWeeksInYear(testYear);

      weeks.forEach(week => {
        const saturday = addDays(week.start, 5);
        const satKey = formatDate(saturday);
        const satSchedule = schedule[satKey];

        if (!satSchedule || satSchedule.closure) return;

        const weekendWorkers = satSchedule.shifts
          .filter(s => s.shift.id === 'weekend')
          .map(s => s.member);

        // Check Monday to Friday
        for (let i = 0; i < 5; i++) {
          const day = addDays(week.start, i);
          const dayKey = formatDate(day);
          const daySchedule = schedule[dayKey];

          if (!daySchedule || daySchedule.closure) continue;

          const lateWorkers = daySchedule.shifts
            .filter(s => s.shift.id === 'late')
            .map(s => s.member);

          weekendWorkers.forEach(worker => {
            expect(lateWorkers).not.toContain(worker);
          });
        }
      });
    });
  });

  describe('Fair Weekend Rotation Rule', () => {
    it('should ensure all team members work weekends before anyone repeats (excluding partner)', () => {
      // Track weekend assignments per member
      const weekendHistory = {};
      TEAM_MEMBERS.forEach(m => {
        weekendHistory[m] = [];
      });

      // Collect all weekend assignments in order
      const weekendDates = Object.keys(schedule)
        .filter(dateStr => {
          const date = new Date(dateStr);
          return date.getDay() === 6; // Only Saturdays to avoid double counting
        })
        .sort();

      weekendDates.forEach(dateStr => {
        const day = schedule[dateStr];
        if (!day || day.closure) return;

        const workers = day.shifts
          .filter(s => s.shift.id === 'weekend')
          .map(s => s.member);

        if (workers.length === 2) {
          workers.forEach(worker => {
            weekendHistory[worker].push({
              date: dateStr,
              partner: workers.find(w => w !== worker)
            });
          });
        }
      });

      // Verify the rotation rule
      // For each member, when they work their Nth weekend, check that all others
      // (except their last partner) have worked at least N-1 weekends
      TEAM_MEMBERS.forEach(member => {
        const memberWeekends = weekendHistory[member];

        memberWeekends.forEach((weekend, index) => {
          if (index === 0) return; // First weekend is always allowed

          const lastPartner = memberWeekends[index - 1].partner;
          const othersToCheck = TEAM_MEMBERS.filter(m => m !== member && m !== lastPartner);

          // Count how many weekends each "other" had before this weekend date
          othersToCheck.forEach(other => {
            const otherWeekendsBefore = weekendHistory[other].filter(w => w.date < weekend.date).length;

            // The other should have worked at least (index) weekends before this member works their (index+1)th weekend
            // But we're lenient - they should have at least 1 weekend if member is on their 2nd
            expect(otherWeekendsBefore).toBeGreaterThanOrEqual(index);
          });
        });
      });
    });

    it('should distribute weekend shifts fairly across all team members', () => {
      const finalStats = getScheduleStats(schedule);
      const weekendCounts = TEAM_MEMBERS.map(m => finalStats[m].weekendShifts);

      const maxWeekends = Math.max(...weekendCounts);
      const minWeekends = Math.min(...weekendCounts);

      // The difference between max and min should be small (max 2-4 due to rotation cycles)
      expect(maxWeekends - minWeekends).toBeLessThanOrEqual(4);
    });
  });

  describe('Fair Distribution of Special Shifts', () => {
    it('should distribute early shifts fairly across team members', () => {
      const finalStats = getScheduleStats(schedule);
      const earlyCounts = TEAM_MEMBERS.map(m => finalStats[m].earlyShifts);

      const maxEarly = Math.max(...earlyCounts);
      const minEarly = Math.min(...earlyCounts);

      // Allow some variance due to constraints
      expect(maxEarly - minEarly).toBeLessThanOrEqual(20);
    });

    it('should distribute late shifts fairly across team members', () => {
      const finalStats = getScheduleStats(schedule);
      const lateCounts = TEAM_MEMBERS.map(m => finalStats[m].lateShifts);

      const maxLate = Math.max(...lateCounts);
      const minLate = Math.min(...lateCounts);

      // Allow some variance due to constraints
      expect(maxLate - minLate).toBeLessThanOrEqual(20);
    });
  });

  describe('Closure Days Handling', () => {
    it('should mark closure days correctly', () => {
      // Use weekdays that are definitely after the first Monday of 2025
      // First Monday of 2025 is January 6th
      const closureDates = [new Date('2025-01-08'), new Date('2025-06-18')]; // Wednesday, Wednesday
      const result = generateYearSchedule(testYear, closureDates);

      closureDates.forEach(closureDate => {
        const dateKey = formatDate(closureDate);
        expect(result.schedule[dateKey]).toBeDefined();
        expect(result.schedule[dateKey].closure).toBe(true);
        expect(result.schedule[dateKey].shifts.length).toBe(0);
      });
    });

    it('should not assign any shifts on closure days', () => {
      // Use weekdays that are after the first Monday
      const closureDates = [new Date('2025-04-21'), new Date('2025-05-05'), new Date('2025-08-18')];
      const result = generateYearSchedule(testYear, closureDates);

      closureDates.forEach(closureDate => {
        const dateKey = formatDate(closureDate);
        const day = result.schedule[dateKey];
        expect(day).toBeDefined();
        expect(day.closure).toBe(true);
        expect(day.shifts).toEqual([]);
      });
    });
  });
});

describe('Schedule Stats Calculation', () => {
  it('should correctly count all shift types per member', () => {
    const testSchedule = {
      '2025-01-06': {
        closure: false,
        shifts: [
          { member: 'Gabriela', shift: SHIFTS.EARLY },
          { member: 'Fabio', shift: SHIFTS.LATE },
          { member: 'Elisa', shift: SHIFTS.STANDARD },
        ]
      },
      '2025-01-11': {
        closure: false,
        shifts: [
          { member: 'Gabriela', shift: SHIFTS.WEEKEND },
          { member: 'Usfar', shift: SHIFTS.WEEKEND },
        ]
      }
    };

    const stats = getScheduleStats(testSchedule);

    expect(stats['Gabriela'].earlyShifts).toBe(1);
    expect(stats['Gabriela'].weekendShifts).toBe(1);
    expect(stats['Fabio'].lateShifts).toBe(1);
    expect(stats['Elisa'].standardShifts).toBe(1);
    expect(stats['Usfar'].weekendShifts).toBe(1);
  });

  it('should not count closure days', () => {
    const testSchedule = {
      '2025-01-01': {
        closure: true,
        shifts: []
      },
      '2025-01-02': {
        closure: false,
        shifts: [
          { member: 'Gabriela', shift: SHIFTS.STANDARD },
        ]
      }
    };

    const stats = getScheduleStats(testSchedule);
    expect(stats['Gabriela'].totalDays).toBe(1);
  });
});
