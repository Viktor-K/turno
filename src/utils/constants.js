export const TEAM_MEMBERS = [
  'Gabriela',
  'Usfar',
  'Fabio',
  'Elisa',
  'Marina',
  'Stefania',
  'Virginia',
  'Silvia'
];

export const SHIFTS = {
  EARLY: { id: 'early', name: '8:00 - 17:00', start: '08:00', end: '17:00', color: 'bg-sky-100 text-sky-700' },
  STANDARD: { id: 'standard', name: '9:00 - 18:00', start: '09:00', end: '18:00', color: 'bg-emerald-100 text-emerald-700' },
  LATE: { id: 'late', name: '12:00 - 21:00', start: '12:00', end: '21:00', color: 'bg-violet-100 text-violet-700' },
  WEEKEND: { id: 'weekend', name: 'Weekend', start: '09:00', end: '18:00', color: 'bg-amber-100 text-amber-700' }
};

export const DAYS_OF_WEEK = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export const VIEW_MODES = {
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year'
};

// 8 distinct colors for team members (soft, less saturated)
export const MEMBER_COLORS = {
  'Gabriela': 'bg-pink-50 text-pink-600 border-pink-200',
  'Usfar': 'bg-orange-50 text-orange-600 border-orange-200',
  'Fabio': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  'Elisa': 'bg-yellow-50 text-yellow-600 border-yellow-200',
  'Marina': 'bg-purple-50 text-purple-600 border-purple-200',
  'Stefania': 'bg-red-50 text-red-600 border-red-200',
  'Virginia': 'bg-blue-50 text-blue-600 border-blue-200',
  'Silvia': 'bg-teal-50 text-teal-600 border-teal-200'
};
