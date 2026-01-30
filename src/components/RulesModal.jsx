import { CONSTRAINT_MESSAGES, CONSTRAINT_TYPES } from '../utils/constraintValidator';

const RulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rules = [
    {
      category: 'Turni Speciali (8:00-17:00 e 12:00-21:00)',
      items: [
        {
          icon: '1️⃣',
          title: 'Una persona per turno speciale',
          description: 'Il turno 8:00-17:00 e il turno 12:00-21:00 possono essere assegnati a una sola persona al giorno.'
        },
        {
          icon: '📅',
          title: 'Massimo uno per settimana (per tipo)',
          description: 'Ogni persona può lavorare al massimo un turno 8:00-17:00 a settimana e un turno 12:00-21:00 a settimana.'
        },
        {
          icon: '🔗',
          title: 'Turni speciali consecutivi (Mar-Ven)',
          description: 'Chi lavora il turno 8:00-17:00 da martedì a giovedì deve lavorare il turno 12:00-21:00 il giorno successivo. L\'ordine è sempre: prima mattina (8-17), poi sera (12-21).'
        },
        {
          icon: '📆',
          title: 'Lunedì sera → Venerdì mattina',
          description: 'Chi lavora il turno 12:00-21:00 di lunedì deve lavorare il turno 8:00-17:00 del venerdì della stessa settimana.'
        }
      ]
    },
    {
      category: 'Weekend',
      items: [
        {
          icon: '👥',
          title: 'Coppie nel weekend',
          description: 'I turni del weekend sono sempre assegnati a coppie di due persone che lavorano insieme sia sabato che domenica.'
        },
        {
          icon: '🚫',
          title: 'Niente giovedì e venerdì',
          description: 'Chi lavora nel weekend non può lavorare il giovedì e il venerdì della stessa settimana.'
        },
        {
          icon: '⏰',
          title: 'Niente turni speciali',
          description: 'Chi lavora nel weekend non può avere turni 8:00-17:00 o 12:00-21:00 durante la stessa settimana.'
        },
        {
          icon: '⚖️',
          title: 'Rotazione equa',
          description: 'Una persona non può lavorare un altro weekend finché tutti gli altri membri del team (eccetto il suo ultimo partner) non abbiano lavorato almeno un weekend.'
        }
      ]
    },
    {
      category: 'Regole Generali',
      items: [
        {
          icon: '🔄',
          title: 'Nessuna doppia assegnazione',
          description: 'Una persona non può essere assegnata a più di un turno nello stesso giorno.'
        },
        {
          icon: '📊',
          title: 'Distribuzione equa',
          description: 'Il sistema cerca di distribuire equamente tutti i tipi di turno tra i membri del team nel corso dell\'anno.'
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Regole di Assegnazione</h2>
              <p className="text-sm text-slate-300">Vincoli per la generazione dei turni</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            aria-label="Chiudi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {rules.map((category, catIndex) => (
              <div key={catIndex}>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.items.map((rule, ruleIndex) => (
                    <div
                      key={ruleIndex}
                      className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">{rule.icon}</span>
                        <div>
                          <h4 className="font-semibold text-slate-700">{rule.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{rule.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Info note */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-700">Nota</h4>
                <p className="text-sm text-blue-600 mt-1">
                  Quando modifichi manualmente un turno, il sistema ti avviserà se la modifica viola una di queste regole.
                  Potrai comunque procedere con la modifica se necessario.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-slate-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
