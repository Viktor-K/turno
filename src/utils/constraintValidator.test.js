import { describe, it, expect } from 'vitest';
import {
  validateChange,
  getAvailableMembers,
  CONSTRAINT_TYPES
} from './constraintValidator';
import { SHIFTS, TEAM_MEMBERS } from './constants';
import { formatDate, addDays, getWeekStart } from './dateUtils';

describe('Constraint Validator', () => {
  // Helper to create a basic schedule for a week
  const createWeekSchedule = (weekStartDate, options = {}) => {
    const schedule = {};
    const weekStart = getWeekStart(weekStartDate);

    // Default: no special assignments
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dateKey = formatDate(day);
      const isWeekend = i >= 5;

      if (isWeekend) {
        schedule[dateKey] = {
          closure: false,
          shifts: options.weekendWorkers
            ? options.weekendWorkers.map(m => ({ member: m, shift: SHIFTS.WEEKEND }))
            : []
        };
      } else {
        schedule[dateKey] = {
          closure: false,
          shifts: options.weekdayShifts?.[i] || []
        };
      }
    }

    return schedule;
  };

  describe('Duplicate Assignment Constraint', () => {
    it('should detect when a person is already assigned to another shift on the same day', () => {
      const schedule = {
        '2025-01-06': {
          closure: false,
          shifts: [
            { member: 'Gabriela', shift: SHIFTS.EARLY }
          ]
        }
      };

      const violations = validateChange(schedule, '2025-01-06', 'Gabriela', 'standard');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.DUPLICATE_ASSIGNMENT)).toBe(true);
    });

    it('should not flag duplicate when moving to same shift type', () => {
      const schedule = {
        '2025-01-06': {
          closure: false,
          shifts: [
            { member: 'Gabriela', shift: SHIFTS.EARLY }
          ]
        }
      };

      const violations = validateChange(
        schedule,
        '2025-01-06',
        'Gabriela',
        'standard',
        { shift: { id: 'early' } } // Current assignment
      );

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.DUPLICATE_ASSIGNMENT)).toBe(false);
    });

    it('should allow assigning to an empty day', () => {
      const schedule = {
        '2025-01-06': {
          closure: false,
          shifts: []
        }
      };

      const violations = validateChange(schedule, '2025-01-06', 'Gabriela', 'early');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.DUPLICATE_ASSIGNMENT)).toBe(false);
    });
  });

  describe('Single Person Shift Constraints', () => {
    it('should detect when early shift already has someone assigned', () => {
      const schedule = {
        '2025-01-06': {
          closure: false,
          shifts: [
            { member: 'Fabio', shift: SHIFTS.EARLY }
          ]
        }
      };

      const violations = validateChange(schedule, '2025-01-06', 'Gabriela', 'early');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.SINGLE_EARLY_SHIFT)).toBe(true);
    });

    it('should detect when late shift already has someone assigned', () => {
      const schedule = {
        '2025-01-06': {
          closure: false,
          shifts: [
            { member: 'Fabio', shift: SHIFTS.LATE }
          ]
        }
      };

      const violations = validateChange(schedule, '2025-01-06', 'Gabriela', 'late');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.SINGLE_LATE_SHIFT)).toBe(true);
    });

    it('should allow early shift if no one is assigned', () => {
      const schedule = {
        '2025-01-06': {
          closure: false,
          shifts: [
            { member: 'Fabio', shift: SHIFTS.STANDARD }
          ]
        }
      };

      const violations = validateChange(schedule, '2025-01-06', 'Gabriela', 'early');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.SINGLE_EARLY_SHIFT)).toBe(false);
    });

    it('should allow late shift if no one is assigned', () => {
      const schedule = {
        '2025-01-06': {
          closure: false,
          shifts: [
            { member: 'Fabio', shift: SHIFTS.STANDARD }
          ]
        }
      };

      const violations = validateChange(schedule, '2025-01-06', 'Gabriela', 'late');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.SINGLE_LATE_SHIFT)).toBe(false);
    });

    it('should allow multiple people on standard shift', () => {
      const schedule = {
        '2025-01-06': {
          closure: false,
          shifts: [
            { member: 'Fabio', shift: SHIFTS.STANDARD },
            { member: 'Elisa', shift: SHIFTS.STANDARD }
          ]
        }
      };

      const violations = validateChange(schedule, '2025-01-06', 'Gabriela', 'standard');

      expect(violations.length).toBe(0);
    });
  });

  describe('Weekend Worker Thursday/Friday Constraint', () => {
    it('should detect when weekend worker tries to work on Thursday', () => {
      // Thursday is Jan 9, 2025; Saturday is Jan 11, 2025
      const weekStart = new Date('2025-01-06'); // Monday
      const schedule = createWeekSchedule(weekStart, {
        weekendWorkers: ['Gabriela', 'Fabio']
      });

      const thursday = '2025-01-09';
      const violations = validateChange(schedule, thursday, 'Gabriela', 'standard');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY)).toBe(true);
    });

    it('should detect when weekend worker tries to work on Friday', () => {
      const weekStart = new Date('2025-01-06');
      const schedule = createWeekSchedule(weekStart, {
        weekendWorkers: ['Gabriela', 'Fabio']
      });

      const friday = '2025-01-10';
      const violations = validateChange(schedule, friday, 'Gabriela', 'standard');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY)).toBe(true);
    });

    it('should allow non-weekend workers to work Thursday', () => {
      const weekStart = new Date('2025-01-06');
      const schedule = createWeekSchedule(weekStart, {
        weekendWorkers: ['Gabriela', 'Fabio']
      });

      const thursday = '2025-01-09';
      const violations = validateChange(schedule, thursday, 'Elisa', 'standard');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY)).toBe(false);
    });

    it('should allow non-weekend workers to work Friday', () => {
      const weekStart = new Date('2025-01-06');
      const schedule = createWeekSchedule(weekStart, {
        weekendWorkers: ['Gabriela', 'Fabio']
      });

      const friday = '2025-01-10';
      const violations = validateChange(schedule, friday, 'Elisa', 'standard');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY)).toBe(false);
    });

    it('should detect when assigning weekend to someone working Thursday', () => {
      const weekStart = new Date('2025-01-06');
      const schedule = createWeekSchedule(weekStart, {
        weekdayShifts: {
          3: [{ member: 'Elisa', shift: SHIFTS.STANDARD }] // Thursday
        }
      });

      const saturday = '2025-01-11';
      const violations = validateChange(schedule, saturday, 'Elisa', 'weekend');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY)).toBe(true);
    });

    it('should detect when assigning weekend to someone working Friday', () => {
      const weekStart = new Date('2025-01-06');
      const schedule = createWeekSchedule(weekStart, {
        weekdayShifts: {
          4: [{ member: 'Elisa', shift: SHIFTS.STANDARD }] // Friday
        }
      });

      const saturday = '2025-01-11';
      const violations = validateChange(schedule, saturday, 'Elisa', 'weekend');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY)).toBe(true);
    });
  });

  describe('Weekend Worker Special Shifts Constraint', () => {
    it('should detect when weekend worker tries to get early shift', () => {
      const weekStart = new Date('2025-01-06');
      const schedule = createWeekSchedule(weekStart, {
        weekendWorkers: ['Gabriela', 'Fabio']
      });

      const monday = '2025-01-06';
      const violations = validateChange(schedule, monday, 'Gabriela', 'early');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_SPECIAL_SHIFTS)).toBe(true);
    });

    it('should detect when weekend worker tries to get late shift', () => {
      const weekStart = new Date('2025-01-06');
      const schedule = createWeekSchedule(weekStart, {
        weekendWorkers: ['Gabriela', 'Fabio']
      });

      const tuesday = '2025-01-07';
      const violations = validateChange(schedule, tuesday, 'Fabio', 'late');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_SPECIAL_SHIFTS)).toBe(true);
    });

    it('should allow weekend worker to have standard shift', () => {
      const weekStart = new Date('2025-01-06');
      const schedule = createWeekSchedule(weekStart, {
        weekendWorkers: ['Gabriela', 'Fabio']
      });

      const monday = '2025-01-06';
      const violations = validateChange(schedule, monday, 'Gabriela', 'standard');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_SPECIAL_SHIFTS)).toBe(false);
    });

    it('should detect when assigning weekend to someone with early shift', () => {
      const weekStart = new Date('2025-01-06');
      const schedule = createWeekSchedule(weekStart, {
        weekdayShifts: {
          0: [{ member: 'Marina', shift: SHIFTS.EARLY }] // Monday
        }
      });

      const saturday = '2025-01-11';
      const violations = validateChange(schedule, saturday, 'Marina', 'weekend');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_SPECIAL_SHIFTS)).toBe(true);
    });

    it('should detect when assigning weekend to someone with late shift', () => {
      const weekStart = new Date('2025-01-06');
      const schedule = createWeekSchedule(weekStart, {
        weekdayShifts: {
          2: [{ member: 'Stefania', shift: SHIFTS.LATE }] // Wednesday
        }
      });

      const saturday = '2025-01-11';
      const violations = validateChange(schedule, saturday, 'Stefania', 'weekend');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_SPECIAL_SHIFTS)).toBe(true);
    });
  });

  describe('Fair Weekend Rotation Constraint', () => {
    it('should allow first weekend assignment for anyone', () => {
      const schedule = {
        '2025-01-11': { closure: false, shifts: [] },
        '2025-01-12': { closure: false, shifts: [] }
      };

      const violations = validateChange(schedule, '2025-01-11', 'Gabriela', 'weekend');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_FAIR_ROTATION)).toBe(false);
    });

    it('should detect when someone tries to work a second weekend before others have worked', () => {
      // Simulate Gabriela and Fabio worked weekend 1
      const schedule = {
        // Week 1 weekend
        '2025-01-11': {
          closure: false,
          shifts: [
            { member: 'Gabriela', shift: SHIFTS.WEEKEND },
            { member: 'Fabio', shift: SHIFTS.WEEKEND }
          ]
        },
        '2025-01-12': {
          closure: false,
          shifts: [
            { member: 'Gabriela', shift: SHIFTS.WEEKEND },
            { member: 'Fabio', shift: SHIFTS.WEEKEND }
          ]
        },
        // Week 2 weekend - trying to assign Gabriela again
        '2025-01-18': { closure: false, shifts: [] },
        '2025-01-19': { closure: false, shifts: [] }
      };

      const violations = validateChange(schedule, '2025-01-18', 'Gabriela', 'weekend');

      // Gabriela shouldn't work again - Elisa, Marina, Stefania, Virginia, Silvia, Usfar haven't worked yet
      // (Fabio is excluded as her partner)
      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_FAIR_ROTATION)).toBe(true);
    });

    it('should allow second weekend after all others (except partner) have worked', () => {
      // Build a schedule where everyone has worked at least one weekend
      const schedule = {};

      // Weekend 1: Gabriela + Fabio
      schedule['2025-01-11'] = {
        closure: false,
        shifts: [
          { member: 'Gabriela', shift: SHIFTS.WEEKEND },
          { member: 'Fabio', shift: SHIFTS.WEEKEND }
        ]
      };
      schedule['2025-01-12'] = {
        closure: false,
        shifts: [
          { member: 'Gabriela', shift: SHIFTS.WEEKEND },
          { member: 'Fabio', shift: SHIFTS.WEEKEND }
        ]
      };

      // Weekend 2: Elisa + Marina
      schedule['2025-01-18'] = {
        closure: false,
        shifts: [
          { member: 'Elisa', shift: SHIFTS.WEEKEND },
          { member: 'Marina', shift: SHIFTS.WEEKEND }
        ]
      };
      schedule['2025-01-19'] = {
        closure: false,
        shifts: [
          { member: 'Elisa', shift: SHIFTS.WEEKEND },
          { member: 'Marina', shift: SHIFTS.WEEKEND }
        ]
      };

      // Weekend 3: Stefania + Virginia
      schedule['2025-01-25'] = {
        closure: false,
        shifts: [
          { member: 'Stefania', shift: SHIFTS.WEEKEND },
          { member: 'Virginia', shift: SHIFTS.WEEKEND }
        ]
      };
      schedule['2025-01-26'] = {
        closure: false,
        shifts: [
          { member: 'Stefania', shift: SHIFTS.WEEKEND },
          { member: 'Virginia', shift: SHIFTS.WEEKEND }
        ]
      };

      // Weekend 4: Silvia + Usfar
      schedule['2025-02-01'] = {
        closure: false,
        shifts: [
          { member: 'Silvia', shift: SHIFTS.WEEKEND },
          { member: 'Usfar', shift: SHIFTS.WEEKEND }
        ]
      };
      schedule['2025-02-02'] = {
        closure: false,
        shifts: [
          { member: 'Silvia', shift: SHIFTS.WEEKEND },
          { member: 'Usfar', shift: SHIFTS.WEEKEND }
        ]
      };

      // Weekend 5: Try Gabriela again - should be allowed
      // All others except Fabio have worked: Elisa, Marina, Stefania, Virginia, Silvia, Usfar
      schedule['2025-02-08'] = { closure: false, shifts: [] };

      const violations = validateChange(schedule, '2025-02-08', 'Gabriela', 'weekend');

      expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_FAIR_ROTATION)).toBe(false);
    });

    it('should correctly identify which members still need to work weekends', () => {
      const schedule = {
        '2025-01-11': {
          closure: false,
          shifts: [
            { member: 'Gabriela', shift: SHIFTS.WEEKEND },
            { member: 'Fabio', shift: SHIFTS.WEEKEND }
          ]
        },
        '2025-01-12': {
          closure: false,
          shifts: [
            { member: 'Gabriela', shift: SHIFTS.WEEKEND },
            { member: 'Fabio', shift: SHIFTS.WEEKEND }
          ]
        },
        '2025-01-18': {
          closure: false,
          shifts: [
            { member: 'Elisa', shift: SHIFTS.WEEKEND },
            { member: 'Marina', shift: SHIFTS.WEEKEND }
          ]
        },
        '2025-01-19': {
          closure: false,
          shifts: [
            { member: 'Elisa', shift: SHIFTS.WEEKEND },
            { member: 'Marina', shift: SHIFTS.WEEKEND }
          ]
        },
        '2025-01-25': { closure: false, shifts: [] }
      };

      const violations = validateChange(schedule, '2025-01-25', 'Gabriela', 'weekend');
      const rotationViolation = violations.find(v => v.type === CONSTRAINT_TYPES.WEEKEND_FAIR_ROTATION);

      expect(rotationViolation).toBeDefined();
      // Message should mention the members who haven't worked yet
      // Stefania, Virginia, Silvia, Usfar haven't worked (Fabio is excluded as partner)
      const message = rotationViolation.message;
      // Check that message mentions at least some of the missing members
      const missingMembers = ['Stefania', 'Virginia', 'Silvia', 'Usfar'];
      const mentionedMembers = missingMembers.filter(m => message.includes(m));
      expect(mentionedMembers.length).toBeGreaterThan(0);
      // Fabio should be mentioned as the excluded partner, but not in the "needs to work" list
      expect(message).toContain('Fabio'); // Mentioned as partner
    });
  });
});

