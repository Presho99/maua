import React, { useEffect, useState, createContext, useContext } from 'react';
import Home from './Components/Home';
import Login from './Components/Login';
import MainHeader from './Components/MainHeader';
import { readSession, clearSession } from './lib/auth';
const cartContext = createContext({ items: [], setItems: () => {} });
export const useCartContext = () => useContext(cartContext);

function useSavedList(key) {
  const [list, setList] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem(key)); return Array.isArray(saved) ? saved : []; } catch { return []; }
  });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(list)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [key, list]);
  return [list, setList, storageError];
}
function Shop({ user, onLogout }) {
  const [cartIsShown, setCartIsShown] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('shop');
  const [wishlist, setWishlist, wishlistError] = useSavedList(`maua.wishlist.v1:${user.email}`);
  const [history, setHistory, historyError] = useSavedList(`maua.history.v1:${user.email}`);
  function toggleWishlist(id) { setWishlist(old => old.includes(id) ? old.filter(value => value !== id) : [...old, id]); }
  function changeView(next) { setView(next); setSearch(''); }
  function recordOrder(order) { setHistory(old => [order, ...old]); }
  return <cartContext.Provider value={{ items, setItems, wishlist, toggleWishlist, history, recordOrder }}>
    <MainHeader user={user} onLogout={onLogout} search={search} onSearch={setSearch} view={view} onViewChange={changeView} showCartHandler={() => setCartIsShown(true)} />
    {(wishlistError || historyError) && <p className="error" role="alert">Browser storage is unavailable. Your wishlist and history will only be kept until you leave this page.</p>}
    <Home user={user} search={search} view={view} onViewChange={changeView} cartIsShown={cartIsShown} hideCartHandler={() => setCartIsShown(false)} />
  </cartContext.Provider>;
}
export default function App() {
  const [user, setUser] = useState(readSession);
  function logout() {
    try { clearSession(); } catch { /* State still signs out when storage is unavailable. */ }
    setUser(null);
  }
  return user ? <Shop key={user.email} user={user} onLogout={logout} /> : <Login onLogin={setUser} />;
}
