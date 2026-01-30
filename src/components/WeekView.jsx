import { DAYS_OF_WEEK, MEMBER_COLORS, SHIFTS } from '../utils/constants';
import { formatDate, getWeekStart, addDays, getWeekNumber } from '../utils/dateUtils';

// Shift accent colors for left border indicator
const SHIFT_ACCENTS = {
  early: 'border-l-sky-500',
  standard: 'border-l-emerald-500',
  late: 'border-l-violet-500',
  weekend: 'border-l-amber-500'
};

const SHIFT_ICONS = {
  early: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  standard: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  late: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  weekend: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
};

const PersonChip = ({ member }) => {
  const colorClass = MEMBER_COLORS[member] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {member}
    </span>
  );
};

const ShiftBlock = ({ shiftType, members }) => {
  const accentColor = SHIFT_ACCENTS[shiftType.id] || 'border-l-gray-400';
  const icon = SHIFT_ICONS[shiftType.id];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden mb-2 last:mb-0 border-l-4 ${accentColor} shadow-sm`}>
      {/* Shift header */}
      <div className="px-2 py-1.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-1.5 text-gray-600">
          {icon}
          <span className="text-[11px] font-semibold">{shiftType.name}</span>
        </div>
      </div>

      {/* People chips */}
      <div className="p-2 flex flex-wrap gap-1">
        {members.map(member => (
          <PersonChip key={member} member={member} />
        ))}
      </div>
    </div>
  );
};

const DayColumn = ({ date, daySchedule, isWeekend, isClosure, onClick }) => {
  const dayOfWeek = date.getDay();
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const dayName = DAYS_OF_WEEK[dayIndex];
  const isToday = formatDate(date) === formatDate(new Date());

  // Group shifts by type
  const groupedShifts = {};
  if (daySchedule && daySchedule.shifts) {
    daySchedule.shifts.forEach(({ member, shift }) => {
      if (!groupedShifts[shift.id]) {
        groupedShifts[shift.id] = { shift, members: [] };
      }
      groupedShifts[shift.id].members.push(member);
    });
  }

  // Determine which shifts to show based on day type
  const shiftsToShow = isWeekend
    ? [SHIFTS.WEEKEND]
    : [SHIFTS.EARLY, SHIFTS.STANDARD, SHIFTS.LATE];

  return (
    <div
      onClick={() => onClick && onClick(date)}
      className={`flex-1 min-w-[140px] border-r last:border-r-0 cursor-pointer transition-colors ${
        isWeekend ? 'bg-slate-50/50 hover:bg-slate-100/50' : 'hover:bg-gray-50/50'
      } ${isClosure ? 'bg-rose-50/30 hover:bg-rose-50/50' : ''}`}
    >
      {/* Day Header */}
      <div className={`p-2 text-center border-b sticky top-0 ${
        isToday
          ? 'bg-sky-500 text-white'
          : isWeekend
            ? 'bg-slate-100'
            : 'bg-gray-50'
      }`}>
        <div className={`text-xs font-medium ${isToday ? 'text-sky-100' : 'text-gray-500'}`}>
          {dayName}
        </div>
        <div className={`text-xl font-bold ${isToday ? '' : 'text-gray-700'}`}>
          {date.getDate()}
        </div>
      </div>

      {/* Shifts Content */}
      <div className="p-2 min-h-[220px]">
        {isClosure ? (
          <div className="flex flex-col items-center justify-center h-full text-rose-400 py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span className="text-sm font-medium">Chiuso</span>
          </div>
        ) : daySchedule && daySchedule.shifts && daySchedule.shifts.length > 0 ? (
          <div className="space-y-2">
            {shiftsToShow.map(shiftType => {
              const group = groupedShifts[shiftType.id];
              if (!group || group.members.length === 0) return null;

              return (
                <ShiftBlock
                  key={shiftType.id}
                  shiftType={shiftType}
                  members={group.members}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Nessun turno</span>
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
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      {/* Week Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg px-3 py-1">
              <span className="text-sm font-medium">Sett. {weekNumber}</span>
            </div>
            <h3 className="font-semibold">
              Vista Settimanale
            </h3>
          </div>
          <span className="text-sm text-slate-300">
            {formatDate(weekStart)} — {formatDate(addDays(weekStart, 6))}
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

      {/* Legend */}
      <div className="bg-gray-50 border-t px-4 py-2">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Fasce orarie:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-l-2 border-l-sky-500 bg-white border border-gray-200"></div>
            <span>8-17 (Mattina)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-l-2 border-l-emerald-500 bg-white border border-gray-200"></div>
            <span>9-18 (Standard)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-l-2 border-l-violet-500 bg-white border border-gray-200"></div>
            <span>12-21 (Sera)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-l-2 border-l-amber-500 bg-white border border-gray-200"></div>
            <span>Weekend</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;
