import { DAYS_OF_WEEK, MEMBER_COLORS, SHIFTS } from '../utils/constants';
import { formatDate, getWeekStart, addDays, getWeekNumber } from '../utils/dateUtils';

const ShiftBadge = ({ shift, member }) => {
  const colorClass = MEMBER_COLORS[member] || 'bg-gray-200 text-gray-800';

  return (
    <div className={`px-2 py-1 rounded-md text-xs font-medium border ${colorClass} mb-1`}>
      <div className="font-semibold truncate">{member}</div>
      <div className="text-[10px] opacity-75">{shift.name}</div>
    </div>
  );
};

const DayColumn = ({ date, daySchedule, isWeekend, isClosure, onClick }) => {
  const dayOfWeek = date.getDay();
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const dayName = DAYS_OF_WEEK[dayIndex];
  const isToday = formatDate(date) === formatDate(new Date());

  return (
    <div
      onClick={() => onClick && onClick(date)}
      className={`flex-1 min-w-[120px] border-r last:border-r-0 cursor-pointer hover:bg-slate-50 transition-colors ${
      isWeekend ? 'bg-gray-100 hover:bg-gray-200' : ''
    } ${isClosure ? 'bg-rose-50/50 hover:bg-rose-100/50' : ''}`}>
      {/* Day Header */}
      <div className={`p-2 text-center border-b sticky top-0 ${
        isToday ? 'bg-sky-100 text-sky-700' : 'bg-gray-50'
      }`}>
        <div className="text-xs font-medium">{dayName}</div>
        <div className={`text-lg font-bold ${isToday ? '' : 'text-gray-700'}`}>
          {date.getDate()}
        </div>
      </div>

      {/* Shifts */}
      <div className="p-2 min-h-[200px]">
        {isClosure ? (
          <div className="text-center text-rose-400 text-sm font-medium py-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Chiuso
          </div>
        ) : daySchedule ? (
          <div className="space-y-1">
            {/* Group shifts by type */}
            {Object.values(SHIFTS).map(shiftType => {
              const shiftsOfType = daySchedule.shifts.filter(s => s.shift.id === shiftType.id);
              if (shiftsOfType.length === 0) return null;

              return (
                <div key={shiftType.id} className="mb-2">
                  <div className={`text-[10px] font-semibold px-1 py-0.5 rounded ${shiftType.color} mb-1`}>
                    {shiftType.name}
                  </div>
                  {shiftsOfType.map(({ member }) => (
                    <ShiftBadge key={`${shiftType.id}-${member}`} shift={shiftType} member={member} />
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 text-sm py-4">
            Nessun turno
          </div>
        )}
      </div>
    </div>
  );
};

const WeekView = ({ currentDate, schedule, closures, onDayClick }) => {
  const weekStart = getWeekStart(currentDate);
  const weekNumber = getWeekNumber(currentDate);

  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Week Header */}
      <div className="bg-gray-100 px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">
            Settimana {weekNumber}
          </h3>
          <span className="text-sm text-gray-500">
            {formatDate(weekStart)} - {formatDate(addDays(weekStart, 6))}
          </span>
        </div>
      </div>

      {/* Days Grid */}
      <div className="flex overflow-x-auto">
        {days.map(date => {
          const dateKey = formatDate(date);
          const daySchedule = schedule[dateKey];
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isClosure = closures.includes(dateKey) || (daySchedule && daySchedule.closure);

          return (
            <DayColumn
              key={dateKey}
              date={date}
              daySchedule={daySchedule}
              isWeekend={isWeekend}
              isClosure={isClosure}
              onClick={onDayClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;
