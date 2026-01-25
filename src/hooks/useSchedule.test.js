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

      // Add a closure
      act(() => {
        result.current.addClosure('2026-06-15');
      });

      // Generate schedule
      act(() => {
        result.current.generateSchedule();
      });

      // The closure date should be marked as closure with no shifts
      const closureDay = result.current.schedule['2026-06-15'];
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

    it('should set isLoading during generation', async () => {
      const { result } = renderHook(() => useSchedule(2026));

      // Can't easily test the loading state transition,
      // but we can verify it ends up as false
      act(() => {
        result.current.generateSchedule();
      });

      expect(result.current.isLoading).toBe(false);
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
});
