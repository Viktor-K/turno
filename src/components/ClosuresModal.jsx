import { useState } from 'react';
import { MONTHS } from '../utils/constants';

const ClosuresModal = ({ isOpen, onClose, closures, addClosure, removeClosure, clearClosures, year }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [quickAdd, setQuickAdd] = useState('');

  if (!isOpen) return null;

  const handleAddClosure = () => {
    if (selectedDate) {
      addClosure(selectedDate);
      setSelectedDate('');
    }
  };

  const handleQuickAdd = () => {
    // Parse common Italian holidays or custom dates
    const holidays = {
      'capodanno': `${year}-01-01`,
      'epifania': `${year}-01-06`,
      'pasquetta': '', // Variable, user should add manually
      'liberazione': `${year}-04-25`,
      'lavoro': `${year}-05-01`,
      'repubblica': `${year}-06-02`,
      'ferragosto': `${year}-08-15`,
      'santi': `${year}-11-01`,
      'immacolata': `${year}-12-08`,
      'natale': `${year}-12-25`,
      'santo stefano': `${year}-12-26`,
      'capodanno successivo': `${year}-12-31`
    };

    const normalized = quickAdd.toLowerCase().trim();
    if (holidays[normalized]) {
      addClosure(holidays[normalized]);
      setQuickAdd('');
    }
  };

  const addAllHolidays = () => {
    const holidays = [
      `${year}-01-01`, // Capodanno
      `${year}-01-06`, // Epifania
      `${year}-04-25`, // Liberazione
      `${year}-05-01`, // Festa del Lavoro
      `${year}-06-02`, // Festa della Repubblica
      `${year}-08-15`, // Ferragosto
      `${year}-11-01`, // Tutti i Santi
      `${year}-12-08`, // Immacolata
      `${year}-12-25`, // Natale
      `${year}-12-26`, // Santo Stefano
    ];
    holidays.forEach(h => addClosure(h));
  };

  const formatClosureDate = (dateStr) => {
    const date = new Date(dateStr);
    const dayOfWeek = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][date.getDay()];
    return `${dayOfWeek} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  };

  const sortedClosures = [...closures].sort();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Chiusure Aziendali</h2>
            <p className="text-sm text-white/80">Anno {year}</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Add Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aggiungi data di chiusura
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <button
                onClick={handleAddClosure}
                disabled={!selectedDate}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Aggiungi
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Azioni rapide
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={addAllHolidays}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
              >
                Aggiungi festività italiane
              </button>
              <button
                onClick={clearClosures}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Rimuovi tutte
              </button>
            </div>
          </div>

          {/* Closures List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chiusure programmate ({closures.length})
            </label>
            {sortedClosures.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sortedClosures.map(date => (
                  <div
                    key={date}
                    className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-lg border border-red-100"
                  >
                    <span className="text-sm text-red-700">
                      {formatClosureDate(date)}
                    </span>
                    <button
                      onClick={() => removeClosure(date)}
                      className="p-1 hover:bg-red-200 rounded transition-colors cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Nessuna chiusura programmata</p>
              </div>
            )}
          </div>
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

export default ClosuresModal;
