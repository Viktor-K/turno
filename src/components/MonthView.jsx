import { DAYS_OF_WEEK, MONTHS } from '../utils/constants';
import { formatDate, getMonthStart, getMonthEnd, getDaysInRange, addDays } from '../utils/dateUtils';

const DayCell = ({ date, daySchedule, isCurrentMonth, isClosure, isToday, onClick, getMemberColor }) => {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const shiftsCount = daySchedule && daySchedule.shifts ? daySchedule.shifts.length : 0;

  return (
    <div
      onClick={() => onClick && onClick(date)}
      className={`min-h-[80px] md:min-h-[100px] p-1 border-b border-r cursor-pointer transition-colors flex flex-col ${
        !isCurrentMonth ? 'bg-gray-50/50 text-gray-300' :
        isClosure ? 'bg-rose-50/50' :
        isWeekend ? 'bg-gray-100' : 'bg-white'
      } ${isToday ? 'ring-2 ring-sky-200 ring-inset' : ''} hover:bg-sky-50/50`}
    >
      {/* Date Number */}
      <div className={`text-sm font-medium mb-1 ${
        isToday ? 'w-6 h-6 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center' : ''
      }`}>
        {date.getDate()}
      </div>

      {/* Shifts Preview - only show for current month */}
      {isCurrentMonth && (
        isClosure ? (
          <div className="text-xs text-rose-400 font-medium">Chiuso</div>
        ) : daySchedule && daySchedule.shifts ? (
          <div className="space-y-0.5 overflow-hidden flex-1">
            {daySchedule.shifts.slice(0, 4).map(({ member, shift }, idx) => (
              <div
                key={idx}
                className={`text-[10px] px-1 rounded truncate ${getMemberColor ? getMemberColor(member) : 'bg-gray-100 text-gray-700'}`}
                title={`${member} - ${shift.name}`}
              >
                {member.substring(0, 3)}
              </div>
            ))}
            {daySchedule.shifts.length > 4 && (
              <div className="text-[10px] text-gray-500">+{daySchedule.shifts.length - 4}</div>
            )}
          </div>
        ) : <div className="flex-1"></div>
      )}

      {/* People Count - bottom right */}
      {isCurrentMonth && !isClosure && shiftsCount > 0 && (
        <div className="text-[10px] text-slate-400 mt-auto text-right">
          {shiftsCount} {shiftsCount === 1 ? 'persona' : 'persone'}
        </div>
      )}
    </div>
  );
};

const MonthView = ({ currentDate, schedule, closures, onDayClick, getMemberColor }) => {
  const monthStart = getMonthStart(currentDate);
  const monthEnd = getMonthEnd(currentDate);
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Get first day to display (start of week containing month start)
  const firstDayOfWeek = monthStart.getDay();
  const startDisplay = addDays(monthStart, -(firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));

  // Get last day to display (end of week containing month end)
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Month Header */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-b px-4 py-3">
        <h3 className="text-lg font-semibold text-slate-700">
          {MONTHS[month]} {year}
        </h3>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b bg-slate-50">
        {DAYS_OF_WEEK.map((day, idx) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-semibold ${
              idx >= 5 ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day.substring(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="border-l">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7">
            {week.map(date => {
              const dateKey = formatDate(date);
              const daySchedule = schedule[dateKey];
              const isCurrentMonth = date.getMonth() === month;
              const isClosure = closures.includes(dateKey) || (daySchedule && daySchedule.closure);
              const isToday = dateKey === today;

              return (
                <DayCell
                  key={dateKey}
                  date={date}
                  daySchedule={daySchedule}
                  isCurrentMonth={isCurrentMonth}
                  isClosure={isClosure}
                  isToday={isToday}
                  onClick={onDayClick}
                  getMemberColor={getMemberColor}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;
