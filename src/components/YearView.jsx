import { MONTHS } from '../utils/constants';
import { formatDate, getMonthStart, getMonthEnd, getDaysInRange, addDays } from '../utils/dateUtils';

const MiniMonthYear = ({ month, year, schedule, closures, onMonthClick }) => {
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

  // Create weeks (max 6 weeks)
  const weeks = [];
  for (let i = 0; i < Math.min(days.length, 42); i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div
      className="bg-white rounded-lg shadow-sm border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onMonthClick && onMonthClick(month)}
    >
      <div className="bg-slate-100 text-slate-600 px-2 py-1.5 text-center font-medium text-xs">
        {MONTHS[month]}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-[8px] font-medium text-slate-400 bg-slate-50">
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className={`py-0.5 ${i >= 5 ? 'text-slate-300' : ''}`}>{d}</div>
        ))}
      </div>

      {/* Calendar */}
      <div className="p-0.5">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7">
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
                  className={`aspect-square flex flex-col items-center justify-center text-[7px] ${
                    !isCurrentMonth ? 'text-gray-200' :
                    isClosure ? 'bg-rose-50 text-rose-400' :
                    isToday ? 'bg-sky-100 text-sky-600 font-bold rounded-full' :
                    hasShifts ? (isWeekend ? 'bg-gray-200' : 'bg-emerald-50') :
                    'text-slate-500'
                  }`}
                  title={hasShifts ? `${shiftsCount} persone` : ''}
                >
                  {isCurrentMonth ? date.getDate() : ''}
                  {isCurrentMonth && hasShifts && (
                    <span className="text-[5px] text-slate-400 leading-none">{shiftsCount}</span>
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

const YearView = ({ year, schedule, closures, onMonthClick }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">
          Calendario {year}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }, (_, i) => (
            <MiniMonthYear
              key={i}
              month={i}
              year={year}
              schedule={schedule}
              closures={closures}
              onMonthClick={onMonthClick}
            />
          ))}
        </div>
      </div>

      {/* Year Legend */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h4 className="text-sm font-semibold text-slate-500 mb-3">Legenda</h4>
        <div className="flex flex-wrap gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-50 rounded border border-emerald-100"></div>
            <span>Turni feriali</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded border border-gray-300"></div>
            <span>Weekend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-rose-50 rounded border border-rose-100"></div>
            <span>Chiusura aziendale</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-sky-100 rounded-full border border-sky-200"></div>
            <span className="text-sky-600 font-medium">Oggi</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Clicca su un mese per visualizzare i dettagli
        </p>
      </div>
    </div>
  );
};

export default YearView;
