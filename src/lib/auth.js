const ACCOUNTS = 'maua.accounts.v1';
const SESSION = 'maua.session.v1';
export function readSession() {
  try { const user = JSON.parse(localStorage.getItem(SESSION)); return user && typeof user.name === 'string' && typeof user.email === 'string' ? user : null; } catch { return null; }
}
async function digest(password, salt) {
  const bytes = new TextEncoder().encode(password);
  const key = await crypto.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('');
}
export async function authenticate({ name, email, password }, signup) {
  email = email.trim().toLowerCase();
  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS) || '[]');
  let account = accounts.find(a => a.email === email);
  if (signup) {
    if (account) throw new Error('An account with this email already exists. Please log in.');
    const salt = crypto.randomUUID();
    account = { name: name.trim(), email, salt, hash: await digest(password, salt) };
    localStorage.setItem(ACCOUNTS, JSON.stringify([...accounts, account]));
  } else {
    if (!account) {
      const error = new Error('No account with this email is saved in this browser. Sign up here, or use the browser and app address where you created your account.');
      error.code = 'ACCOUNT_NOT_FOUND';
      throw error;
    }
    if (await digest(password, account.salt) !== account.hash) {
      throw new Error('The password is incorrect. Use Show to check your entry. Passwords are case-sensitive and spaces count.');
    }
  }
  const user = { name: account.name, email: account.email };
  localStorage.setItem(SESSION, JSON.stringify(user));
  return user;
}
export function clearSession() { localStorage.removeItem(SESSION); }
