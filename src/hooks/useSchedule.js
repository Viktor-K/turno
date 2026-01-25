import { useState, useCallback, useEffect } from 'react';
import { generateYearSchedule, getScheduleStats } from '../utils/shiftGenerator';
import { formatDate } from '../utils/dateUtils';

const STORAGE_KEY = 'turno-schedule';
const CLOSURES_KEY = 'turno-closures';

export const useSchedule = (initialYear = new Date().getFullYear()) => {
  const [year, setYear] = useState(initialYear);
  const [schedule, setSchedule] = useState({});
  const [closures, setClosures] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const savedSchedule = localStorage.getItem(`${STORAGE_KEY}-${year}`);
    const savedClosures = localStorage.getItem(`${CLOSURES_KEY}-${year}`);

    if (savedSchedule) {
      const parsed = JSON.parse(savedSchedule);
      setSchedule(parsed);
      setStats(getScheduleStats(parsed));
    }

    if (savedClosures) {
      setClosures(JSON.parse(savedClosures));
    }

    setIsLoading(false);
  }, [year]);

  // Save to localStorage
  useEffect(() => {
    if (Object.keys(schedule).length > 0) {
      localStorage.setItem(`${STORAGE_KEY}-${year}`, JSON.stringify(schedule));
    }
  }, [schedule, year]);

  useEffect(() => {
    if (closures.length >= 0) {
      localStorage.setItem(`${CLOSURES_KEY}-${year}`, JSON.stringify(closures));
    }
  }, [closures, year]);

  // Generate new schedule
  const generateSchedule = useCallback(() => {
    setIsLoading(true);
    try {
      const { schedule: newSchedule, stats: newStats } = generateYearSchedule(year, closures);
      setSchedule(newSchedule);
      setStats(newStats);
    } catch (error) {
      console.error('Error generating schedule:', error);
    }
    setIsLoading(false);
  }, [year, closures]);

  // Add closure
  const addClosure = useCallback((date) => {
    const dateStr = typeof date === 'string' ? date : formatDate(date);
    if (!closures.includes(dateStr)) {
      const newClosures = [...closures, dateStr].sort();
      setClosures(newClosures);

      // Update schedule if exists
      if (schedule[dateStr]) {
        setSchedule(prev => ({
          ...prev,
          [dateStr]: { closure: true, shifts: [] }
        }));
      }
    }
  }, [closures, schedule]);

  // Remove closure
  const removeClosure = useCallback((date) => {
    const dateStr = typeof date === 'string' ? date : formatDate(date);
    setClosures(prev => prev.filter(d => d !== dateStr));
  }, []);

  // Clear all closures
  const clearClosures = useCallback(() => {
    setClosures([]);
  }, []);

  // Change year
  const changeYear = useCallback((newYear) => {
    setYear(newYear);
    setSchedule({});
    setClosures([]);
    setStats({});
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
  const updateDaySchedule = useCallback((dateStr, daySchedule) => {
    setSchedule(prev => ({
      ...prev,
      [dateStr]: daySchedule
    }));
  }, []);

  return {
    year,
    schedule,
    closures,
    stats,
    isLoading,
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
