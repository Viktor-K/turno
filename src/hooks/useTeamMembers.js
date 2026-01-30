import { useState, useEffect, useCallback } from 'react';
import { teamMembersApi } from '../services/api';

// Default team member data
const DEFAULT_TEAM_MEMBERS = [
  { id: 'gabriela', firstName: 'Gabriela', lastName: '', email: '', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 'usfar', firstName: 'Usfar', lastName: '', email: '', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'fabio', firstName: 'Fabio', lastName: '', email: '', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'elisa', firstName: 'Elisa', lastName: '', email: '', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'marina', firstName: 'Marina', lastName: '', email: '', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { id: 'stefania', firstName: 'Stefania', lastName: '', email: '', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { id: 'virginia', firstName: 'Virginia', lastName: '', email: '', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'silvia', firstName: 'Silvia', lastName: '', email: '', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' }
];

// Available color options for the color picker
export const COLOR_OPTIONS = [
  { id: 'pink', label: 'Rosa', classes: 'bg-pink-100 text-pink-700 border-pink-200', preview: 'bg-pink-400' },
  { id: 'sky', label: 'Azzurro', classes: 'bg-sky-100 text-sky-700 border-sky-200', preview: 'bg-sky-400' },
  { id: 'emerald', label: 'Verde', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200', preview: 'bg-emerald-400' },
  { id: 'amber', label: 'Ambra', classes: 'bg-amber-100 text-amber-700 border-amber-200', preview: 'bg-amber-400' },
  { id: 'violet', label: 'Viola', classes: 'bg-violet-100 text-violet-700 border-violet-200', preview: 'bg-violet-400' },
  { id: 'rose', label: 'Rosato', classes: 'bg-rose-100 text-rose-700 border-rose-200', preview: 'bg-rose-400' },
  { id: 'indigo', label: 'Indaco', classes: 'bg-indigo-100 text-indigo-700 border-indigo-200', preview: 'bg-indigo-400' },
  { id: 'cyan', label: 'Ciano', classes: 'bg-cyan-100 text-cyan-700 border-cyan-200', preview: 'bg-cyan-400' },
  { id: 'red', label: 'Rosso', classes: 'bg-red-100 text-red-700 border-red-200', preview: 'bg-red-400' },
  { id: 'orange', label: 'Arancione', classes: 'bg-orange-100 text-orange-700 border-orange-200', preview: 'bg-orange-400' },
  { id: 'yellow', label: 'Giallo', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200', preview: 'bg-yellow-400' },
  { id: 'lime', label: 'Lime', classes: 'bg-lime-100 text-lime-700 border-lime-200', preview: 'bg-lime-400' },
  { id: 'teal', label: 'Teal', classes: 'bg-teal-100 text-teal-700 border-teal-200', preview: 'bg-teal-400' },
  { id: 'blue', label: 'Blu', classes: 'bg-blue-100 text-blue-700 border-blue-200', preview: 'bg-blue-400' },
  { id: 'purple', label: 'Porpora', classes: 'bg-purple-100 text-purple-700 border-purple-200', preview: 'bg-purple-400' },
  { id: 'fuchsia', label: 'Fucsia', classes: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', preview: 'bg-fuchsia-400' },
  { id: 'slate', label: 'Ardesia', classes: 'bg-slate-100 text-slate-700 border-slate-200', preview: 'bg-slate-400' },
  { id: 'gray', label: 'Grigio', classes: 'bg-gray-100 text-gray-700 border-gray-200', preview: 'bg-gray-400' },
];

const STORAGE_KEY = 'turno_team_members';

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return DEFAULT_TEAM_MEMBERS;
      }
    }
    return DEFAULT_TEAM_MEMBERS;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [useApi, setUseApi] = useState(true);

  // Load from API on mount
  useEffect(() => {
    const loadFromApi = async () => {
      if (!useApi) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await teamMembersApi.getAll();
        if (response.teamMembers && response.teamMembers.length > 0) {
          setTeamMembers(response.teamMembers);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(response.teamMembers));
        }
      } catch (err) {
        console.warn('API unavailable for team members, using localStorage:', err);
        setUseApi(false);
      }

      setIsLoading(false);
    };

    loadFromApi();
  }, [useApi]);

  // Save to localStorage when teamMembers changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teamMembers));
  }, [teamMembers]);

  // Update a team member
  const updateMember = useCallback(async (memberId, updates) => {
    // Update local state first (optimistic update)
    setTeamMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? { ...member, ...updates }
          : member
      )
    );

    // Save to API if available
    if (useApi) {
      try {
        await teamMembersApi.update(memberId, updates);
      } catch (err) {
        console.warn('Failed to update team member in API:', err);
      }
    }
  }, [useApi]);

  // Add a new team member
  const addMember = useCallback(async (memberData) => {
    // Generate a unique ID from the first name
    const id = memberData.firstName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    const newMember = {
      id,
      firstName: memberData.firstName,
      lastName: memberData.lastName || '',
      email: memberData.email || '',
      color: memberData.color || 'bg-gray-100 text-gray-700 border-gray-200'
    };

    // Update local state
    setTeamMembers(prev => [...prev, newMember]);

    // Save to API if available
    if (useApi) {
      try {
        await teamMembersApi.create(newMember);
      } catch (err) {
        console.warn('Failed to add team member in API:', err);
      }
    }

    return newMember;
  }, [useApi]);

  // Delete a team member
  const deleteMember = useCallback(async (memberId) => {
    // Update local state first (optimistic update)
    setTeamMembers(prev => prev.filter(member => member.id !== memberId));

    // Delete from API if available
    if (useApi) {
      try {
        await teamMembersApi.delete(memberId);
      } catch (err) {
        console.warn('Failed to delete team member from API:', err);
      }
    }
  }, [useApi]);

  // Get member by name (for backward compatibility with schedule data)
  const getMemberByName = useCallback((name) => {
    return teamMembers.find(m => m.firstName === name);
  }, [teamMembers]);

  // Get color classes for a member by name
  const getMemberColor = useCallback((name) => {
    const member = getMemberByName(name);
    return member?.color || 'bg-gray-100 text-gray-700 border-gray-200';
  }, [getMemberByName]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    setTeamMembers(DEFAULT_TEAM_MEMBERS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEAM_MEMBERS));

    // Note: API reset would require deleting and recreating all members
    // For simplicity, we just update each member to default values
    if (useApi) {
      try {
        for (const member of DEFAULT_TEAM_MEMBERS) {
          await teamMembersApi.update(member.id, {
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            color: member.color
          });
        }
      } catch (err) {
        console.warn('Failed to reset team members in API:', err);
      }
    }
  }, [useApi]);

  return {
    teamMembers,
    isLoading,
    updateMember,
    addMember,
    deleteMember,
    getMemberByName,
    getMemberColor,
    resetToDefaults
  };
};

export default useTeamMembers;
