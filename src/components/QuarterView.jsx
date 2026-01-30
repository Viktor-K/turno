import { MONTHS } from '../utils/constants';
import { formatDate, getMonthStart, getMonthEnd, getDaysInRange, addDays } from '../utils/dateUtils';

const MiniMonth = ({ month, year, schedule, closures }) => {
  const monthStart = getMonthStart(new Date(year, month, 1));
  const monthEnd = getMonthEnd(new Date(year, month, 1));

  // Get first day to display
  const firstDayOfWeek = monthStart.getDay();
  const startDisplay = addDays(monthStart, -(firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));

  // Get last day to display
  const lastDayOfWeek = monthEnd.getDay();
  const endDisplay = addDays(monthEnd, lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek);

  const days = getDaysInRange(startDisplay, endDisplay);
  const today = formatDate(new Date());

  // Create weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="bg-slate-100 text-slate-700 px-3 py-2 text-center font-semibold text-sm">
        {MONTHS[month]}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-400 border-b bg-slate-50">
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className={`py-1 ${i >= 5 ? 'text-slate-300' : ''}`}>{d}</div>
        ))}
      </div>

      {/* Calendar */}
      <div className="p-1">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-0.5">
            {week.map(date => {
              const dateKey = formatDate(date);
              const daySchedule = schedule[dateKey];
              const isCurrentMonth = date.getMonth() === month;
              const isClosure = closures.includes(dateKey) || (daySchedule && daySchedule.closure);
              const isToday = dateKey === today;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const hasShifts = daySchedule && daySchedule.shifts && daySchedule.shifts.length > 0;

              const shiftsCount = hasShifts ? daySchedule.shifts.length : 0;

              return (
                <div
                  key={dateKey}
                  className={`aspect-square flex flex-col items-center justify-center text-[10px] rounded-sm relative ${
                    !isCurrentMonth ? 'text-gray-300' :
                    isClosure ? 'bg-rose-50 text-rose-400' :
                    isToday ? 'bg-sky-100 text-sky-600 font-bold' :
                    hasShifts ? (isWeekend ? 'bg-gray-200' : 'bg-emerald-50') :
                    ''
                  }`}
                  title={hasShifts ? `${shiftsCount} persone` : ''}
                >
                  {isCurrentMonth ? date.getDate() : ''}
                  {isCurrentMonth && hasShifts && (
                    <span className="text-[7px] text-slate-500 leading-none">{shiftsCount}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const QuarterView = ({ currentDate, schedule, closures }) => {
  const currentMonth = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Determine quarter
  const quarter = Math.floor(currentMonth / 4);
  const quarterMonths = [quarter * 4, quarter * 4 + 1, quarter * 4 + 2, quarter * 4 + 3].filter(m => m < 12);

  const quarterNames = ['Primo Quadrimestre', 'Secondo Quadrimestre', 'Terzo Quadrimestre'];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          {quarterNames[quarter]} {year}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quarterMonths.map(monthIdx => (
            <MiniMonth
              key={monthIdx}
              month={monthIdx}
              year={year}
              schedule={schedule}
              closures={closures}
            />
          ))}
        </div>
      </div>

      {/* Quarter Legend */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h4 className="text-sm font-semibold text-slate-500 mb-3">Legenda</h4>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-50 border border-emerald-100 rounded"></div>
            <span>Turni assegnati</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
            <span>Weekend</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-rose-50 border border-rose-100 rounded"></div>
            <span>Chiusura</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-sky-100 border border-sky-200 rounded"></div>
            <span className="text-sky-600">Oggi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuarterView;
