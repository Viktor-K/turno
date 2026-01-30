import { TEAM_MEMBERS } from '../utils/constants';

const StatsPanel = ({ stats, isOpen, onClose, getMemberColor }) => {
  if (!isOpen) return null;

  const hasStats = Object.keys(stats).length > 0;

  // Calculate totals and averages
  const totals = {
    earlyShifts: 0,
    lateShifts: 0,
    standardShifts: 0,
    weekendShifts: 0
  };

  if (hasStats) {
    Object.values(stats).forEach(memberStats => {
      totals.earlyShifts += memberStats.earlyShifts || 0;
      totals.lateShifts += memberStats.lateShifts || 0;
      totals.standardShifts += memberStats.standardShifts || 0;
      totals.weekendShifts += memberStats.weekendShifts || 0;
    });
  }

  const averages = {
    earlyShifts: Math.round(totals.earlyShifts / TEAM_MEMBERS.length),
    lateShifts: Math.round(totals.lateShifts / TEAM_MEMBERS.length),
    standardShifts: Math.round(totals.standardShifts / TEAM_MEMBERS.length),
    weekendShifts: Math.round(totals.weekendShifts / TEAM_MEMBERS.length)
  };

  const getBarWidth = (value, max) => {
    if (max === 0) return 0;
    return (value / max) * 100;
  };

  const maxValues = {
    earlyShifts: Math.max(...Object.values(stats).map(s => s.earlyShifts || 0), 1),
    lateShifts: Math.max(...Object.values(stats).map(s => s.lateShifts || 0), 1),
    standardShifts: Math.max(...Object.values(stats).map(s => s.standardShifts || 0), 1),
    weekendShifts: Math.max(...Object.values(stats).map(s => s.weekendShifts || 0), 1)
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Statistiche Turni</h2>
            <p className="text-sm text-white/80">Distribuzione e equità</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!hasStats ? (
            <div className="text-center py-12 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg">Nessun dato disponibile</p>
              <p className="text-sm">Genera prima i turni per visualizzare le statistiche</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{totals.earlyShifts}</div>
                  <div className="text-sm text-blue-700">Turni 8:00-17:00</div>
                  <div className="text-xs text-blue-500">Media: {averages.earlyShifts}/persona</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{totals.lateShifts}</div>
                  <div className="text-sm text-purple-700">Turni 12:00-21:00</div>
                  <div className="text-xs text-purple-500">Media: {averages.lateShifts}/persona</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{totals.standardShifts}</div>
                  <div className="text-sm text-green-700">Turni 9:00-18:00</div>
                  <div className="text-xs text-green-500">Media: {averages.standardShifts}/persona</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{totals.weekendShifts}</div>
                  <div className="text-sm text-orange-700">Turni Weekend</div>
                  <div className="text-xs text-orange-500">Media: {averages.weekendShifts}/persona</div>
                </div>
              </div>

              {/* Per-person breakdown */}
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Dettaglio per persona</h3>
              <div className="space-y-4">
                {TEAM_MEMBERS.map(member => {
                  const memberStats = stats[member] || { earlyShifts: 0, lateShifts: 0, standardShifts: 0, weekendShifts: 0 };
                  const colorClass = getMemberColor ? getMemberColor(member) : 'bg-gray-100 text-gray-700 border-gray-200';

                  return (
                    <div key={member} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
                          {member}
                        </span>
                        <span className="text-sm text-gray-500">
                          Totale: {(memberStats.earlyShifts || 0) + (memberStats.lateShifts || 0) + (memberStats.standardShifts || 0) + (memberStats.weekendShifts || 0)} giorni
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Early Shift */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-24">8:00-17:00</span>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${getBarWidth(memberStats.earlyShifts || 0, maxValues.earlyShifts)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{memberStats.earlyShifts || 0}</span>
                        </div>

                        {/* Late Shift */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-24">12:00-21:00</span>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all"
                              style={{ width: `${getBarWidth(memberStats.lateShifts || 0, maxValues.lateShifts)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{memberStats.lateShifts || 0}</span>
                        </div>

                        {/* Standard Shift */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-24">9:00-18:00</span>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${getBarWidth(memberStats.standardShifts || 0, maxValues.standardShifts)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{memberStats.standardShifts || 0}</span>
                        </div>

                        {/* Weekend */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-24">Weekend</span>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all"
                              style={{ width: `${getBarWidth(memberStats.weekendShifts || 0, maxValues.weekendShifts)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{memberStats.weekendShifts || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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

export default StatsPanel;
