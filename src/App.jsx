import { useState, useEffect } from 'react';
import { VIEW_MODES, MONTHS } from './utils/constants';
import { formatDate, generateScheduleHash } from './utils/dateUtils';
import { useSchedule } from './hooks/useSchedule';
import { useTeamMembers } from './hooks/useTeamMembers';
import Header from './components/Header';
import DateNavigator from './components/DateNavigator';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import QuarterView from './components/QuarterView';
import YearView from './components/YearView';
import ClosuresModal from './components/ClosuresModal';
import StatsPanel from './components/StatsPanel';
import EditDayModal from './components/EditDayModal';
import ViolationModal from './components/ViolationModal';
import RulesModal from './components/RulesModal';
import TeamSidebar from './components/TeamSidebar';
import TeamMemberModal from './components/TeamMemberModal';
import LoginPage from './components/LoginPage';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { getScheduleStats } from './utils/shiftGenerator';
import { downloadMonthPDF, downloadYearPDF } from './utils/pdfGenerator';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const authData = sessionStorage.getItem('turno_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        // Check if auth is still valid (optional: add expiry check)
        if (parsed.authenticated) {
          setIsAuthenticated(true);
        }
      } catch (e) {
        sessionStorage.removeItem('turno_auth');
      }
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('turno_auth');
    setIsAuthenticated(false);
  };

  const [currentView, setCurrentView] = useState(VIEW_MODES.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isClosuresOpen, setIsClosuresOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  // Violation modal state
  const [violationModalOpen, setViolationModalOpen] = useState(false);
  const [currentViolations, setCurrentViolations] = useState([]);
  const [violationAction, setViolationAction] = useState('');
  const [pendingChange, setPendingChange] = useState(null);

  const {
    year,
    schedule,
    closures,
    isLoading,
    setYear,
    generateSchedule,
    addClosure,
    removeClosure,
    clearClosures,
    getScheduleForDate,
    isClosure,
    updateDaySchedule,
    clearMonthSchedule
  } = useSchedule(currentDate.getFullYear());

  // Delete month confirmation modal state
  const [isDeleteMonthModalOpen, setIsDeleteMonthModalOpen] = useState(false);
  const [monthToDelete, setMonthToDelete] = useState(null);

  // Team members management
  const {
    teamMembers,
    updateMember,
    addMember,
    deleteMember,
    getMemberColor
  } = useTeamMembers();

  // Team member modal state
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setIsMemberModalOpen(true);
  };

  const handleMemberUpdate = (memberId, updates) => {
    updateMember(memberId, updates);
  };

  const handleAddMember = async (memberData) => {
    await addMember(memberData);
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo membro del team?')) {
      await deleteMember(memberId);
    }
  };

  // Sync year with currentDate
  useEffect(() => {
    if (currentDate.getFullYear() !== year) {
      setYear(currentDate.getFullYear());
    }
  }, [currentDate, year, setYear]);

  // Calculate stats from schedule
  const currentStats = Object.keys(schedule).length > 0 ? getScheduleStats(schedule) : {};

  const handleGenerate = () => {
    const currentMonth = currentDate.getMonth();
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const endMonth = (currentMonth + 2) % 12;
    const message = `Vuoi generare i turni per 3 mesi (${monthNames[currentMonth]} - ${monthNames[endMonth]} ${year})?\n\nNota: I turni del weekend già assegnati verranno preservati.`;

    if (window.confirm(message)) {
      generateSchedule(currentMonth, teamMembers);
    }
  };

  const handleDayClick = (date) => {
    setSelectedDay(date);
    setIsDayModalOpen(true);
  };

  const handleMonthClick = (monthIndex) => {
    const newDate = new Date(year, monthIndex, 1);
    setCurrentDate(newDate);
    setCurrentView(VIEW_MODES.MONTH);
  };

  const handleDownloadPDF = () => {
    if (currentView === VIEW_MODES.MONTH) {
      downloadMonthPDF(year, currentDate.getMonth(), schedule, closures);
    } else {
      downloadYearPDF(year, schedule, closures);
    }
  };

  // Handle delete month request
  const handleDeleteMonthRequest = () => {
    setMonthToDelete(currentDate.getMonth());
    setIsDeleteMonthModalOpen(true);
  };

  // Confirm delete month
  const handleConfirmDeleteMonth = async () => {
    if (monthToDelete !== null) {
      await clearMonthSchedule(monthToDelete);
    }
    setIsDeleteMonthModalOpen(false);
    setMonthToDelete(null);
  };

  // Cancel delete month
  const handleCancelDeleteMonth = () => {
    setIsDeleteMonthModalOpen(false);
    setMonthToDelete(null);
  };

  // Get schedule count for current month
  const getCurrentMonthScheduleCount = () => {
    const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yearStr = String(year);
    return Object.keys(schedule).filter(dateStr =>
      dateStr.startsWith(`${yearStr}-${monthStr}`)
    ).length;
  };

  // Handle violation detection from EditDayModal
  const handleViolation = (violations, actionDescription, applyChangeFn) => {
    setCurrentViolations(violations);
    setViolationAction(actionDescription);
    setPendingChange(() => applyChangeFn);
    setViolationModalOpen(true);
  };

  // Confirm violation override
  const handleConfirmViolation = () => {
    if (pendingChange) {
      pendingChange();
    }
    setViolationModalOpen(false);
    setCurrentViolations([]);
    setViolationAction('');
    setPendingChange(null);
  };

  // Cancel violation
  const handleCancelViolation = () => {
    setViolationModalOpen(false);
    setCurrentViolations([]);
    setViolationAction('');
    setPendingChange(null);
  };

  const renderCalendarView = () => {
    switch (currentView) {
      case VIEW_MODES.WEEK:
        return (
          <WeekView
            currentDate={currentDate}
            schedule={schedule}
            closures={closures}
            onDayClick={handleDayClick}
            getMemberColor={getMemberColor}
          />
        );
      case VIEW_MODES.MONTH:
        return (
          <MonthView
            currentDate={currentDate}
            schedule={schedule}
            closures={closures}
            onDayClick={handleDayClick}
            getMemberColor={getMemberColor}
          />
        );
      case VIEW_MODES.QUARTER:
        return (
          <QuarterView
            currentDate={currentDate}
            schedule={schedule}
            closures={closures}
          />
        );
      case VIEW_MODES.YEAR:
        return (
          <YearView
            year={year}
            schedule={schedule}
            closures={closures}
            onMonthClick={handleMonthClick}
          />
        );
      default:
        return null;
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={setIsAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        year={year}
        setYear={(y) => {
          setYear(y);
          setCurrentDate(new Date(y, currentDate.getMonth(), 1));
        }}
        onGenerate={handleGenerate}
        onOpenClosures={() => setIsClosuresOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onDownloadPDF={handleDownloadPDF}
        hasSchedule={Object.keys(schedule).length > 0}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={`mx-auto px-4 py-6 ${currentView === VIEW_MODES.WEEK ? 'max-w-full' : 'max-w-7xl'}`}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Team Sidebar */}
          <div className="lg:w-48 flex-shrink-0">
            <TeamSidebar
              teamMembers={teamMembers}
              onMemberClick={handleMemberClick}
              onAddMember={handleAddMember}
              onDeleteMember={handleDeleteMember}
            />
          </div>

          {/* Calendar Content */}
          <div className="flex-1 min-w-0">
            {/* Quick Stats Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  {Object.keys(schedule).length > 0
                    ? `${Object.keys(schedule).length} giorni pianificati`
                    : 'Nessun turno generato'}
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-red-500">
                  {closures.length} chiusure
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Delete month button - only show in month view when there's data */}
                {currentView === VIEW_MODES.MONTH && getCurrentMonthScheduleCount() > 0 && (
                  <button
                    onClick={handleDeleteMonthRequest}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer border border-red-200"
                    title={`Elimina turni di ${MONTHS[currentDate.getMonth()]}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Elimina mese</span>
                  </button>
                )}
                <button
                  onClick={() => setIsStatsOpen(true)}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Statistiche
                </button>
              </div>
            </div>

            {/* Date Navigator */}
            <DateNavigator
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              viewMode={currentView}
            />

            {/* Loading State */}
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Caricamento...</p>
              </div>
            ) : (
              renderCalendarView()
            )}

            {/* Legend for week/month views */}
            {(currentView === VIEW_MODES.WEEK || currentView === VIEW_MODES.MONTH) && (
              <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                <h4 className="text-sm font-semibold text-slate-500 mb-3">Turni</h4>
                <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-sky-100 border border-sky-200 rounded"></div>
                    <span>8:00 - 17:00 (1 persona)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-100 border border-emerald-200 rounded"></div>
                    <span>9:00 - 18:00 (standard)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-violet-100 border border-violet-200 rounded"></div>
                    <span>12:00 - 21:00 (1 persona)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></div>
                    <span>Weekend (coppia)</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Clicca su un giorno per modificare le assegnazioni
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <ClosuresModal
        isOpen={isClosuresOpen}
        onClose={() => setIsClosuresOpen(false)}
        closures={closures}
        addClosure={addClosure}
        removeClosure={removeClosure}
        clearClosures={clearClosures}
        year={year}
      />

      <StatsPanel
        stats={currentStats}
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        getMemberColor={getMemberColor}
      />

      <EditDayModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        date={selectedDay}
        daySchedule={selectedDay ? getScheduleForDate(selectedDay) : null}
        schedule={schedule}
        onUpdateSchedule={updateDaySchedule}
        onViolation={handleViolation}
        getMemberColor={getMemberColor}
      />

      <ViolationModal
        isOpen={violationModalOpen}
        onClose={handleCancelViolation}
        onConfirm={handleConfirmViolation}
        violations={currentViolations}
        actionDescription={violationAction}
      />

      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <TeamMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        member={selectedMember}
        onUpdate={handleMemberUpdate}
      />

      <DeleteConfirmModal
        isOpen={isDeleteMonthModalOpen}
        onClose={handleCancelDeleteMonth}
        onConfirm={handleConfirmDeleteMonth}
        title="Elimina turni del mese"
        message="Stai per eliminare tutti i turni e le assegnazioni per:"
        itemDescription={monthToDelete !== null ? `${MONTHS[monthToDelete]} ${year} (${getCurrentMonthScheduleCount()} giorni)` : ''}
      />

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>Turno - Gestione Turni Team</p>
          <p className="text-xs mt-1">{teamMembers.length} membri del team | Turni equi e bilanciati</p>
          {/* Debug: Schedule hash */}
          {generateScheduleHash(schedule) && (
            <p className="text-[10px] mt-3 text-gray-600 font-mono select-all" title="Schedule fingerprint (debug)">
              #{generateScheduleHash(schedule)}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
