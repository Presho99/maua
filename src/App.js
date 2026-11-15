import React, { useEffect, useState, createContext, useContext } from 'react';
import Admin from './Components/Admin';
import './Components/Admin.css';
import Home from './Components/Home';
import Login from './Components/Login';
import MainHeader from './Components/MainHeader';
import { readSession, clearSession } from './lib/auth';
import { api } from './lib/api';
const cartContext = createContext({ items: [], setItems: () => {} });
export const useCartContext = () => useContext(cartContext);

function Shop({ user, onLogout }) {
  const [cartIsShown, setCartIsShown] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('shop');
  const [wishlist, setWishlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([api('/wishlist'), api('/orders')]).then(([saved, orders]) => {
      if (active) { setWishlist(saved); setHistory(orders); setReady(true); }
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);
  async function toggleWishlist(id) {
    if (!ready || saving) return;
    setSaving(true); setError('');
    try {
      const ids = wishlist.includes(id) ? wishlist.filter(value => value !== id) : [...wishlist, id];
      setWishlist(await api('/wishlist', { method: 'PUT', body: JSON.stringify({ ids }) }));
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  function changeView(next) { setView(next); setSearch(''); }
  async function recordOrder(order) {
    const saved = await api('/orders', { method: 'POST', body: JSON.stringify({
      shipping: order.shipping, items: order.items.map(item => ({ flowerId: item.flower.id, quantity: item.quantity }))
    }) });
    setHistory(old => [saved, ...old]);
    return saved;
  }
  return <cartContext.Provider value={{ items, setItems, wishlist, toggleWishlist, history, recordOrder, refreshOrders: async () => setHistory(await api('/orders')) }}>
    <MainHeader user={user} onLogout={onLogout} search={search} onSearch={setSearch} view={view} onViewChange={changeView} showCartHandler={() => setCartIsShown(true)} />
    {error && <p className="error" role="alert">{error}</p>}
    {!ready && !error && <p role="status">Loading your wishlist and orders…</p>}
    {view === 'admin' && user.role === 'admin' ? <Admin /> : <Home user={user} search={search} view={view} onViewChange={changeView} cartIsShown={cartIsShown} hideCartHandler={() => setCartIsShown(false)} />}
  </cartContext.Provider>;
}
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.resolve(readSession()).then(value => { if (active) setUser(value); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function logout() {
    try { await clearSession(); setUser(null); setError(''); }
    catch (err) { setError(err.message); }
  }
  if (loading) return <p role="status">Loading your account…</p>;
  return <>{error && <p className="error" role="alert">{error}</p>}{user ? <Shop key={user.email} user={user} onLogout={logout} /> : <Login onLogin={setUser} />}</>;
}
