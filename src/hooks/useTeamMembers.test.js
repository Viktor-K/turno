import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTeamMembers, COLOR_OPTIONS } from './useTeamMembers';

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

// Mock fetch for API calls
global.fetch = vi.fn(() =>
  Promise.reject(new Error('API not available'))
);

describe('useTeamMembers Hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should load default team members on initialization', () => {
      const { result } = renderHook(() => useTeamMembers());

      expect(result.current.teamMembers.length).toBeGreaterThan(0);
      expect(result.current.teamMembers[0]).toHaveProperty('id');
      expect(result.current.teamMembers[0]).toHaveProperty('firstName');
      expect(result.current.teamMembers[0]).toHaveProperty('color');
    });

    it('should have 8 default team members', () => {
      const { result } = renderHook(() => useTeamMembers());

      expect(result.current.teamMembers.length).toBe(8);
    });

    it('should load from localStorage if available', () => {
      const savedMembers = [
        { id: 'test-1', firstName: 'TestUser', lastName: '', email: '', color: 'bg-blue-100 text-blue-700 border-blue-200' }
      ];
      localStorageMock.setItem('turno_team_members', JSON.stringify(savedMembers));

      const { result } = renderHook(() => useTeamMembers());

      expect(result.current.teamMembers.length).toBe(1);
      expect(result.current.teamMembers[0].firstName).toBe('TestUser');
    });
  });

  describe('Add Member', () => {
    it('should add a new team member', async () => {
      const { result } = renderHook(() => useTeamMembers());

      const initialCount = result.current.teamMembers.length;

      await act(async () => {
        await result.current.addMember({ firstName: 'NewMember' });
      });

      expect(result.current.teamMembers.length).toBe(initialCount + 1);
      expect(result.current.teamMembers.some(m => m.firstName === 'NewMember')).toBe(true);
    });

    it('should generate a unique ID for new member', async () => {
      const { result } = renderHook(() => useTeamMembers());

      let newMember;
      await act(async () => {
        newMember = await result.current.addMember({ firstName: 'UniqueTest' });
      });

      expect(newMember.id).toBeDefined();
      expect(newMember.id).toContain('uniquetest');
    });

    it('should assign default color to new member', async () => {
      const { result } = renderHook(() => useTeamMembers());

      let newMember;
      await act(async () => {
        newMember = await result.current.addMember({ firstName: 'ColorTest' });
      });

      expect(newMember.color).toBeDefined();
      expect(newMember.color).toContain('bg-');
    });

    it('should save to localStorage after adding member', async () => {
      const { result } = renderHook(() => useTeamMembers());

      await act(async () => {
        await result.current.addMember({ firstName: 'SaveTest' });
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'turno_team_members',
        expect.any(String)
      );
    });

    it('should allow custom color for new member', async () => {
      const { result } = renderHook(() => useTeamMembers());

      const customColor = 'bg-red-100 text-red-700 border-red-200';
      let newMember;
      await act(async () => {
        newMember = await result.current.addMember({
          firstName: 'CustomColor',
          color: customColor
        });
      });

      expect(newMember.color).toBe(customColor);
    });
  });

  describe('Delete Member', () => {
    it('should delete a team member by ID', async () => {
      const { result } = renderHook(() => useTeamMembers());

      const initialCount = result.current.teamMembers.length;
      const memberToDelete = result.current.teamMembers[0];

      await act(async () => {
        await result.current.deleteMember(memberToDelete.id);
      });

      expect(result.current.teamMembers.length).toBe(initialCount - 1);
      expect(result.current.teamMembers.find(m => m.id === memberToDelete.id)).toBeUndefined();
    });

    it('should save to localStorage after deleting member', async () => {
      const { result } = renderHook(() => useTeamMembers());

      const memberToDelete = result.current.teamMembers[0];

      await act(async () => {
        await result.current.deleteMember(memberToDelete.id);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'turno_team_members',
        expect.any(String)
      );
    });

    it('should not throw error when deleting non-existent member', async () => {
      const { result } = renderHook(() => useTeamMembers());

      await expect(async () => {
        await act(async () => {
          await result.current.deleteMember('non-existent-id');
        });
      }).not.toThrow();
    });
  });

  describe('Update Member', () => {
    it('should update team member properties', async () => {
      const { result } = renderHook(() => useTeamMembers());

      const memberToUpdate = result.current.teamMembers[0];

      await act(async () => {
        await result.current.updateMember(memberToUpdate.id, {
          firstName: 'UpdatedName',
          email: 'test@example.com'
        });
      });

      const updatedMember = result.current.teamMembers.find(m => m.id === memberToUpdate.id);
      expect(updatedMember.firstName).toBe('UpdatedName');
      expect(updatedMember.email).toBe('test@example.com');
    });

    it('should preserve unchanged properties when updating', async () => {
      const { result } = renderHook(() => useTeamMembers());

      const memberToUpdate = result.current.teamMembers[0];
      const originalColor = memberToUpdate.color;

      await act(async () => {
        await result.current.updateMember(memberToUpdate.id, {
          firstName: 'NewName'
        });
      });

      const updatedMember = result.current.teamMembers.find(m => m.id === memberToUpdate.id);
      expect(updatedMember.color).toBe(originalColor);
    });
  });

  describe('Get Member Functions', () => {
    it('should get member by name', () => {
      const { result } = renderHook(() => useTeamMembers());

      const member = result.current.getMemberByName('Gabriela');
      expect(member).toBeDefined();
      expect(member.firstName).toBe('Gabriela');
    });

    it('should return undefined for non-existent name', () => {
      const { result } = renderHook(() => useTeamMembers());

      const member = result.current.getMemberByName('NonExistent');
      expect(member).toBeUndefined();
    });

    it('should get member color by name', () => {
      const { result } = renderHook(() => useTeamMembers());

      const color = result.current.getMemberColor('Gabriela');
      expect(color).toBeDefined();
      expect(color).toContain('bg-');
    });

    it('should return default color for non-existent member', () => {
      const { result } = renderHook(() => useTeamMembers());

      const color = result.current.getMemberColor('NonExistent');
      expect(color).toBe('bg-gray-100 text-gray-700 border-gray-200');
    });
  });

  describe('Color Options', () => {
    it('should export color options for picker', () => {
      expect(COLOR_OPTIONS).toBeDefined();
      expect(Array.isArray(COLOR_OPTIONS)).toBe(true);
      expect(COLOR_OPTIONS.length).toBeGreaterThan(0);
    });

    it('should have required properties for each color option', () => {
      COLOR_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('id');
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('classes');
        expect(option).toHaveProperty('preview');
      });
    });
  });

  describe('Reset to Defaults', () => {
    it('should reset team members to default list', async () => {
      const { result } = renderHook(() => useTeamMembers());

      // Add a new member
      await act(async () => {
        await result.current.addMember({ firstName: 'Extra' });
      });

      const countAfterAdd = result.current.teamMembers.length;
      expect(countAfterAdd).toBeGreaterThan(8);

      // Reset to defaults
      await act(async () => {
        await result.current.resetToDefaults();
      });

      expect(result.current.teamMembers.length).toBe(8);
    });
  });
});