describe('Get Available Members', () => {
  const createWeekSchedule = (weekStartDate, options = {}) => {
    const schedule = {};
    const weekStart = getWeekStart(weekStartDate);

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dateKey = formatDate(day);
      const isWeekend = i >= 5;

      if (isWeekend) {
        schedule[dateKey] = {
          closure: false,
          shifts: options.weekendWorkers
            ? options.weekendWorkers.map(m => ({ member: m, shift: SHIFTS.WEEKEND }))
            : []
        };
      } else {
        schedule[dateKey] = {
          closure: false,
          shifts: options.weekdayShifts?.[i] || []
        };
      }
    }

    return schedule;
  };

  it('should exclude members already assigned today', () => {
    const schedule = {
      '2025-01-06': {
        closure: false,
        shifts: [
          { member: 'Gabriela', shift: SHIFTS.EARLY },
          { member: 'Fabio', shift: SHIFTS.STANDARD }
        ]
      }
    };

    const available = getAvailableMembers(schedule, '2025-01-06', 'late');

    expect(available).not.toContain('Gabriela');
    expect(available).not.toContain('Fabio');
    expect(available).toContain('Elisa');
    expect(available).toContain('Marina');
  });

  it('should exclude weekend workers from Thursday', () => {
    const weekStart = new Date('2025-01-06');
    const schedule = createWeekSchedule(weekStart, {
      weekendWorkers: ['Gabriela', 'Fabio']
    });

    const thursday = '2025-01-09';
    const available = getAvailableMembers(schedule, thursday, 'standard');

    expect(available).not.toContain('Gabriela');
    expect(available).not.toContain('Fabio');
  });

  it('should exclude weekend workers from Friday', () => {
    const weekStart = new Date('2025-01-06');
    const schedule = createWeekSchedule(weekStart, {
      weekendWorkers: ['Gabriela', 'Fabio']
    });

    const friday = '2025-01-10';
    const available = getAvailableMembers(schedule, friday, 'standard');

    expect(available).not.toContain('Gabriela');
    expect(available).not.toContain('Fabio');
  });

  it('should exclude weekend workers from early shift', () => {
    const weekStart = new Date('2025-01-06');
    const schedule = createWeekSchedule(weekStart, {
      weekendWorkers: ['Gabriela', 'Fabio']
    });

    const monday = '2025-01-06';
    const available = getAvailableMembers(schedule, monday, 'early');

    expect(available).not.toContain('Gabriela');
    expect(available).not.toContain('Fabio');
  });

  it('should exclude weekend workers from late shift', () => {
    const weekStart = new Date('2025-01-06');
    const schedule = createWeekSchedule(weekStart, {
      weekendWorkers: ['Gabriela', 'Fabio']
    });

    const tuesday = '2025-01-07';
    const available = getAvailableMembers(schedule, tuesday, 'late');

    expect(available).not.toContain('Gabriela');
    expect(available).not.toContain('Fabio');
  });

  it('should include weekend workers for standard shift on Mon-Wed', () => {
    const weekStart = new Date('2025-01-06');
    const schedule = createWeekSchedule(weekStart, {
      weekendWorkers: ['Gabriela', 'Fabio']
    });

    const wednesday = '2025-01-08';
    const available = getAvailableMembers(schedule, wednesday, 'standard');

    expect(available).toContain('Gabriela');
    expect(available).toContain('Fabio');
  });

  it('should exclude members who worked Thu/Fri from weekend shift', () => {
    const weekStart = new Date('2025-01-06');
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        3: [{ member: 'Marina', shift: SHIFTS.STANDARD }], // Thursday
        4: [{ member: 'Stefania', shift: SHIFTS.STANDARD }] // Friday
      }
    });

    const saturday = '2025-01-11';
    const available = getAvailableMembers(schedule, saturday, 'weekend');

    expect(available).not.toContain('Marina');
    expect(available).not.toContain('Stefania');
  });

  it('should exclude members with early/late shifts from weekend shift', () => {
    const weekStart = new Date('2025-01-06');
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Virginia', shift: SHIFTS.EARLY }], // Monday early
        2: [{ member: 'Silvia', shift: SHIFTS.LATE }] // Wednesday late
      }
    });

    const saturday = '2025-01-11';
    const available = getAvailableMembers(schedule, saturday, 'weekend');

    expect(available).not.toContain('Virginia');
    expect(available).not.toContain('Silvia');
  });

  it('should respect fair rotation rule for weekend availability', () => {
    // Gabriela + Fabio already worked a weekend
    const schedule = {
      '2025-01-11': {
        closure: false,
        shifts: [
          { member: 'Gabriela', shift: SHIFTS.WEEKEND },
          { member: 'Fabio', shift: SHIFTS.WEEKEND }
        ]
      },
      '2025-01-12': {
        closure: false,
        shifts: [
          { member: 'Gabriela', shift: SHIFTS.WEEKEND },
          { member: 'Fabio', shift: SHIFTS.WEEKEND }
        ]
      },
      '2025-01-18': { closure: false, shifts: [] }
    };

    const available = getAvailableMembers(schedule, '2025-01-18', 'weekend');

    // Gabriela and Fabio should not be available until others work
    expect(available).not.toContain('Gabriela');
    expect(available).not.toContain('Fabio');
    // Others should be available
    expect(available).toContain('Elisa');
    expect(available).toContain('Marina');
    expect(available).toContain('Stefania');
  });

  it('should respect excludeMembers parameter', () => {
    const schedule = {
      '2025-01-06': { closure: false, shifts: [] }
    };

    const available = getAvailableMembers(schedule, '2025-01-06', 'standard', ['Gabriela', 'Fabio']);

    expect(available).not.toContain('Gabriela');
    expect(available).not.toContain('Fabio');
    expect(available).toContain('Elisa');
  });
});

