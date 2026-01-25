import { useState } from 'react';
import { DAYS_OF_WEEK, MONTHS, MEMBER_COLORS, SHIFTS, TEAM_MEMBERS } from '../utils/constants';
import { validateChange, getAvailableMembers } from '../utils/constraintValidator';

const EditDayModal = ({ isOpen, onClose, date, daySchedule, schedule, onUpdateSchedule, onViolation }) => {
  const [localSchedule, setLocalSchedule] = useState(null);
  const [addingToShift, setAddingToShift] = useState(null);

  if (!isOpen || !date) return null;

  const dayOfWeek = date.getDay();
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const dayName = DAYS_OF_WEEK[dayIndex];
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dateStr = date.toISOString().split('T')[0];

  const formatDateDisplay = (d) => {
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Use local schedule if available, otherwise use prop
  const currentDaySchedule = localSchedule || daySchedule || { shifts: [] };

  // Group shifts by type
  const groupedShifts = {};
  if (currentDaySchedule.shifts) {
    currentDaySchedule.shifts.forEach(({ member, shift }) => {
      if (!groupedShifts[shift.id]) {
        groupedShifts[shift.id] = { shift, members: [] };
      }
      groupedShifts[shift.id].members.push(member);
    });
  }

  // Get shifts to display based on day type
  const shiftsToShow = isWeekend
    ? [SHIFTS.WEEKEND]
    : [SHIFTS.EARLY, SHIFTS.STANDARD, SHIFTS.LATE];

  // Handle removing a member from a shift
  const handleRemoveMember = (member, shiftId) => {
    const newShifts = currentDaySchedule.shifts.filter(
      s => !(s.member === member && s.shift.id === shiftId)
    );

    const newDaySchedule = { ...currentDaySchedule, shifts: newShifts };
    setLocalSchedule(newDaySchedule);
  };

  // Handle moving a member to a different shift
  const handleMoveToShift = (member, fromShiftId, toShiftId) => {
    // Check for violations
    const violations = validateChange(schedule, dateStr, member, toShiftId, { shift: { id: fromShiftId } });

    const applyChange = () => {
      // Remove from current shift
      let newShifts = currentDaySchedule.shifts.filter(
        s => !(s.member === member && s.shift.id === fromShiftId)
      );

      // Add to new shift
      const newShift = Object.values(SHIFTS).find(s => s.id === toShiftId);
      newShifts.push({ member, shift: newShift });

      const newDaySchedule = { ...currentDaySchedule, shifts: newShifts };
      setLocalSchedule(newDaySchedule);
    };

    if (violations.length > 0) {
      onViolation(violations, `Spostare ${member} al turno ${SHIFTS[toShiftId.toUpperCase()]?.name || toShiftId}`, applyChange);
    } else {
      applyChange();
    }
  };

  // Handle adding a new member to a shift
  const handleAddMember = (member, shiftId) => {
    // Check for violations
    const violations = validateChange(schedule, dateStr, member, shiftId);

    const applyChange = () => {
      const newShift = Object.values(SHIFTS).find(s => s.id === shiftId);
      const newShifts = [...(currentDaySchedule.shifts || []), { member, shift: newShift }];

      const newDaySchedule = { ...currentDaySchedule, shifts: newShifts };
      setLocalSchedule(newDaySchedule);
      setAddingToShift(null);
    };

    if (violations.length > 0) {
      onViolation(violations, `Aggiungere ${member} al turno ${SHIFTS[shiftId.toUpperCase()]?.name || shiftId}`, applyChange);
    } else {
      applyChange();
    }
  };

  // Get members not assigned to any shift today
  const assignedMembers = new Set(currentDaySchedule.shifts?.map(s => s.member) || []);
  const unassignedMembers = TEAM_MEMBERS.filter(m => !assignedMembers.has(m));

  // Save changes
  const handleSave = () => {
    if (localSchedule) {
      onUpdateSchedule(dateStr, localSchedule);
    }
    setLocalSchedule(null);
    onClose();
  };

  // Cancel changes
  const handleCancel = () => {
    setLocalSchedule(null);
    setAddingToShift(null);
    onClose();
  };

  const hasChanges = localSchedule !== null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between flex-shrink-0 ${
          isWeekend ? 'bg-gray-100' : 'bg-slate-50'
        }`}>
          <div>
            <h2 className="text-xl font-bold text-slate-700">{dayName}</h2>
            <p className="text-sm text-slate-500">{formatDateDisplay(date)}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                Modifiche non salvate
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {shiftsToShow.map(shiftType => {
              const group = groupedShifts[shiftType.id];
              const members = group?.members || [];
              const isSinglePersonShift = shiftType.id === 'early' || shiftType.id === 'late';
              const canAddMore = !isSinglePersonShift || members.length === 0;

              return (
                <div key={shiftType.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className={`${shiftType.color} px-4 py-2 font-medium flex items-center justify-between`}>
                    <span>{shiftType.name}</span>
                    {isSinglePersonShift && (
                      <span className="text-xs opacity-75">(max 1 persona)</span>
                    )}
                  </div>

                  <div className="p-3 space-y-2">
                    {/* Assigned members */}
                    {members.map(member => (
                      <div
                        key={member}
                        className={`px-3 py-2 rounded-lg border ${MEMBER_COLORS[member]} flex items-center justify-between group`}
                      >
                        <span className="font-medium">{member}</span>
                        <div className="flex items-center gap-1">
                          {/* Move to different shift dropdown */}
                          {!isWeekend && (
                            <select
                              className="text-xs bg-white border rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleMoveToShift(member, shiftType.id, e.target.value);
                                }
                              }}
                            >
                              <option value="">Sposta a...</option>
                              {Object.values(SHIFTS)
                                .filter(s => s.id !== shiftType.id && s.id !== 'weekend')
                                .map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))
                              }
                            </select>
                          )}

                          {/* Remove button */}
                          <button
                            onClick={() => handleRemoveMember(member, shiftType.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Rimuovi"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* No members message */}
                    {members.length === 0 && addingToShift !== shiftType.id && (
                      <p className="text-sm text-slate-400 italic">Nessuno assegnato</p>
                    )}

                    {/* Add member interface */}
                    {addingToShift === shiftType.id ? (
                      <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-2">Seleziona persona:</p>
                        <div className="flex flex-wrap gap-1">
                          {unassignedMembers.map(member => (
                            <button
                              key={member}
                              onClick={() => handleAddMember(member, shiftType.id)}
                              className={`px-2 py-1 text-xs rounded border ${MEMBER_COLORS[member]} hover:opacity-80 transition-opacity`}
                            >
                              {member}
                            </button>
                          ))}
                          {unassignedMembers.length === 0 && (
                            <p className="text-xs text-slate-400">Tutti assegnati</p>
                          )}
                        </div>
                        <button
                          onClick={() => setAddingToShift(null)}
                          className="mt-2 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Annulla
                        </button>
                      </div>
                    ) : canAddMore ? (
                      <button
                        onClick={() => setAddingToShift(shiftType.id)}
                        className="w-full mt-2 px-3 py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Aggiungi persona
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unassigned members section */}
          {unassignedMembers.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-slate-500 mb-2">Persone non assegnate oggi:</h4>
              <div className="flex flex-wrap gap-2">
                {unassignedMembers.map(member => (
                  <span
                    key={member}
                    className={`px-2 py-1 text-xs rounded border ${MEMBER_COLORS[member]}`}
                  >
                    {member}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-between flex-shrink-0">
          <button
            onClick={handleCancel}
            className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          >
            {hasChanges ? 'Annulla modifiche' : 'Chiudi'}
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
            >
              Salva modifiche
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditDayModal;
