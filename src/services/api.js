const API_BASE = '/api';

// Helper function for API calls
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
}

// Team Members API
export const teamMembersApi = {
  getAll: () => fetchApi('/team-members'),

  getById: (id) => fetchApi(`/team-members/${id}`),

  create: (data) => fetchApi('/team-members', {
    method: 'POST',
    body: data,
  }),

  update: (id, data) => fetchApi(`/team-members/${id}`, {
    method: 'PUT',
    body: data,
  }),

  delete: (id) => fetchApi(`/team-members/${id}`, {
    method: 'DELETE',
  }),
};

// Schedule API
export const scheduleApi = {
  getByYear: (year) => fetchApi(`/schedule?year=${year}`),

  getByDate: (date) => fetchApi(`/schedule/${date}`),

  saveYear: (year, schedule) => fetchApi('/schedule', {
    method: 'POST',
    body: { year, schedule },
  }),

  updateDay: (date, daySchedule) => fetchApi(`/schedule/${date}`, {
    method: 'PUT',
    body: daySchedule,
  }),

  deleteDay: (date) => fetchApi(`/schedule/${date}`, {
    method: 'DELETE',
  }),

  deleteMonth: (year, month) => fetchApi(`/schedule?year=${year}&month=${month}`, {
    method: 'DELETE',
  }),
};

// Closures API
export const closuresApi = {
  getByYear: (year) => fetchApi(`/closures?year=${year}`),

  add: (date) => fetchApi('/closures', {
    method: 'POST',
    body: { date },
  }),

  remove: (date) => fetchApi(`/closures/${date}`, {
    method: 'DELETE',
  }),

  clearYear: (year) => fetchApi(`/closures?year=${year}`, {
    method: 'DELETE',
  }),
};

// Database migration
export const dbApi = {
  migrate: () => fetchApi('/db/migrate', {
    method: 'POST',
  }),
};

// Export all
export default {
  teamMembers: teamMembersApi,
  schedule: scheduleApi,
  closures: closuresApi,
  db: dbApi,
};
