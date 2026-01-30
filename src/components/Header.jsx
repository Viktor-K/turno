import { VIEW_MODES } from '../utils/constants';

const Header = ({ currentView, setCurrentView, year, setYear, onGenerate, onOpenClosures, onOpenRules, onDownloadPDF, hasSchedule, onLogout }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Turno</h1>
              <p className="text-xs text-blue-200 hidden md:block">Gestione Turni Team</p>
            </div>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear(year - 1)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              aria-label="Anno precedente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold min-w-[4rem] text-center">{year}</span>
            <button
              onClick={() => setYear(year + 1)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              aria-label="Anno successivo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* View Mode Selector */}
          <div className="flex flex-wrap gap-1 bg-white/10 rounded-lg p-1">
            {Object.entries(VIEW_MODES).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setCurrentView(value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all cursor-pointer ${
                  currentView === value
                    ? 'bg-white text-blue-700 shadow-md'
                    : 'hover:bg-white/20'
                }`}
              >
                {key === 'WEEK' ? 'Settimana' :
                 key === 'MONTH' ? 'Mese' :
                 key === 'QUARTER' ? 'Quadrimestre' : 'Anno'}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onOpenRules}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm cursor-pointer"
              title="Regole di assegnazione"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Regole</span>
            </button>
            <button
              onClick={onOpenClosures}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span className="hidden sm:inline">Chiusure</span>
            </button>
            {hasSchedule && (
              <button
                onClick={onDownloadPDF}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}
            <button
              onClick={onGenerate}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-md cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Genera Turni
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2 text-sm cursor-pointer"
                title="Esci"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Esci</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