describe('Special Shifts Once Per Week Constraint', () => {
  const createWeekSchedule = (weekStartDate, options = {}) => {
    const schedule = {};
    const weekStart = getWeekStart(weekStartDate);

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dateKey = formatDate(day);
      const isWeekend = i >= 5;

      if (isWeekend) {
        schedule[dateKey] = {
          closure: false,
          shifts: options.weekendWorkers
            ? options.weekendWorkers.map(m => ({ member: m, shift: SHIFTS.WEEKEND }))
            : []
        };
      } else {
        schedule[dateKey] = {
          closure: false,
          shifts: options.weekdayShifts?.[i] || []
        };
      }
    }

    return schedule;
  };

  it('should detect when a person already has an early shift this week', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Gabriela', shift: SHIFTS.EARLY }] // Monday early
      }
    });

    // Try to assign Gabriela early shift on Wednesday
    const wednesday = '2025-01-08';
    const violations = validateChange(schedule, wednesday, 'Gabriela', 'early');

    expect(violations.some(v => v.type === CONSTRAINT_TYPES.EARLY_ONCE_PER_WEEK)).toBe(true);
  });

  it('should detect when a person already has a late shift this week', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        1: [{ member: 'Fabio', shift: SHIFTS.LATE }] // Tuesday late
      }
    });

    // Try to assign Fabio late shift on Thursday
    const thursday = '2025-01-09';
    const violations = validateChange(schedule, thursday, 'Fabio', 'late');

    expect(violations.some(v => v.type === CONSTRAINT_TYPES.LATE_ONCE_PER_WEEK)).toBe(true);
  });

  it('should allow a person to have both early AND late in the same week', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Elisa', shift: SHIFTS.EARLY }] // Monday early
      }
    });

    // Elisa should be allowed to get late shift on Wednesday
    const wednesday = '2025-01-08';
    const violations = validateChange(schedule, wednesday, 'Elisa', 'late');

    // Should not have LATE_ONCE_PER_WEEK violation (she hasn't had late yet)
    expect(violations.some(v => v.type === CONSTRAINT_TYPES.LATE_ONCE_PER_WEEK)).toBe(false);
    // Should not have EARLY_ONCE_PER_WEEK violation (this is a late shift, not early)
    expect(violations.some(v => v.type === CONSTRAINT_TYPES.EARLY_ONCE_PER_WEEK)).toBe(false);
  });

  it('should allow a person who had late to get early in the same week', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Marina', shift: SHIFTS.LATE }] // Monday late
      }
    });

    // Marina should be allowed to get early shift on Wednesday
    const wednesday = '2025-01-08';
    const violations = validateChange(schedule, wednesday, 'Marina', 'early');

    // Should not have any once-per-week violations
    expect(violations.some(v => v.type === CONSTRAINT_TYPES.EARLY_ONCE_PER_WEEK)).toBe(false);
    expect(violations.some(v => v.type === CONSTRAINT_TYPES.LATE_ONCE_PER_WEEK)).toBe(false);
  });

  it('should allow early shift if no early shift this week', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Stefania', shift: SHIFTS.STANDARD }] // Monday standard
      }
    });

    // Stefania should be allowed early shift on Tuesday
    const tuesday = '2025-01-07';
    const violations = validateChange(schedule, tuesday, 'Stefania', 'early');

    expect(violations.some(v => v.type === CONSTRAINT_TYPES.EARLY_ONCE_PER_WEEK)).toBe(false);
  });

  it('should allow late shift if no late shift this week', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Virginia', shift: SHIFTS.STANDARD }] // Monday standard
      }
    });

    // Virginia should be allowed late shift on Tuesday
    const tuesday = '2025-01-07';
    const violations = validateChange(schedule, tuesday, 'Virginia', 'late');

    expect(violations.some(v => v.type === CONSTRAINT_TYPES.LATE_ONCE_PER_WEEK)).toBe(false);
  });

  it('should exclude members with early shift this week from early availability', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Gabriela', shift: SHIFTS.EARLY }] // Monday early
      }
    });

    const wednesday = '2025-01-08';
    const available = getAvailableMembers(schedule, wednesday, 'early');

    // Gabriela should not be available for early (already has one this week)
    expect(available).not.toContain('Gabriela');
    // Others should be available
    expect(available).toContain('Fabio');
    expect(available).toContain('Elisa');
  });

  it('should exclude members with late shift this week from late availability', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        1: [{ member: 'Fabio', shift: SHIFTS.LATE }] // Tuesday late
      }
    });

    const thursday = '2025-01-09';
    const available = getAvailableMembers(schedule, thursday, 'late');

    // Fabio should not be available for late (already has one this week)
    expect(available).not.toContain('Fabio');
    // Others should be available
    expect(available).toContain('Gabriela');
    expect(available).toContain('Elisa');
  });

  it('should still allow member with early shift to be available for late', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Silvia', shift: SHIFTS.EARLY }] // Monday early
      }
    });

    const wednesday = '2025-01-08';
    const available = getAvailableMembers(schedule, wednesday, 'late');

    // Silvia should be available for late (only had early, not late)
    expect(available).toContain('Silvia');
  });

  it('should still allow member with late shift to be available for early', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        1: [{ member: 'Usfar', shift: SHIFTS.LATE }] // Tuesday late
      }
    });

    const wednesday = '2025-01-08';
    const available = getAvailableMembers(schedule, wednesday, 'early');

    // Usfar should be available for early (only had late, not early)
    expect(available).toContain('Usfar');
  });
});

