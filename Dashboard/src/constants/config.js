export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const POLLING_INTERVAL = Number(import.meta.env.VITE_POLLING_INTERVAL) || 3000;
export const MAX_LOG_LINES = Number(import.meta.env.VITE_MAX_LOG_LINES) || 20;

console.log(`[Config] Loaded Environment: ${import.meta.env.MODE}`);
console.log(`[Config] API: ${API_BASE_URL}`);
