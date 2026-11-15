import { authenticate, readSession, clearSession } from './auth';
import { api } from './api';
jest.mock('./api', () => ({ api: jest.fn() }));
beforeEach(() => jest.resetAllMocks());
test('registers and logs in through the backend', async () => {
  const details = { name: 'Amina', email: 'amina@example.com', password: 'flowers123' };
  api.mockResolvedValue({ name: 'Amina', email: details.email });
  await authenticate(details, true);
  expect(api).toHaveBeenCalledWith('/auth/signup', { method: 'POST', body: JSON.stringify(details) });
  await authenticate(details, false);
  expect(api).toHaveBeenLastCalledWith('/auth/login', { method: 'POST', body: JSON.stringify(details) });
});
test('restores cookie sessions and treats unauthorized as signed out', async () => {
  api.mockRejectedValueOnce({ status: 401 });
  await expect(readSession()).resolves.toBeNull();
  api.mockRejectedValueOnce(new Error('Network unavailable'));
  await expect(readSession()).rejects.toThrow('Network unavailable');
});
test('logout revokes the server session', async () => {
  api.mockResolvedValue({ ok: true });
  await clearSession();
  expect(api).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
});