describe('Early-Late Consecutive Constraint', () => {
  const createWeekSchedule = (weekStartDate, options = {}) => {
    const schedule = {};
    const weekStart = getWeekStart(weekStartDate);

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dateKey = formatDate(day);
      const isWeekend = i >= 5;

      if (isWeekend) {
        schedule[dateKey] = {
          closure: false,
          shifts: options.weekendWorkers
            ? options.weekendWorkers.map(m => ({ member: m, shift: SHIFTS.WEEKEND }))
            : []
        };
      } else {
        schedule[dateKey] = {
          closure: false,
          shifts: options.weekdayShifts?.[i] || []
        };
      }
    }

    return schedule;
  };

  it('should detect early shift on Friday for wrong person (not Monday late worker)', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Gabriela', shift: SHIFTS.LATE }] // Monday late
      }
    });

    // Try to assign early shift on Friday to someone else (not Gabriela)
    const friday = '2025-01-10';
    const violations = validateChange(schedule, friday, 'Fabio', 'early');

    expect(violations.some(v => v.type === CONSTRAINT_TYPES.FRIDAY_EARLY_REQUIRES_MONDAY_LATE)).toBe(true);
  });

  it('should allow early shift on Friday for Monday late worker', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Gabriela', shift: SHIFTS.LATE }] // Monday late
      }
    });

    // Assign early shift on Friday to Gabriela (she had late on Monday)
    const friday = '2025-01-10';
    const violations = validateChange(schedule, friday, 'Gabriela', 'early');

    expect(violations.some(v => v.type === CONSTRAINT_TYPES.FRIDAY_EARLY_REQUIRES_MONDAY_LATE)).toBe(false);
  });

  it('should allow early shift on Monday through Thursday', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {});

    // Check Monday, Tuesday, Wednesday, Thursday
    const days = ['2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09'];

    days.forEach(dateStr => {
      const violations = validateChange(schedule, dateStr, 'Gabriela', 'early');
      expect(violations.some(v => v.type === CONSTRAINT_TYPES.FRIDAY_EARLY_REQUIRES_MONDAY_LATE)).toBe(false);
    });
  });

  it('should detect late shift for wrong person on Wed-Fri when someone else had early yesterday', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        1: [{ member: 'Gabriela', shift: SHIFTS.EARLY }] // Tuesday early
      }
    });

    // Try to assign late shift to someone else on Wednesday
    const wednesday = '2025-01-08';
    const violations = validateChange(schedule, wednesday, 'Fabio', 'late');

    // Should warn that Gabriela (who had early) should have late
    expect(violations.some(v => v.type === CONSTRAINT_TYPES.LATE_REQUIRES_PREVIOUS_EARLY)).toBe(true);
  });

  it('should allow late shift for person who had early yesterday (Wed-Fri)', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        1: [{ member: 'Gabriela', shift: SHIFTS.EARLY }] // Tuesday early
      }
    });

    // Assign late shift to Gabriela on Wednesday (she had early yesterday)
    const wednesday = '2025-01-08';
    const violations = validateChange(schedule, wednesday, 'Gabriela', 'late');

    // Should NOT warn about consecutive rule
    expect(violations.some(v => v.type === CONSTRAINT_TYPES.LATE_REQUIRES_PREVIOUS_EARLY)).toBe(false);
  });

  it('should allow late shift on Tuesday without consecutive check (Monday has late not early)', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        // Monday has late (not early), so Tuesday late has no consecutive restriction
        0: [{ member: 'Gabriela', shift: SHIFTS.LATE }]
      }
    });

    // Assign late shift to anyone on Tuesday
    const tuesday = '2025-01-07';
    const violations = validateChange(schedule, tuesday, 'Fabio', 'late');

    // Should NOT warn about consecutive rule (Tuesday doesn't check for Monday early)
    expect(violations.some(v => v.type === CONSTRAINT_TYPES.LATE_REQUIRES_PREVIOUS_EARLY)).toBe(false);
  });

  it('should exclude all members except yesterday early worker from late availability (Wed-Fri)', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        1: [{ member: 'Marina', shift: SHIFTS.EARLY }] // Tuesday early
      }
    });

    const wednesday = '2025-01-08';
    const available = getAvailableMembers(schedule, wednesday, 'late');

    // Only Marina should be available for late (she had early yesterday)
    expect(available).toContain('Marina');
    expect(available).toHaveLength(1);
  });

  it('should allow any member for late on Tuesday (no consecutive rule from Monday)', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Gabriela', shift: SHIFTS.LATE }] // Monday late (not early)
      }
    });

    const tuesday = '2025-01-07';
    const available = getAvailableMembers(schedule, tuesday, 'late');

    // Multiple members should be available (no consecutive restriction from Monday)
    expect(available.length).toBeGreaterThan(1);
  });

  it('should only allow Monday late worker for early on Friday', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Marina', shift: SHIFTS.LATE }] // Monday late
      }
    });

    const friday = '2025-01-10';
    const available = getAvailableMembers(schedule, friday, 'early');

    // Only Marina should be available for early on Friday
    expect(available).toContain('Marina');
    expect(available).toHaveLength(1);
  });

  it('should allow anyone for early on Friday if no one had late on Monday', () => {
    const weekStart = new Date('2025-01-06'); // Monday
    const schedule = createWeekSchedule(weekStart, {
      weekdayShifts: {
        0: [{ member: 'Gabriela', shift: SHIFTS.STANDARD }] // Monday standard (no late)
      }
    });

    const friday = '2025-01-10';
    const available = getAvailableMembers(schedule, friday, 'early');

    // Multiple members should be available
    expect(available.length).toBeGreaterThan(1);
  });
});

