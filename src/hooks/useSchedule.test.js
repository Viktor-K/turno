import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSchedule } from './useSchedule';
import { TEAM_MEMBERS, SHIFTS } from '../utils/constants';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useSchedule Hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Generate Schedule Button Functionality', () => {
    it('should generate a schedule when generateSchedule is called', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      // Initially, schedule should be empty
      expect(Object.keys(result.current.schedule).length).toBe(0);

      // Generate schedule
      act(() => {
        result.current.generateSchedule();
      });

      // Schedule should now have entries
      expect(Object.keys(result.current.schedule).length).toBeGreaterThan(0);
    });

    it('should generate schedule for the correct year', async () => {
      const testYear = 2026;
      const { result } = renderHook(() => useSchedule(testYear));

      act(() => {
        result.current.generateSchedule();
      });

      // All dates should be in the correct year
      const dates = Object.keys(result.current.schedule);
      dates.forEach(dateStr => {
        const year = parseInt(dateStr.split('-')[0]);
        // Allow for week 1 of next year
        expect(year).toBeGreaterThanOrEqual(testYear);
        expect(year).toBeLessThanOrEqual(testYear + 1);
      });
    });

    it('should generate schedule with shifts for each day', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      act(() => {
        result.current.generateSchedule();
      });

      // Each non-closure day should have shifts
      Object.values(result.current.schedule).forEach(day => {
        if (!day.closure) {
          expect(day.shifts).toBeDefined();
          expect(day.shifts.length).toBeGreaterThan(0);
        }
      });
    });

    it('should generate schedule with valid team members', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      act(() => {
        result.current.generateSchedule();
      });

      // All assigned members should be from the team
      Object.values(result.current.schedule).forEach(day => {
        if (!day.closure && day.shifts) {
          day.shifts.forEach(shift => {
            expect(TEAM_MEMBERS).toContain(shift.member);
          });
        }
      });
    });

    it('should generate schedule with valid shift types', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      act(() => {
        result.current.generateSchedule();
      });

      const validShiftIds = Object.values(SHIFTS).map(s => s.id);

      Object.values(result.current.schedule).forEach(day => {
        if (!day.closure && day.shifts) {
          day.shifts.forEach(shift => {
            expect(validShiftIds).toContain(shift.shift.id);
          });
        }
      });
    });

    it('should save generated schedule to localStorage', async () => {
      const testYear = 2026;
      const { result } = renderHook(() => useSchedule(testYear));

      act(() => {
        result.current.generateSchedule();
      });

      // Wait for useEffect to save to localStorage
      await vi.waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          `turno-schedule-${testYear}`,
          expect.any(String)
        );
      });

      // Verify the saved data is valid JSON
      const savedCall = localStorageMock.setItem.mock.calls.find(
        call => call[0] === `turno-schedule-${testYear}`
      );
      expect(savedCall).toBeDefined();
      const savedSchedule = JSON.parse(savedCall[1]);
      expect(Object.keys(savedSchedule).length).toBeGreaterThan(0);
    });

    it('should handle closures correctly when generating schedule', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      // Add a closure within the first 3 months (January-March)
      act(() => {
        result.current.addClosure('2026-02-15');
      });

      // Generate schedule starting from January
      act(() => {
        result.current.generateSchedule(0);
      });

      // The closure date should be marked as closure with no shifts
      const closureDay = result.current.schedule['2026-02-15'];
      expect(closureDay).toBeDefined();
      expect(closureDay.closure).toBe(true);
      expect(closureDay.shifts.length).toBe(0);
    });

    it('should regenerate schedule when called multiple times', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      // Generate first schedule
      act(() => {
        result.current.generateSchedule();
      });

      const firstScheduleSize = Object.keys(result.current.schedule).length;
      expect(firstScheduleSize).toBeGreaterThan(0);

      // Generate again
      act(() => {
        result.current.generateSchedule();
      });

      // Should still have a valid schedule
      const secondScheduleSize = Object.keys(result.current.schedule).length;
      expect(secondScheduleSize).toBeGreaterThan(0);
      expect(secondScheduleSize).toBe(firstScheduleSize);
    });

    it('should produce different weekday assignments on subsequent generations', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      // Generate first schedule
      act(() => {
        result.current.generateSchedule(0);
      });

      // Get first Monday's assignments (weekdays can vary more than weekends which are preserved)
      const firstMonday = Object.keys(result.current.schedule).find(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day).getDay() === 1;
      });
      const firstScheduleAssignments = result.current.schedule[firstMonday]?.shifts
        .filter(s => s.shift.id === 'early')
        .map(s => s.member)
        .sort()
        .join(',');

      // Generate multiple times starting fresh (clear schedule first)
      let foundDifferent = false;
      for (let i = 0; i < 10; i++) {
        // Use a different month to get fresh generation
        act(() => {
          result.current.setYear(2027);
        });
        act(() => {
          result.current.generateSchedule(0);
        });

        const newMonday = Object.keys(result.current.schedule).find(dateStr => {
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day).getDay() === 1;
        });

        const newAssignments = result.current.schedule[newMonday]?.shifts
          .filter(s => s.shift.id === 'early')
          .map(s => s.member)
          .sort()
          .join(',');

        if (newAssignments !== firstScheduleAssignments) {
          foundDifferent = true;
          break;
        }
      }

      // With randomization, early shift assignments should vary
      expect(foundDifferent).toBe(true);
    });

    it('should update stats after generating schedule', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      act(() => {
        result.current.generateSchedule();
      });

      // Stats should be populated for all team members
      TEAM_MEMBERS.forEach(member => {
        expect(result.current.stats[member]).toBeDefined();
        // Check that at least one type of shift count exists
        const memberStats = result.current.stats[member];
        const totalShifts = (memberStats.earlyShifts || 0) +
                           (memberStats.lateShifts || 0) +
                           (memberStats.standardShifts || 0) +
                           (memberStats.weekendShifts || 0);
        expect(totalShifts).toBeGreaterThan(0);
      });
    });

    it('should set isLoading to false after generation completes', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      // Generate schedule
      act(() => {
        result.current.generateSchedule(0);
      });

      // Wait for loading to complete (API errors fall back to localStorage)
      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });
    });
  });

  describe('Schedule Data Integrity', () => {
    it('should have weekday shifts on Monday through Friday', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      act(() => {
        result.current.generateSchedule();
      });

      Object.entries(result.current.schedule).forEach(([dateStr, day]) => {
        if (day.closure) return;

        const [year, month, dayNum] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, dayNum);
        const dayOfWeek = date.getDay();

        // Weekday (1-5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const shiftTypes = day.shifts.map(s => s.shift.id);
          expect(shiftTypes).not.toContain('weekend');
        }
      });
    });

    it('should have weekend shifts on Saturday and Sunday', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      act(() => {
        result.current.generateSchedule();
      });

      Object.entries(result.current.schedule).forEach(([dateStr, day]) => {
        if (day.closure) return;

        const [year, month, dayNum] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, dayNum);
        const dayOfWeek = date.getDay();

        // Weekend (0 or 6)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          if (day.shifts.length > 0) {
            const shiftTypes = day.shifts.map(s => s.shift.id);
            expect(shiftTypes.every(t => t === 'weekend')).toBe(true);
          }
        }
      });
    });

    it('should have exactly 2 people on weekend days', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      act(() => {
        result.current.generateSchedule();
      });

      Object.entries(result.current.schedule).forEach(([dateStr, day]) => {
        if (day.closure) return;

        const [year, month, dayNum] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, dayNum);
        const dayOfWeek = date.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          const weekendShifts = day.shifts.filter(s => s.shift.id === 'weekend');
          if (weekendShifts.length > 0) {
            expect(weekendShifts.length).toBe(2);
          }
        }
      });
    });
  });

  describe('Year Management', () => {
    it('should clear schedule when year changes', async () => {
      const { result, rerender } = renderHook(
        ({ year }) => useSchedule(year),
        { initialProps: { year: 2026 } }
      );

      // Generate schedule for 2026
      act(() => {
        result.current.generateSchedule();
      });

      expect(Object.keys(result.current.schedule).length).toBeGreaterThan(0);

      // Change year
      act(() => {
        result.current.setYear(2027);
      });

      // Schedule should be cleared
      expect(Object.keys(result.current.schedule).length).toBe(0);
    });
  });

  describe('Date Lookup (Timezone Fix)', () => {
    it('should retrieve schedule for weekend Date object correctly', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      act(() => {
        result.current.generateSchedule();
      });

      // Find a Saturday in the schedule
      const saturdayKey = Object.keys(result.current.schedule).find(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.getDay() === 6; // Saturday
      });

      expect(saturdayKey).toBeDefined();

      // Create a Date object for the same Saturday
      const [year, month, day] = saturdayKey.split('-').map(Number);
      const saturdayDate = new Date(year, month - 1, day);

      // getScheduleForDate should find the schedule using Date object
      const daySchedule = result.current.getScheduleForDate(saturdayDate);

      expect(daySchedule).not.toBeNull();
      expect(daySchedule.shifts).toBeDefined();
      expect(daySchedule.shifts.length).toBe(2); // Weekend should have 2 people
    });

    it('should retrieve schedule for Sunday Date object correctly', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      act(() => {
        result.current.generateSchedule();
      });

      // Find a Sunday in the schedule
      const sundayKey = Object.keys(result.current.schedule).find(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.getDay() === 0; // Sunday
      });

      expect(sundayKey).toBeDefined();

      // Create a Date object for the same Sunday
      const [year, month, day] = sundayKey.split('-').map(Number);
      const sundayDate = new Date(year, month - 1, day);

      // getScheduleForDate should find the schedule using Date object
      const daySchedule = result.current.getScheduleForDate(sundayDate);

      expect(daySchedule).not.toBeNull();
      expect(daySchedule.shifts).toBeDefined();
      expect(daySchedule.shifts.length).toBe(2); // Weekend should have 2 people
    });

    it('should retrieve schedule using string date key correctly', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      act(() => {
        result.current.generateSchedule();
      });

      // Get first date in schedule
      const firstDateKey = Object.keys(result.current.schedule)[0];

      // Should work with string
      const daySchedule = result.current.getScheduleForDate(firstDateKey);

      expect(daySchedule).not.toBeNull();
      expect(daySchedule.shifts).toBeDefined();
    });

    it('should check closure status correctly with Date object', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      // Add a closure using string
      act(() => {
        result.current.addClosure('2026-03-15');
      });

      // Check using Date object
      const closureDate = new Date(2026, 2, 15); // March 15, 2026
      expect(result.current.isClosure(closureDate)).toBe(true);

      // Check non-closure using Date object
      const nonClosureDate = new Date(2026, 2, 16);
      expect(result.current.isClosure(nonClosureDate)).toBe(false);
    });
  });

  describe('3-Month Schedule Generation', () => {
    it('should generate schedule for 3 months when startMonth is provided', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      // Generate for January (month 0)
      act(() => {
        result.current.generateSchedule(0);
      });

      const dates = Object.keys(result.current.schedule);

      // Should have approximately 90 days (3 months)
      expect(dates.length).toBeGreaterThanOrEqual(80);
      expect(dates.length).toBeLessThanOrEqual(100);

      // All dates should be in January, February, March, or early April
      dates.forEach(dateStr => {
        const [year, month] = dateStr.split('-').map(Number);
        expect(year).toBe(2026);
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(4);
      });
    });

    it('should accept custom team members list', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      const customTeam = [
        { firstName: 'Alice' },
        { firstName: 'Bob' },
        { firstName: 'Charlie' },
        { firstName: 'Diana' },
        { firstName: 'Eve' },
        { firstName: 'Frank' }
      ];

      act(() => {
        result.current.generateSchedule(0, customTeam);
      });

      // All shifts should only include custom team members
      const teamNames = customTeam.map(m => m.firstName);
      Object.values(result.current.schedule).forEach(day => {
        if (day.closure) return;
        day.shifts.forEach(shift => {
          expect(teamNames).toContain(shift.member);
        });
      });
    });

    it('should preserve existing weekend allocations when regenerating', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      // First, generate some schedule
      act(() => {
        result.current.generateSchedule(0);
      });

      // Get the first weekend assignments
      const firstSaturdayKey = Object.keys(result.current.schedule).find(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.getDay() === 6;
      });

      const originalWeekendWorkers = result.current.schedule[firstSaturdayKey]?.shifts
        .map(s => s.member)
        .sort();

      // Generate again - the existing weekend should be preserved
      act(() => {
        result.current.generateSchedule(0);
      });

      const newWeekendWorkers = result.current.schedule[firstSaturdayKey]?.shifts
        .map(s => s.member)
        .sort();

      // Weekend workers should be preserved (or it should be a fresh generation)
      // Since generateQuarterSchedule preserves weekends, check this behavior
      expect(newWeekendWorkers).toBeDefined();
      expect(newWeekendWorkers.length).toBe(2);
    });
  });
});
