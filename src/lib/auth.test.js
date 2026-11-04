import { authenticate, readSession, clearSession } from './auth';
const { webcrypto } = require('crypto');
const { TextEncoder } = require('util');
beforeAll(() => {
  Object.defineProperty(global, 'crypto', { value: webcrypto, configurable: true });
  global.TextEncoder = TextEncoder;
});
beforeEach(() => localStorage.clear());
test('registers, persists, rejects duplicate accounts and wrong passwords, and logs in again', async () => {
  const details = { name: ' Amina ', email: ' Amina@example.com ', password: 'flowers123' };
  await expect(authenticate(details, true)).resolves.toEqual({ name: 'Amina', email: 'amina@example.com' });
  expect(localStorage.getItem('maua.accounts.v1')).not.toContain('flowers123');
  expect(readSession().name).toBe('Amina');
  clearSession();
  expect(readSession()).toBeNull();
  await expect(authenticate(details, true)).rejects.toThrow('already exists');
  await expect(authenticate({ ...details, password: 'wrongpassword' }, false)).rejects.toThrow('incorrect');
  await expect(authenticate(details, false)).resolves.toEqual({ name: 'Amina', email: 'amina@example.com' });
});
test('ignores malformed session storage', () => {
  localStorage.setItem('maua.session.v1', '{');
  expect(readSession()).toBeNull();
});
test('distinguishes an unregistered email from an incorrect password without creating an account', async () => {
  await expect(authenticate({ email: 'new@example.com', password: 'flowers123' }, false)).rejects.toMatchObject({ code: 'ACCOUNT_NOT_FOUND' });
  expect(localStorage.getItem('maua.accounts.v1')).toBeNull();
  expect(readSession()).toBeNull();
});