describe('Edge Cases', () => {
  it('should handle empty schedule', () => {
    const schedule = {};
    const violations = validateChange(schedule, '2025-01-06', 'Gabriela', 'early');

    expect(violations.length).toBe(0);
  });

  it('should handle undefined day schedule', () => {
    const schedule = {
      '2025-01-07': { closure: false, shifts: [] }
    };

    const violations = validateChange(schedule, '2025-01-06', 'Gabriela', 'early');

    expect(violations.length).toBe(0);
  });

  it('should handle schedule with only closures', () => {
    const schedule = {
      '2025-01-06': { closure: true, shifts: [] },
      '2025-01-07': { closure: true, shifts: [] }
    };

    const violations = validateChange(schedule, '2025-01-08', 'Gabriela', 'early');

    expect(violations.length).toBe(0);
  });

  it('should handle multiple violations at once', () => {
    const weekStart = new Date('2025-01-06');
    const schedule = {
      '2025-01-06': { closure: false, shifts: [] },
      '2025-01-07': { closure: false, shifts: [] },
      '2025-01-08': { closure: false, shifts: [] },
      '2025-01-09': {
        closure: false,
        shifts: [{ member: 'Fabio', shift: SHIFTS.EARLY }]
      },
      '2025-01-10': { closure: false, shifts: [] },
      '2025-01-11': {
        closure: false,
        shifts: [
          { member: 'Gabriela', shift: SHIFTS.WEEKEND },
          { member: 'Marina', shift: SHIFTS.WEEKEND }
        ]
      },
      '2025-01-12': {
        closure: false,
        shifts: [
          { member: 'Gabriela', shift: SHIFTS.WEEKEND },
          { member: 'Marina', shift: SHIFTS.WEEKEND }
        ]
      }
    };

    // Try to assign Gabriela to early shift on Thursday
    // This should trigger:
    // 1. WEEKEND_THURSDAY_FRIDAY (she's a weekend worker)
    // 2. WEEKEND_SPECIAL_SHIFTS (early is a special shift)
    // 3. SINGLE_EARLY_SHIFT (Fabio already has early)
    const violations = validateChange(schedule, '2025-01-09', 'Gabriela', 'early');

    expect(violations.length).toBeGreaterThanOrEqual(2);
    expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_THURSDAY_FRIDAY)).toBe(true);
    expect(violations.some(v => v.type === CONSTRAINT_TYPES.WEEKEND_SPECIAL_SHIFTS)).toBe(true);
    expect(violations.some(v => v.type === CONSTRAINT_TYPES.SINGLE_EARLY_SHIFT)).toBe(true);
  });
});
