const apiHost = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_HOST || '';

export const API_BASE_URL = apiHost
  ? apiHost.replace(/\/$/, '')
  : '';

export const TACTICAL_API_BASE = API_BASE_URL
  ? `${API_BASE_URL}/api/tactical`
  : '/api/tactical';

export const MATCH_API_BASE = API_BASE_URL
  ? `${API_BASE_URL}/api/tactical/matches`
  : '/api/tactical/matches';