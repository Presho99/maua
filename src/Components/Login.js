import React, { useState } from 'react';
import { authenticate } from '../lib/auth';
import Loader from '../Loader';
import ErrorModal from './ErrorModal';
import './Login.css';
export default function Login({ onLogin }) {
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [accountMissing, setAccountMissing] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(''); setAccountMissing(false);
    if (busy) return;
    if (signup && (name.trim().length < 2 || name.trim().length > 60)) return setError('Enter a name between 2 and 60 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.trim().length < 8) return setError('Use a password with at least 8 non-padding characters.');
    setBusy(true);
    try { onLogin(await authenticate({ name, email, password }, signup)); }
    catch (err) { setAccountMissing(err.code === 'ACCOUNT_NOT_FOUND'); setError(err.message); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card">
    <div className="auth-art"><img src="/assets/peonies.jpeg" alt="A lush bouquet of pink peonies" /><div><span><img className="brand-wordmark" src="/assets/name.png" alt="Maua" width="2172" height="724" /> · FLOWERS WITH FEELING</span><h2>A little beauty.<br />A lasting feeling.</h2><p>Thoughtful bouquets for your everyday and your extraordinary.</p></div></div>
    <section className="auth-form"><a className="brand" href="/"><img className="brand-wordmark" src="/assets/name.png" alt="Maua" width="2172" height="724" /></a><h1>{signup ? 'Make yourself at home' : 'Welcome back!'}</h1>{signup && <p>Create your account and find your next favourite bouquet.</p>}
    <form onSubmit={submit} noValidate>
      {signup && <label>Your name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} maxLength={60} required /></label>}
      <label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <label>Password<div className="password-field"><input type={visible ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</button></div></label>
      <small>{signup ? 'Use at least 8 characters.' : 'Sign in to access your saved wishlist and orders.'}</small>
      <button className="primary" disabled={busy}>{busy ? <Loader inline label="Signing you in…" /> : signup ? 'Create account' : 'Log in'}</button>
    </form><p className="auth-switch">{signup ? 'Already have an account?' : <>New to <img className="brand-wordmark" src="/assets/name.png" alt="Maua" width="2172" height="724" />?</>} <button type="button" onClick={() => { setSignup(!signup); setError(''); setAccountMissing(false); setPassword(''); }}>{signup ? 'Log in' : 'Sign up'}</button></p><small className="local-note">Your account and orders are saved securely on the server.</small></section>
  </div>{error && <ErrorModal message={error} onClose={() => setError('')}>
    {accountMissing && <button type="button" className="text-button" onClick={() => { setSignup(true); setAccountMissing(false); setError(''); setPassword(''); }}>Create an account with this email</button>}
  </ErrorModal>}</main>;
}
