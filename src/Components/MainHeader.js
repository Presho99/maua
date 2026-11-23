import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { useCartContext } from '../App';
export default function MainHeader({ user, onLogout, search, onSearch, showCartHandler, view, onViewChange }) {
  const { items } = useCartContext();
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const [open, setOpen] = useState(false);
  const menu = useRef(null);
  useEffect(() => {
    function dismiss(e) { if (!menu.current?.contains(e.target)) setOpen(false); }
    function escape(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('pointerdown', dismiss); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, []);
  return <header className="main-header"><a className="brand" href="/"><img className="brand-wordmark" src="/assets/name.png" alt="Maua" width="2172" height="724" /></a><label className="search-label"><span className="sr-only">Search bouquets</span><input type="search" placeholder="Search bouquets…" value={search} onChange={e => onSearch(e.target.value)} /></label><div className="header-actions"><button className="cart-button" aria-label={`Cart (${count} items)`} onClick={showCartHandler}><FontAwesomeIcon icon={faCartShopping} aria-hidden="true" /><span className="cart-badge" aria-hidden="true">{count}</span></button><div className="profile" ref={menu}><button className="avatar" aria-label="Profile menu" aria-expanded={open} aria-controls="profile-menu" onClick={() => setOpen(!open)}>{user.name.charAt(0).toUpperCase()}</button>{open && <div className="profile-menu" id="profile-menu"><strong>{user.name}</strong><small>{user.email}</small><button onClick={() => { onViewChange('wishlist'); setOpen(false); }}>Wishlist</button><button onClick={() => { onViewChange('history'); setOpen(false); }}>Order history</button><button onClick={onLogout}>Log out</button></div>}</div></div><nav className="shop-tabs" aria-label="Shopping">{user.role === 'admin' && <button onClick={() => onViewChange('admin')}>Admin & database</button>}<button aria-current={view === 'shop' ? 'page' : undefined} onClick={() => onViewChange('shop')}>Shop</button><button aria-current={view === 'wishlist' ? 'page' : undefined} onClick={() => onViewChange('wishlist')}>Wishlist</button><button aria-current={view === 'history' ? 'page' : undefined} onClick={() => onViewChange('history')}>History</button></nav></header>;
}
