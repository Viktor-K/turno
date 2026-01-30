import { DAYS_OF_WEEK, MONTHS, SHIFTS } from '../utils/constants';

const DayDetailModal = ({ isOpen, onClose, date, daySchedule, isClosure, onToggleClosure, getMemberColor }) => {
  if (!isOpen || !date) return null;

  const dayOfWeek = date.getDay();
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const dayName = DAYS_OF_WEEK[dayIndex];
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const formatDate = (d) => {
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${
          isClosure ? 'bg-rose-50 text-rose-700' : isWeekend ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
        }`}>
          <div>
            <h2 className="text-xl font-bold">{dayName}</h2>
            <p className="text-sm opacity-70">{formatDate(date)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isClosure ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-rose-50 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Chiusura Aziendale</h3>
              <p className="text-slate-400 mb-4">Nessun turno programmato per questo giorno</p>
              <button
                onClick={onToggleClosure}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors cursor-pointer"
              >
                Rimuovi chiusura
              </button>
            </div>
          ) : daySchedule && daySchedule.shifts && daySchedule.shifts.length > 0 ? (
            <div className="space-y-4">
              {Object.values(SHIFTS).map(shiftType => {
                const group = groupedShifts[shiftType.id];
                if (!group) return null;

                return (
                  <div key={shiftType.id} className="border border-slate-100 rounded-lg overflow-hidden">
                    <div className={`${shiftType.color} px-4 py-2 font-medium`}>
                      {shiftType.name}
                    </div>
                    <div className="p-3 space-y-2">
                      {group.members.map(member => (
                        <div
                          key={member}
                          className={`px-3 py-2 rounded-lg border ${getMemberColor ? getMemberColor(member) : 'bg-gray-100 text-gray-700 border-gray-200'} font-medium`}
                        >
                          {member}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {!isClosure && (
                <button
                  onClick={onToggleClosure}
                  className="w-full px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors mt-4 cursor-pointer"
                >
                  Imposta come giorno di chiusura
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-50 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Nessun turno</h3>
              <p className="text-slate-400 mb-4">Genera i turni per vedere la pianificazione</p>
              <button
                onClick={onToggleClosure}
                className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Imposta come chiusura
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;
