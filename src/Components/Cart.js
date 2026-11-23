import React, { useEffect, useRef, useState } from 'react';
import { useCartContext } from '../App';
import './Cart.css';
import Loader from '../Loader';
import { api } from '../lib/api';
export default function Cart({ hideCartHandler }) {
  const { items, setItems, recordOrder, refreshOrders } = useCartContext();
  const [shipping, setShipping] = useState('standard');
  const [complete, setComplete] = useState(false);
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [phone, setPhone] = useState('');
  async function simulate(outcome) {
    setBusy(true); setError('');
    try {
      const result = await api(`/payments/mpesa/${payment.id}/simulate`, { method: 'POST', body: JSON.stringify({ outcome }) });
      setPayment(result.payment);
      if (outcome === 'approved') { setComplete(true); setItems([]); }
      else setError(`Simulation ${outcome}. You can retry payment.`);
      await refreshOrders();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const [busy, setBusy] = useState(false);
  async function checkout() {
    if (busy) return;
    setBusy(true); setError('');
    try { const saved = order || await recordOrder({ items, shipping }); setOrder(saved); setPayment(await api('/payments/mpesa', { method: 'POST', body: JSON.stringify({ orderId: saved.id, phone }) })); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
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
  return <dialog ref={dialog} className="cart-modal" onCancel={hideCartHandler} onClick={e => { if (e.target === dialog.current) hideCartHandler(); }}><div className="cart-top"><div><p className="eyebrow">A LITTLE JOY, ON ITS WAY</p><h1>Your bag <small>({count})</small></h1></div><button aria-label="Close shopping bag" onClick={hideCartHandler}>✕</button></div>{complete ? <section className="empty-state"><h2>Your bouquet selection is ready.</h2><p>Your simulated M-Pesa payment was approved. No money was charged.</p><p>Receipt: {payment?.receipt}</p><button className="primary" onClick={hideCartHandler}>Continue shopping</button></section> : payment?.status === 'pending' ? <section className="payment-simulation"><img className="mpesa-logo" src="/assets/mpesa.png" alt="M-Pesa" /><h2>Simulate phone approval</h2><p>KES {payment.amount.toFixed(2)} · {payment.phone}</p><p>This is a simulation. No phone prompt is sent. Never enter your M-Pesa PIN here.</p>{busy && <Loader label="Updating payment…" />}<div className="payment-actions">{['approved', 'failed', 'cancelled'].map(outcome => <button disabled={busy} key={outcome} onClick={() => simulate(outcome)}>{outcome === 'approved' ? 'Approve payment' : outcome === 'failed' ? 'Simulate failure' : 'Cancel payment'}</button>)}</div>{error && <p role="alert">{error}</p>}</section> : <div className="checkout-layout"><section>{items.length ? items.map(({ flower, quantity: amount }) => <article className="cart-row" key={flower.id}><img src={flower.image} alt={`${flower.name} bouquet`} /><div><h3>{flower.name}</h3><p>KES {Number(flower.price).toFixed(2)} each</p><button className="text-button" disabled={!!order} onClick={() => { setItems(old => old.filter(i => i.flower.id !== flower.id)); setError(''); }}>Remove</button></div>
          <fieldset className="cart-quantity" disabled={!!order}>
            <legend>Quantity</legend>
            <button type="button" aria-label={`Decrease ${flower.name} quantity`} disabled={amount <= 1} onClick={() => quantity(flower.id, amount - 1)}>−</button>
            <input type="number" inputMode="numeric" min="1" max="99" step="1" aria-label={`${flower.name} quantity`} value={amount} onFocus={e => e.target.select()} onChange={e => quantity(flower.id, e.target.value)} />
            <button type="button" aria-label={`Increase ${flower.name} quantity`} disabled={amount >= 99} onClick={() => quantity(flower.id, amount + 1)}>+</button>
          </fieldset>
          <strong>KES {(flower.price * amount).toFixed(2)}</strong></article>) : <div className="empty-state"><h2>Your bag is waiting to bloom</h2><p>Add a bouquet to get started.</p></div>}{error && <p className="error" role="alert">{error}</p>}<button className="text-button" onClick={hideCartHandler}>← Continue shopping</button></section><aside className="order-summary"><h2>Order summary</h2><div><span>Subtotal ({count} items)</span><strong>KES {subtotal.toFixed(2)}</strong></div><label>Delivery<select disabled={!!order} value={shipping} onChange={e => setShipping(e.target.value)}><option value="standard">Standard · KES 4.99</option><option value="express">Express · KES 9.99</option></select></label><div><span>Delivery</span><strong>KES {delivery.toFixed(2)}</strong></div><div className="summary-total"><span>Total</span><strong>KES {(subtotal + delivery).toFixed(2)}</strong></div><section className="payment-method" aria-label="M-Pesa payment"><img className="mpesa-logo" src="/assets/mpesa.png" alt="M-Pesa" /><label>Kenyan mobile number<input type="tel" value={phone} placeholder="0712345678" onChange={e => setPhone(e.target.value)} /></label><button className="primary" disabled={!items.length || busy || !phone} onClick={checkout}>{busy ? <Loader inline label="Starting payment…" /> : 'Simulate M-Pesa payment'}</button><small>Simulation only · No money charged</small></section></aside></div>}</dialog>;
}
