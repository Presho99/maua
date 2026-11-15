import { api } from './api';
export function readSession() {
  return api('/auth/me').catch(error => {
    if (error.status === 401) return null;
    throw error;
  });
}
export function authenticate(details, signup) {
  return api(`/auth/${signup ? 'signup' : 'login'}`, { method: 'POST', body: JSON.stringify(details) });
}
export function clearSession() { return api('/auth/logout', { method: 'POST' }); }
