import React, { useEffect, useRef, useState } from 'react';
import { useCartContext } from '../App';
import './Cart.css';
export default function Cart({ hideCartHandler }) {
  const { items, setItems, recordOrder } = useCartContext();
  const [shipping, setShipping] = useState('standard');
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const modal = dialog.current;
    modal.showModal();
    return () => { modal.close(); previous?.focus(); };
  }, []);
  const subtotal = items.reduce((sum, i) => sum + Number(i.flower.price) * i.quantity, 0);
  const delivery = items.length ? shipping === 'express' ? 9.99 : 4.99 : 0;
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  function quantity(id, value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 99) { setError('Quantity must be a whole number between 1 and 99.'); return; }
    setError(''); setItems(old => old.map(i => i.flower.id === id ? { ...i, quantity: n } : i));
  }
  return <dialog ref={dialog} className="cart-modal" onCancel={hideCartHandler} onClick={e => { if (e.target === dialog.current) hideCartHandler(); }}><div className="cart-top"><div><p className="eyebrow">A LITTLE JOY, ON ITS WAY</p><h1>Your bag <small>({count})</small></h1></div><button aria-label="Close shopping bag" onClick={hideCartHandler}>✕</button></div>{complete ? <section className="empty-state"><h2>Your bouquet selection is ready.</h2><p>This is a local demo. No payment has been taken and no order has been sent.</p><button className="primary" onClick={hideCartHandler}>Continue shopping</button></section> : <div className="checkout-layout"><section>{items.length ? items.map(({ flower, quantity: amount }) => <article className="cart-row" key={flower.id}><img src={flower.image} alt={`${flower.name} bouquet`} /><div><h3>{flower.name}</h3><p>${Number(flower.price).toFixed(2)} each</p><button className="text-button" onClick={() => { setItems(old => old.filter(i => i.flower.id !== flower.id)); setError(''); }}>Remove</button></div><label>Quantity<input type="number" min="1" max="99" step="1" aria-label={`${flower.name} quantity`} value={amount} onChange={e => quantity(flower.id, e.target.value)} /></label><strong>${(flower.price * amount).toFixed(2)}</strong></article>) : <div className="empty-state"><h2>Your bag is waiting to bloom</h2><p>Add a bouquet to get started.</p></div>}{error && <p className="error" role="alert">{error}</p>}<button className="text-button" onClick={hideCartHandler}>← Continue shopping</button></section><aside className="order-summary"><h2>Order summary</h2><div><span>Subtotal ({count} items)</span><strong>${subtotal.toFixed(2)}</strong></div><label>Delivery<select value={shipping} onChange={e => setShipping(e.target.value)}><option value="standard">Standard · $4.99</option><option value="express">Express · $9.99</option></select></label><div><span>Delivery</span><strong>${delivery.toFixed(2)}</strong></div><div className="summary-total"><span>Total</span><strong>${(subtotal + delivery).toFixed(2)}</strong></div><button className="primary" disabled={!items.length} onClick={() => { recordOrder({ id: crypto.randomUUID(), date: new Date().toISOString(), items: items.map(item => ({ ...item })), shipping, delivery, total: subtotal + delivery }); setComplete(true); setItems([]); }}>Complete demo checkout</button><small>Demo checkout · No payment required</small></aside></div>}</dialog>;
}
