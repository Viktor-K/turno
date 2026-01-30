import { useState, useCallback, useEffect } from 'react';
import { generateYearSchedule, generateQuarterSchedule, getScheduleStats } from '../utils/shiftGenerator';
import { formatDate } from '../utils/dateUtils';
import { scheduleApi, closuresApi } from '../services/api';

const STORAGE_KEY = 'turno-schedule';
const CLOSURES_KEY = 'turno-closures';

export const useSchedule = (initialYear = new Date().getFullYear()) => {
  const [year, setYear] = useState(initialYear);
  const [schedule, setSchedule] = useState({});
  const [closures, setClosures] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useApi, setUseApi] = useState(true);

  // Load from API with localStorage fallback
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      // Try API first
      if (useApi) {
        try {
          const [scheduleRes, closuresRes] = await Promise.all([
            scheduleApi.getByYear(year),
            closuresApi.getByYear(year)
          ]);

          const loadedSchedule = scheduleRes.schedule || {};
          const loadedClosures = closuresRes.closures || [];

          setSchedule(loadedSchedule);
          setClosures(loadedClosures);
          setStats(getScheduleStats(loadedSchedule));

          // Update localStorage cache
          if (Object.keys(loadedSchedule).length > 0) {
            localStorage.setItem(`${STORAGE_KEY}-${year}`, JSON.stringify(loadedSchedule));
          }
          localStorage.setItem(`${CLOSURES_KEY}-${year}`, JSON.stringify(loadedClosures));

          setIsLoading(false);
          return;
        } catch (err) {
          console.warn('API unavailable, falling back to localStorage:', err);
          setUseApi(false);
        }
      }

      // Fallback to localStorage
      const savedSchedule = localStorage.getItem(`${STORAGE_KEY}-${year}`);
      const savedClosures = localStorage.getItem(`${CLOSURES_KEY}-${year}`);

      if (savedSchedule) {
        const parsed = JSON.parse(savedSchedule);
        setSchedule(parsed);
        setStats(getScheduleStats(parsed));
      } else {
        setSchedule({});
        setStats({});
      }

      if (savedClosures) {
        setClosures(JSON.parse(savedClosures));
      } else {
        setClosures([]);
      }

      setIsLoading(false);
    };

    loadData();
  }, [year, useApi]);

  // Save schedule to localStorage (and API if available)
  const saveScheduleToStorage = useCallback(async (newSchedule) => {
    localStorage.setItem(`${STORAGE_KEY}-${year}`, JSON.stringify(newSchedule));

    if (useApi) {
      try {
        await scheduleApi.saveYear(year, newSchedule);
      } catch (err) {
        console.warn('Failed to save to API:', err);
      }
    }
  }, [year, useApi]);

  // Generate new schedule for 3 months, preserving existing weekend allocations
  const generateSchedule = useCallback(async (startMonth = null, teamMembersList = null) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use provided startMonth or default to current month
      const currentMonth = startMonth !== null ? startMonth : new Date().getMonth();

      // Extract team member names from the list if provided
      const teamMemberNames = teamMembersList
        ? teamMembersList.map(m => m.firstName)
        : null;

      // Generate 3 months of schedule, preserving existing weekend allocations
      const { schedule: newSchedule, stats: newStats } = generateQuarterSchedule(
        year,
        currentMonth,
        schedule, // Pass existing schedule to preserve weekends
        closures,
        teamMemberNames
      );

      setSchedule(newSchedule);
      setStats(newStats);

      // Save to localStorage
      localStorage.setItem(`${STORAGE_KEY}-${year}`, JSON.stringify(newSchedule));

      // Save to API if available
      if (useApi) {
        try {
          await scheduleApi.saveYear(year, newSchedule);
        } catch (err) {
          console.warn('Failed to save to API:', err);
        }
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      setError(error.message);
    }

    setIsLoading(false);
  }, [year, closures, schedule, useApi]);

  // Add closure
  const addClosure = useCallback(async (date) => {
    const dateStr = typeof date === 'string' ? date : formatDate(date);
    if (closures.includes(dateStr)) return;

    const newClosures = [...closures, dateStr].sort();
    setClosures(newClosures);
    localStorage.setItem(`${CLOSURES_KEY}-${year}`, JSON.stringify(newClosures));

    // Update schedule if exists
    if (schedule[dateStr]) {
      const newSchedule = {
        ...schedule,
        [dateStr]: { closure: true, shifts: [] }
      };
      setSchedule(newSchedule);
      localStorage.setItem(`${STORAGE_KEY}-${year}`, JSON.stringify(newSchedule));
    }

    // Save to API if available
    if (useApi) {
      try {
        await closuresApi.add(dateStr);
        if (schedule[dateStr]) {
          await scheduleApi.updateDay(dateStr, { closure: true, shifts: [] });
        }
      } catch (err) {
        console.warn('Failed to save closure to API:', err);
      }
    }
  }, [closures, schedule, year, useApi]);

  // Remove closure
  const removeClosure = useCallback(async (date) => {
    const dateStr = typeof date === 'string' ? date : formatDate(date);
    const newClosures = closures.filter(d => d !== dateStr);
    setClosures(newClosures);
    localStorage.setItem(`${CLOSURES_KEY}-${year}`, JSON.stringify(newClosures));

    // Save to API if available
    if (useApi) {
      try {
        await closuresApi.remove(dateStr);
      } catch (err) {
        console.warn('Failed to remove closure from API:', err);
      }
    }
  }, [closures, year, useApi]);

  // Clear all closures
  const clearClosures = useCallback(async () => {
    setClosures([]);
    localStorage.setItem(`${CLOSURES_KEY}-${year}`, JSON.stringify([]));

    // Save to API if available
    if (useApi) {
      try {
        await closuresApi.clearYear(year);
      } catch (err) {
        console.warn('Failed to clear closures from API:', err);
      }
    }
  }, [year, useApi]);

  // Change year
  const changeYear = useCallback((newYear) => {
    setYear(newYear);
    setSchedule({});
    setClosures([]);
    setStats({});
    setUseApi(true); // Reset to try API again for new year
  }, []);

  // Get schedule for a specific date
  const getScheduleForDate = useCallback((date) => {
    const dateStr = typeof date === 'string' ? date : formatDate(date);
    return schedule[dateStr] || null;
  }, [schedule]);

  // Check if date is a closure
  const isClosure = useCallback((date) => {
    const dateStr = typeof date === 'string' ? date : formatDate(date);
    return closures.includes(dateStr);
  }, [closures]);

  // Update schedule for a specific date
  const updateDaySchedule = useCallback(async (dateStr, daySchedule) => {
    const newSchedule = {
      ...schedule,
      [dateStr]: daySchedule
    };
    setSchedule(newSchedule);
    localStorage.setItem(`${STORAGE_KEY}-${year}`, JSON.stringify(newSchedule));

    // Save to API if available
    if (useApi) {
      try {
        await scheduleApi.updateDay(dateStr, daySchedule);
      } catch (err) {
        console.warn('Failed to update day in API:', err);
      }
    }
  }, [schedule, year, useApi]);

  return {
    year,
    schedule,
    closures,
    stats,
    isLoading,
    error,
    setYear: changeYear,
    generateSchedule,
    addClosure,
    removeClosure,
    clearClosures,
    getScheduleForDate,
    isClosure,
    updateDaySchedule
  };
};
