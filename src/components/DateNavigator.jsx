import { MONTHS, VIEW_MODES } from '../utils/constants';
import {
  addDays,
  getWeekStart,
  getWeekNumber,
  getMonthStart,
  getQuarterStart
} from '../utils/dateUtils';

const DateNavigator = ({ currentDate, setCurrentDate, viewMode }) => {
  const navigatePrev = () => {
    switch (viewMode) {
      case VIEW_MODES.WEEK:
        setCurrentDate(addDays(currentDate, -7));
        break;
      case VIEW_MODES.MONTH:
        const prevMonth = new Date(currentDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        setCurrentDate(prevMonth);
        break;
      case VIEW_MODES.QUARTER:
        const prevQuarter = new Date(currentDate);
        prevQuarter.setMonth(prevQuarter.getMonth() - 4);
        setCurrentDate(prevQuarter);
        break;
      default:
        break;
    }
  };

  const navigateNext = () => {
    switch (viewMode) {
      case VIEW_MODES.WEEK:
        setCurrentDate(addDays(currentDate, 7));
        break;
      case VIEW_MODES.MONTH:
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setCurrentDate(nextMonth);
        break;
      case VIEW_MODES.QUARTER:
        const nextQuarter = new Date(currentDate);
        nextQuarter.setMonth(nextQuarter.getMonth() + 4);
        setCurrentDate(nextQuarter);
        break;
      default:
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateLabel = () => {
    switch (viewMode) {
      case VIEW_MODES.WEEK:
        const weekStart = getWeekStart(currentDate);
        const weekEnd = addDays(weekStart, 6);
        return `Settimana ${getWeekNumber(currentDate)} (${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].substring(0, 3)} - ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()].substring(0, 3)})`;
      case VIEW_MODES.MONTH:
        return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case VIEW_MODES.QUARTER:
        const quarter = Math.floor(currentDate.getMonth() / 4) + 1;
        return `Q${quarter} ${currentDate.getFullYear()}`;
      case VIEW_MODES.YEAR:
        return `Anno ${currentDate.getFullYear()}`;
      default:
        return '';
    }
  };

  if (viewMode === VIEW_MODES.YEAR) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-3 mb-4">
      <button
        onClick={navigatePrev}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        aria-label="Precedente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex items-center gap-3">
        <span className="font-semibold text-gray-700">{getDateLabel()}</span>
        <button
          onClick={goToToday}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
        >
          Oggi
        </button>
      </div>

      <button
        onClick={navigateNext}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        aria-label="Successivo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default DateNavigator;
