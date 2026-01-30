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

// 8 distinct colors for team members (no similar shades)
export const MEMBER_COLORS = {
  'Gabriela': 'bg-pink-100 text-pink-700 border-pink-300',
  'Usfar': 'bg-orange-100 text-orange-700 border-orange-300',
  'Fabio': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'Elisa': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Marina': 'bg-purple-100 text-purple-700 border-purple-300',
  'Stefania': 'bg-red-100 text-red-700 border-red-300',
  'Virginia': 'bg-blue-100 text-blue-700 border-blue-300',
  'Silvia': 'bg-teal-100 text-teal-700 border-teal-300'
};
